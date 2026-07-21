#!/usr/bin/env bash
#
# looma-installer.sh — THE single script that installs and runs Looma on an
# ODROID box. Everything the box needs lives in this one file: the interactive
# form, the Docker install, the legacy native (Apache/PHP/Mongo) install, the
# offline Docker install, the boot-time start/stop used by systemd, and the
# offline-bundle builders. There is nothing else to copy or call.
#
#   sudo ./looma-installer.sh                 # interactive form (navigate + choose)
#   sudo ./looma-installer.sh install [flags] # scripted install (no form)
#   sudo ./looma-installer.sh up [--build]    # start the stack   (systemd ExecStart)
#   sudo ./looma-installer.sh down [--volumes]# stop the stack    (systemd ExecStop)
#        ./looma-installer.sh build-bundle docker|native|all
#                                             # build the OFFLINE payload — run this
#                                             # on a build box WITH internet, arm64
#   ./looma-installer.sh --help
#
# The DISK is the installer: run it from the disk, on the box, as root. When it
# finishes the box is STANDALONE — remove the disk and reuse it on the next box.
#
# Final layout on the box (install root, default /var/www/html):
#     /var/www/html/Looma/        <- repo: compose, Dockerfiles, mongo-dump, looma-ai …
#     /var/www/html/content/      <- books, pdfs, images, epaath …
#     /var/www/html/maps2018/  /piper/  /includes/  …
#     /var/www/html/.dockerignore <- keeps the 80 GB content/ out of the build context
#
# A previous NATIVE install (Apache/MongoDB/Piper in /var/www/html) is detected and
# disabled so Docker takes over. Content is updated IN PLACE (rsync --size-only), so
# a box that already has the content does not re-copy 80 GB.
#
# TTS is Piper only (local/offline, voices baked into the looma-web image).
set -euo pipefail

SCRIPT_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/$(basename "${BASH_SOURCE[0]}")"
SCRIPT_DIR="$(dirname "$SCRIPT_PATH")"          # …/deploy/odroid
SRC_REPO="$(cd "$SCRIPT_DIR/../.." && pwd)"     # the Looma repo (on the disk when installing)
SRC_ROOT="$(cd "$SRC_REPO/.." && pwd)"          # disk root (content/ maps2018/ … are siblings)
REPO_NAME="$(basename "$SRC_REPO")"
OBS_DIR="$SRC_REPO/observability"

# Step off the caller's working directory onto one that always exists.
#
# The install disk is USB, and `sudo` hands us the invoking shell's CWD. When that
# CWD is on a disk whose mount went stale (a USB dropout — this board browns out
# under load, see CPU_MAX_FREQ — or a re-mount), the directory still "exists" for
# the shell but getcwd() fails, and then:
#   * every forked command prints
#       job-working-directory: error retrieving current directory: getcwd: ...
#   * rsync REFUSES to run at all: "rsync: getcwd(): Input/output error (5)",
#     which killed the install mid-copy.
# Nothing below needs the caller's CWD — SCRIPT_PATH/SRC_REPO are resolved above and
# every other path in this script is absolute — so an unreadable CWD must never be
# able to stop an install. This has to come AFTER the resolution above: a relative
# invocation (`./looma-installer.sh`) still needs the original CWD to find itself.
cd / 2>/dev/null || true

# Offline payload directories (data only — produced by `build-bundle`). They live
# next to this script by default, i.e. ON THE DISK; --bundle-dir puts them anywhere
# else, which is what you need when the disk is mounted read-only.
BUNDLE_ROOT="${LOOMA_BUNDLE_DIR:-$SCRIPT_DIR}"
OFFLINE_DIR=""                                  # offline/docker/*.tgz + offline/images/*.tar
NATIVE_BUNDLE=""                                # native-bundle/: deb/ php-ext/ wheels/ piper/ hf/
set_bundle_paths() {                            # re-run after the flags are parsed
  OFFLINE_DIR="$BUNDLE_ROOT/offline"
  NATIVE_BUNDLE="$BUNDLE_ROOT/native-bundle"
}
set_bundle_paths

# ---------------------------------------------------------------------------
# Options (defaults; overridden by the form or by flags)
# ---------------------------------------------------------------------------
# native = Apache/PHP/MongoDB on the host (the default), but with the two services
# the host cannot run well — zvec search and Piper TTS — as CONTAINERS. focal's
# Python is 3.8, and neither zvec's nor looma-ai's pinned requirements install on
# it; the images already carry the right Python, torch, the embedding model and the
# Piper voices. SIDECARS=host forces the old all-on-the-host behaviour instead.
DEPLOY="${DEPLOY:-native}"                 # docker | native
SIDECARS="${SIDECARS:-docker}"             # native only: docker | host
OFFLINE="${OFFLINE:-0}"                    # 1 = install with NO internet, from the disk bundle
WWW="${WWW:-/var/www/html}"                # install root ON THE BOX
TARGET_USER="${TARGET_USER:-odroid}"       # desktop user for autostart/kiosk
# Piper CPU guard: TTS inference at full tilt browns out / resets the odroid.
# Cap the service rather than the board. 200% = 2 cores' worth.
PIPER_CPUQUOTA="${PIPER_CPUQUOTA:-200%}"
PIPER_THREADS="${PIPER_THREADS:-2}"
# Observability is OFF by default: on an 8 GB box the full stack (OpenSearch,
# Grafana, traces) is the heaviest thing on it, and Looma does not need it to serve
# content. Turn it on with --observability, or in the form.
WITH_OBSERVABILITY="${WITH_OBSERVABILITY:-0}"  # full obs stack on this box
WITH_AGENTS="${WITH_AGENTS:-0}"            # agents-only: Vector+Metricbeat -> remote obs
WITH_AI="${WITH_AI:-1}"                    # looma-ai = the in-app assistant (ON by default)
WITH_ANALYSIS="${WITH_ANALYSIS:-0}"        # heavy obs AI analysis workers (torch) — OFF
WITH_SEARCH="${WITH_SEARCH:-1}"            # zvec semantic search (native install only)
INSTALL_KIOSK="${INSTALL_KIOSK:-1}"
KIOSK_URL="${KIOSK_URL:-}"                 # empty = derive from DEPLOY (docker :48080, native :80)
MAKE_SWAP="${MAKE_SWAP:-0}"                # off by default; --swap creates one
SWAP_GB="${SWAP_GB:-8}"
# Cap every CPU's max frequency at boot, before Looma starts (an ODROID that clocks
# to its rated ceiling — no overclock needed — under Piper TTS or a full container
# stack browns out and resets; reproduced on real hardware by pressing play in the
# Piper UI). 0 = leave the CPUs alone. 1900000 is this board's own hardware max
# (a no-op cap), so it does NOT protect against the brownout by itself — 1500000
# is the lowest value confirmed on this hardware to still leave Piper usable while
# avoiding the reset. Applied by looma.service (Docker) or looma-cpu-cap.service
# (native) via ExecStartPre, so it survives reboots either way.
CPU_MAX_FREQ="${CPU_MAX_FREQ:-1500000}"    # kHz — 1500000 = 1.5 GHz
REMOTE_OBS_HOST="${REMOTE_OBS_HOST:-}"     # set by the "remote" observability profile
LOOMA_OTEL_ENDPOINT="${LOOMA_OTEL_ENDPOINT:-http://looma-otel-collector:4318}"
LOOMA_OPENSEARCH_URL="${LOOMA_OPENSEARCH_URL:-http://looma-opensearch:9200}"
# native-only paths
VENV="${VENV:-/opt/looma/venv}"
HF_DIR="${HF_DIR:-/var/lib/looma/hf}"
# build-bundle versions
DOCKER_VERSION="${DOCKER_VERSION:-27.5.1}"
COMPOSE_VERSION="${COMPOSE_VERSION:-v2.32.4}"
DOCKER_ARCH="${DOCKER_ARCH:-aarch64}"
COMPOSE_ARCH="${COMPOSE_ARCH:-aarch64}"
MONGO_VERSION="${MONGO_VERSION:-5.0.27}"
MONGO_SERIES="${MONGO_SERIES:-5.0}"
MONGODB_EXT_VERSION="${MONGODB_EXT_VERSION:-1.15.0}"
PIPER_VERSION="${PIPER_VERSION:-v1.2.0}"

log()  { printf '\n\033[1;36m[looma]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[warn]\033[0m %s\n' "$*"; }
die()  { printf '\033[1;31m[error]\033[0m %s\n' "$*" >&2; exit 1; }
onoff(){ [ "$1" = "1" ] && echo on || echo off; }
yesno(){ [ "$1" = "1" ] && echo yes || echo no; }

# `set -e` aborts silently, which in a script this long is useless: say WHAT died
# and WHERE, so a failure is diagnosable instead of just a shell prompt coming back.
trap 'rc=$?; printf "\n\033[1;31m[error]\033[0m aborted: the command below failed (exit %s), at line %s of %s\n    %s\n" \
        "$rc" "$LINENO" "$(basename "$SCRIPT_PATH")" "$BASH_COMMAND" >&2' ERR

mkdirs() {  # mkdir -p that explains a read-only disk instead of failing silently
  local d mp
  for d in "$@"; do
    mkdir -p "$d" 2>/dev/null && continue
    # `|| true`: df on a path that does not exist fails, and with `set -e` a failing
    # command substitution in an assignment would kill the script before the message.
    mp="$(df -P "$d" 2>/dev/null | awk 'NR==2{print $6}' || true)"
    die "cannot create $d — that filesystem is read-only (or full).
  The install disk is often mounted read-only. Either remount it read-write:
      sudo mount -o remount,rw '${mp:-<mountpoint>}'
  or keep the bundle somewhere else (it does not have to live on the disk):
      $SCRIPT_PATH build-bundle native --bundle-dir /var/lib/looma-bundle
  and install with the same --bundle-dir."
  done
}

kiosk_url() {  # the URL the kiosk opens: explicit if given, else per deployment
  if [ -n "$KIOSK_URL" ]; then echo "$KIOSK_URL"
  elif [ "$DEPLOY" = "native" ]; then echo "http://localhost/home"
  else echo "http://localhost:48080/home"; fi
}

usage() {
  cat <<EOF
Looma ODROID installer — one script, all deployments.

  sudo $0                          interactive form (recommended)
  sudo $0 install [flags]          scripted install, no form
  sudo $0 up [--build]             start the stack (used by looma.service)
  sudo $0 down [--volumes]         stop the stack  (--volumes also WIPES data)
       $0 build-bundle docker|native|all [--bundle-dir PATH]
                                   build the offline payload — run on a build box
                                   WITH internet, same arch (arm64) as the odroid
  $0 --help

Install flags (all optional; passing any flag skips the form):
  --native | --docker     native (the default): Apache/PHP/MongoDB on the host, with
                          zvec + Piper as containers.  docker: the whole app in containers.
  --sidecars docker|host  native only: run zvec/Piper as containers (default), or on the
                          host with a venv + systemd units (needs Python >= 3.9)
  --swap                  Create a ${SWAP_GB}G swapfile (OFF by default)
  --swap-gb N             Same, but N gigabytes. On a re-install with a DIFFERENT
                          N than before, REPLACES the existing swapfile (does not
                          just leave the old size in place, and does not add a
                          second one)
  --offline | --online    Install from the disk bundle with NO internet, or from the net
  --www PATH              Install root on the box (default: $WWW)
  --user NAME             Desktop user for autostart/kiosk (default: $TARGET_USER)
  --kiosk-url URL         URL the kiosk opens (default: docker :48080, native :80)
  --no-kiosk              Don't install the Chromium kiosk autostart
  --no-swap               Don't create a ${SWAP_GB}G swapfile
  --observability         Run the full obs stack here (OpenSearch/Grafana/traces).
                          OFF by default — it is the heaviest thing on an 8 GB box.
  --no-observability      App only (the default)
  --remote-obs IP         Send telemetry to an obs stack on another host (this box runs
                          only Vector+Metricbeat; needs IP reachable on :4318 and :49200)
  --analysis              Also run the heavy obs AI analysis workers (torch)
  --ai | --no-ai          Run the in-app assistant looma-ai (ON by default)
  --no-search             Native only: don't install the zvec search service
  --cpu-max-freq kHz      Cap every CPU's max frequency at boot, before Looma starts
                          (default: $CPU_MAX_FREQ = $((CPU_MAX_FREQ/1000)) MHz; 0 = leave the CPUs alone)
  --bundle-dir PATH       Where the offline bundle lives (default: next to this
                          script, i.e. on the disk). Use it when the disk is
                          mounted read-only — build and install with the same PATH.
EOF
}

# ===========================================================================
# Embedded templates. Every file the old multi-script layout kept on disk is a
# heredoc here — @PLACEHOLDERS@ are substituted when written to the box.
# ===========================================================================
tpl_looma_service() {
cat <<'EOF'
[Unit]
# Looma full stack (app + observability) — autostart at boot.
Description=Looma full stack (Docker: app + observability)
Requires=docker.service
After=docker.service network-online.target
Wants=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
# First boot may build images — do not time out.
TimeoutStartSec=0
EnvironmentFile=-/etc/looma-odroid.env
# Cap the CPUs before Looma starts. `$$f` (not `$f`): systemd expands $f itself and
# would hand sh an empty word. Leading `-`: a board whose cpufreq is read-only or
# absent must not stop Looma from booting.
ExecStartPre=-/bin/sh -c 'for f in /sys/devices/system/cpu/cpu*/cpufreq/scaling_max_freq; do echo @CPU_MAX_FREQ@ > "$$f" 2>/dev/null || true; done'
ExecStart=@REPO_DIR@/deploy/odroid/looma-installer.sh up
ExecStop=@REPO_DIR@/deploy/odroid/looma-installer.sh down

[Install]
WantedBy=multi-user.target
EOF
}

tpl_kiosk_desktop() {
# Waits up to ~5 min for the app to answer, then launches Chromium fullscreen.
# Works with either the chromium-browser or chromium (snap) command.
cat <<'EOF'
[Desktop Entry]
Type=Application
Name=Looma Kiosk
Comment=Wait for Looma to be ready, then open it fullscreen (Chromium kiosk)
Exec=bash -lc 'for i in $(seq 1 60); do curl -fsS -o /dev/null "@KIOSK_URL@" && break; sleep 5; done; CB=$(command -v chromium-browser || command -v chromium); exec "$CB" --kiosk --incognito --noerrdialogs --disable-infobars --disable-session-crashed-bubble --check-for-update-interval=31536000 "@KIOSK_URL@"'
X-GNOME-Autostart-enabled=true
Terminal=false
EOF
}

# A clickable Desktop icon to (re)open Looma by hand — e.g. after closing the
# kiosk window, or on a box where autostart is disabled (--no-kiosk). Separate
# from tpl_kiosk_desktop: that one is the AUTOSTART entry (~/.config/autostart,
# waits for the app, runs at login); this one is a manual launcher
# (~/Desktop, no wait loop — the app is already up by the time someone clicks it).
tpl_start_looma_desktop() {
cat <<'EOF'
[Desktop Entry]
Version=1.0
Type=Application
Name=Start Looma
Comment=Open Looma in Chromium (fullscreen kiosk mode)
Icon=chromium-browser
Terminal=false
Exec=bash -lc 'CB=$(command -v chromium-browser || command -v chromium); exec "$CB" --kiosk --incognito --noerrdialogs --disable-infobars --disable-session-crashed-bubble "@KIOSK_URL@"'
EOF
}

tpl_apache_conf() {
# Native Apache site (Ubuntu 20.04, mod_php7.4). Serves the app on :80 (the
# default site is disabled, so Looma owns port 80 — otherwise hitting :80 gives
# Apache's "Forbidden" on the empty /var/www/html root).
# DocumentRoot is @LOOMA_ROOT@/Looma, so /content, /maps2018 and /ePaath (its
# siblings) need explicit aliases — mirrors docker_httpd.conf.
cat <<'EOF'
Define LOOMA_ROOT @LOOMA_ROOT@

<VirtualHost *:80>
    ServerName looma
    ServerAdmin skip@looma.education
    # NOTE: no `ServerTokens` here — it is a SERVER-level directive and Apache
    # refuses to start if it appears inside <VirtualHost> ("ServerTokens cannot
    # occur within <VirtualHost>"). Ubuntu already sets it in
    # /etc/apache2/conf-available/security.conf.

    DocumentRoot "${LOOMA_ROOT}/@REPO_NAME@"
    DirectoryIndex index.php index.html
    ErrorDocument 404 /looma-404.php

    # Where the PHP finds its services. Without these it falls back to the compose
    # hostnames (http://looma-search:46333, http://looma-ai:8089), which resolve
    # inside Docker but NOT on this host — search would silently return nothing.
    # zvec/Piper/AI listen on the host here, whether they run as containers with
    # host networking (the default) or as systemd services.
    SetEnv LOOMA_SEARCH_ENGINE zvec
    SetEnv LOOMA_SEARCH_URL http://127.0.0.1:46333/search
    SetEnv LOOMA_SEARCH_URL_ZVEC http://127.0.0.1:46333/search
    SetEnv LOOMA_AI_URL http://127.0.0.1:8089

    # NOTE: do NOT set a PHP handler here. Ubuntu's mod_php already installs one
    # (/etc/apache2/mods-enabled/php7.4.conf). A second `SetHandler
    # application/x-httpd-php` in this vhost overrides it with a handler nothing
    # is registered for, so Apache stops executing the PHP and serves it as a
    # plain file — the browser then shows index.php's source instead of Looma.

    <Directory "${LOOMA_ROOT}/@REPO_NAME@">
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted

        # The pretty URLs. These live in docker_httpd.conf for the container; the
        # native vhost had none of them, so /home, /library, /search … all 404'd
        # and you only ever saw looma-404.php. Keep this list in step with
        # docker_httpd.conf.
        <IfModule mod_rewrite.c>
            RewriteEngine on
            RewriteRule ^home$        /looma-home.php [NC,L]
            RewriteRule ^library$     /looma-library.php [NC,L]
            RewriteRule ^search$      /looma-library-search.php [NC,L]
            RewriteRule ^chapters$    /looma-chapters.php [NC,L]
            RewriteRule ^activities$  /looma-activities.php [NC,L]
            RewriteRule ^dictionary$  /looma-dictionary.php [NC,L]
            RewriteRule ^video$       /looma-play-video.php [NC,L]
            RewriteRule ^image$       /looma-play-image.php [NC,L]
            RewriteRule ^pdf$         /looma-play-pdf.php [NC,L]
            RewriteRule ^text$        /looma-play-text.php [NC,L]
            RewriteRule ^html$        /looma-html.php [NC,L]
            RewriteRule ^epaath$      /looma-epaath.php [NC,L]
            RewriteRule ^wikipedia$   /looma-wikipedia.php [NC,L]
            RewriteRule ^lesson$      /looma-play-lesson.php [NC,L]
            RewriteRule ^game$        /looma-game.php [NC,L]
            RewriteRule ^games$       /looma-games.php [NC,L]
            RewriteRule ^game-list$   /looma-game-list.php [NC,L]
            RewriteRule ^histories$   /looma-histories.php [NC,L]
            RewriteRule ^history$     /looma-history.php [NC,L]
            RewriteRule ^calculator$  /looma-calculator.php [NC,L]
            RewriteRule ^audio$       /looma-play-audio.php [NC,L]
            RewriteRule ^web$         /looma-web.php [NC,L]
            RewriteRule ^info$        /looma-info.php [NC,L]
            RewriteRule ^settings$    /looma-settings.php [NC,L]
            RewriteRule ^book$        /looma-book.php [NC,L]
            RewriteRule ^slideshow$   /looma-play-slideshow.php [NC,L]
            RewriteRule ^map$         /looma-play-map.php [NC,L]
            RewriteRule ^maps$        /looma-maps.php [NC,L]
            RewriteRule ^paint$       /looma-paint.php [NC,L]
            RewriteRule ^clock$       /looma-clock.php [NC,L]
            RewriteRule ^activity$    /looma-log-viewer.php [NC,L]
        </IfModule>
    </Directory>

    Alias /content/  "${LOOMA_ROOT}/content/"
    Alias /content   "${LOOMA_ROOT}/content"
    <Directory "${LOOMA_ROOT}/content">
        Options -Indexes +FollowSymLinks
        Require all granted
    </Directory>

    Alias /maps2018/ "${LOOMA_ROOT}/maps2018/"
    Alias /maps2018  "${LOOMA_ROOT}/maps2018"
    <Directory "${LOOMA_ROOT}/maps2018">
        Options -Indexes +FollowSymLinks
        Require all granted
    </Directory>

    # ePaath lives at content/epaath on the box; expose it at /ePaath.
    Alias /ePaath/ "${LOOMA_ROOT}/content/epaath/"
    Alias /ePaath  "${LOOMA_ROOT}/content/epaath"
    <Directory "${LOOMA_ROOT}/content/epaath">
        Options -Indexes +FollowSymLinks
        Require all granted
    </Directory>

    ErrorLog  ${APACHE_LOG_DIR}/looma-error.log
    CustomLog ${APACHE_LOG_DIR}/looma-access.log combined
</VirtualHost>
EOF
}

tpl_native_sidecars() {
# The NATIVE deployment runs Apache/PHP/MongoDB on the host, but zvec search and
# Piper TTS as containers — the host's Python (3.8 on focal) cannot install their
# requirements, while the images already carry the right Python, torch, the
# embedding model and the Piper voices.
#
# `network_mode: host` is the point of this file: the containers then reach the
# HOST's MongoDB on 127.0.0.1:27017 and publish their own ports (46333, 5002, 8089)
# straight onto the host, exactly where the native Apache/PHP expects them. The
# alternative — a bridge network — would mean exposing MongoDB on the LAN.
#
# Piper has no image of its own: it lives inside the web image (voices baked in),
# so we run that image with the Piper Flask server as its command.
cat <<'EOF'
services:
  looma-search:
    build:
      context: ..
      dockerfile: @REPO_NAME@/search-service/Dockerfile
    image: loomasearch:latest
    container_name: looma-search
    network_mode: host
    environment:
      MONGO_URL: mongodb://127.0.0.1:27017
      MONGO_DB: looma
      MONGO_COLLECTION: activities
      MODEL_NAME: sentence-transformers/all-MiniLM-L6-v2
      HF_HOME: /models/hf
      INDEX_DIR: /data/zvec-index
      SEARCH_REBUILD_ON_START: "0"
      SEARCH_PORT: "46333"
      OTEL_SERVICE_NAME: looma-search
      OTEL_EXPORTER_OTLP_ENDPOINT: "@OTEL_ENDPOINT@"
      OTEL_EXPORTER_OTLP_PROTOCOL: http/protobuf
      OTEL_TRACES_EXPORTER: "@OTEL_TRACES@"
      OTEL_LOGS_EXPORTER: "@OTEL_TRACES@"
      OTEL_METRICS_EXPORTER: none
    volumes:
      - looma_search_index:/data
      - looma_search_hf:/models/hf
    restart: unless-stopped

  looma-piper:
    build:
      context: .
      dockerfile: Dockerfile
    image: loomaweb:latest
    container_name: looma-piper
    network_mode: host
    # 0.0.0.0, not the script's 127.0.0.1 default: with host networking that is the
    # same interface, but it keeps working if this is ever moved to a bridge.
    environment:
      LOOMA_PIPER_HOST: 0.0.0.0
      LOOMA_PIPER_PORT: "5002"
      LOOMA_PIPER_VOICE_DIR: /usr/share/piper
    command: ["python3", "/usr/local/var/www/@REPO_NAME@/piper_server.py"]
    restart: unless-stopped

  looma-ai:
    profiles: ["ai"]
    build:
      context: ./looma-ai
      dockerfile: Dockerfile
    image: looma-ai:latest
    container_name: looma-ai
    network_mode: host
    environment:
      LOOMA_MONGO_URL: mongodb://127.0.0.1:27017
      LOOMA_MONGO_DB: looma
      LOOMA_MONGO_COLLECTION: activities
      LOOMA_SOURCE_ROOT: /looma/content
      LOOMA_DEVICE: cpu
      LOOMA_DISABLE_EMBEDDINGS: "0"
      LOOMA_ENABLE_EMBED_INDEXING: "1"
      HF_HOME: /app/data/models/hf
      TRANSFORMERS_CACHE: /app/data/models/hf
      OTEL_SERVICE_NAME: looma-ai
      OTEL_EXPORTER_OTLP_ENDPOINT: "@OTEL_ENDPOINT@"
      OTEL_EXPORTER_OTLP_PROTOCOL: http/protobuf
      OTEL_TRACES_EXPORTER: "@OTEL_TRACES@"
      OTEL_LOGS_EXPORTER: "@OTEL_TRACES@"
      OTEL_METRICS_EXPORTER: none
    volumes:
      # The host's content dir — looma-ai writes summaries/keywords back into it.
      - @WWW@/content:/looma/content
      - looma_ai_data:/app/data
    command: ["python", "scripts/looma_server.py", "--host", "0.0.0.0", "--port", "8089"]
    restart: unless-stopped

# These three are SHARED with the Docker app stack (docker-compose.yml), which
# declares them under its own project. `external: true` makes Compose skip the
# ownership check entirely instead of warning
#   volume "looma_ai_data" already exists but was created for project "looma"
#   (expected "looma-native"). Use external: true to use an existing volume
# on every docker <-> native switch — and it keeps the zvec index and the HF cache
# INSTEAD of throwing them away. `external` also means Compose never creates them,
# so the installer does (ensure_shared_volumes) before it brings this file up.
volumes:
  looma_search_index:
    name: looma_search_index
    external: true
  looma_search_hf:
    name: looma_search_hf
    external: true
  looma_ai_data:
    name: looma_ai_data
    external: true
EOF
}

tpl_native_obs_override() {
# In the NATIVE install the app runs on the host but the observability STACK still
# runs in Docker. `!override` REPLACES the collector's volume list so it tails the
# HOST's Apache logs instead of the (non-existent) looma_apache_logs volume.
cat <<'EOF'
services:
  otel-collector:
    volumes: !override
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - /:/hostfs:ro
      - looma_otel_storage:/var/lib/otelcol/file_storage
      - /var/log/apache2:/var/log/apache2:ro
EOF
}

tpl_unit_piper() {
cat <<'EOF'
[Unit]
Description=Looma Piper TTS (Flask sidecar on :5002, used by looma-TTS.php)
After=network.target

[Service]
Type=simple
Environment=LOOMA_PIPER_BIN=piper
Environment=LOOMA_PIPER_VOICE_DIR=/usr/share/piper
Environment=LOOMA_PIPER_PORT=5002
# The Piper binary lives in @LOOMA_ROOT@/piper.
Environment=PATH=@LOOMA_ROOT@/piper:/usr/local/bin/piper:/usr/local/bin:/usr/bin:/bin
# OTLP: @OTEL_ENDPOINT@/@OTEL_TRACES@ are substituted by the installer; when obs is
# disabled the endpoint is empty and the exporters become no-ops.
Environment=OTEL_SERVICE_NAME=piper-tts
Environment=OTEL_EXPORTER_OTLP_ENDPOINT=@OTEL_ENDPOINT@
Environment=OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf
Environment=OTEL_TRACES_EXPORTER=@OTEL_TRACES@
Environment=OTEL_METRICS_EXPORTER=none
Environment=OTEL_LOGS_EXPORTER=none
Environment=OTEL_RESOURCE_ATTRIBUTES=service.name=piper-tts,service.namespace=looma,deployment.environment=looma
# CPU GUARD — do NOT remove. Piper/onnxruntime inference otherwise pegs every core
# at max frequency; on the odroid that exceeds the board's power/thermal budget and
# it RESETS mid-synthesis. (The legacy piper.service made this worse by explicitly
# writing scaling_max_freq=1900000.) We cap the service instead of the whole board:
#   CPUQuota  — total CPU it may use (@PIPER_CPUQUOTA@, default 200% = 2 cores)
#   Nice      — yields to Apache/PHP so the UI stays responsive
#   *_THREADS — keep onnxruntime/OpenMP from spawning one hot thread per core
Environment=OMP_NUM_THREADS=@PIPER_THREADS@
Environment=OPENBLAS_NUM_THREADS=@PIPER_THREADS@
Environment=MKL_NUM_THREADS=@PIPER_THREADS@
Environment=ONNX_NUM_THREADS=@PIPER_THREADS@
CPUQuota=@PIPER_CPUQUOTA@
Nice=10
WorkingDirectory=@LOOMA_ROOT@/@REPO_NAME@
ExecStart=@VENV@/bin/python @LOOMA_ROOT@/@REPO_NAME@/piper_server.py
Restart=always
RestartSec=3
User=www-data
Group=www-data

[Install]
WantedBy=multi-user.target
EOF
}

tpl_unit_search() {
cat <<'EOF'
[Unit]
Description=Looma semantic search (zvec) — gunicorn on :46333
# Ubuntu's OLD mongodb-server package (still on some boxes) uses the unit name
# `mongodb.service`; the mongodb-org repo package uses `mongod.service`. List both —
# an unresolved name in Wants=/After= is a harmless no-op, not a failure.
After=network.target mongod.service mongodb.service
Wants=mongod.service mongodb.service

[Service]
Type=simple
# Gunicorn's control server otherwise resolves a dotdir off $HOME to store its
# runtime state; www-data's passwd entry is /var/www, which www-data cannot
# write to (only the html/ subtree is www-data's) — "Control server error:
# Permission denied: '/var/www/.gunicorn'". Give it a HOME it actually owns.
Environment=HOME=@LOOMA_ROOT@/@REPO_NAME@
Environment=SEARCH_PORT=46333
# search_service.py reads MONGO_URL (see search-service/search_service.py) — NOT
# LOOMA_MONGO_URI. Setting the wrong name here means the script silently falls
# back to its own default, mongodb://looma-db:27017 (a Docker-network hostname),
# which fails DNS resolution on the native host and search never connects.
Environment=MONGO_URL=mongodb://127.0.0.1:27017
# search_service.py's own default INDEX_DIR (/data/zvec-index) only makes sense
# inside the Docker image — /data does not exist on the native host at all, and
# www-data cannot create a directory at the filesystem root. _save_index() catches
# that failure silently (logs it, does not crash), so the service looks fine but
# NEVER actually persists the index — every restart re-embeds the whole corpus
# from zero and loses it again the moment it restarts again. Point it somewhere
# www-data can actually write.
Environment=INDEX_DIR=/var/lib/looma/zvec-index
# search_service.py rebuilds the WHOLE index on every start unless this is "0"
# (default "1" — see SEARCH_REBUILD_ON_START in search_service.py). It still
# rebuilds automatically the first time there is no saved index at all, so this
# is always safe: it only skips re-embedding a corpus that is ALREADY indexed
# and saved to INDEX_DIR. Without it, a crash/reboot mid-build (or just a normal
# restart) throws away a perfectly good saved index and starts the whole slow
# embed over from zero, every time.
Environment=SEARCH_REBUILD_ON_START=0
# CPU/memory GUARD — do NOT remove. Building the first full-corpus embedding index
# (thousands of activities) with torch/BLAS free to use every core spikes memory
# enough to get SIGKILL'd by the OOM killer on an 8 GB (or less) odroid running
# Apache/MongoDB/Piper alongside it — confirmed reproducible on a real box. Capping
# threads to 1 trades embed speed for actually finishing instead of crash-looping.
Environment=OMP_NUM_THREADS=1
Environment=MKL_NUM_THREADS=1
Environment=OPENBLAS_NUM_THREADS=1
Environment=TOKENIZERS_PARALLELISM=false
# Reuse the multilingual model looma-ai already bakes into @HF_DIR@ (paraphrase-
# multilingual-MiniLM-L12-v2) instead of search_service.py's own default
# (all-MiniLM-L6-v2, English-only) — it is not the same model, so the default
# would need its own separate download, and it wouldn't handle Nepali content.
Environment=MODEL_NAME=sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2
# Offline mode only when @HF_DIR@ actually has a cached model (baked bundle, or a
# box that already fetched one) — see the installer's hf_offline check. Forcing it
# on with an empty cache would mean sentence-transformers can NEVER fetch the model.
Environment=HF_HOME=@HF_DIR@
Environment=TRANSFORMERS_OFFLINE=@HF_OFFLINE@
Environment=HF_HUB_OFFLINE=@HF_OFFLINE@
Environment=OTEL_SERVICE_NAME=looma-search
Environment=OTEL_EXPORTER_OTLP_ENDPOINT=@OTEL_ENDPOINT@
Environment=OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf
Environment=OTEL_TRACES_EXPORTER=@OTEL_TRACES@
Environment=OTEL_LOGS_EXPORTER=@OTEL_TRACES@
Environment=OTEL_METRICS_EXPORTER=none
Environment=OTEL_RESOURCE_ATTRIBUTES=service.name=looma-search,service.namespace=looma,deployment.environment=looma
WorkingDirectory=@LOOMA_ROOT@/@REPO_NAME@/search-service
# 1 worker (the zvec index is in memory); long timeout so the first-run
# full-corpus embed isn't killed on ARM.
ExecStart=@VENV@/bin/gunicorn --workers 1 --timeout 1800 --bind 0.0.0.0:46333 search_service:app
Restart=always
RestartSec=5
Nice=10
User=www-data
Group=www-data

[Install]
WantedBy=multi-user.target
EOF
}

tpl_unit_ai() {
cat <<'EOF'
[Unit]
Description=Looma AI assistant (looma-ai) — HTTP on :8089
# Ubuntu's OLD mongodb-server package (still on some boxes) uses the unit name
# `mongodb.service`; the mongodb-org repo package uses `mongod.service`. List both —
# an unresolved name in Wants=/After= is a harmless no-op, not a failure.
After=network.target mongod.service mongodb.service
Wants=mongod.service mongodb.service

[Service]
Type=simple
Environment=OMP_NUM_THREADS=1
Environment=MKL_NUM_THREADS=1
Environment=OPENBLAS_NUM_THREADS=1
Environment=NUMEXPR_NUM_THREADS=1
Environment=TOKENIZERS_PARALLELISM=false
# looma_server.py reads LOOMA_MONGO_URL (see looma-ai/scripts/looma_server.py) —
# NOT LOOMA_MONGO_URI. The wrong name here silently falls back to the script's own
# default, mongodb://looma-db:27017 (a Docker-network hostname), which fails DNS
# resolution on the native host.
Environment=LOOMA_MONGO_URL=mongodb://127.0.0.1:27017
# Various libraries (HF cache fallbacks, matplotlib config, etc.) write to a
# dotdir under $HOME; www-data's passwd entry is /var/www, which www-data
# cannot write to (only the html/ subtree is www-data's) — same class of bug
# as looma-search's gunicorn control-socket permission error.
Environment=HOME=@LOOMA_ROOT@/@REPO_NAME@
# looma_server.py's own defaults (LOOMA_SOURCE_ROOT=/looma/content,
# LOOMA_EXAMS_DIR=/looma/content/exams) only exist inside the Docker image.
# Native content lives at @LOOMA_ROOT@/content (a sibling of the repo — see
# copy_content()/check_space()), not under the repo itself. Without this the
# assistant finds no textbooks/lessons to work with at all on a native install.
Environment=LOOMA_SOURCE_ROOT=@LOOMA_ROOT@/content
Environment=LOOMA_EXAMS_DIR=@LOOMA_ROOT@/content/exams
Environment=HF_HOME=@HF_DIR@
Environment=TRANSFORMERS_OFFLINE=@HF_OFFLINE@
Environment=HF_HUB_OFFLINE=@HF_OFFLINE@
# looma_server.py's own otel_bootstrap.init_tracing() checks THIS var (default
# "1" i.e. always on), not OTEL_TRACES_EXPORTER below — a different gate than
# every other exporter here. Without it, tracing always tries to import
# opentelemetry regardless of whether observability is on, and warns
# "OpenTelemetry SDK unavailable" on every start when the package isn't
# installed (which it isn't, when observability is off — nothing needs it).
Environment=OTEL_ENABLED=@OTEL_ENABLED@
Environment=OTEL_SERVICE_NAME=looma-ai
Environment=OTEL_EXPORTER_OTLP_ENDPOINT=@OTEL_ENDPOINT@
Environment=OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf
Environment=OTEL_TRACES_EXPORTER=@OTEL_TRACES@
Environment=OTEL_LOGS_EXPORTER=@OTEL_TRACES@
Environment=OTEL_METRICS_EXPORTER=none
Environment=OTEL_RESOURCE_ATTRIBUTES=service.name=looma-ai,service.namespace=looma,deployment.environment=looma
WorkingDirectory=@LOOMA_ROOT@/@REPO_NAME@/looma-ai
ExecStart=@VENV@/bin/python scripts/looma_server.py --host 0.0.0.0 --port 8089
Restart=always
RestartSec=5
User=www-data
Group=www-data

[Install]
WantedBy=multi-user.target
EOF
}

# NATIVE-only. CPUQuota/Nice/thread caps on looma-piper.service limit AVERAGE CPU
# time, but not how fast a core clocks during a burst — onnxruntime can still spike
# every core to its rated max frequency for a fraction of a second, and on the
# odroid that current spike is enough to brown out the board and reset it
# (confirmed: reproducible by pressing play in the Piper TTS UI). Capping the
# actual clock ceiling at boot, system-wide, is what prevents the spike in the
# first place. The Docker deployment already has this (tpl_looma_service); native
# had no equivalent, silently ignoring --cpu-max-freq entirely.
tpl_unit_cpucap() {
cat <<'EOF'
[Unit]
Description=Looma CPU frequency cap (native deployment — prevents Piper TTS power brownouts)
DefaultDependencies=no
Before=looma-piper.service looma-search.service looma-ai.service apache2.service
After=local-fs.target

[Service]
Type=oneshot
RemainAfterExit=yes
# Leading `-`: a board whose cpufreq is read-only or absent must not stop Looma
# from booting. `$$f` (not `$f`) only matters inside systemd unit files that
# systemd itself expands — irrelevant here since this runs via sh -c literally,
# but kept consistent with tpl_looma_service's ExecStartPre.
ExecStart=/bin/sh -c 'for f in /sys/devices/system/cpu/cpu*/cpufreq/scaling_max_freq; do echo @CPU_MAX_FREQ@ > "$f" 2>/dev/null || true; done'

[Install]
WantedBy=multi-user.target
EOF
}

tpl_unit_containerd() {
cat <<'EOF'
[Unit]
Description=containerd container runtime (Looma offline static install)
After=network.target local-fs.target

[Service]
ExecStartPre=-/sbin/modprobe overlay
ExecStart=/usr/local/bin/containerd
Restart=always
RestartSec=5
Delegate=yes
KillMode=process
LimitNOFILE=1048576
TasksMax=infinity

[Install]
WantedBy=multi-user.target
EOF
}

tpl_unit_dockerd() {
cat <<'EOF'
[Unit]
Description=Docker Application Container Engine (Looma offline static install)
After=network-online.target containerd.service
Wants=network-online.target
Requires=containerd.service

[Service]
Type=notify
ExecStart=/usr/local/bin/dockerd -H unix:///var/run/docker.sock --containerd=/run/containerd/containerd.sock
ExecReload=/bin/kill -s HUP $MAINPID
Restart=always
RestartSec=5
LimitNOFILE=1048576
LimitNPROC=infinity
LimitCORE=infinity
TasksMax=infinity
Delegate=yes
KillMode=process

[Install]
WantedBy=multi-user.target
EOF
}

# ===========================================================================
# Interactive form — a NAVIGABLE menu. Each row shows its current value; pick a
# row to change it, then "Install now". whiptail if available, plain text if not.
# The form only sets the variables the flags set, so scripted installs behave
# identically.
# ===========================================================================
USE_TUI=0; command -v whiptail >/dev/null 2>&1 && [ -t 0 ] && USE_TUI=1
FORM_TITLE="Looma ODROID installer"

ui_input() {  # VAR "prompt" "default"
  local __v="$1" p="$2" d="${3:-}" x
  if [ "$USE_TUI" = 1 ]; then
    x=$(whiptail --title "$FORM_TITLE" --inputbox "$p" 11 78 "$d" 3>&1 1>&2 2>&3) || return 1
  else
    read -rp "$p [$d]: " x || true; x="${x:-$d}"
  fi
  printf -v "$__v" '%s' "$x"
}

ui_choose() {  # VAR "title" tag desc tag desc …   (current value of VAR preselected)
  local __v="$1" t="$2"; shift 2
  local cur="${!__v}" c
  if [ "$USE_TUI" = 1 ]; then
    local a=(); local n=$(( $# / 2 ))
    while [ $# -gt 0 ]; do a+=("$1" "$2"); shift 2; done
    c=$(whiptail --title "$FORM_TITLE" --default-item "$cur" --menu "$t" 20 78 "$n" "${a[@]}" 3>&1 1>&2 2>&3) || return 1
  else
    echo; echo "$t"
    local i=1 tags=()
    while [ $# -gt 0 ]; do
      tags+=("$1"); printf '  %d) %-8s %s%s\n' "$i" "$1" "$2" "$([ "$1" = "$cur" ] && echo '   <- current')"
      shift 2; i=$((i+1))
    done
    local s; read -rp "Choose [1-${#tags[@]}] (Enter = keep '$cur'): " s || true
    [ -n "${s:-}" ] || return 0
    c="${tags[$((s-1))]:-$cur}"
  fi
  printf -v "$__v" '%s' "$c"
}

ui_yesno() {  # "question"  -> 0 = yes
  local q="$1"
  if [ "$USE_TUI" = 1 ]; then whiptail --title "$FORM_TITLE" --yesno "$q" 14 78
  else local a; read -rp "$q [Y/n]: " a || true; case "${a:-Y}" in [Nn]*) return 1;; *) return 0;; esac; fi
}

# Pick the observability profile and, for "remote", the host that receives it.
edit_observability() {
  local OBS=none
  [ "$WITH_OBSERVABILITY" = "1" ] && OBS=full
  [ "$WITH_AGENTS" = "1" ] && OBS=remote
  ui_choose OBS "Observability profile" \
    "full"   "Full stack on this box — OpenSearch, Dashboards, Grafana, traces (trimmed for 8 GB)" \
    "remote" "Remote — this box runs only Vector+Metricbeat and ships traces/logs to another host" \
    "none"   "None — Looma app only (lightest)" || return 0
  case "$OBS" in
    full)   WITH_OBSERVABILITY=1; WITH_AGENTS=0 ;;
    none)   WITH_OBSERVABILITY=0; WITH_AGENTS=0; WITH_ANALYSIS=0 ;;
    remote) WITH_OBSERVABILITY=0; WITH_AGENTS=1; WITH_ANALYSIS=0
            local h="$REMOTE_OBS_HOST"
            ui_input h "Remote observability host (IP/hostname; must be reachable on :4318 OTLP and :49200 OpenSearch)" "$h" || return 0
            if [ -z "$h" ]; then warn "the remote profile needs a host — leaving observability unchanged"; return 0; fi
            REMOTE_OBS_HOST="$h" ;;
  esac
}

obs_label() {
  if [ "$WITH_OBSERVABILITY" = "1" ]; then echo "full (on this box)"
  elif [ "$WITH_AGENTS" = "1" ]; then echo "remote -> ${REMOTE_OBS_HOST:-?}"
  else echo "none"; fi
}

summary() {
  local row='  %-16s: %s\n'
  printf "$row" "Deployment" "$DEPLOY$([ "$DEPLOY" = native ] && echo ' (Apache/PHP/MongoDB on the host)' || echo ' (containers)')"
  [ "$DEPLOY" = native ] && printf "$row" "zvec + Piper" \
    "$([ "$SIDECARS" = docker ] && echo 'in Docker (recommended)' || echo 'on the host (venv + systemd)')"
  printf "$row" "Install source" "$([ "$OFFLINE" = 1 ] && echo 'offline — from the disk bundle, no internet' || echo 'online — pulls/builds from the internet')"
  printf "$row" "Observability" "$(obs_label)"
  printf "$row" "AI assistant" "$(onoff "$WITH_AI")"
  [ "$DEPLOY" = native ] && printf "$row" "Search (zvec)" "$(onoff "$WITH_SEARCH")"
  [ "$DEPLOY" = docker ] && [ "$WITH_OBSERVABILITY" = 1 ] && printf "$row" "Analysis workers" "$(onoff "$WITH_ANALYSIS")"
  printf "$row" "Kiosk autostart" "$(onoff "$INSTALL_KIOSK")$([ "$INSTALL_KIOSK" = 1 ] && echo " -> $(kiosk_url)")"
  printf "$row" "Swapfile (${SWAP_GB}G)" "$(yesno "$MAKE_SWAP")"
  printf "$row" "CPU max freq" \
    "$([ "${CPU_MAX_FREQ:-0}" = 0 ] && echo 'unchanged (Piper TTS may brown out this board)' || echo "capped at $((CPU_MAX_FREQ/1000)) MHz at boot")"
  printf "$row" "Install root" "$WWW"
  printf "$row" "Desktop user" "$TARGET_USER"
  return 0
}

run_form() {
  local choice
  while :; do
    # The menu is rebuilt every pass so each row shows its CURRENT value, and
    # rows that don't apply to the chosen deployment simply aren't offered.
    local rows=(
      "deploy"  "Deployment ............ $DEPLOY"
      "source"  "Install source ........ $([ "$OFFLINE" = 1 ] && echo 'offline (disk bundle)' || echo 'online (internet)')"
      "obs"     "Observability ......... $(obs_label)"
      "ai"      "AI assistant (looma-ai) $(onoff "$WITH_AI")"
    )
    [ "$DEPLOY" = "native" ] && rows+=(
      "sidecars" "zvec + Piper run ...... $([ "$SIDECARS" = docker ] && echo 'in Docker' || echo 'on the host')"
      "search"   "Search service (zvec) . $(onoff "$WITH_SEARCH")" )
    [ "$DEPLOY" = "docker" ] && [ "$WITH_OBSERVABILITY" = "1" ] && \
      rows+=( "analysis" "Obs analysis workers .. $(onoff "$WITH_ANALYSIS")" )
    rows+=(
      "kiosk"   "Chromium kiosk ........ $(onoff "$INSTALL_KIOSK")"
      "url"     "Kiosk URL ............. $(kiosk_url)"
      "swap"    "Swapfile (${SWAP_GB}G) ....... $(yesno "$MAKE_SWAP")"
      "root"    "Install root .......... $WWW"
      "user"    "Desktop user .......... $TARGET_USER"
      "INSTALL" "==> Review and install"
      "QUIT"    "Quit without changing anything"
    )

    choice=INSTALL
    if [ "$USE_TUI" = 1 ]; then
      choice=$(whiptail --title "$FORM_TITLE" --default-item "$choice" \
        --menu "Select an option to change it, then choose 'Review and install'." \
        22 78 13 "${rows[@]}" 3>&1 1>&2 2>&3) || die "cancelled — nothing was changed"
    else
      echo; echo "=== $FORM_TITLE ==="
      local i=1 tags=() n=0
      while [ $n -lt ${#rows[@]} ]; do
        tags+=("${rows[$n]}"); printf '  %2d) %s\n' "$i" "${rows[$((n+1))]}"
        n=$((n+2)); i=$((i+1))
      done
      local s; read -rp "Choose [1-${#tags[@]}]: " s || true
      choice="${tags[$(( ${s:-0} - 1 ))]:-INSTALL}"
    fi

    case "$choice" in
      deploy)
        ui_choose DEPLOY "How should Looma run on this box?" \
          "docker" "Containers — recommended; this is how Looma runs now" \
          "native" "Native Apache/PHP/MongoDB/Piper on the host — legacy" || true
        # The two deployments listen on different ports. If the kiosk URL is still
        # one of the two defaults, follow the new deployment — otherwise the kiosk
        # would open the OTHER port, i.e. a dead page. A URL you typed is kept.
        case "$KIOSK_URL" in
          ""|http://localhost/home|http://localhost:48080/home|http://localhost|http://localhost:8080|http://localhost:48080) KIOSK_URL="" ;;
        esac
        ;;
      source)
        local SRC=online; [ "$OFFLINE" = 1 ] && SRC=offline
        ui_choose SRC "Where do the packages/images come from?" \
          "online"  "Internet — Docker/apt/pip fetch what they need" \
          "offline" "The disk bundle — no internet is used at all" || true
        if [ "$SRC" = "offline" ]; then
          if [ "$DEPLOY" = "docker" ] && [ ! -f "$OFFLINE_DIR/images/looma-images.tar" ]; then
            warn "no Docker bundle on the disk ($OFFLINE_DIR/images/looma-images.tar) — build it with: $0 build-bundle docker"
            ui_yesno "The Docker offline bundle is MISSING from the disk.\n\nKeep 'offline' anyway (the install will fail until the bundle is there)?" || SRC=online
          fi
          if [ "$DEPLOY" = "native" ] && ! ls "$NATIVE_BUNDLE"/deb/*.deb >/dev/null 2>&1; then
            warn "no native bundle on the disk ($NATIVE_BUNDLE/deb) — build it with: $0 build-bundle native"
            ui_yesno "The native offline bundle is MISSING from the disk.\n\nKeep 'offline' anyway (the install will fail until the bundle is there)?" || SRC=online
          fi
        fi
        [ "$SRC" = "offline" ] && OFFLINE=1 || OFFLINE=0
        ;;
      sidecars)
        ui_choose SIDECARS "How should zvec search and Piper TTS run?" \
          "docker" "As containers — recommended; they bring their own Python, torch and voices" \
          "host"   "On the host — a venv + systemd units; needs Python >= 3.9 (focal has 3.8)" || true
        ;;
      obs)      edit_observability ;;
      ai)       ui_yesno "Run the in-app AI assistant (looma-ai)?\n\nIt is heavy (torch) — turn it off if 8 GB is tight." && WITH_AI=1 || WITH_AI=0 ;;
      search)   ui_yesno "Install the zvec semantic search service?" && WITH_SEARCH=1 || WITH_SEARCH=0 ;;
      analysis) ui_yesno "Also run the heavy observability AI analysis workers (torch)?\n\nSeparate from the assistant; off by default." && WITH_ANALYSIS=1 || WITH_ANALYSIS=0 ;;
      kiosk)    ui_yesno "Install the Chromium kiosk autostart (fullscreen Looma on login)?" && INSTALL_KIOSK=1 || INSTALL_KIOSK=0 ;;
      url)      ui_input KIOSK_URL "URL the kiosk opens" "$(kiosk_url)" || true ;;
      swap)     if ui_yesno "Create a swapfile (recommended on 8 GB)?\n\nA re-install with a different size REPLACES the existing swapfile."; then
                  MAKE_SWAP=1; ui_input SWAP_GB "Swapfile size (GB)" "$SWAP_GB" || true
                else
                  MAKE_SWAP=0
                fi ;;
      root)     ui_input WWW "Install root on the box" "$WWW" || true ;;
      user)     ui_input TARGET_USER "Desktop user for autostart/kiosk" "$TARGET_USER" || true ;;
      QUIT)     die "cancelled — nothing was changed" ;;
      INSTALL)
        ui_yesno "Review your choices:

$(summary)
Proceed with the install?" && return 0
        ;;
    esac
  done
}

# ===========================================================================
# Shared install steps
# ===========================================================================
have_network() {
  curl -fsS --max-time 8 -o /dev/null https://download.docker.com/ 2>/dev/null && return 0
  ping -c1 -W3 8.8.8.8 >/dev/null 2>&1
}

# Best-effort noise reduction before apt-get update — NOT required for the install
# to succeed (that call already tolerates a broken repo on its own). Stock odroid
# images are known to carry both a bionic AND a focal hardkernel PPA file with the
# IDENTICAL line, so apt warns "configured multiple times" on every single update;
# and deb.odroid.in, which stopped serving a Release file (404) some time ago.
# Verify before touching anything — never assume a repo is dead without checking.
tidy_known_broken_apt_repos() {
  local b="/etc/apt/sources.list.d/hardkernel-ubuntu-ppa-bionic.list"
  local f="/etc/apt/sources.list.d/hardkernel-ubuntu-ppa-focal.list"
  if [ -f "$b" ] && [ -f "$f" ] && diff -q "$b" "$f" >/dev/null 2>&1; then
    log "removing duplicate apt source $(basename "$b") (identical to $(basename "$f"))"
    rm -f "$b" "$b.save"
  fi
  local o="/etc/apt/sources.list.d/odroid.list" url
  if [ -f "$o" ] && grep -q '^deb ' "$o"; then
    url="$(grep '^deb ' "$o" | head -1 | awk '{print $2}')"
    if [ -n "$url" ] && ! curl -fsS --max-time 6 -o /dev/null "$url" 2>/dev/null; then
      log "disabling dead apt source $(basename "$o") ($url unreachable)"
      sed -i 's/^deb /# deb /' "$o"
    fi
  fi
}

bundle_present() {
  if [ "$DEPLOY" = "native" ]; then ls "$NATIVE_BUNDLE"/deb/*.deb >/dev/null 2>&1
  else [ -f "$OFFLINE_DIR/images/looma-images.tar" ] && ls "$OFFLINE_DIR"/docker/docker-*.tgz >/dev/null 2>&1
  fi
}

# OFFLINE means "take everything from the disk bundle". If that bundle isn't there,
# don't just abort: a box WITH a network can install perfectly well online, so fall
# back to that and say so. Only a box with no bundle AND no network is truly stuck.
settle_install_source() {
  [ "$OFFLINE" = "1" ] || return 0
  bundle_present && return 0

  local where; [ "$DEPLOY" = "native" ] && where="$NATIVE_BUNDLE" || where="$OFFLINE_DIR"
  warn "you asked for an OFFLINE install, but there is no bundle at $where."
  warn "(a bundle only exists after '$SCRIPT_PATH build-bundle $DEPLOY', which itself needs internet)"
  log  "checking whether this box has a network…"

  if have_network; then
    warn "this box IS online — installing ONLINE instead (nothing else changes)."
    OFFLINE=0
    return 0
  fi

  die "no bundle and no network — this box cannot install anything as things stand.
  Either give it a network and re-run, or build the bundle on a machine that has one:
      $SCRIPT_PATH build-bundle $DEPLOY --bundle-dir /var/lib/looma-bundle
  then install with:  --offline --bundle-dir /var/lib/looma-bundle"
}

resolve_obs_endpoints() {
  # Docker: the app talks to the local collector by container name, or to the
  # remote host in agents-only mode. Native: services use the host's :4318.
  if [ -n "$REMOTE_OBS_HOST" ]; then
    LOOMA_OTEL_ENDPOINT="http://$REMOTE_OBS_HOST:4318"
    LOOMA_OPENSEARCH_URL="http://$REMOTE_OBS_HOST:49200"
  fi
}

# The disk IS the installer, so it has to be readable before we touch the box. A USB
# dropout or a stale mount is not hypothetical here — the board browns out under load
# (see CPU_MAX_FREQ) and takes the disk with it. Catch it NOW, with the recovery
# spelled out, instead of half-way through the rsync that copies the repo in.
check_source_readable() {
  local mp
  if ls "$SRC_REPO" >/dev/null 2>&1 && [ -r "$SCRIPT_PATH" ]; then return 0; fi
  mp="$(df -P "$SRC_REPO" 2>/dev/null | awk 'NR==2{print $6}' || true)"
  die "cannot read the Looma repo on the install disk:
    $SRC_REPO
  The disk is unreadable or its mount went stale (a USB dropout). This is the same
  fault behind 'getcwd: cannot access parent directories: Input/output error' and
  'rsync: getcwd(): Input/output error (5)'. Recover the disk, then re-run:
      cd /                                   # step off the dead directory first
      sudo umount -l '${mp:-<mountpoint>}' && sudo mount -a   # or just re-plug the disk
      dmesg | tail -30                       # USB resets / I/O errors show up here
  If dmesg shows repeated resets, use another USB port (or a powered hub): this
  board browns out under load and drops the bus."
}

preflight() {
  [ "$(id -u)" -eq 0 ] || die "run as root: sudo $0 ${1:-}"
  id "$TARGET_USER" >/dev/null 2>&1 || die "user '$TARGET_USER' does not exist (use --user)"
  check_source_readable
  [ -d "$SRC_ROOT/content" ] || die "no content/ next to the repo at $SRC_ROOT"
  # Running the INSTALLED copy would rsync $WWW/Looma onto itself with --delete.
  [ "$SRC_REPO" != "$WWW/$REPO_NAME" ] || \
    die "this is the installed copy at $SRC_REPO — run the installer from the DISK, not from $WWW"
}

make_swap() {
  [ "$MAKE_SWAP" = "1" ] || return 0
  local want_kb=$((SWAP_GB * 1024 * 1024))

  if [ -f /swapfile ]; then
    # A re-install/update with a DIFFERENT SWAP_GB must REPLACE the old swapfile,
    # not leave it in place — "if missing" alone meant a size change silently
    # never took effect on a box that already had one from a previous install.
    # +-5% tolerance: fallocate/dd don't produce byte-exact sizes.
    local have_kb; have_kb=$(( $(stat -c%s /swapfile 2>/dev/null || echo 0) / 1024 ))
    local low=$((want_kb * 95 / 100)) high=$((want_kb * 105 / 100))
    if [ "$have_kb" -ge "$low" ] && [ "$have_kb" -le "$high" ]; then
      log "swapfile is already ~${SWAP_GB}G — leaving it as is"
      return 0
    fi
    log "swapfile is $((have_kb/1024/1024))G, requested ${SWAP_GB}G — replacing it"
    swapoff /swapfile 2>/dev/null || true
    rm -f /swapfile
  else
    # No swapfile of ours yet — if the system already has OTHER swap covering
    # this (e.g. a swap partition), don't add a redundant one on top of it.
    local cur; cur=$(awk '/SwapTotal/{print $2}' /proc/meminfo)
    if [ "${cur:-0}" -ge "$want_kb" ]; then
      log "the system already has $((${cur:-0}/1024/1024))G of swap (not ours) — not adding more"
      return 0
    fi
  fi

  log "creating ${SWAP_GB}G swapfile"
  fallocate -l "${SWAP_GB}G" /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=$((SWAP_GB*1024))
  chmod 600 /swapfile; mkswap /swapfile; swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
}

check_space() {
  # Only meaningful on a box that does NOT already hold the content.
  mkdir -p "$WWW"
  local content_dir="$WWW/content" need_kb free_kb
  if [ ! -d "$content_dir" ] || [ "$(du -sk "$content_dir" 2>/dev/null | awk '{print $1}')" -lt 1000000 ]; then
    need_kb=$(du -sk "$SRC_ROOT/content" | awk '{print $1}')
    free_kb=$(df -Pk "$WWW" | awk 'NR==2{print $4}')
    log "content ~$((need_kb/1024/1024)) GB, free on $WWW ~$((free_kb/1024/1024)) GB"
    [ "$free_kb" -gt "$((need_kb + 8000000))" ] || die "not enough free space at $WWW for the content"
  fi
}

copy_content() {
  # In place: full copy on a fresh box, incremental (--size-only) if it's already there.
  log "syncing content -> $WWW/content (in place; --size-only)…"
  rsync -a --info=progress2 --size-only "$SRC_ROOT/content/" "$WWW/content/"
  [ -d "$SRC_ROOT/maps2018" ] && rsync -a --size-only "$SRC_ROOT/maps2018/" "$WWW/maps2018/" || true
}

install_kiosk() {
  [ "$INSTALL_KIOSK" = "1" ] || return 0
  local url; url="$(kiosk_url)"
  # First remove ANY other browser autostart (legacy firefox.startup, an old
  # kiosk .desktop, etc.) so login opens exactly ONE window — ours. Runs for BOTH
  # the native and Docker deployments (the native path used to skip it -> two
  # Chromiums opened).
  disable_foreign_browser_autostarts
  log "installing Chromium kiosk autostart for $TARGET_USER ($url)"
  local autostart="/home/$TARGET_USER/.config/autostart"
  mkdir -p "$autostart"
  tpl_kiosk_desktop | sed -e "s#@KIOSK_URL@#$url#g" > "$autostart/looma-kiosk.desktop"
  chown -R "$TARGET_USER":"$TARGET_USER" "/home/$TARGET_USER/.config" 2>/dev/null || true
  command -v chromium-browser >/dev/null 2>&1 || command -v chromium >/dev/null 2>&1 || \
    warn "no chromium found — install a browser or the kiosk won't open"
}

# Always installed — independent of INSTALL_KIOSK/--no-kiosk: a manual "Start
# Looma" icon is useful precisely when autostart is off, or after someone closes
# the kiosk window. Re-generated on every install/update so the URL always
# follows kiosk_url() (the current deployment), like install_kiosk() above.
install_start_shortcut() {
  local url; url="$(kiosk_url)"
  log "installing the 'Start Looma' Desktop shortcut for $TARGET_USER ($url)"
  local desktop_dir="/home/$TARGET_USER/Desktop"
  mkdir -p "$desktop_dir"
  local f="$desktop_dir/Start Looma.desktop"
  tpl_start_looma_desktop | sed -e "s#@KIOSK_URL@#$url#g" > "$f"
  chmod +x "$f"
  chown "$TARGET_USER":"$TARGET_USER" "$f" 2>/dev/null || true
  # Nautilus/Caja refuse to run a Desktop launcher that isn't marked "trusted" —
  # best-effort only, older/other file managers don't need or have this key.
  command -v gio >/dev/null 2>&1 && sudo -u "$TARGET_USER" gio set "$f" metadata::trusted true 2>/dev/null || true
}

# ===========================================================================
# DOCKER deployment
# ===========================================================================
install_docker_engine_offline() {
  # Docker Engine + Compose v2 from the static binaries in the bundle (no internet).
  local docker_dir="$OFFLINE_DIR/docker" tgz tmp
  if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    log "docker + compose already present — skipping the offline Docker install"; return 0
  fi
  tgz="$(ls -1 "$docker_dir"/docker-*.tgz 2>/dev/null | head -1 || true)"
  [ -n "$tgz" ] && [ -f "$tgz" ] || die "no docker-*.tgz in $docker_dir (run: $0 build-bundle docker)"
  [ -f "$docker_dir/docker-compose" ] || die "no docker-compose plugin in $docker_dir"

  log "installing Docker binaries from $(basename "$tgz")"
  tmp="$(mktemp -d)"
  tar -xzf "$tgz" -C "$tmp"                 # extracts a docker/ dir: dockerd, containerd, runc, …
  install -m 0755 "$tmp"/docker/* /usr/local/bin/
  rm -rf "$tmp"

  log "installing the Docker Compose v2 plugin"
  install -d /usr/local/lib/docker/cli-plugins
  install -m 0755 "$docker_dir/docker-compose" /usr/local/lib/docker/cli-plugins/docker-compose

  getent group docker >/dev/null 2>&1 || groupadd docker
  log "installing systemd units for containerd + docker (the static release ships none)"
  tpl_unit_containerd > /etc/systemd/system/containerd.service
  tpl_unit_dockerd    > /etc/systemd/system/docker.service
  systemctl daemon-reload
  systemctl enable --now containerd.service
  systemctl enable --now docker.service

  for _ in $(seq 1 30); do docker info >/dev/null 2>&1 && break; sleep 1; done
  docker info >/dev/null 2>&1 || die "docker did not come up — check: journalctl -u docker -u containerd"
  docker compose version >/dev/null 2>&1 || die "the docker compose plugin is not working"
  log "Docker $(docker --version) installed offline"
}

# Docker Engine + Compose, whatever the deployment: the all-Docker install needs it,
# and so does the native one, whose zvec/Piper sidecars are containers.
ensure_docker() {
  if ! command -v docker >/dev/null 2>&1 || ! docker compose version >/dev/null 2>&1; then
    if [ "$OFFLINE" = "1" ]; then
      install_docker_engine_offline
    else
      log "installing Docker Engine (get.docker.com, arm64-aware)"
      # get.docker.com's own package list has grown to include docker-model-plugin
      # (Docker's AI model runner) — not published for every distro/arch combo
      # (confirmed missing for focal/arm64: "E: Unable to locate package
      # docker-model-plugin"). apt-get install fails ATOMICALLY when any package
      # in the list is unknown, so the one optional package we don't need takes
      # docker-ce/containerd/compose down with it. || true here so that (with
      # set -e active) this doesn't abort the whole installer — the repo/GPG
      # key setup earlier in that script already succeeded by the time it fails
      # on the package list, so a direct install of just what we actually need
      # immediately below succeeds using the same now-configured repo.
      curl -fsSL https://get.docker.com | sh || true
      if ! command -v docker >/dev/null 2>&1; then
        warn "get.docker.com's package list failed on this distro/arch (likely docker-model-plugin, which we don't need) — installing just the packages Looma actually uses"
        apt-get update || true
        apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin \
          || die "could not install Docker even with the minimal package list — check: apt-cache policy docker-ce"
      fi
    fi
  fi
  docker compose version >/dev/null 2>&1 || die "the docker compose v2 plugin is missing"
  systemctl enable --now docker >/dev/null 2>&1 || true
  id -nG "$TARGET_USER" | grep -qw docker || {
    usermod -aG docker "$TARGET_USER" || true
    warn "added $TARGET_USER to the docker group (re-login for non-sudo docker)"; }
}

# Any OTHER browser autostart (a legacy `firefox.startup`, an old kiosk .desktop,
# an LXDE session line…) opens a SECOND browser window on login next to ours —
# usually pointing at a dead URL. Kill them all EXCEPT our own looma-kiosk.desktop.
# Needed by BOTH deployments (the native install used to skip this, which is why
# two Chromiums opened).
disable_foreign_browser_autostarts() {
  local f dir la
  log "disabling other browser autostarts (so only the Looma kiosk opens)"
  for dir in "/home/$TARGET_USER/.config/autostart" "/etc/xdg/autostart"; do
    [ -d "$dir" ] || continue
    for f in "$dir"/*.desktop; do
      [ -f "$f" ] || continue
      case "$(basename "$f")" in looma-kiosk.desktop) continue;; esac
      if grep -qiE 'firefox|chromium|chrome|looma' "$f" 2>/dev/null && \
         grep -qiE 'kiosk|localhost|127\.0\.0\.1|firefox|chromium|chrome' "$f" 2>/dev/null; then
        mv -f "$f" "$f.disabled-by-looma" && log "  disabled autostart $(basename "$f")" || true
      fi
    done
  done
  # Legacy non-.desktop startup files (e.g. `firefox.startup`) live here too.
  for f in "/home/$TARGET_USER/.config/autostart"/*.startup; do
    [ -f "$f" ] || continue
    mv -f "$f" "$f.disabled-by-looma" && log "  disabled autostart $(basename "$f")" || true
  done
  # LXDE/LXQt session autostart: comment out any line that launches a browser.
  for la in "/home/$TARGET_USER/.config/lxsession"/*/autostart \
            "/home/$TARGET_USER/.config/lxqt/autostart.conf" \
            /etc/xdg/lxsession/*/autostart; do
    [ -f "$la" ] || continue
    if grep -qiE 'firefox|chromium|chrome' "$la"; then
      cp -f "$la" "$la.looma-bak" 2>/dev/null || true
      sed -i -E 's#^([^#].*(firefox|chromium|chrome).*)$#\# \1  # disabled-by-looma#I' "$la" \
        && log "  commented browser line(s) in $la" || true
    fi
  done
}

# The compose project name the DOCKER app stack runs under. Compose derives it from
# the project directory ($WWW/$REPO_NAME -> "Looma" -> "looma") and stamps it onto
# every volume it creates, so we have to derive it the same way to tell OUR volumes
# from another project's.
app_project_name() {
  printf '%s' "$REPO_NAME" | tr '[:upper:]' '[:lower:]' | tr -cd 'a-z0-9_-'
}

# Container names are GLOBAL to the Docker daemon, but a compose project only ever
# adopts the containers IT created. One left by ANOTHER project — the Docker stack's
# looma-ai vs the native sidecars' looma-ai, or anything from a hand-run
# `docker compose up` — is a hard, install-killing
#   Conflict. The container name "/looma-ai" is already in use by container "…"
# Re-running the installer means "install it again, whatever is on this box", so
# take the name back. Only containers belonging to a DIFFERENT project are removed:
# our own are left for compose to adopt/recreate, which matters for looma-db (it
# keeps Mongo in its writable layer, with no volume behind it).
# Is a TCP port free? ss first (iproute2, always on Ubuntu), then fuser/lsof.
port_free() {
  local p="$1"
  if command -v ss >/dev/null 2>&1; then
    ss -ltnH "sport = :$p" 2>/dev/null | grep -q . && return 1 || return 0
  elif command -v fuser >/dev/null 2>&1; then
    fuser "$p/tcp" >/dev/null 2>&1 && return 1 || return 0
  fi
  return 0                                   # cannot tell — let Docker decide
}

port_holder() {                              # what is sitting on the port
  local p="$1" h=""
  command -v ss >/dev/null 2>&1 && \
    h="$(ss -ltnpH "sport = :$p" 2>/dev/null | sed -n 's/.*users:((\(.*\))).*/\1/p' | head -1 || true)"
  printf '%s' "$h"
}

# Which CONTAINER publishes this host port, if any. `ss` only ever reports
# "docker-proxy" for a published port, which tells you nothing about which
# container to stop — this maps the port back to a name you can act on.
port_container() {
  local p="$1"
  command -v docker >/dev/null 2>&1 || return 0
  docker ps --format '{{.Names}}|{{.Ports}}' 2>/dev/null \
    | awk -F'|' -v port=":$p->" 'index($2, port) { print $1; exit }'
}

# `docker stop` returns once the container is gone, but the kernel can hold the
# listening socket a moment longer while docker-proxy tears down. Re-checking
# immediately would then abort the install over a port that is about to be free.
wait_port_free() {
  local p="$1" tries="${2:-20}"
  while [ "$tries" -gt 0 ]; do
    port_free "$p" && return 0
    sleep 0.5
    tries=$((tries - 1))
  done
  return 1
}

# Make sure the ports this install needs are actually free BEFORE compose tries to
# bind them — otherwise the stack dies with Docker's cryptic
#   failed to bind host port for 0.0.0.0:46333: address already in use
# Two things land on these ports. The OTHER deployment: the native install runs
# zvec/Piper as host-networked containers (and optionally systemd units) on these
# very ports — those are removed. And OUR OWN containers still running from a
# previous install — those are stopped, so compose can rebind and recreate them.
# Every container holding a needed port is cleared automatically; only a genuinely
# foreign, non-container process stops the install, and it is named precisely.
free_required_ports() {
  local project="$1"; shift
  local p c owner unit holder

  # 1) Leftover looma-* containers. Volumes are untouched either way, so no data
  #    is lost — compose recreates the containers in the `up` step below.
  #
  #    FOREIGN containers (another compose project, or started by hand) are
  #    removed outright: nothing here will ever manage them.
  #
  #    OURS are STOPPED, not skipped. They must be, because a running container
  #    of ours from a PREVIOUS install still publishes the port — that is the
  #    docker-proxy that used to make a perfectly ordinary re-install die at the
  #    port check below with "port 8089 is already in use". Leaving them up for
  #    compose to adopt cannot work: the preflight aborts before compose ever
  #    runs. Stopping (rather than removing) keeps compose's adoption intact —
  #    `up` starts or recreates them exactly as it would have.
  if command -v docker >/dev/null 2>&1; then
    for c in $(docker ps -a --format '{{.Names}}' 2>/dev/null | grep -E '^looma-' || true); do
      owner="$(docker container inspect \
        --format '{{ if .Config.Labels }}{{ index .Config.Labels "com.docker.compose.project" }}{{ end }}' \
        "$c" 2>/dev/null || true)"
      if [ "$owner" = "$project" ]; then
        # Only touch it if it is actually running and thus holding ports.
        docker ps --format '{{.Names}}' 2>/dev/null | grep -qx "$c" || continue
        docker stop "$c" >/dev/null 2>&1 \
          && log "  stopped our own running container $c — compose restarts it" \
          || warn "  could not stop $c — remove it by hand: docker rm -f $c"
        continue
      fi
      docker rm -f "$c" >/dev/null 2>&1 \
        && log "  removed the leftover container $c (compose project '${owner:-none}')" || true
    done
  fi

  # 2) Host services of ours that bind the same ports.
  for p in "$@"; do
    port_free "$p" && continue
    for unit in looma-search looma-piper looma-ai piper; do
      systemctl is-active --quiet "${unit}.service" 2>/dev/null || continue
      systemctl disable --now "${unit}.service" >/dev/null 2>&1 \
        && log "  stopped ${unit}.service — it was holding port $p" || true
    done
  done

  # 3) Still taken by a CONTAINER? Resolve docker-proxy back to the container that
  #    published the port and clear it here. Step 1 only matches names starting
  #    with "looma-", so anything renamed, or a stray hand-run container, would
  #    otherwise reach the die below and force the user to do this by hand — the
  #    installer has enough information to just fix it.
  for p in "$@"; do
    wait_port_free "$p" 6 && continue     # give step 1's stops time to release
    c="$(port_container "$p")"
    [ -n "$c" ] || continue
    owner="$(docker container inspect \
      --format '{{ if .Config.Labels }}{{ index .Config.Labels "com.docker.compose.project" }}{{ end }}' \
      "$c" 2>/dev/null || true)"
    if [ "$owner" = "$project" ]; then
      docker stop "$c" >/dev/null 2>&1 \
        && log "  stopped our own container $c — it was publishing port $p" || true
    else
      docker rm -f "$c" >/dev/null 2>&1 \
        && log "  removed the container $c (compose project '${owner:-none}') — it was publishing port $p" || true
    fi
  done

  # 4) Genuinely foreign process (not a container at all). Say precisely what it
  #    is — this is the one case the installer cannot resolve on its own.
  for p in "$@"; do
    wait_port_free "$p" 20 && continue
    holder="$(port_holder "$p")"
    die "port $p is already in use by ${holder:-an unknown process}.
  Looma needs it. It is NOT a container (those were cleared automatically),
  so it is another program on this box. Find it and stop it:
      sudo ss -ltnp 'sport = :$p'
  Then run this installer again."
  done
}

remove_conflicting_containers() {
  command -v docker >/dev/null 2>&1 || return 0
  local want="$1"; shift
  local c owner
  for c in "$@"; do
    docker container inspect "$c" >/dev/null 2>&1 || continue
    # `{{ if .Config.Labels }}`: an unlabelled container has a nil map, which `index`
    # alone would choke on — guard it so this reports "" instead of erroring.
    owner="$(docker container inspect \
      --format '{{ if .Config.Labels }}{{ index .Config.Labels "com.docker.compose.project" }}{{ end }}' \
      "$c" 2>/dev/null || true)"
    [ "$owner" = "$want" ] && continue          # ours — compose recreates it itself
    if docker rm -f "$c" >/dev/null 2>&1; then
      log "  removed the container $c (compose project '${owner:-none}') — it held a name this install needs"
    else
      warn "  could not remove the container $c — remove it by hand: docker rm -f $c"
    fi
  done
}

# looma_search_index / looma_search_hf / looma_ai_data are shared by BOTH deployments
# under the same fixed names. The native template declares them `external` (Compose
# skips every ownership check on an external volume, which is what silences the
#   volume "looma_ai_data" already exists but was created for project "looma"
#   (expected "looma-native"). Use external: true to use an existing volume
# warnings) — but `external` also means Compose will NOT create them, so a box that
# has never run the Docker stack needs them to exist first. Creating them empty is
# safe: Docker seeds an empty named volume from the image's own content on first
# mount, so the baked HF model still lands in /models/hf, offline included.
ensure_shared_volumes() {
  command -v docker >/dev/null 2>&1 || return 0
  local v
  for v in looma_search_index looma_search_hf looma_ai_data; do
    docker volume inspect "$v" >/dev/null 2>&1 && continue
    docker volume create "$v" >/dev/null 2>&1 \
      && log "  created the shared volume $v" \
      || warn "  could not create the volume $v"
  done
}

disable_native_stack() {
  # A box that ran the native Looma keeps Apache/Mongo/Piper AND a browser
  # autostart — both must go, or they fight the containers and open a second
  # (blank) browser window on login.
  log "disabling the native services (Apache/MongoDB/Piper) so Docker takes over"
  local svc
  for svc in apache2 httpd mongod mongodb piper looma-piper looma-search looma-ai looma-cpu-cap; do
    if systemctl list-unit-files 2>/dev/null | grep -q "^${svc}\.service"; then
      systemctl disable --now "${svc}.service" 2>/dev/null && log "  disabled ${svc}.service" || true
    fi
  done

  # The native deployment ALSO runs zvec/Piper/looma-ai as CONTAINERS in their own
  # compose project ("looma-native"), and those hold both the app's host ports and
  # the container NAMES the Docker stack needs. Take the names back — the Docker
  # stack recreates looma-search/looma-ai from its own compose file, and Piper is
  # served from inside looma-web. Mirrors disable_docker_stack() the other way.
  ( cd "$WWW/$REPO_NAME" 2>/dev/null && docker compose -f docker-compose.native.yml \
      -p looma-native --profile ai down ) >/dev/null 2>&1 \
    && log "  brought down the native sidecar containers" || true
  remove_conflicting_containers "$(app_project_name)" looma-search looma-piper looma-ai

  disable_foreign_browser_autostarts

  warn "Docker MongoDB is restored from the disk's mongo-dump (latest) — DB changes made"
  warn "only on this box are replaced (same as 'loomaupdate'). Back up first if needed."
}

# The mirror of disable_native_stack(): a box that ran the DOCKER deployment keeps
# looma.service (enabled — brings the whole compose stack back on every boot) plus
# whatever containers are up. Both must go before the native Apache/Mongo take over,
# or they fight for the same ports (80, 27017, 46333, 5002, 8089).
disable_docker_stack() {
  # NO early return on "is looma.service installed?" — it used to bail out here, and
  # that was wrong: a stack started BY HAND (`docker compose up`, i.e. any aborted or
  # exploratory install) leaves containers and volumes behind WITHOUT ever installing
  # the unit. The teardown then silently did nothing and the leftover looma-ai/-search
  # went on holding their names and ports, so the next install died with
  #   Conflict. The container name "/looma-ai" is already in use
  # Containers are the thing to look for, not the unit.
  log "disabling the Docker stack (looma.service + containers) so native takes over"
  if systemctl list-unit-files 2>/dev/null | grep -q '^looma\.service'; then
    systemctl disable --now looma.service 2>/dev/null && log "  disabled looma.service" || true
  fi
  if command -v docker >/dev/null 2>&1; then
    local repo_dest="$WWW/$REPO_NAME"
    ( cd "$repo_dest" 2>/dev/null && docker compose --profile ai down ) 2>/dev/null \
      && log "  brought down the app stack" || true
    ( cd "$repo_dest/observability" 2>/dev/null && docker compose \
        -f docker-compose.yml -f docker-compose.odroid.yml --profile heavy --profile ai down ) 2>/dev/null \
      && log "  brought down observability" || true
    ( cd "$repo_dest" 2>/dev/null && docker compose -f docker-compose.native.yml -p looma-native --profile ai down ) 2>/dev/null \
      && log "  brought down the native sidecar containers" || true
  fi

  disable_foreign_browser_autostarts

  warn "the native MongoDB is restored from the disk's mongo-dump (latest) — DB changes made"
  warn "only on this box are replaced. Back up first if needed."
}

install_deploy_docker() {
  local repo_dest="$WWW/$REPO_NAME"
  local content_dir="$WWW/content" maps_dir="$WWW/maps2018" epaath_dir="$WWW/content/epaath"

  # A previous NATIVE install: existing code/content at $WWW, or its services.
  local native=0
  if [ -d "$WWW/$REPO_NAME" ] || [ -d "$content_dir" ] \
     || systemctl list-unit-files 2>/dev/null | grep -qE '^(apache2|httpd|mongod|mongodb)\.service'; then
    native=1
  fi

  [ -f "$SRC_REPO/docker-compose.yml" ] || die "no docker-compose.yml in $SRC_REPO"
  log "install root: $WWW   (repo -> $repo_dest, content -> $content_dir)"
  log "previous native install detected: $(yesno "$native")"
  log "options: offline=$OFFLINE observability=$WITH_OBSERVABILITY agents=$WITH_AGENTS ai=$WITH_AI kiosk=$INSTALL_KIOSK"

  # 0) Offline preflight
  if [ "$OFFLINE" = "1" ]; then
    log "OFFLINE mode: Docker + every image come from the disk (no internet)"
    [ -f "$OFFLINE_DIR/images/looma-images.tar" ] || die "no images/looma-images.tar in $OFFLINE_DIR (run: $0 build-bundle docker)"
    ls "$OFFLINE_DIR"/docker/docker-*.tgz >/dev/null 2>&1 || die "no docker-*.tgz in $OFFLINE_DIR/docker (run: $0 build-bundle docker)"
  fi

  # 1) Docker
  # get.docker.com runs its own apt-get update internally — the same stock-odroid
  # broken/duplicate repos that hit the native install's apt step hit this too.
  [ "$OFFLINE" = "1" ] || tidy_known_broken_apt_repos
  ensure_docker

  # 2) Swap + space
  make_swap
  check_space

  # 3) Take over from a native install FIRST — before the copy below. 3b) runs
  #    `rsync --delete`, which DELETES $WWW/$REPO_NAME/docker-compose.native.yml
  #    (that file is generated on the box, so it is not in the source). Tearing the
  #    sidecars down afterwards then silently did nothing — compose had no file to
  #    read — and the surviving looma-search kept port 46333, so the stack died with
  #    "failed to bind host port for 0.0.0.0:46333: address already in use".
  [ "$native" = "1" ] && disable_native_stack

  # 4) Copy everything into the install root.
  # 4a) siblings + root files (incl. .dockerignore, which keeps the 80 GB content/
  #     out of the build context); content and the repo are handled separately.
  log "copying project files -> $WWW (maps2018, piper, includes, .dockerignore …)"
  rsync -a \
    --exclude 'content/' --exclude "$REPO_NAME/" --exclude 'looma-env/' --exclude '.claude/' \
    --exclude '**/.git/' --exclude '**/.venv/' --exclude '**/__pycache__/' --exclude '**/node_modules/' \
    "$SRC_ROOT/" "$WWW/"
  # 4b) the repo (clean update of the code). The offline payload is read straight
  #     from the disk during this install, so don't duplicate those GBs onto the box.
  log "copying repo -> $repo_dest"
  rsync -a --delete \
    --exclude '.git/' --exclude '**/.venv/' --exclude '**/__pycache__/' --exclude '**/node_modules/' \
    --exclude 'deploy/odroid/offline/' --exclude 'deploy/odroid/native-bundle/' \
    "$SRC_REPO/" "$repo_dest/"
  chmod +x "$repo_dest/deploy/odroid/looma-installer.sh" 2>/dev/null || true
  # 4c) content
  copy_content
  [ -d "$epaath_dir" ] || epaath_dir="$content_dir/ePaath"   # fall back to the capitalised name

  # 5) Options for `up` / systemd
  log "writing /etc/looma-odroid.env"
  cat > /etc/looma-odroid.env <<EOF
# Generated by looma-installer.sh
WITH_OBSERVABILITY=$WITH_OBSERVABILITY
WITH_AI=$WITH_AI
WITH_ANALYSIS=$WITH_ANALYSIS
WITH_AGENTS=$WITH_AGENTS
LOOMA_OTEL_ENDPOINT=$LOOMA_OTEL_ENDPOINT
LOOMA_OPENSEARCH_URL=$LOOMA_OPENSEARCH_URL
LOOMA_CONTENT_DIR=$content_dir
LOOMA_MAPS_DIR=$maps_dir
LOOMA_EPAATH_DIR=$epaath_dir
# OFFLINE=1 makes 'looma-installer.sh up' pass '--pull never' and never build, so
# reboots use only the images already on the box (no internet needed, ever).
OFFLINE=$OFFLINE
EOF

  # 6) Network + external volume
  docker network inspect loomanet >/dev/null 2>&1 || { log "creating loomanet"; docker network create loomanet; }
  docker volume inspect looma_apache_logs >/dev/null 2>&1 || docker volume create looma_apache_logs >/dev/null

  # Belt and braces: take back any container name still held by ANOTHER project,
  # even when the native heuristic above didn't fire (a box that only ever ran the
  # sidecars, a half-finished switch, a hand-run `docker compose up`, …). A no-op
  # once they are ours — compose adopts and recreates its own containers.
  remove_conflicting_containers "$(app_project_name)" looma-search looma-piper looma-ai

  # 7) OFFLINE: load every image so compose finds them locally
  if [ "$OFFLINE" = "1" ]; then
    log "loading container images from the offline bundle (large — be patient)…"
    docker load -i "$OFFLINE_DIR/images/looma-images.tar"
    log "loaded images:"; docker images --format '  {{.Repository}}:{{.Tag}}' | sort -u | sed -n '1,40p'
  fi

  # 8) Free the ports first — a leftover from the other deployment binding 46333/
  #    48080/8089 is what turns a re-install into "address already in use".
  log "checking that the ports Looma needs are free"
  free_required_ports "$(app_project_name)" 48080 47017 46333 8089

  # 9) Autostart FIRST — before the stack is started. This used to come last, so a
  #    first start that failed (a squatted port, an image that crash-loops) killed
  #    the installer before the unit was ever written: the box then had Looma
  #    installed but NOTHING at boot. Registering it up front means a later fix
  #    (or just a reboot) brings the stack up on its own.
  log "installing the systemd unit looma.service"
  if [ "${CPU_MAX_FREQ:-0}" = "0" ] || [ -z "${CPU_MAX_FREQ:-}" ]; then
    tpl_looma_service | sed -e "s#@REPO_DIR@#$repo_dest#g" -e '/scaling_max_freq/d' \
      > /etc/systemd/system/looma.service
  else
    log "capping the CPUs at $((CPU_MAX_FREQ/1000)) MHz on every boot (ExecStartPre)"
    tpl_looma_service | sed -e "s#@REPO_DIR@#$repo_dest#g" -e "s#@CPU_MAX_FREQ@#$CPU_MAX_FREQ#g" \
      > /etc/systemd/system/looma.service
  fi
  systemctl daemon-reload
  systemctl enable looma.service
  install_kiosk
  install_start_shortcut

  # 10) Build + start. Online: --build so a re-install picks up Dockerfile changes.
  #    Offline: no build, no pull — `up` adds --pull never (OFFLINE in the env file).
  if [ "$OFFLINE" = "1" ]; then
    log "starting Looma from the pre-loaded images (offline; no build, no pull)…"
    "$repo_dest/deploy/odroid/looma-installer.sh" up
  else
    log "building and starting Looma… (the first build is slow on ARM)"
    "$repo_dest/deploy/odroid/looma-installer.sh" up --build
  fi

  # 11) zvec: build the index NOW and confirm it indexed, so the box ships with
  #    working semantic search and we fail loudly here, not on the first search.
  log "building the zvec search index (first build; slow on ARM, please wait)…"
  for _ in $(seq 1 90); do curl -fsS "http://localhost:46333/health" >/dev/null 2>&1 && break; sleep 5; done
  local zresp; zresp="$(curl -fsS -X POST --max-time 1800 "http://localhost:46333/rebuild" 2>/dev/null || true)"
  case "$zresp" in
    *'"ok"'*true*) log "zvec OK: $zresp" ;;
    *) warn "zvec did NOT build cleanly: ${zresp:-<no response>}"
       warn "  check: docker logs looma-search --tail 50 ; docker logs looma-db --tail 20"
       warn "  retry: curl -X POST http://localhost:46333/rebuild" ;;
  esac

  local obs_state; obs_state="$(obs_label)"
  log "DONE — Looma runs in Docker from $WWW. You can REMOVE THE DISK."
  cat <<EOF

  Install root:   $WWW   ($REPO_NAME/, content/, maps2018/, …)
  App:            curl -I $(kiosk_url)        (expect 200/302)
  Search (zvec):  curl http://localhost:46333/health
  Observability:  $obs_state  ->  Grafana :43000 / OpenSearch Dashboards :45601
  Autostart:      systemctl is-enabled looma.service   (-> enabled)
  Reboot to confirm the stack auto-starts and Chromium opens $(kiosk_url).

  Manage later:   $repo_dest/deploy/odroid/looma-installer.sh up | down
  Toggle obs/ai:  edit /etc/looma-odroid.env, then run 'looma-installer.sh up'
EOF
}

# zvec search + Piper TTS (+ looma-ai) as CONTAINERS next to the native app.
# They use host networking, so they reach the HOST's MongoDB on 127.0.0.1:27017 and
# publish 46333 / 5002 / 8089 exactly where the native Apache/PHP looks for them —
# no bridge network, and MongoDB is never exposed beyond the host.
native_sidecars_docker() {
  local repo_dest="$1" otel_endpoint="$2" otel_traces="$3" u
  log "zvec + Piper will run as CONTAINERS (they carry their own Python/torch/voices)"
  ensure_docker

  # Host-side units from an earlier native install would fight for the same ports.
  for u in looma-piper looma-search looma-ai piper; do
    if systemctl list-unit-files 2>/dev/null | grep -q "^${u}\.service"; then
      systemctl disable --now "${u}.service" >/dev/null 2>&1 \
        && log "  disabled the host ${u}.service — the container takes over" || true
    fi
  done

  local f="$repo_dest/docker-compose.native.yml"
  log "writing $f"
  tpl_native_sidecars | sed -e "s#@REPO_NAME@#$REPO_NAME#g" -e "s#@WWW@#$WWW#g" \
    -e "s#@OTEL_ENDPOINT@#$otel_endpoint#g" -e "s#@OTEL_TRACES@#$otel_traces#g" > "$f"

  local svcs=(looma-piper) profiles=() build=(--build) pull=()
  [ "$WITH_SEARCH" = "1" ] && svcs+=(looma-search)
  [ "$WITH_AI" = "1" ] && { svcs+=(looma-ai); profiles+=(--profile ai); }
  [ "$OFFLINE" = "1" ] && { build=(); pull=(--pull never); }

  # A container from the DOCKER deployment (or from a hand-run `docker compose up`)
  # still owning one of these names aborts the whole install with a name Conflict —
  # compose never adopts another project's container. Take the names back, free the
  # ports, and make sure the external shared volumes exist, BEFORE we build.
  remove_conflicting_containers looma-native "${svcs[@]}"
  ensure_shared_volumes

  log "building and starting: ${svcs[*]}  (the first ARM build is slow — be patient)"
  if ! ( cd "$repo_dest" && docker compose -f docker-compose.native.yml -p looma-native \
           "${profiles[@]}" up -d "${build[@]}" "${pull[@]}" "${svcs[@]}" ); then
    # Re-running the installer means "install it again, no matter what is on this
    # box": clear the two things that can still be in the way (a name we don't own,
    # a squatted port) and try once more before giving up.
    warn "the sidecars did not start — clearing what is in the way and retrying once"
    remove_conflicting_containers looma-native "${svcs[@]}"
    free_app_host_ports
    ( cd "$repo_dest" && docker compose -f docker-compose.native.yml -p looma-native \
        "${profiles[@]}" up -d "${build[@]}" "${pull[@]}" "${svcs[@]}" ) \
      || die "the sidecar containers failed to start — check: docker compose -f $f -p looma-native logs"
  fi

  # They restart with Docker on every boot (restart: unless-stopped), so there is no
  # systemd unit to install here.
  if [ "$WITH_SEARCH" = "1" ]; then
    log "building the zvec index (first build; slow on ARM)…"
    for _ in $(seq 1 90); do curl -fsS http://127.0.0.1:46333/health >/dev/null 2>&1 && break; sleep 5; done
    curl -fsS -X POST --max-time 1800 http://127.0.0.1:46333/rebuild >/dev/null 2>&1 \
      || warn "zvec did not build — check 'docker logs looma-search', retry: curl -X POST http://127.0.0.1:46333/rebuild"
  fi
  for _ in $(seq 1 24); do curl -fsS http://127.0.0.1:5002/health >/dev/null 2>&1 && break; sleep 5; done
  curl -fsS http://127.0.0.1:5002/health >/dev/null 2>&1 \
    || warn "Piper is not answering on :5002 — check: docker logs looma-piper"
}

# ===========================================================================
# NATIVE deployment (Apache + PHP 7.4 + MongoDB on the host; zvec/Piper in Docker)
# ===========================================================================
install_deploy_native() {
  local repo_dest="$WWW/$REPO_NAME"
  local otel_endpoint otel_traces otel_enabled

  [ -f "$SRC_REPO/looma-TTS.php" ] || die "the repo at $SRC_REPO does not look like Looma"
  . /etc/os-release 2>/dev/null || true
  [ "${VERSION_ID:-}" = "20.04" ] || warn "the native install expects Ubuntu 20.04 (focal); this is '${VERSION_ID:-?}'"

  if [ "$OFFLINE" = "1" ]; then
    ls "$NATIVE_BUNDLE"/deb/*.deb >/dev/null 2>&1 || \
      die "offline requested but there are no .debs in $NATIVE_BUNDLE/deb (run: $0 build-bundle native)"
  fi

  # Telemetry: local obs stack -> localhost collector; remote -> that host; none
  # -> exporters off, so the services don't waste time retrying a dead endpoint.
  if [ "$WITH_OBSERVABILITY" = "1" ]; then
    otel_endpoint="http://localhost:4318"; otel_traces=otlp; otel_enabled=1
  elif [ -n "$REMOTE_OBS_HOST" ]; then
    otel_endpoint="http://$REMOTE_OBS_HOST:4318"; otel_traces=otlp; otel_enabled=1
  else
    otel_endpoint=""; otel_traces=none; otel_enabled=0
  fi

  log "NATIVE install — root=$WWW repo->$repo_dest offline=$OFFLINE ai=$WITH_AI search=$WITH_SEARCH"

  # A previous DOCKER install: take it down before this one claims the same ports.
  disable_docker_stack

  make_swap
  check_space

  # 0) CPU frequency cap — before anything else starts. See the CPU_MAX_FREQ
  # comment at the top of this script: Piper TTS reliably browns out this board
  # at its rated max clock, and CPUQuota/Nice on looma-piper.service alone (which
  # limit AVERAGE cpu time) do not stop the instantaneous spike that causes it.
  if [ "${CPU_MAX_FREQ:-0}" = "0" ] || [ -z "${CPU_MAX_FREQ:-}" ]; then
    log "leaving CPU frequency uncapped (--cpu-max-freq 0) — Piper TTS may brown out this board"
    systemctl disable --now looma-cpu-cap.service >/dev/null 2>&1 || true
  else
    log "capping the CPUs at $((CPU_MAX_FREQ/1000)) MHz on every boot (prevents Piper TTS brownouts)"
    tpl_unit_cpucap | sed -e "s#@CPU_MAX_FREQ@#$CPU_MAX_FREQ#g" > /etc/systemd/system/looma-cpu-cap.service
    systemctl daemon-reload
    systemctl enable --now looma-cpu-cap.service || warn "looma-cpu-cap failed to start — check: journalctl -u looma-cpu-cap"
  fi

  # 1) OS packages
  if [ "$OFFLINE" = "1" ]; then
    log "installing OS packages from the bundle (dpkg, no internet)"
    dpkg -i "$NATIVE_BUNDLE"/deb/*.deb || apt-get -y -f install --no-download || warn "dpkg reported unmet deps (see above)"
  else
    log "installing OS packages via apt (online)"
    # MongoDB: a box that ran the native Looma ALREADY has mongod, installed from a
    # repo that may no longer be configured. Asking apt for mongodb-org then fails
    # with "Unable to locate package". So only add the repo + install the package
    # when mongod is genuinely missing; otherwise keep the MongoDB that is there.
    local mongo_pkgs=()
    if command -v mongod >/dev/null 2>&1; then
      log "MongoDB is already installed ($(mongod --version 2>/dev/null | head -1)) — keeping it"
    else
      log "adding the MongoDB ${MONGO_SERIES} apt repo"
      curl -fsSL "https://pgp.mongodb.com/server-${MONGO_SERIES}.asc" | gpg --dearmor --batch --yes -o "/usr/share/keyrings/mongodb-server-${MONGO_SERIES}.gpg"
      echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-${MONGO_SERIES}.gpg arch=arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/${MONGO_SERIES} multiverse" \
        > "/etc/apt/sources.list.d/mongodb-org-${MONGO_SERIES}.list"
      mongo_pkgs=(mongodb-org)
    fi
    # NOT fatal: an odroid typically carries third-party repos (deb.odroid.in,
    # hardkernel PPAs) that are dead or misconfigured. That has nothing to do with
    # the Ubuntu repos the packages below actually come from, so warn and carry on —
    # if a package really is unavailable, the install step right after says so.
    tidy_known_broken_apt_repos
    apt-get update || warn "apt-get update reported errors (a broken third-party repo?) — continuing"
    apt-get install -y apache2 apache2-utils libapache2-mod-php7.4 \
      php7.4 php7.4-cli php7.4-common php7.4-curl php7.4-mbstring php7.4-xml \
      php7.4-gd php7.4-zip php7.4-bcmath php-mongodb \
      python3 python3-venv python3-pip \
      unzip curl wget net-tools rsync "${mongo_pkgs[@]}" \
      || die "apt could not install the native packages (see above).
  If they are simply not available for this Ubuntu, the native install is not possible here —
  the Docker install is:   sudo $SCRIPT_PATH"
  fi

  # mongorestore/mongoimport (mongodb-org-tools / mongodb-database-tools) are what
  # load the Looma dump. If they are missing, say so now rather than at step 5.
  command -v mongorestore >/dev/null 2>&1 || \
    warn "mongorestore is not installed — the Looma database dump cannot be restored (apt-get install mongodb-database-tools)"

  # 2) PHP: the mongodb extension + php.ini + Apache mods
  if [ -f "$NATIVE_BUNDLE/php-ext/mongodb.so" ]; then
    local ext_dir; ext_dir="$(php -i 2>/dev/null | awk -F'=> ' '/^extension_dir/{print $2; exit}')"
    if [ -n "${ext_dir:-}" ]; then
      log "installing the PHP mongodb extension into $ext_dir"
      install -m 0644 "$NATIVE_BUNDLE/php-ext/mongodb.so" "$ext_dir/mongodb.so"
      echo "extension=mongodb.so" > /etc/php/7.4/mods-available/mongodb.ini
      phpenmod -v 7.4 mongodb || true
    fi
  fi
  [ -f "$SRC_REPO/docker_php.ini" ] && install -m 0644 "$SRC_REPO/docker_php.ini" /etc/php/7.4/apache2/php.ini || true
  log "enabling the Apache modules (php7.4, rewrite, alias, dir)"
  a2enmod php7.4 rewrite alias dir >/dev/null 2>&1 || true

  # 3) The app + content
  log "copying repo -> $repo_dest"
  mkdir -p "$WWW"
  rsync -a --delete \
    --exclude '.git/' --exclude '**/.venv/' --exclude '**/__pycache__/' --exclude '**/node_modules/' \
    --exclude 'deploy/odroid/offline/' --exclude 'deploy/odroid/native-bundle/' \
    "$SRC_REPO/" "$repo_dest/"
  chmod +x "$repo_dest/deploy/odroid/looma-installer.sh" 2>/dev/null || true
  copy_content
  chown -R www-data:www-data "$repo_dest" "$WWW/content" 2>/dev/null || true

  # 4) Apache site (:80) — replaces the default site, so Looma owns port 80.
  log "installing the Apache site (looma.conf, :80)"
  grep -qE '^\s*Listen\s+80\b' /etc/apache2/ports.conf || echo "Listen 80" >> /etc/apache2/ports.conf
  # Drop the old :8080 listener if a previous install added it (nothing serves it now).
  sed -i -E '/^\s*Listen\s+8080\s*$/d' /etc/apache2/ports.conf
  tpl_apache_conf | sed -e "s#@LOOMA_ROOT@#$WWW#g" -e "s#@REPO_NAME@#$REPO_NAME#g" \
    > /etc/apache2/sites-available/looma.conf
  a2dissite 000-default >/dev/null 2>&1 || true
  a2ensite looma >/dev/null 2>&1 || true
  systemctl enable apache2 >/dev/null 2>&1 || true
  systemctl restart apache2 || warn "apache2 failed to restart — check: journalctl -u apache2 -n 40"

  # 5) MongoDB + the dump
  # The mongodb-org repo package's unit is `mongod.service`; Ubuntu's own OLD
  # mongodb-server package (still on some boxes — see the version check further
  # down) uses `mongodb.service` instead. Use whichever one is actually installed.
  local mongo_svc=mongod
  systemctl list-unit-files 2>/dev/null | grep -q '^mongod\.service' || \
    { systemctl list-unit-files 2>/dev/null | grep -q '^mongodb\.service' && mongo_svc=mongodb; }
  log "starting MongoDB ($mongo_svc.service) and restoring the Looma dump"
  systemctl enable "$mongo_svc" >/dev/null 2>&1 || true
  systemctl start "$mongo_svc" || warn "$mongo_svc failed to start — check: journalctl -u $mongo_svc -n 40"
  for _ in $(seq 1 30); do
    mongosh --quiet --eval 'db.runCommand({ping:1})' >/dev/null 2>&1 && break
    mongo   --quiet --eval 'db.runCommand({ping:1})' >/dev/null 2>&1 && break
    sleep 2
  done
  # The dump is taken from MongoDB 5.0. An older mongod (what a box that ran the old
  # native Looma still has) restores the DATA but rejects some indexes — e.g. the
  # Nepali dictionary keys, "WiredTigerIndex::insert: key too large to index".
  local mver; mver="$(mongod --version 2>/dev/null | sed -n 's/^db version v\([0-9]*\).*/\1/p' | head -1 || true)"
  if [ -n "$mver" ] && [ "$mver" -lt 5 ] 2>/dev/null; then
    warn "this box runs MongoDB $mver, but the dump comes from MongoDB 5.0."
    warn "  The data restores, but some indexes will be REJECTED ('key too large to index'),"
    warn "  which makes dictionary lookups slow. The Docker install ships Mongo 5.0 and avoids this."
  fi

  if [ -d "$SRC_REPO/mongo-dump/dump" ]; then
    # --drop: on a re-install/update, mongorestore's default (insert-only) leaves
    # every already-restored document alone and just logs "duplicate key" for each
    # one — a newer dump on the disk would never actually reach the database. Drop
    # each collection first so a re-run truly updates content, same as the Docker
    # deployment already does (see the warning below).
    warn "MongoDB is restored from the disk's mongo-dump (latest) — DB changes made"
    warn "only on this box are replaced. Back up first if needed."
    mongorestore --drop "$SRC_REPO/mongo-dump/dump" || warn "mongorestore reported an issue (see above)"
  else
    warn "no mongo-dump/dump on the disk — the database will be empty"
  fi
  # --mode=upsert: on a re-install the seed logins are already there, and the default
  # insert mode then fails every one of them with E11000 duplicate key.
  [ -f "$SRC_REPO/mongo-dump/logins/defaultlogins.json" ] && \
    { mongoimport --db loomausers --collection logins --mode=upsert \
        --file "$SRC_REPO/mongo-dump/logins/defaultlogins.json" || warn "the login seed import failed"; }

  # 6-9) zvec + Piper (+ looma-ai). Two ways to run them:
  #   SIDECARS=docker (default) — as containers, which is the only way that actually
  #     works on focal: the host has Python 3.8 and neither zvec's nor looma-ai's
  #     requirements install on it, while the images carry the right Python, torch,
  #     the embedding model and the Piper voices.
  #   SIDECARS=host — the legacy path: Piper binary + a venv + systemd units.
  if [ "$SIDECARS" = "docker" ]; then
    native_sidecars_docker "$repo_dest" "$otel_endpoint" "$otel_traces"
  else

  # A previous SIDECARS=docker install left containers with restart:unless-stopped
  # (docker-compose.native.yml) — they'd keep running and fight the host venv/
  # systemd services below for the same ports (46333, 5002, 8089).
  if command -v docker >/dev/null 2>&1 && [ -f "$repo_dest/docker-compose.native.yml" ]; then
    log "stopping the previous Docker sidecars (switching zvec/Piper/AI to the host)"
    ( cd "$repo_dest" && docker compose -f docker-compose.native.yml -p looma-native --profile ai down ) 2>/dev/null || true
  fi

  # 6) Piper TTS — binary + voices
  log "installing Piper TTS"
  mkdir -p "$WWW/piper" /usr/share/piper
  if [ -f "$NATIVE_BUNDLE/piper/piper_arm64.tar.gz" ]; then
    tar -xzf "$NATIVE_BUNDLE/piper/piper_arm64.tar.gz" -C "$WWW/"     # extracts a piper/ dir
    cp -rn "$WWW/piper/." /usr/local/bin/piper/ 2>/dev/null || true
    cp -n "$NATIVE_BUNDLE"/piper/voices/* /usr/share/piper/ 2>/dev/null || true
  elif [ "$OFFLINE" != "1" ]; then
    local a; a="$(uname -m)"; [ "$a" = "aarch64" ] && a=arm64
    curl -fSL "https://github.com/rhasspy/piper/releases/download/${PIPER_VERSION}/piper_${a}.tar.gz" -o /tmp/piper.tgz
    tar -xzf /tmp/piper.tgz -C "$WWW/" && rm -f /tmp/piper.tgz
    local vbase="https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0"
    curl -fSL "$vbase/ne/ne_NP/google/x_low/ne_NP-google-x_low.onnx"      -o /usr/share/piper/ne_NP-google-x_low.onnx
    curl -fSL "$vbase/ne/ne_NP/google/x_low/ne_NP-google-x_low.onnx.json" -o /usr/share/piper/ne_NP-google-x_low.onnx.json
    curl -fSL "$vbase/en/en_US/amy/low/en_US-amy-low.onnx"                -o /usr/share/piper/en_US-amy-low.onnx
    curl -fSL "$vbase/en/en_US/amy/low/en_US-amy-low.onnx.json"           -o /usr/share/piper/en_US-amy-low.onnx.json
  fi
  chown -R www-data:www-data "$WWW/piper" /usr/share/piper 2>/dev/null || true

  # 7) Shared Python venv (Piper Flask sidecar + search + looma-ai)
  # focal's default python3 is 3.8, but looma-ai's requirements need >= 3.9 (anyio,
  # fastapi & co. no longer publish for 3.8), so building the venv with python3
  # gives "No matching distribution found" and a venv that cannot run search/ai.
  # Take the newest python3.x on the box instead, and install one if there is none.
  local py=""
  for c in python3.12 python3.11 python3.10 python3.9; do
    command -v "$c" >/dev/null 2>&1 && { py="$c"; break; }
  done
  if [ -z "$py" ] && [ "$OFFLINE" != "1" ]; then
    # First try the distro (works where the repos already carry 3.9+).
    log "no Python >= 3.9 on this box (focal ships 3.8) — getting one for search/looma-ai"
    if apt-get install -y python3.10 python3.10-venv python3.10-dev >/dev/null 2>&1 \
       && command -v python3.10 >/dev/null 2>&1; then
      py=python3.10
    else
      # apt cannot satisfy this on the odroid: focal has no python3.10, and the
      # deadsnakes PPA publishes NO arm64 packages. So fetch a prebuilt,
      # self-contained CPython for this arch (no PPA, no compiling) and use it
      # just for the Looma venv. Leaves the system python3 (3.8) untouched.
      local pbs_tag="20260623" pbs_ver="3.10.20" pbs_arch=""
      case "$(uname -m)" in
        aarch64|arm64) pbs_arch="aarch64-unknown-linux-gnu" ;;
        x86_64|amd64)  pbs_arch="x86_64-unknown-linux-gnu"  ;;
        *) warn "no prebuilt CPython for arch $(uname -m)" ;;
      esac
      if [ -n "$pbs_arch" ]; then
        local pbs_url="https://github.com/astral-sh/python-build-standalone/releases/download/${pbs_tag}/cpython-${pbs_ver}%2B${pbs_tag}-${pbs_arch}-install_only.tar.gz"
        local pbs_tgz="/tmp/looma-cpython.tar.gz"
        log "installing a standalone CPython ${pbs_ver} ($(uname -m)) — prebuilt, no compiling"
        if curl -fSL "$pbs_url" -o "$pbs_tgz"; then
          rm -rf /opt/looma/python
          mkdir -p /opt/looma
          # the install_only tarball unpacks to a top-level `python/` dir
          if tar -xzf "$pbs_tgz" -C /opt/looma && [ -x /opt/looma/python/bin/python3 ]; then
            py=/opt/looma/python/bin/python3
            log "standalone CPython ready: $("$py" --version 2>&1)"
          else
            warn "the standalone CPython tarball did not unpack as expected"
          fi
          rm -f "$pbs_tgz"
        else
          warn "could not download the standalone CPython ($pbs_url)"
        fi
      fi
    fi
  fi

  local venv_ok=1 ai_deps_ok=0 search_deps_ok=0
  if [ -n "$py" ]; then
    log "creating the Python venv at $VENV ($($py --version 2>&1))"
  else
    py=python3
    warn "falling back to $(python3 --version 2>&1) — the assistant and zvec search need >= 3.9 and will NOT install"
  fi
  rm -rf "$VENV"
  "$py" -m venv "$VENV" || { venv_ok=0; warn "could not create the venv with $py"; }

  # search-service (zvec) has its OWN requirements — pymongo, scikit-learn, scipy,
  # sentence-transformers (see search-service/Dockerfile) — which looma-ai's
  # requirements.txt does not necessarily cover. Install both sets explicitly;
  # a failure in one must not silently take the other service down too.
  #
  # MongoDB compatibility: PyMongo >= 4 refuses to connect below wire version 8
  # (MongoDB >= 4.2) — "Server ... reports wire version 6, but this version of
  # PyMongo requires at least 8" — a hard failure, not a warning, on a box that
  # kept a pre-existing OLD native Mongo (see the $mver check above; this is
  # exactly why a re-installed box's zvec silently never got real embeddings,
  # only the HashingVectorizer fallback). looma-ai/requirements.txt pins its own
  # pymongo 4.x too, so this MUST install after it, to win.
  local pymongo_spec="pymongo"
  if [ -n "$mver" ] && [ "$mver" -lt 4 ] 2>/dev/null; then
    pymongo_spec="pymongo==3.13.0"
    warn "MongoDB $mver is too old for modern PyMongo (needs >= 4.2/wire version 8) — pinning $pymongo_spec instead"
  fi
  if [ "$venv_ok" = "1" ]; then
    if [ "$OFFLINE" = "1" ] && ls "$NATIVE_BUNDLE"/wheels/*.whl >/dev/null 2>&1; then
      "$VENV/bin/pip" install --no-index --find-links "$NATIVE_BUNDLE/wheels" flask gunicorn \
        || warn "the offline flask/gunicorn install had issues (Piper TTS needs them)"
      [ -f "$SRC_REPO/looma-ai/requirements.txt" ] && \
        { "$VENV/bin/pip" install --no-index --find-links "$NATIVE_BUNDLE/wheels" -r "$SRC_REPO/looma-ai/requirements.txt" && ai_deps_ok=1; }
      "$VENV/bin/pip" install --no-index --find-links "$NATIVE_BUNDLE/wheels" \
        "$pymongo_spec" scikit-learn scipy "sentence-transformers==3.0.1" \
        && search_deps_ok=1 || warn "search-service deps failed to install offline (zvec needs them)"
    else
      "$VENV/bin/pip" install --upgrade pip wheel >/dev/null 2>&1 || true
      "$VENV/bin/pip" install flask gunicorn \
        || warn "flask/gunicorn failed to install (Piper TTS needs them)"
      [ -f "$SRC_REPO/looma-ai/requirements.txt" ] && \
        { "$VENV/bin/pip" install --extra-index-url https://download.pytorch.org/whl/cpu -r "$SRC_REPO/looma-ai/requirements.txt" && ai_deps_ok=1; }
      "$VENV/bin/pip" install --extra-index-url https://download.pytorch.org/whl/cpu \
        "$pymongo_spec" scikit-learn scipy "sentence-transformers==3.0.1" \
        && search_deps_ok=1 || warn "search-service deps failed to install (zvec needs them)"
    fi
  fi

  # Don't enable services whose dependencies are not there: a unit that crash-loops
  # every 5 s is worse than one that was never installed, and it hides the real cause.
  if [ "$ai_deps_ok" != "1" ] && [ "$WITH_AI" = "1" ]; then
    warn "looma-ai/requirements.txt did NOT install (see the pip errors above)."
    warn "  Skipping looma-ai — it would only crash-loop."
    warn "  Those requirements are pinned for the Python in the Docker image; on this host"
    warn "  they need Python >= 3.9. The Docker install has none of this trouble: sudo $SCRIPT_PATH"
    WITH_AI=0
  fi
  if [ "$search_deps_ok" != "1" ] && [ "$WITH_SEARCH" = "1" ]; then
    warn "search-service's dependencies (pymongo/scikit-learn/scipy/sentence-transformers)"
    warn "  did NOT install — skipping the zvec search service, it would only crash-loop."
    warn "  The Docker install (--sidecars docker, the default) carries these already: sudo $SCRIPT_PATH"
    WITH_SEARCH=0
  fi

  # 8) HuggingFace cache, so search/AI work offline
  mkdir -p "$HF_DIR"
  if [ -d "$NATIVE_BUNDLE/hf" ] && [ -n "$(ls -A "$NATIVE_BUNDLE/hf" 2>/dev/null)" ]; then
    log "installing the baked HuggingFace models -> $HF_DIR"
    cp -rn "$NATIVE_BUNDLE"/hf/. "$HF_DIR/" 2>/dev/null || true
  fi
  # zvec's persisted index (see INDEX_DIR in tpl_unit_search) — search_service.py's
  # own default (/data/zvec-index) doesn't exist on the native host and www-data
  # cannot create it (root of the filesystem); this is where it actually lives here.
  mkdir -p /var/lib/looma/zvec-index
  chown -R www-data:www-data "$HF_DIR" "$VENV" /var/lib/looma/zvec-index 2>/dev/null || true

  # TRANSFORMERS_OFFLINE/HF_HUB_OFFLINE must only be forced on when $HF_DIR actually
  # has a cached model (bundled installs, or a box that already fetched one). An
  # ONLINE install with no bundle leaves $HF_DIR empty — forcing offline mode there
  # means sentence-transformers can NEVER fetch the model on first run, and search/
  # AI silently never get real embeddings.
  local hf_offline=0
  [ -n "$(ls -A "$HF_DIR" 2>/dev/null)" ] && hf_offline=1
  log "HuggingFace cache at $HF_DIR: $([ "$hf_offline" = 1 ] && echo 'has models -> offline mode on' || echo 'empty -> allowing a network fetch on first run')"

  # 9) systemd units (piper always; search/ai optional)
  local sedargs=(-e "s#@LOOMA_ROOT@#$WWW#g" -e "s#@REPO_NAME@#$REPO_NAME#g" -e "s#@VENV@#$VENV#g"
                 -e "s#@HF_DIR@#$HF_DIR#g" -e "s#@HF_OFFLINE@#$hf_offline#g"
                 -e "s#@OTEL_ENDPOINT@#$otel_endpoint#g" -e "s#@OTEL_TRACES@#$otel_traces#g"
                 -e "s#@OTEL_ENABLED@#$otel_enabled#g"
                 -e "s#@PIPER_CPUQUOTA@#$PIPER_CPUQUOTA#g" -e "s#@PIPER_THREADS@#$PIPER_THREADS#g")
  log "installing the systemd services"
  # The LEGACY `piper.service` (from piper/piper.service) raises the CPU to its
  # max frequency in ExecStartPre (`echo 1900000 > .../scaling_max_freq`). On the
  # odroid that pushes the board past its power/thermal budget under TTS load and
  # it RESETS. We ship our own looma-piper.service (no overclock, CPU-capped), so
  # make sure the legacy unit can never run alongside it.
  if systemctl list-unit-files 2>/dev/null | grep -q '^piper\.service'; then
    systemctl disable --now piper.service 2>/dev/null \
      && log "  disabled the legacy piper.service (it overclocked the CPU -> reboots)" || true
  fi
  tpl_unit_piper  | sed "${sedargs[@]}" > /etc/systemd/system/looma-piper.service
  [ "$WITH_SEARCH" = "1" ] && tpl_unit_search | sed "${sedargs[@]}" > /etc/systemd/system/looma-search.service
  [ "$WITH_AI" = "1" ]     && tpl_unit_ai     | sed "${sedargs[@]}" > /etc/systemd/system/looma-ai.service
  # A service we are NOT installing may still be enabled from an earlier install —
  # stop it, or it crash-loops forever against a venv that no longer has its deps.
  [ "$WITH_SEARCH" = "1" ] || systemctl disable --now looma-search.service >/dev/null 2>&1 || true
  [ "$WITH_AI" = "1" ]     || systemctl disable --now looma-ai.service     >/dev/null 2>&1 || true
  systemctl daemon-reload
  systemctl enable --now looma-piper.service || warn "looma-piper failed — journalctl -u looma-piper"
  [ "$WITH_SEARCH" = "1" ] && { systemctl enable --now looma-search.service || warn "looma-search failed — journalctl -u looma-search"; }
  [ "$WITH_AI" = "1" ]     && { systemctl enable --now looma-ai.service     || warn "looma-ai failed — journalctl -u looma-ai"; }

  fi   # end SIDECARS=host

  # 10) Observability: the app is native, but the obs STACK still runs in Docker,
  #     with an override so the collector tails the HOST's Apache logs.
  if [ "$WITH_OBSERVABILITY" = "1" ]; then
    if docker compose version >/dev/null 2>&1; then
      log "starting the observability stack (Docker) with the native override"
      local ovr="$repo_dest/observability/docker-compose.native.yml"
      tpl_native_obs_override > "$ovr"
      ( cd "$repo_dest/observability" && docker compose -p looma-observability \
          -f docker-compose.yml -f docker-compose.odroid.yml -f "$ovr" up -d ) \
        || warn "observability did not fully start — the native app is up regardless"
    else
      warn "observability was requested but Docker is not installed — skipping the obs stack."
      warn "  The native services still emit OTLP to $otel_endpoint; install Docker, or re-run with --no-observability."
    fi
  fi

  install_kiosk
  install_start_shortcut

  log "DONE — native Looma installed."
  cat <<EOF

  App:        curl -I $(kiosk_url)                    (expect 200/302 from Apache :80)
  TTS:        curl -s http://127.0.0.1:5002/health            (Piper)
  Search:     curl -s http://127.0.0.1:46333/health           (zvec$([ "$WITH_SEARCH" = 1 ] || echo ' — disabled'))
  AI:         curl -s http://127.0.0.1:8089/health            (looma-ai$([ "$WITH_AI" = 1 ] || echo ' — disabled'))
EOF
  if [ "$SIDECARS" = "docker" ]; then
    cat <<EOF
  On the host:   systemctl status apache2 mongod
  In Docker:     docker ps    (looma-piper, looma-search$([ "$WITH_AI" = 1 ] && echo ', looma-ai'))
                 they use host networking, so they talk to the host's MongoDB on :27017
  Manage them:   cd $repo_dest && docker compose -f docker-compose.native.yml -p looma-native ps|logs|restart
  They come back on their own after a reboot (restart: unless-stopped).
EOF
  else
    echo "  Services:   systemctl status apache2 mongod looma-piper looma-search looma-ai"
  fi
  echo "  Reboot to confirm autostart + the kiosk."
}

# ===========================================================================
# up / down — the runtime commands. looma.service calls these at boot.
# ===========================================================================
# Free the host ports the Docker app is about to PUBLISH (46333 zvec, 8089 ai,
# 47017 mongo, 48080 web). Called on every `up` — install, manual, and the
# systemd boot start — so the conflict can never come back on its own.
#
# The classic failure is `docker compose up` dying with "address already in use"
# on 46333: a leftover NATIVE looma-search.service (gunicorn on 0.0.0.0:46333)
# from an earlier install is still enabled. It has Restart=always/RestartSec=5,
# so `fuser -k 46333/tcp` frees the port for a few seconds and systemd respawns
# it before the container can bind — which is why killing the PID never sticks.
# DISABLING the unit (not just killing it) is what stops the respawn for good.
free_app_host_ports() {
  # 1) The real culprit: native systemd services that publish these ports. In the
  #    Docker deployment (the only path that calls cmd_up) the containers own these
  #    ports, so a host service on the same port is always the wrong one to keep.
  local svc
  for svc in looma-search looma-ai looma-piper; do
    systemctl list-unit-files 2>/dev/null | grep -q "^${svc}\.service" || continue
    if systemctl is-active --quiet "${svc}.service" 2>/dev/null \
       || systemctl is-enabled --quiet "${svc}.service" 2>/dev/null; then
      echo "[looma-up] freeing host ports: disabling native ${svc}.service (the container takes over)"
      systemctl disable --now "${svc}.service" >/dev/null 2>&1 || true
    fi
  done

  # 2) A container from the OTHER deployment holding one of these ports. The native
  #    install runs looma-search/looma-piper/looma-ai in the `looma-native` project
  #    with host networking, so the port's holder is docker-proxy/dockerd and step 3
  #    below deliberately leaves those alone — which is why this used to loop
  #    forever on "address already in use". Remove the container itself instead;
  #    only containers NOT in our own project are touched, and volumes survive.
  if command -v docker >/dev/null 2>&1; then
    local ours c owner
    ours="$(app_project_name)"
    for c in $(docker ps -a --format '{{.Names}}' 2>/dev/null | grep -E '^looma-' || true); do
      owner="$(docker container inspect \
        --format '{{ if .Config.Labels }}{{ index .Config.Labels "com.docker.compose.project" }}{{ end }}' \
        "$c" 2>/dev/null || true)"
      [ "$owner" = "$ours" ] && continue
      docker rm -f "$c" >/dev/null 2>&1 \
        && echo "[looma-up]   removed container $c from the other deployment (project '${owner:-none}')" || true
    done
  fi

  # 3) Belt and braces: a NON-Docker process still holding one of the ports (e.g. a
  #    gunicorn/python started by hand) is cleared too. A port held by our OWN
  #    container is skipped — its holder is docker-proxy/dockerd and compose
  #    recreates that container cleanly; killing its proxy would only confuse Docker.
  command -v fuser >/dev/null 2>&1 || return 0
  local port pid comm
  # 5002 is the native sidecar Piper; the Docker stack serves Piper from inside
  # looma-web and publishes nothing there, so listing it is a no-op for Docker.
  for port in 46333 8089 47017 48080 5002; do
    for pid in $(fuser "${port}/tcp" 2>/dev/null); do
      comm="$(cat "/proc/$pid/comm" 2>/dev/null || true)"
      case "$comm" in
        docker-proxy|dockerd|containerd*) : ;;   # our own container — leave it
        *) echo "[looma-up]   host port ${port} held by pid ${pid} (${comm:-unknown}) — stopping it"
           kill "$pid" 2>/dev/null || true ;;
      esac
    done
  done
}

cmd_up() {
  # NOTE: no `set -e` here. The APP starts FIRST (that is what the kiosk needs);
  # observability is best-effort and must NEVER stop the box from coming up.
  # Failures are handled explicitly below, so the ERR reporter goes too.
  set +e; trap - ERR
  local repo_dir="$SRC_REPO" obs_dir="$OBS_DIR"

  # Defaults, then the installer's answers.
  WITH_OBSERVABILITY=1; WITH_AI=1; WITH_ANALYSIS=0; WITH_AGENTS=0; OFFLINE=0
  LOOMA_CONTENT_DIR="$SRC_ROOT/content"
  LOOMA_MAPS_DIR="$SRC_ROOT/maps2018"
  LOOMA_EPAATH_DIR="$SRC_ROOT/content/epaath"
  LOOMA_OTEL_ENDPOINT="http://looma-otel-collector:4318"
  LOOMA_OPENSEARCH_URL="http://looma-opensearch:9200"
  # shellcheck disable=SC1091
  [ -f /etc/looma-odroid.env ] && . /etc/looma-odroid.env
  export LOOMA_CONTENT_DIR LOOMA_MAPS_DIR LOOMA_EPAATH_DIR LOOMA_OTEL_ENDPOINT LOOMA_OPENSEARCH_URL

  # `ai` turns on the assistant. `analysis` turns on the heavy obs workers — kept
  # SEPARATE, so enabling the assistant does not also start those.
  local app_profiles=() obs_profiles=() build_args=() pull_args=()
  [ "$WITH_AI" = "1" ] && app_profiles+=(--profile ai)
  [ "$WITH_ANALYSIS" = "1" ] && obs_profiles+=(--profile analysis)
  [ "${1:-}" = "--build" ] && build_args=(--build)
  # OFFLINE: never build, never pull — use only the images loaded onto the box.
  # `--pull never` also stops services with `pull_policy: always` reaching a registry.
  if [ "${OFFLINE:-0}" = "1" ]; then build_args=(); pull_args=(--pull never); fi

  docker network inspect loomanet >/dev/null 2>&1 || docker network create loomanet
  docker volume inspect looma_apache_logs >/dev/null 2>&1 || docker volume create looma_apache_logs >/dev/null

  # Make sure nothing on the host is squatting on the ports the app publishes — a
  # leftover native looma-search.service (Restart=always) is the usual reason
  # `docker compose up` fails with "address already in use" on 46333, over and over.
  free_app_host_ports
  # …and that no OTHER compose project still owns a container name we need, which
  # would fail with `Conflict. The container name "/looma-ai" is already in use`.
  # Only foreign containers go; compose adopts and recreates its own. looma-db and
  # looma-web are deliberately not listed — they are only ever ours, and looma-db
  # keeps Mongo in its writable layer, so it must never be removed behind a boot.
  remove_conflicting_containers "$(app_project_name)" looma-search looma-piper looma-ai

  # --- APP FIRST (the kiosk depends on looma-web :48080) ---
  echo "[looma-up] app…"
  # No -f on purpose: docker-compose.override.yml auto-loads (content binds, no
  # resource limits, looma-ai gated off unless --profile ai).
  if ! ( cd "$repo_dir" && docker compose "${app_profiles[@]}" up -d "${build_args[@]}" "${pull_args[@]}" ); then
    echo "[looma-up] ERROR: the app stack failed to start" >&2
    exit 1
  fi

  # --- OBSERVABILITY: best-effort, never blocks the app/box ---
  if [ "$WITH_OBSERVABILITY" = "1" ]; then
    echo "[looma-up] observability (trimmed for 8 GB; best-effort)…"
    if ! ( cd "$obs_dir" && docker compose \
            -f docker-compose.yml -f docker-compose.odroid.yml "${obs_profiles[@]}" up -d "${build_args[@]}" "${pull_args[@]}" ); then
      echo "[looma-up] WARN: observability did not fully start — the app is up regardless." >&2
      echo "[looma-up]       check: cd $obs_dir && docker compose -f docker-compose.yml -f docker-compose.odroid.yml ps" >&2
    fi
  fi

  # --- AGENTS-ONLY: just Vector + Metricbeat, shipping to a REMOTE obs stack ---
  # No local OpenSearch/collector. `--no-deps` so it doesn't pull those in.
  if [ "$WITH_AGENTS" = "1" ] && [ "$WITH_OBSERVABILITY" != "1" ]; then
    echo "[looma-up] agents (Vector+Metricbeat -> remote $LOOMA_OPENSEARCH_URL)…"
    ( cd "$obs_dir" && docker compose -f docker-compose.yml -f docker-compose.odroid.yml \
        up -d --no-deps "${build_args[@]}" "${pull_args[@]}" vector metricbeat ) \
      || echo "[looma-up] WARN: the agents did not start — the app is up regardless." >&2
  fi

  # Warm the zvec index in the BACKGROUND: it is built lazily on the first request
  # (full-corpus embedding — slow on ARM), so kick it off now, detached, and it is
  # ready before the first user search without ever blocking boot.
  (
    for _ in $(seq 1 90); do curl -fsS "http://localhost:46333/health" >/dev/null 2>&1 && break; sleep 5; done
    curl -fsS -X POST "http://localhost:46333/rebuild" >/dev/null 2>&1 || true
  ) >/dev/null 2>&1 &

  echo "[looma-up] done."
}

cmd_down() {
  # --volumes ALSO deletes the data volumes (DANGER: wipes Mongo, the zvec index,
  # OpenSearch/Grafana data). Content and maps are host copies — never touched.
  local extra=()
  [ "${1:-}" = "--volumes" ] && extra+=(--volumes)

  echo "[looma-down] app…"
  ( cd "$SRC_REPO" && docker compose --profile ai down "${extra[@]}" ) || true

  echo "[looma-down] observability…"
  ( cd "$OBS_DIR" && docker compose \
      -f docker-compose.yml -f docker-compose.odroid.yml --profile heavy --profile ai down "${extra[@]}" ) || true

  echo "[looma-down] done."
}

# ===========================================================================
# build-bundle — produce the OFFLINE payload. Run on a build box WITH internet,
# same architecture (arm64) as the odroid. Images and .debs are arch-specific:
# an x86 bundle will NOT run on the box.
# ===========================================================================
build_bundle_docker() {
  command -v docker >/dev/null 2>&1 || die "docker is required on the BUILD machine"
  docker compose version >/dev/null 2>&1 || die "docker compose v2 is required on the BUILD machine"
  command -v curl >/dev/null 2>&1 || die "curl is required"

  local host_arch; host_arch="$(uname -m)"
  if [ "$host_arch" != "aarch64" ] && [ "$host_arch" != "arm64" ]; then
    warn "this machine is '$host_arch' but the odroid is arm64 — the images saved here will NOT run on it."
    read -r -p "Continue anyway? [y/N] " a; [ "${a:-N}" = "y" ] || exit 1
  fi

  mkdirs "$OFFLINE_DIR/docker" "$OFFLINE_DIR/images"

  log "downloading Docker Engine static ${DOCKER_VERSION} (${DOCKER_ARCH})"
  curl -fSL "https://download.docker.com/linux/static/stable/${DOCKER_ARCH}/docker-${DOCKER_VERSION}.tgz" \
    -o "$OFFLINE_DIR/docker/docker-${DOCKER_VERSION}.tgz"
  log "downloading Docker Compose ${COMPOSE_VERSION} (${COMPOSE_ARCH})"
  curl -fSL "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-linux-${COMPOSE_ARCH}" \
    -o "$OFFLINE_DIR/docker/docker-compose"
  chmod +x "$OFFLINE_DIR/docker/docker-compose"
  cat > "$OFFLINE_DIR/docker/VERSIONS" <<EOF
DOCKER_VERSION=$DOCKER_VERSION
COMPOSE_VERSION=$COMPOSE_VERSION
DOCKER_ARCH=$DOCKER_ARCH
COMPOSE_ARCH=$COMPOSE_ARCH
BUILT_ON=$(uname -m) $(date -u +%Y-%m-%dT%H:%M:%SZ)
EOF

  log "building the app images (pulls base images + Piper/voices — needs internet)"
  ( cd "$SRC_REPO" && docker compose --profile ai build )
  log "building the observability images"
  ( cd "$OBS_DIR" && docker compose -f docker-compose.yml -f docker-compose.odroid.yml build ) \
    || warn "some obs images failed to build (continuing — the app images are what matter)"
  log "pulling the third-party observability images (opensearch, clickhouse, coroot, …)"
  ( cd "$OBS_DIR" && docker compose -f docker-compose.yml -f docker-compose.odroid.yml pull --ignore-buildable ) \
    || warn "some obs images failed to pull (continuing)"

  log "enumerating the images both stacks reference"
  {
    ( cd "$SRC_REPO" && docker compose --profile ai config --images )
    ( cd "$OBS_DIR"  && docker compose -f docker-compose.yml -f docker-compose.odroid.yml config --images )
  } | sort -u > "$OFFLINE_DIR/images/IMAGES.list"

  # Save only what actually exists locally (skip anything that failed to build/pull).
  local present=() img
  while IFS= read -r img; do
    [ -n "$img" ] || continue
    if docker image inspect "$img" >/dev/null 2>&1; then present+=("$img"); else warn "not present locally, skipping: $img"; fi
  done < "$OFFLINE_DIR/images/IMAGES.list"
  [ "${#present[@]}" -gt 0 ] || die "no images available to save — did the builds fail?"

  log "saving ${#present[@]} images -> images/looma-images.tar (large; be patient)"
  docker save "${present[@]}" -o "$OFFLINE_DIR/images/looma-images.tar"
  printf '%s\n' "${present[@]}" > "$OFFLINE_DIR/images/IMAGES.saved"

  log "Docker offline payload ready: $OFFLINE_DIR  (images: $(du -h "$OFFLINE_DIR/images/looma-images.tar" | awk '{print $1}'))"
}

build_bundle_native() {
  [ "$(id -u)" -eq 0 ] || die "the native bundle needs apt + pecl: sudo $0 build-bundle native"
  . /etc/os-release 2>/dev/null || true
  local arch; arch="$(dpkg --print-architecture 2>/dev/null || echo unknown)"
  [ "${VERSION_ID:-}" = "20.04" ] || warn "expected Ubuntu 20.04 (focal); found '${VERSION_ID:-?}' — the bundle may not match the box"
  [ "$arch" = "arm64" ] || warn "expected arm64; found '$arch' — these .debs/wheels will NOT run on the odroid"

  mkdirs "$NATIVE_BUNDLE"/{deb,php-ext,wheels,piper/voices,hf}

  local pkgs=(
    apache2 apache2-utils libapache2-mod-php7.4
    php7.4 php7.4-cli php7.4-common php7.4-curl php7.4-mbstring php7.4-xml
    php7.4-gd php7.4-zip php7.4-bcmath php7.4-dev php-pear
    libssl-dev pkg-config build-essential autoconf
    python3 python3-venv python3-pip python3-dev
    unzip curl wget net-tools gnupg ca-certificates rsync
    mongodb-org="$MONGO_VERSION" mongodb-org-server="$MONGO_VERSION"
    mongodb-org-shell="$MONGO_VERSION" mongodb-org-mongos="$MONGO_VERSION"
    mongodb-org-tools="$MONGO_VERSION" mongodb-database-tools
  )

  log "adding the MongoDB ${MONGO_SERIES} apt repo (focal, arm64)"
  curl -fsSL "https://pgp.mongodb.com/server-${MONGO_SERIES}.asc" | gpg --dearmor --batch --yes -o "/usr/share/keyrings/mongodb-server-${MONGO_SERIES}.gpg"
  echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-${MONGO_SERIES}.gpg arch=arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/${MONGO_SERIES} multiverse" \
    > "/etc/apt/sources.list.d/mongodb-org-${MONGO_SERIES}.list"
  tidy_known_broken_apt_repos
  apt-get update || warn "apt-get update reported errors (a broken third-party repo?) — continuing"

  log "downloading the .deb packages (+ dependencies) into deb/"
  apt-get clean
  apt-get install -y --download-only "${pkgs[@]}"
  cp -n /var/cache/apt/archives/*.deb "$NATIVE_BUNDLE/deb/" 2>/dev/null || true
  local count; count="$(ls -1 "$NATIVE_BUNDLE"/deb/*.deb 2>/dev/null | wc -l)"
  log "collected $count .deb files"
  [ "$count" -gt 0 ] || die "no .debs collected — run this on a CLEAN focal arm64 so the dependencies actually download"

  log "building the PHP mongodb extension ${MONGODB_EXT_VERSION} (pecl)"
  apt-get install -y php7.4-dev php-pear build-essential libssl-dev pkg-config autoconf
  printf "\n" | pecl install "mongodb-${MONGODB_EXT_VERSION}" || warn "the pecl mongodb build reported an issue"
  local ext_dir; ext_dir="$(php -i 2>/dev/null | awk -F'=> ' '/^extension_dir/{print $2; exit}')"
  if [ -n "${ext_dir:-}" ] && [ -f "$ext_dir/mongodb.so" ]; then
    cp "$ext_dir/mongodb.so" "$NATIVE_BUNDLE/php-ext/mongodb.so"
    echo "extension=mongodb.so" > "$NATIVE_BUNDLE/php-ext/mongodb.ini"
    log "captured mongodb.so from $ext_dir"
  else
    warn "could not find mongodb.so (extension_dir='$ext_dir') — PHP mongo calls may fail on the box"
  fi

  log "downloading the Python wheels (torch CPU, sentence-transformers, flask, gunicorn, looma-ai reqs)…"
  python3 -m pip install --upgrade pip wheel >/dev/null 2>&1 || true
  [ -f "$SRC_REPO/looma-ai/requirements.txt" ] && \
    { python3 -m pip download -r "$SRC_REPO/looma-ai/requirements.txt" -d "$NATIVE_BUNDLE/wheels" \
        --extra-index-url https://download.pytorch.org/whl/cpu || warn "some looma-ai wheels failed to download"; }
  python3 -m pip download flask gunicorn -d "$NATIVE_BUNDLE/wheels" || warn "the flask/gunicorn wheel download failed"

  log "downloading Piper ${PIPER_VERSION} (arm64) + the voice models"
  curl -fSL "https://github.com/rhasspy/piper/releases/download/${PIPER_VERSION}/piper_arm64.tar.gz" \
    -o "$NATIVE_BUNDLE/piper/piper_arm64.tar.gz"
  local vbase="https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0"
  curl -fSL "$vbase/ne/ne_NP/google/x_low/ne_NP-google-x_low.onnx"      -o "$NATIVE_BUNDLE/piper/voices/ne_NP-google-x_low.onnx"
  curl -fSL "$vbase/ne/ne_NP/google/x_low/ne_NP-google-x_low.onnx.json" -o "$NATIVE_BUNDLE/piper/voices/ne_NP-google-x_low.onnx.json"
  curl -fSL "$vbase/en/en_US/amy/low/en_US-amy-low.onnx"                -o "$NATIVE_BUNDLE/piper/voices/en_US-amy-low.onnx"
  curl -fSL "$vbase/en/en_US/amy/low/en_US-amy-low.onnx.json"           -o "$NATIVE_BUNDLE/piper/voices/en_US-amy-low.onnx.json"

  log "pre-downloading the HuggingFace models into hf/ (best-effort)"
  [ -f "$SRC_REPO/load_models.py" ] && \
    { ( export HF_HOME="$NATIVE_BUNDLE/hf"; python3 "$SRC_REPO/load_models.py" ) \
      || warn "load_models.py failed — the first search/AI run may need internet for the embedding model"; }

  cat > "$NATIVE_BUNDLE/VERSIONS" <<EOF
OS=focal arm64
MONGO=$MONGO_VERSION
MONGODB_PHP_EXT=$MONGODB_EXT_VERSION
PIPER=$PIPER_VERSION
BUILT=$(date -u +%Y-%m-%dT%H:%M:%SZ) on $(uname -m)
EOF
  log "native offline bundle ready: $NATIVE_BUNDLE  ($(du -sh "$NATIVE_BUNDLE" | awk '{print $1}'))"
}

cmd_build_bundle() {
  local what=all
  while [ $# -gt 0 ]; do case "$1" in
    docker|native|all) what="$1"; shift;;
    --bundle-dir) BUNDLE_ROOT="$2"; set_bundle_paths; shift 2;;
    -h|--help) usage; exit 0;;
    *) die "build-bundle takes: docker | native | all  [--bundle-dir PATH]";;
  esac; done

  log "bundle destination: $BUNDLE_ROOT"
  case "$what" in
    docker) build_bundle_docker ;;
    native) build_bundle_native ;;
    all)    build_bundle_docker; build_bundle_native ;;
  esac
  cat <<EOF

  Next: move the disk (repo + content/ + this bundle) to the odroid and run there:
    sudo <disk>/$REPO_NAME/deploy/odroid/looma-installer.sh        # choose "offline" in the form
EOF
}

# ===========================================================================
# install — the form (or the flags), then the chosen deployment
# ===========================================================================
cmd_install() {
  local had_flags=0
  [ $# -gt 0 ] && had_flags=1
  while [ $# -gt 0 ]; do case "$1" in
    --docker) DEPLOY=docker; shift;;
    --native) DEPLOY=native; shift;;
    --offline) OFFLINE=1; shift;;
    --online) OFFLINE=0; shift;;
    --www) WWW="$2"; shift 2;;
    --user) TARGET_USER="$2"; shift 2;;
    --kiosk-url) KIOSK_URL="$2"; shift 2;;
    --no-kiosk) INSTALL_KIOSK=0; shift;;
    --no-swap) MAKE_SWAP=0; shift;;
    --observability) WITH_OBSERVABILITY=1; WITH_AGENTS=0; shift;;
    --no-observability) WITH_OBSERVABILITY=0; WITH_AGENTS=0; shift;;
    --remote-obs) WITH_OBSERVABILITY=0; WITH_AGENTS=1; REMOTE_OBS_HOST="$2"; shift 2;;
    --analysis) WITH_ANALYSIS=1; shift;;
    --ai) WITH_AI=1; shift;;
    --no-ai) WITH_AI=0; shift;;
    --no-search) WITH_SEARCH=0; shift;;
    --sidecars) SIDECARS="$2"; shift 2;;
    --swap) MAKE_SWAP=1; shift;;
    --swap-gb) MAKE_SWAP=1; SWAP_GB="$2"; shift 2;;
    --cpu-max-freq) CPU_MAX_FREQ="$2"; shift 2;;
    --bundle-dir) BUNDLE_ROOT="$2"; set_bundle_paths; shift 2;;
    -h|--help) usage; exit 0;;
    *) die "unknown option: $1 (see --help)";;
  esac; done

  # No flags on a terminal -> the form. Any flag skips it (scripted installs).
  if [ "$had_flags" -eq 0 ] && [ -t 0 ]; then
    run_form
  fi

  resolve_obs_endpoints
  preflight "install"
  # Always — not just when switching deployments: a leftover legacy browser
  # autostart (an old firefox.desktop, a hand-edited kiosk entry, …) opens a
  # SECOND browser window on login next to ours, on every deploy and re-install.
  disable_foreign_browser_autostarts
  settle_install_source          # offline without a bundle -> install online if we can

  # Wrong-port kiosk = a blank screen on boot, and it is not obvious why. run_form's
  # own "deploy" handler already resets KIOSK_URL when it changes there — but a
  # SCRIPTED install (flags only, no form) can pass --docker/--native together
  # with a --kiosk-url that does not match, or one left over in the environment
  # from a previous run, and nothing else catches that. Match on the actual port
  # substring, not two exact legacy strings — a full, correctly-shaped URL for the
  # WRONG deployment (e.g. the Docker default kept while installing --native) is
  # the realistic mistake, and the old glob (`*:8080` / `*:48080`, anchored to the
  # END of the string) missed it entirely once "/home" followed the port.
  local _kiosk_url; _kiosk_url="$(kiosk_url)"
  case "$DEPLOY" in
    docker)
      case "$_kiosk_url" in
        *:48080|*:48080/*) ;;  # correct port for Docker
        *) warn "the kiosk URL is $_kiosk_url, but the Docker app listens on :48080 — the kiosk would open a dead page" ;;
      esac ;;
    native)
      case "$_kiosk_url" in
        *:8080|*:8080/*|*:48080|*:48080/*)
          warn "the kiosk URL is $_kiosk_url, but the native app listens on :80 — the kiosk would open a dead page" ;;
      esac ;;
  esac
  log "starting the install:"; summary

  case "$DEPLOY" in
    docker) install_deploy_docker ;;
    native) install_deploy_native ;;
    *) die "unknown deployment: $DEPLOY" ;;
  esac
}

# ===========================================================================
main() {
  # NOTE: no bare `shift` in the no-argument case — with $# = 0 it fails, and
  # `set -e` would then kill the script before the form ever appeared.
  local cmd="${1:-install}"
  [ $# -gt 0 ] && shift
  case "$cmd" in
    up)           cmd_up "$@" ;;
    down)         cmd_down "$@" ;;
    build-bundle) cmd_build_bundle "$@" ;;
    install)      cmd_install "$@" ;;
    -h|--help)    usage ;;
    -*)           cmd_install "$cmd" "$@" ;;   # bare flags == install
    *)            die "unknown command: $cmd (see --help)" ;;
  esac
}
main "$@"
