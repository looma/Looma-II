# looma-led-status — Looma stack status on an ESP8266 panel

Physical status panel for the **Looma** stack (a separate app whose
`looma-*` containers share this Docker host with Artrackr — see
[../../README.md](../../README.md)). **Not** Artrackr's own stack — for
that, see the sibling [../fan-status/](../fan-status/), which drives
Corsair fans instead.

Two parts:

1. **`status_server.py`** — runs on this host (the data-server), polls the
   5 signals below, and serves them as JSON over plain HTTP.
2. **`looma_led_status/looma_led_status.ino`** — an ESP8266 (NodeMCU)
   sketch that polls that JSON over WiFi and renders it on a 7-segment
   digit + a 2-channel (red/green) LED strip.

| Code | Signal | Source | Colours |
|------|--------|--------|---------|
| `O` | Looma OpenSearch cluster health | `GET {OS_URL}/_cluster/health` | green/yellow/red = the API's own `status` field |
| `H` | looma.website reachability | `GET {HEARTBEAT_URL}` | green = HTTP 200–399, red = anything else (down/timeout) |
| `U` | `looma-vector` container state | `docker inspect` | green = running, red = anything else |
| `d` | Size of `looma_*` Docker volumes | `docker run busybox du -csb` (every 5 min — spins a container, kept off the fast loop) | green/yellow/red vs `DISK_WARN_GB`/`DISK_CRIT_GB` |
| `P` | `looma-prometheus` health | `GET http://<container-ip>:{PROM_PORT}{PROM_HEALTH_PATH}` (not published to the host, so the container's own Docker-network IP is looked up via `docker inspect` on every poll) | green = HTTP 200–399, red = anything else |

An unreachable/failed signal reports **yellow** ("unknown"), never crashes
the loop — check `journalctl` or the `detail` field in the JSON for why.

## Backend: install on the data-server

Zero third-party Python dependencies (stdlib + the `docker` CLI only), so
no venv:

```sh
./install.sh            # as your user, NOT sudo
```

Installs `status_server.py` to `~/.local/share/looma-ledstatus/`, config at
`~/.config/looma-ledstatus/config.env`, and a `systemd --user` service
(`looma-ledstatus.service`) serving `http://<this-host-LAN-ip>:38070/status`.

**After editing `status_server.py` in this repo, redeploy the running copy**
(`install.sh` only writes it once; it won't overwrite an existing install):

```sh
cp status_server.py ~/.local/share/looma-ledstatus/status_server.py
systemctl --user restart looma-ledstatus
```

```sh
journalctl --user -u looma-ledstatus -f     # reading + colour each poll
python3 ~/.local/share/looma-ledstatus/status_server.py --once   # one-shot JSON
curl http://localhost:38070/status
```

Tuning: see [`config.env.sample`](config.env.sample). Worth checking before
you rely on it:

- **`DISK_WARN_GB` / `DISK_CRIT_GB`** (default 5 / 10 GB) — this is the sum
  of `looma_*` volumes only, not host disk free space.
- **`HEARTBEAT_URL`** (default `https://looma.website`) — change if that's
  not the right URL.
- **`PROM_PORT`** (default 9091) — this Looma Prometheus listens on 9091,
  not the usual 9090; check `docker exec looma-prometheus ps aux` if that
  ever changes.

**The firewall must allow the port**: since the ESP8266 is a different
device on the LAN, `ufw` (or whatever firewall is active on this host) has
to explicitly allow inbound connections to it:

```sh
sudo ufw allow 38070/tcp comment 'looma-ledstatus (ESP8266 LED panel)'
```

Without this the backend works fine locally (`curl localhost:38070/...`
succeeds) but the ESP8266 gets connection failures (`status poll: HTTP -1`
in its serial log) because the OS silently drops the incoming packets.

## Firmware: flash the ESP8266

**Board is an ESP8266, not an ESP32** — despite hardware sometimes sold
under an "ESP32-ish" name, `esptool` identifies the chip on `/dev/ttyUSB0`
as an ESP8266 (`esptool.py` output: "Chip is ESP8266EX"). That's also why
the board's silkscreen uses the classic `D0`-`D8`/`A0`/`SD1`/`SD2` ESP8266
NodeMCU labelling rather than ESP32 pin names.

FQBN: `esp8266:esp8266:nodemcuv2` ("NodeMCU 1.0 (ESP-12E Module)"). Using
`arduino-cli`:

```sh
arduino-cli config add board_manager.additional_urls https://arduino.esp8266.com/stable/package_esp8266com_index.json
arduino-cli core update-index
arduino-cli core install esp8266:esp8266

arduino-cli compile --fqbn esp8266:esp8266:nodemcuv2 looma_led_status
arduino-cli upload  --fqbn esp8266:esp8266:nodemcuv2 --port /dev/ttyUSB0 looma_led_status
```

(The sketch **folder** must be named `looma_led_status` to match the
`.ino` filename — that's an `arduino-cli` requirement, not a Looma one.)

Your user needs access to the serial port (`/dev/ttyUSB0` is usually
owned by the `uucp` group on Arch/CachyOS): `sudo usermod -aG uucp $USER`,
then log out/in — or use `echo '<cmd>' | newgrp uucp` to pick up the group
for one command without a full re-login.

1. Copy `secrets.h.example` → `secrets.h` (same folder as the `.ino`) and
   set `STATUS_HOST`/`STATUS_PORT`/`STATUS_PATH` to this host's LAN IP and
   the port above. WiFi credentials are set directly as `WIFI_SSID` /
   `WIFI_PASSWORD` constants near the top of the `.ino`.
2. Compile + upload (see above, or use the Arduino IDE with the same FQBN).
3. Read the serial console at 115200 baud to confirm it joins WiFi and each
   poll succeeds (silence = polls are succeeding; `status poll: HTTP ...`
   lines mean something's failing).

### GPIO budget

The ESP8266 NodeMCU exposes only **9 usable digital pins** (`D0`-`D8`) in
total — not enough for 7 segments + a decimal point + a 3-wire RGB strip
(11 pins). This build drops two things to fit exactly 9:

- **No decimal point.** There's no free pin for it, and this board's `A0`
  is analog-**input**-only on ESP8266 (unlike ESP32) — it cannot drive an
  LED segment at all.
- **No Blue channel.** Only green/yellow/red are ever shown, and yellow is
  approximated from red+green (see below) — Blue is never driven, so its
  wire is simply left disconnected.

### Wiring

**7-segment display** (10-pin, common cathode — both COM pins to GND):

| Segment | Pin |
|---|---|
| A | D7 |
| B | D8 |
| C | D5 |
| D | D3 |
| E | D4 |
| F | D6 |
| G | D0 |

Put a 220–330 Ω resistor in series on every segment line. Display pin 5
(DP) and pin 10 (would-be segment G if you follow some datasheets' pin
order) are left unconnected — see GPIO budget above.

> **Why not `A0`/`SD1`/`SD2` for anything?** `A0` is analog-input-only on
> ESP8266 (can't drive a segment). `SD1`/`SD2` (and `D9`/`D10`, which are
> the Serial RX/TX pins) are avoided entirely — none of the 9 signals use
> them. `D3`, `D4` and `D8` (GPIO0/2/15) *are* used above — they're
> boot-strapping pins, but a plain resistor+LED load has been fine in
> practice on this build; there's no spare pin to move them to without
> dropping another segment.

**LED strip/module** — a red/green module with one shared "common" wire
plus separate R and G control wires:

| Wire | Pin |
|---|---|
| R | D2 |
| G | D1 |
| common (5V or GND, whichever this module needs) | the ESP8266's own 5V/VIN pin or an external supply — **never** a GPIO pin, it can't source the current a strip needs |
| Blue | not wired (never used, see GPIO budget above) |

Note the R/G pin assignment above is **swapped relative to what you might
expect from the wiring diagrams elsewhere in this repo's history** — on
this specific physical build the module's R and G wires ended up crossed,
so the firmware's `PIN_R`/`PIN_G` constants were swapped to compensate
instead of re-wiring. If you wire a fresh build from scratch, wire it
"normally" (R to whichever pin you call `PIN_R`) and there's no need for
this swap.

**Yellow doesn't mean "both channels on" on this module.** Driving R and G
high at the same time starves both — this module apparently shares one
current-limiting resistor on the common wire, so simultaneous draw drops
the voltage below both LEDs' turn-on threshold and *both go dark* instead
of blending to amber. The firmware works around this by alternating red
and green every 4 ms (250 Hz) when the state is "yellow" — fast enough
that it reads as a steady amber colour, not a visible blink. If you ever
swap in a module that truly supports simultaneous R+G (independent
resistors per channel), you can simplify `updateStripColor()` back to a
plain "set both pins high" — see the git history of this file.

### Display cycle

Every 2 s the ESP8266 advances to the next signal (`O → H → U → d → P →
O...`), showing its letter/digit on the 7-segment and colouring the strip
green / red / fast-alternating-amber to match. If WiFi drops or a poll
fails, the display shows a dash (`-`) and the strip goes to the amber
alternation until it recovers.
