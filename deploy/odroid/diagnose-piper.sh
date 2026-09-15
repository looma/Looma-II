#!/usr/bin/env bash
# One command that says WHY Piper is silent on this box.
#
# TTS reaches a teacher through a chain, and any link can break it quietly:
#
#   browser -> looma-TTS.php -> LOOMA_PIPER_URL -> piper server -> piper binary + voices
#
# `verify` reports the end of that chain ("TTS does not answer"); this walks every
# link and prints which one is broken, so the fix is not a guess.
#
#   sudo ./diagnose-piper.sh          report only
#   sudo ./diagnose-piper.sh --fix    report, then repair what it can, then re-test
#
set -u

FIX=0
[ "${1:-}" = "--fix" ] && FIX=1

ok()   { printf '  \033[1;32m[ ok ]\033[0m %s\n' "$*"; }
bad()  { printf '  \033[1;31m[FAIL]\033[0m %s\n' "$*"; }
warn_() { printf '  \033[1;33m[warn]\033[0m %s\n' "$*"; }
info() { printf '         %s\n' "$*"; }
head_() { printf '\n=== %s ===\n' "$*"; }

# Set by section 3 when it finds the boot-time saboteur, read by --fix at the end.
SABOTEUR=0
PIPER_DISABLED=0

head_ "1. How this box was installed"
ENVF=/etc/looma-odroid.env
if [ -f "$ENVF" ]; then
    ok "$ENVF"
    grep -E '^(DEPLOY|PIPER_MODE|SIDECARS|WITH_SEARCH|OFFLINE|WWW|REPO_NAME)=' "$ENVF" | sed 's/^/         /'
    # shellcheck disable=SC1090
    . "$ENVF" 2>/dev/null || true
else
    bad "no $ENVF — this box was never installed by looma-installer.sh"
fi
WWW="${WWW:-/var/www/html}"

head_ "2. Is anything listening on 5002?"
if command -v ss >/dev/null 2>&1; then
    listener="$(ss -ltnp 2>/dev/null | grep ':5002' || true)"
else
    listener="$(netstat -ltnp 2>/dev/null | grep ':5002' || true)"
fi
if [ -n "$listener" ]; then ok "port 5002 is held:"; info "$listener"
else bad "NOTHING is listening on 5002 — the Piper server is not running"; fi

head_ "3. Where Piper could be running (BOTH checked, whatever the env file says)"
info "recorded PIPER_MODE: ${PIPER_MODE:-<unset: the native install never writes this file>}"

printf '\n  -- as a container --\n'
if command -v docker >/dev/null 2>&1; then
    line="$(docker ps -a --filter name=looma-piper --format '{{.Names}} {{.Status}} ({{.Image}})' 2>/dev/null || true)"
    if [ -n "$line" ]; then
        ok "container: $line"
        info "--- last 15 log lines ---"
        docker logs looma-piper --tail 15 2>&1 | sed 's/^/         /'
    else
        info "no looma-piper container on this box"
    fi
else
    info "docker is not installed here"
fi

printf '\n  -- as a systemd service --\n'
if systemctl list-unit-files 2>/dev/null | grep -q '^looma-piper\.service'; then
    state="$(systemctl is-active looma-piper 2>/dev/null || true)"
    enabled="$(systemctl is-enabled looma-piper 2>/dev/null || true)"
    if [ "$state" = active ]; then ok "looma-piper.service: $state ($enabled)"
    else bad "looma-piper.service: $state ($enabled)"; fi
    [ "$enabled" = enabled ] || PIPER_DISABLED=1
    # `disabled` is a different illness from `failed`, and the journal above does
    # not distinguish them. The unit has Restart=always, so it cannot stop by
    # itself — inactive+disabled means SOMETHING TURNED IT OFF, and the next
    # sub-block names what.
    if [ "$state" != active ] && [ "$enabled" != enabled ]; then
        info "note: the unit has Restart=always, so it cannot have stopped on its own."
        info "      inactive + disabled means something ran 'systemctl disable' on it."
    fi
    info "ExecStart: $(systemctl show looma-piper -p ExecStart --value 2>/dev/null | head -c 200)"
    info "--- last 20 journal lines (WHY it is not running) ---"
    journalctl -u looma-piper -n 20 --no-pager 2>/dev/null | sed 's/^/         /'
else
    bad "looma-piper.service is NOT installed on this box"
fi

# The one cause the file checks below can never find: nothing is MISSING, the
# service is simply switched off again at every boot. looma.service is the DOCKER
# deployment's boot unit; it runs `looma-installer.sh up`, whose first job is to
# clear the host services off the ports the containers want. On a native box that
# means it disables looma-piper (and looma-search, looma-ai) roughly a minute
# after systemd started them — which is exactly what an "it worked yesterday"
# board looks like.
printf '\n  -- what could be switching it off at boot --\n'
if systemctl list-unit-files 2>/dev/null | grep -q '^looma\.service'; then
    if systemctl is-enabled looma.service >/dev/null 2>&1; then
        if [ "${DEPLOY:-native}" = "native" ]; then
            SABOTEUR=1
            bad "looma.service (the DOCKER autostart) is ENABLED on this NATIVE box."
            info "It runs 'looma-installer.sh up' at every boot, and that disables"
            info "looma-piper.service. This is almost certainly why Piper is off."
            info "Fix:  sudo systemctl disable --now looma.service"
            info "      sudo systemctl enable  --now looma-piper.service"
        else
            ok "looma.service is enabled — correct for a Docker deployment"
        fi
    else
        ok "looma.service exists but is disabled — it cannot interfere"
    fi
else
    ok "no looma.service on this box — nothing runs 'up' at boot"
fi
# The proof, if the journal still has the boot in it.
eviction="$(journalctl -u looma.service --no-pager 2>/dev/null \
            | grep -F 'disabling native looma-piper' | tail -3 || true)"
if [ -n "$eviction" ]; then
    bad "caught in the act — looma.service's own log says it disabled Piper:"
    printf '%s\n' "$eviction" | sed 's/^/         /'
    SABOTEUR=1
fi
# The legacy unit: it overclocks the CPU in ExecStartPre and browns the board out
# under TTS load, and it fights looma-piper for :5002.
if systemctl is-enabled piper.service >/dev/null 2>&1; then
    bad "the LEGACY piper.service is enabled — it overclocks the CPU (board resets under TTS)"
    info "and holds :5002 against looma-piper. Fix: sudo systemctl disable --now piper.service"
fi

printf '\n  -- what the service needs to start --\n'
VENV="${VENV:-/opt/looma/venv}"
if [ -x "$VENV/bin/python" ]; then
    ok "venv python: $VENV/bin/python ($("$VENV/bin/python" --version 2>&1))"
    if "$VENV/bin/python" -c 'import flask' 2>/dev/null; then ok "flask is installed in the venv"
    else bad "flask is NOT installed in the venv — the Flask sidecar cannot start"; fi
else
    bad "no venv python at $VENV/bin/python"
fi
srv="$(ls "$WWW"/*/piper_server.py 2>/dev/null | head -1)"
[ -n "$srv" ] && ok "piper_server.py: $srv" || bad "piper_server.py not found under $WWW/*/"

head_ "4. The pieces a host Piper needs"
found_bin=""
for c in "$WWW/piper/piper" /usr/local/bin/piper/piper /usr/local/bin/piper; do
    [ -x "$c" ] && { found_bin="$c"; break; }
done
[ -n "$found_bin" ] && ok "piper binary: $found_bin" \
                    || bad "NO piper binary in $WWW/piper/ or /usr/local/bin/piper/"
for d in /usr/share/piper "$WWW/piper"; do
    n="$(ls -1 "$d"/*.onnx 2>/dev/null | wc -l)"
    [ "$n" -gt 0 ] && ok "$n voice model(s) in $d" || info "no .onnx in $d"
done

head_ "5. Does the server answer?"
health="$(curl -fsS --max-time 10 http://127.0.0.1:5002/health 2>/dev/null || true)"
if [ -n "$health" ]; then ok "/health answered:"; printf '         %s\n' "$health"
else bad "/health did NOT answer on 127.0.0.1:5002"; fi

head_ "6. Does it actually speak?"
code="$(curl -s -o /tmp/looma-tts-test.wav -w '%{http_code}' --max-time 60 \
        -X POST http://127.0.0.1:5002/tts -H 'Content-Type: application/json' \
        -d '{"text":"Looma speaks","language":"en"}' 2>/dev/null || true)"
if [ "$code" = "200" ] && head -c 4 /tmp/looma-tts-test.wav 2>/dev/null | grep -q RIFF; then
    ok "synthesis works ($(wc -c < /tmp/looma-tts-test.wav) bytes of WAV)"
else
    bad "synthesis failed (HTTP ${code:-none})"
    [ -s /tmp/looma-tts-test.wav ] && info "$(head -c 300 /tmp/looma-tts-test.wav)"
fi

head_ "7. What the APP asks for"
conf="$(ls /etc/apache2/sites-enabled/*looma* 2>/dev/null | head -1)"
if [ -n "$conf" ]; then
    ok "vhost: $conf"
    grep -E 'SetEnv +LOOMA_(PIPER|AI|SEARCH)' "$conf" | sed 's/^/         /' || info "no LOOMA_* SetEnv lines"
else
    info "no native vhost (Docker deployment?) — the app reads LOOMA_PIPER_URL from the container env:"
    command -v docker >/dev/null 2>&1 && \
        docker exec looma-web sh -c 'env | grep -i piper' 2>/dev/null | sed 's/^/         /'
fi

head_ "8. End to end, the way a teacher triggers it"
base="http://localhost"; [ "${DEPLOY:-native}" = "docker" ] && base="http://localhost:48080"
code="$(curl -s -o /tmp/looma-tts-app.wav -w '%{http_code}' --max-time 60 \
        "$base/looma-TTS.php?text=Looma+speaks&lang=en" 2>/dev/null || true)"
if [ "$code" = "200" ] && head -c 4 /tmp/looma-tts-app.wav 2>/dev/null | grep -q RIFF; then
    ok "the app returns audio ($(wc -c < /tmp/looma-tts-app.wav) bytes)"
else
    bad "the app did NOT return audio (HTTP ${code:-none}) from $base/looma-TTS.php"
    [ -s /tmp/looma-tts-app.wav ] && info "$(head -c 300 /tmp/looma-tts-app.wav)"
fi

if [ "$FIX" != "1" ]; then
    printf '\nSend this whole output. The first [FAIL] is where the chain breaks.\n'
    if [ "$SABOTEUR" = "1" ] || [ "$PIPER_DISABLED" = "1" ]; then
        printf 'This box can repair itself: sudo %s --fix\n' "$0"
    fi
    exit 0
fi

# ---------------------------------------------------------------------------
# --fix: only the repairs this script can make SAFELY and reversibly — flipping
# systemd units back the way the deployment says they belong. Missing binaries,
# missing voices and a broken venv are the installer's job (looma-installer.sh
# repairs those), so they are named here rather than half-fixed.
# ---------------------------------------------------------------------------
head_ "9. Repairing (--fix)"
[ "$(id -u)" = "0" ] || { bad "--fix needs root: sudo $0 --fix"; exit 1; }

did=0
if systemctl is-enabled looma.service >/dev/null 2>&1 && [ "${DEPLOY:-native}" = "native" ]; then
    systemctl disable --now looma.service >/dev/null 2>&1 || true
    ok "disabled looma.service (the Docker autostart that was turning Piper off at boot)"
    info "native Looma still autostarts: apache2, mongod and looma-piper are each enabled"
    did=1
fi
if systemctl is-enabled piper.service >/dev/null 2>&1; then
    systemctl disable --now piper.service >/dev/null 2>&1 || true
    ok "disabled the legacy piper.service (CPU overclock + port conflict)"
    did=1
fi
if systemctl list-unit-files 2>/dev/null | grep -q '^looma-piper\.service'; then
    systemctl enable --now looma-piper.service >/dev/null 2>&1 || true
    ok "enabled and started looma-piper.service"
    did=1
else
    bad "looma-piper.service is not installed — re-run the installer to put it back:"
    info "sudo $WWW/${REPO_NAME:-Looma}/deploy/odroid/looma-installer.sh install"
fi
[ "$did" = "1" ] || warn_ "nothing to flip — the fault is not a systemd unit being switched off"

printf '\n  -- re-testing --\n'
for _ in $(seq 1 30); do
    curl -fsS --max-time 5 http://127.0.0.1:5002/health >/dev/null 2>&1 && break
    sleep 2
done
code="$(curl -s -o /tmp/looma-tts-fix.wav -w '%{http_code}' --max-time 60 \
        -X POST http://127.0.0.1:5002/tts -H 'Content-Type: application/json' \
        -d '{"text":"Looma speaks","language":"en"}' 2>/dev/null || true)"
if [ "$code" = "200" ] && head -c 4 /tmp/looma-tts-fix.wav 2>/dev/null | grep -q RIFF; then
    ok "Piper speaks again ($(wc -c < /tmp/looma-tts-fix.wav) bytes of WAV)"
    ok "and it is enabled, so it comes back after a reboot"
    printf '\nReboot to confirm, then press Speak in the app.\n'
else
    bad "still no audio (HTTP ${code:-none}) — the unit is on but something else is wrong."
    info "Run the installer's own repair, which fixes missing voices/flask/binary too:"
    info "  sudo $WWW/${REPO_NAME:-Looma}/deploy/odroid/looma-installer.sh install"
    info "Then re-run: sudo $0"
fi
