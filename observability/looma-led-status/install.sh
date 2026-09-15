#!/usr/bin/env bash
#
# Installs the Looma LED status endpoint:
#   - status_server.py              -> ~/.local/share/looma-ledstatus/
#   - config, systemd --user service
#
# No third-party Python deps (stdlib only), so no venv — just system python3
# and the `docker` CLI, run as a user who is in the `docker` group.
#
# Re-runnable. Run it as YOUR user (NOT with sudo).
#
set -euo pipefail

if [ "$(id -u)" -eq 0 ]; then
  echo "Do not run this with sudo. Run it as your normal user:" >&2
  echo "    ./install.sh" >&2
  exit 1
fi

if ! id -nG "$USER" | tr ' ' '\n' | grep -qx docker; then
  echo "Warning: '$USER' is not in the 'docker' group — status_server.py needs" >&2
  echo "         'docker' CLI access (inspect/ps/stats/volume/run) to work." >&2
fi

if ! systemctl --user show-environment >/dev/null 2>&1; then
  echo "No systemd --user session bus is available for '$USER'." >&2
  echo "Run this from inside your graphical desktop session (a normal terminal)," >&2
  echo "not a plain TTY / SSH-without-lingering. To allow it without a login:" >&2
  echo "    sudo loginctl enable-linger $USER   # then log in once, or reboot" >&2
  exit 1
fi

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$HOME/.local/share/looma-ledstatus"
CFG_DIR="$HOME/.config/looma-ledstatus"
UNIT_DIR="$HOME/.config/systemd/user"

say() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }

say "Creating directories"
mkdir -p "$APP_DIR" "$CFG_DIR" "$UNIT_DIR"

say "Installing daemon"
cp "$HERE/status_server.py" "$APP_DIR/"

if [ ! -f "$CFG_DIR/config.env" ]; then
  cp "$HERE/config.env.sample" "$CFG_DIR/config.env"
  echo "   wrote $CFG_DIR/config.env (defaults; edit to taste)"
else
  echo "   kept existing $CFG_DIR/config.env"
fi

say "Installing systemd --user unit"
cp "$HERE/looma-ledstatus.service" "$UNIT_DIR/"
systemctl --user daemon-reload
systemctl --user enable --now looma-ledstatus.service
sleep 1
systemctl --user --no-pager status looma-ledstatus.service | head -n 15 || true

LAN_IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
cat <<EOF

Done.

  logs:     journalctl --user -u looma-ledstatus -f
  tweak:    \$EDITOR $CFG_DIR/config.env  &&  systemctl --user restart looma-ledstatus
  one poll: python3 $APP_DIR/status_server.py --once
  endpoint: curl http://localhost:38070/status

Point the ESP32 firmware's STATUS_HOST at this machine's LAN IP${LAN_IP:+ (looks like $LAN_IP)}
and make sure the ESP32 is on the same network.
EOF
