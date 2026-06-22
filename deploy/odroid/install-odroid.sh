#!/usr/bin/env bash
#
# install-odroid.sh — installer ON A DISK that sets up an odroid box to run Looma
# in Docker, with the install root at /var/www/html (same place the native Looma
# used). The box becomes STANDALONE — remove the disk afterwards and reuse it.
#
# Final layout on the box (/var/www/html, the install root):
#     /var/www/html/Looma/        <- repo: compose, Dockerfiles, mongo-dump, looma-ai, …
#     /var/www/html/content/      <- books, pdfs, images, epaath …
#     /var/www/html/voices/       <- mimic voices (needed by the looma-mimic build)
#     /var/www/html/maps2018/  /mimic/  /piper/  /includes/  …
#     /var/www/html/.dockerignore <- keeps the 80 GB content/ out of build context
#
# It auto-detects a previous NATIVE install (Apache/MongoDB/Piper in /var/www/html)
# and DISABLES those services so Docker takes over. Content is updated IN PLACE
# (rsync --size-only), so a box that already has the content does not re-copy 80 GB.
#
# Run FROM THE DISK, on the box, as root:
#     sudo /path/on/disk/Looma/deploy/odroid/install-odroid.sh
#
# App runs with NO resource limits. Observability (heavy) is optional (default on),
# trimmed for 8 GB.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC_REPO="$(cd "$SCRIPT_DIR/../.." && pwd)"     # repo on the disk
SRC_ROOT="$(cd "$SRC_REPO/.." && pwd)"          # disk root (content/ voices/ … siblings)
REPO_NAME="$(basename "$SRC_REPO")"

# Defaults (override via flags)
TARGET_USER="${TARGET_USER:-odroid}"
WWW="${WWW:-/var/www/html}"          # install root ON THE BOX
WITH_OBSERVABILITY="${WITH_OBSERVABILITY:-1}"
WITH_AI="${WITH_AI:-1}"          # looma-ai = the in-app assistant (ON by default)
WITH_ANALYSIS="${WITH_ANALYSIS:-0}"  # heavy obs AI analysis workers (separate, OFF)
WITH_AGENTS="${WITH_AGENTS:-0}"      # agents-only: Vector+Metricbeat -> remote obs
LOOMA_OTEL_ENDPOINT="${LOOMA_OTEL_ENDPOINT:-http://looma-otel-collector:4318}"
LOOMA_OPENSEARCH_URL="${LOOMA_OPENSEARCH_URL:-http://looma-opensearch:9200}"
MAKE_SWAP="${MAKE_SWAP:-1}"
SWAP_GB="${SWAP_GB:-8}"
INSTALL_KIOSK="${INSTALL_KIOSK:-1}"
KIOSK_URL="${KIOSK_URL:-http://localhost:48080}"

log()  { printf '\n\033[1;36m[install]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[warn]\033[0m %s\n' "$*"; }
die()  { printf '\033[1;31m[error]\033[0m %s\n' "$*" >&2; exit 1; }

usage() {
  cat <<EOF
Usage: sudo $0 [options]
  --www PATH           Install root on the box (default: $WWW)
  --user NAME          Desktop user for autostart/kiosk (default: $TARGET_USER)
  --kiosk-url URL      URL the kiosk opens (default: $KIOSK_URL)
  --no-observability   App only (no Grafana/OpenSearch/traces)
  --remote-obs IP      Send telemetry to an obs stack on another host (this box
                       runs only Vector+Metricbeat + app OTLP; needs IP reachable
                       on :4318 and :49200). Implies --no-observability.
  --no-ai              Do NOT run looma-ai (the assistant is ON by default)
  --analysis           Also run the heavy obs AI analysis workers (torch)
  --no-kiosk           Don't install the Chromium kiosk autostart
  --no-swap            Don't create a swapfile
  -h, --help
EOF
}
while [ $# -gt 0 ]; do case "$1" in
  --www) WWW="$2"; shift 2;;
  --user) TARGET_USER="$2"; shift 2;;
  --kiosk-url) KIOSK_URL="$2"; shift 2;;
  --no-observability) WITH_OBSERVABILITY=0; shift;;
  --remote-obs) # ship to an obs stack on another host (no local obs; just agents)
      WITH_OBSERVABILITY=0; WITH_AGENTS=1
      LOOMA_OTEL_ENDPOINT="http://$2:4318"; LOOMA_OPENSEARCH_URL="http://$2:49200"; shift 2;;
  --no-ai) WITH_AI=0; shift;;
  --ai) WITH_AI=1; shift;;
  --analysis) WITH_ANALYSIS=1; shift;;
  --no-kiosk) INSTALL_KIOSK=0; shift;;
  --no-swap) MAKE_SWAP=0; shift;;
  -h|--help) usage; exit 0;;
  *) die "unknown option: $1";;
esac; done

[ "$(id -u)" -eq 0 ] || die "run as root: sudo $0"
id "$TARGET_USER" >/dev/null 2>&1 || die "user '$TARGET_USER' does not exist (use --user)"
[ -f "$SRC_REPO/docker-compose.yml" ] || die "repo not found at $SRC_REPO"
[ -d "$SRC_ROOT/content" ] || die "no content/ next to the repo at $SRC_ROOT"

REPO_DEST="$WWW/$REPO_NAME"
CONTENT_DIR="$WWW/content"
MAPS_DIR="$WWW/maps2018"
EPAATH_DIR="$WWW/content/epaath"

# Detect a previous NATIVE install (services or existing code/content at $WWW)
NATIVE=0
if [ -d "$WWW/Looma" ] || [ -d "$WWW/content" ] \
   || systemctl list-unit-files 2>/dev/null | grep -qE '^(apache2|httpd|mongod|mongodb)\.service'; then
  NATIVE=1
fi

log "install root: $WWW   (repo -> $REPO_DEST, content -> $CONTENT_DIR)"
log "native install detected: $([ $NATIVE = 1 ] && echo yes || echo no)"
log "options: observability=$WITH_OBSERVABILITY ai=$WITH_AI kiosk=$INSTALL_KIOSK"

# 1) Docker -----------------------------------------------------------------
if ! command -v docker >/dev/null 2>&1; then
  log "installing Docker Engine (get.docker.com, arm64-aware)"
  curl -fsSL https://get.docker.com | sh
fi
docker compose version >/dev/null 2>&1 || die "docker compose v2 plugin missing"
systemctl enable --now docker >/dev/null 2>&1 || true
id -nG "$TARGET_USER" | grep -qw docker || { usermod -aG docker "$TARGET_USER" || true; warn "added $TARGET_USER to docker group (re-login for non-sudo docker)"; }

# 2) Swap -------------------------------------------------------------------
if [ "$MAKE_SWAP" = "1" ]; then
  cur=$(awk '/SwapTotal/{print $2}' /proc/meminfo)
  if [ "${cur:-0}" -lt 2000000 ] && [ ! -f /swapfile ]; then
    log "creating ${SWAP_GB}G swapfile"
    fallocate -l "${SWAP_GB}G" /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=$((SWAP_GB*1024))
    chmod 600 /swapfile; mkswap /swapfile; swapon /swapfile
    grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  fi
fi

# 3) Space check (only if content is not already on the box) ----------------
mkdir -p "$WWW"
if [ ! -d "$CONTENT_DIR" ] || [ "$(du -sk "$CONTENT_DIR" 2>/dev/null | awk '{print $1}')" -lt 1000000 ]; then
  need_kb=$(du -sk "$SRC_ROOT/content" | awk '{print $1}')
  free_kb=$(df -Pk "$WWW" | awk 'NR==2{print $4}')
  log "content ~$((need_kb/1024/1024)) GB, free on $WWW ~$((free_kb/1024/1024)) GB"
  [ "$free_kb" -gt "$((need_kb + 8000000))" ] || die "not enough free space at $WWW for the content"
fi

# 4) Copy everything into the install root ----------------------------------
# 4a) siblings + root files (incl .dockerignore); skip content (separate),
#     the repo (cleaned separately), and host-only/junk dirs.
log "copying project files -> $WWW (voices, maps2018, mimic, piper, includes, .dockerignore …)"
rsync -a \
  --exclude 'content/' --exclude "$REPO_NAME/" --exclude 'looma-env/' --exclude '.claude/' \
  --exclude '**/.git/' --exclude '**/.venv/' --exclude '**/__pycache__/' --exclude '**/node_modules/' \
  "$SRC_ROOT/" "$WWW/"
# 4b) repo (clean update of the code)
log "copying repo -> $REPO_DEST"
rsync -a --delete \
  --exclude '.git/' --exclude '**/.venv/' --exclude '**/__pycache__/' --exclude '**/node_modules/' \
  "$SRC_REPO/" "$REPO_DEST/"
chmod +x "$REPO_DEST"/deploy/odroid/*.sh 2>/dev/null || true
# 4c) content (in place: full copy if new, incremental --size-only if already there)
log "syncing content -> $CONTENT_DIR (in place; --size-only)…"
rsync -a --info=progress2 --size-only "$SRC_ROOT/content/" "$CONTENT_DIR/"
[ -d "$EPAATH_DIR" ] || EPAATH_DIR="$CONTENT_DIR/ePaath"   # fall back to capitalised name

# 5) Disable the native stack (if any) --------------------------------------
if [ "$NATIVE" = "1" ]; then
  log "disabling native services (Apache/MongoDB/Piper) so Docker takes over"
  for svc in apache2 httpd mongod mongodb piper looma-piper; do
    if systemctl list-unit-files 2>/dev/null | grep -q "^${svc}\.service"; then
      systemctl disable --now "${svc}.service" 2>/dev/null && log "  disabled ${svc}.service" || true
    fi
  done

  # Disable the native browser KIOSK autostart (e.g. firefox.startup, or a
  # chromium/looma autostart) — otherwise it keeps opening a second browser
  # window at the old native URL (now a dead/blank page) alongside our Docker
  # kiosk. We never touch our own looma-kiosk.desktop. Covers per-user XDG
  # autostart, the system XDG autostart, and the LXDE/LXQt session autostart.
  log "disabling native browser kiosk autostart (so only the Docker kiosk opens)"
  for dir in "/home/$TARGET_USER/.config/autostart" "/etc/xdg/autostart"; do
    [ -d "$dir" ] || continue
    for f in "$dir"/*.desktop; do
      [ -f "$f" ] || continue
      case "$(basename "$f")" in looma-kiosk.desktop) continue;; esac
      if grep -qiE 'firefox|chromium|chrome|looma' "$f" 2>/dev/null && grep -qiE 'kiosk|localhost|127\.0\.0\.1|firefox|chromium|chrome' "$f" 2>/dev/null; then
        mv -f "$f" "$f.disabled-by-looma" && log "  disabled autostart $(basename "$f")" || true
      fi
    done
  done
  # LXDE/LXQt session autostart files: comment out lines launching a browser.
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

  warn "Docker MongoDB is restored from the disk's mongo-dump (latest) — DB changes"
  warn "made only on this box are replaced (same as 'loomaupdate'). Back up first if needed."
fi

# 6) Options for looma-up.sh / systemd --------------------------------------
log "writing /etc/looma-odroid.env"
cat > /etc/looma-odroid.env <<EOF
# Generated by install-odroid.sh
WITH_OBSERVABILITY=$WITH_OBSERVABILITY
WITH_AI=$WITH_AI
WITH_ANALYSIS=$WITH_ANALYSIS
WITH_AGENTS=$WITH_AGENTS
LOOMA_OTEL_ENDPOINT=$LOOMA_OTEL_ENDPOINT
LOOMA_OPENSEARCH_URL=$LOOMA_OPENSEARCH_URL
LOOMA_CONTENT_DIR=$CONTENT_DIR
LOOMA_MAPS_DIR=$MAPS_DIR
LOOMA_EPAATH_DIR=$EPAATH_DIR
EOF

# 7) Network + external volume ----------------------------------------------
docker network inspect loomanet >/dev/null 2>&1 || { log "creating loomanet"; docker network create loomanet; }
docker volume inspect looma_apache_logs >/dev/null 2>&1 || docker volume create looma_apache_logs >/dev/null

# 8) Build + start ----------------------------------------------------------
# `--build` so re-installs pick up Dockerfile changes (e.g. data-prepper arm64),
# instead of silently reusing a stale image. Boots later run without --build.
log "building and starting Looma… (first build is slow on ARM)"
"$REPO_DEST/deploy/odroid/looma-up.sh" --build

# 8b) Verify zvec: build the search index now and confirm it indexed documents,
#     so the box ships with working semantic search (and we fail loudly here
#     instead of silently on the first user search). Model is baked into the
#     image, so this only needs looma-db (Mongo) up — no internet.
log "building the zvec search index (first build; slow on ARM, please wait)…"
for _ in $(seq 1 90); do curl -fsS "http://localhost:46333/health" >/dev/null 2>&1 && break; sleep 5; done
zresp="$(curl -fsS -X POST --max-time 1800 "http://localhost:46333/rebuild" 2>/dev/null || true)"
case "$zresp" in
  *'"ok"'*true*) log "zvec OK: $zresp" ;;
  *) warn "zvec did NOT build cleanly: ${zresp:-<no response>}"
     warn "  check: docker logs looma-search --tail 50 ; docker logs looma-db --tail 20"
     warn "  retry: curl -X POST http://localhost:46333/rebuild" ;;
esac

# 9) Autostart --------------------------------------------------------------
log "installing systemd unit looma.service"
sed -e "s#@REPO_DIR@#$REPO_DEST#g" -e "s#@USER@#$TARGET_USER#g" \
  "$REPO_DEST/deploy/odroid/looma.service" > /etc/systemd/system/looma.service
systemctl daemon-reload
systemctl enable looma.service

if [ "$INSTALL_KIOSK" = "1" ]; then
  log "installing Chromium kiosk autostart for $TARGET_USER"
  AUTOSTART="/home/$TARGET_USER/.config/autostart"
  mkdir -p "$AUTOSTART"
  sed -e "s#@KIOSK_URL@#$KIOSK_URL#g" "$REPO_DEST/deploy/odroid/looma-kiosk.desktop" > "$AUTOSTART/looma-kiosk.desktop"
  chown -R "$TARGET_USER":"$TARGET_USER" "/home/$TARGET_USER/.config"
fi

# 10) Done ------------------------------------------------------------------
OBS_STATE=OFF; [ "$WITH_OBSERVABILITY" = "1" ] && OBS_STATE=ON
log "DONE — Looma runs in Docker from $WWW. You can REMOVE THE DISK."
cat <<EOF

  Install root:   $WWW   (Looma/, content/, voices/, maps2018/, …)
  App:            curl -I $KIOSK_URL        (expect 200/302)
  Search (zvec):  builds on first start (slow on ARM); curl http://localhost:46333/health
  Observability:  $OBS_STATE  ->  Grafana :43000 / OS Dashboards :45601
  Autostart:      systemctl is-enabled looma.service   (-> enabled)
  Reboot to confirm the stack auto-starts and Chromium opens $KIOSK_URL.

  Manage later:   $REPO_DEST/deploy/odroid/looma-up.sh   /   looma-down.sh
  Toggle obs/ai:  edit /etc/looma-odroid.env then run looma-up.sh
EOF
