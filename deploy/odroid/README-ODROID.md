# Looma on ODROID — one installer, one script

Everything the box needs lives in **`looma-installer.sh`**. There is nothing else
to copy or call: the interactive form, the native install, the Docker install, the
offline install, the boot-time start/stop and the offline-bundle builders are all
in that one file.

The **disk is the installer**. Run it from the disk, on the box, as root. When it
finishes the box is standalone — **remove the disk** and reuse it on the next box.

```bash
sudo /media/odroid/<DISK>/Looma/deploy/odroid/looma-installer.sh
```

With no flags you get a **navigable form** (whiptail, with a plain-text fallback):
each row shows its current value, you pick a row to change it, and nothing happens
until you choose *Review and install*.

```
=== Looma ODROID installer ===
   1) Deployment ............ native
   2) Install source ........ online (internet)
   3) Observability ......... none
   4) AI assistant (looma-ai) on
   5) zvec + Piper run ...... in Docker
   6) Search service (zvec) . on
   7) Chromium kiosk ........ on
   8) Kiosk URL ............. http://localhost/home
   9) Swapfile (8G) ......... no
  10) Install root .......... /var/www/html
  11) Desktop user .......... odroid
  12) ==> Review and install
  13) Quit without changing anything
```

Rows that don't apply are not offered: the *zvec + Piper* and *Search service*
rows only appear for a native install; the *Obs analysis workers* row only for a
Docker install with the full obs stack on. The kiosk URL follows the deployment
(`http://localhost/home` for native, `http://localhost:48080/home` for Docker)
until you set it yourself.

## Commands

| Command | What it does |
|---|---|
| `sudo ./looma-installer.sh` | Interactive form, then install |
| `sudo ./looma-installer.sh install [flags]` | Scripted install — **any flag skips the form** |
| `sudo ./looma-installer.sh up [--build]` | Start the stack (this is what `looma.service` runs at boot) |
| `sudo ./looma-installer.sh down [--volumes]` | Stop it (`--volumes` also **wipes** Mongo/zvec/OpenSearch data) |
| `./looma-installer.sh build-bundle docker\|native\|all` | Build the **offline** payload — run on a build box **with internet, arm64** |
| `./looma-installer.sh --help` | All flags |

### Re-installing is always safe

Running the installer again means *"install it again, whatever is on this box"* — it
never stops half-way on leftovers from an earlier run or a hand-started stack. Before
anything is built, both deployments:

- **Free the host ports** they publish (46333, 8089, 47017, 48080, 5002), including
  disabling a leftover native `looma-search`/`looma-ai`/`looma-piper` service. Those
  units are `Restart=always`, so killing the process never sticks — the unit has to be
  disabled, otherwise you get `address already in use` forever.
- **Take back container names** owned by the *other* compose project. Names are global
  to Docker but a project only ever adopts its own containers, so a leftover
  `looma-ai` aborts the install with `Conflict. The container name "/looma-ai" is
  already in use`. Only foreign containers are removed — the stack's own are left for
  Compose to recreate (`looma-db` in particular keeps Mongo in its writable layer).
- **Retry once** after clearing the way, before reporting a real failure.

`down` on the previous deployment now also runs even when `looma.service` was never
installed — a stack you started by hand with `docker compose up` still gets cleaned up.

### Install flags

| Flag | Effect |
|---|---|
| `--native` / `--docker` | **native is the default**: Apache/PHP 7.4/MongoDB on the host, with zvec + Piper as containers. `--docker`: the whole app in containers |
| `--sidecars docker\|host` | Native only: run zvec/Piper as containers (default), or on the host with a venv + systemd units (needs Python ≥ 3.9) |
| `--offline` / `--online` | Install from the disk bundle with **no internet**, or from the network |
| `--observability` | Run the full obs stack on this box (OpenSearch/Grafana/traces). **Off by default** — it is the heaviest thing on an 8 GB box |
| `--no-observability` | App only — this is the default |
| `--remote-obs IP` | This box runs only Vector+Metricbeat and ships traces/logs to the obs stack on `IP` (`:4318` OTLP, `:49200` OpenSearch) |
| `--analysis` | Also run the heavy obs AI analysis workers (torch) |
| `--ai` / `--no-ai` | The in-app assistant `looma-ai` — **on by default** |
| `--no-search` | Native only: skip the zvec search service |
| `--swap` / `--no-swap` | Create the swapfile / skip it. **Off by default** |
| `--swap-gb N` | Swapfile size in GB (default 8). On a re-install with a different N, **replaces** the existing swapfile |
| `--cpu-max-freq kHz` | Cap every CPU's max frequency at boot (default **1500000 = 1.5 GHz**; `0` = leave the CPUs alone). Prevents Piper TTS from browning out / resetting the board |
| `--www PATH` / `--user NAME` / `--kiosk-url URL` | Install root (`/var/www/html`), desktop user (`odroid`), kiosk URL (default: native `:80`, Docker `:48080`) |
| `--no-kiosk` | Skip the Chromium kiosk autostart |
| `--bundle-dir PATH` | Where the offline bundle lives (default: next to the script, on the disk). **Use it when the disk is mounted read-only** — build and install with the same `PATH` |

> **CPU brownout guard:** on this board Piper TTS at full clock draws enough current
> to reset the box mid-synthesis. Both deployments cap the CPU frequency at boot
> (1.5 GHz by default) via an `ExecStartPre` on `looma.service` (Docker) or the
> `looma-cpu-cap.service` (native). Set `--cpu-max-freq 0` only if you know the board
> can take it.

## What the Docker install does

1. Installs Docker Engine + Compose (from `get.docker.com`, or from the disk bundle when offline). A swapfile is created **only if you asked for one** (`--swap`; off by default).
2. Copies the project into the install root: repo → `/var/www/html/Looma`, plus `maps2018/`, `piper/`, `includes/` and the `.dockerignore` that keeps the 80 GB `content/` out of the build context.
3. **Content**: rsync to `/var/www/html/content` **in place** (`--size-only`) — a full copy on a fresh box, an incremental update on a box that already has it, so it never re-copies 80 GB.
4. **Migrating a native box**: disables `apache2`/`httpd`/`mongod`/`piper` and the native `looma-search`/`looma-ai`/`looma-piper` services **and** the native browser kiosk autostart, so Docker takes over and you don't get a second, blank browser window on login. It also brings the `looma-native` sidecar project down and **takes back any container name** it still owns (see *Re-installing is always safe* below).
5. Creates `loomanet` + `looma_apache_logs`, then **frees the app's host ports** and starts the stack (the first build is slow on ARM; Mongo restores itself from the disk's dump).
6. Builds the **zvec** search index and verifies it, so the box ships with working semantic search.
7. Installs `looma.service` (boot start, with the CPU-frequency cap as `ExecStartPre`) + the Chromium kiosk autostart, then tells you to remove the disk.

> **Migration note:** the Docker MongoDB is restored from the **disk's** `mongo-dump`,
> so DB changes made only on that box are replaced — same behaviour as the old
> `loomaupdate`. Back up first (`mongodump`) if you need them.

**Box layout after install** (install root = `/var/www/html`):

```
/var/www/html/Looma/        <- repo: compose, Dockerfiles, mongo-dump, looma-ai, …
/var/www/html/content/      <- books, pdfs, images, epaath, …
/var/www/html/maps2018/  /piper/  /includes/
/var/www/html/.dockerignore <- keeps the 80 GB content/ out of the build context
```

**What travels vs. what regenerates**

| Travels (copied/baked) | Regenerated on the box |
|---|---|
| App code | OpenSearch log/trace/metric indices |
| MongoDB content (baked into `loomadb` from `mongo-dump/`) | zvec index (built at install, rebuilt on demand) |
| Content / maps2018 / epaath | Trace service maps (after some traffic) |
| Grafana dashboards + obs saved objects (`observability/state/`) | |

## Native install (the default)

Choose *native* in the form, or `--native`. Apache + PHP 7.4 (mod_php) + MongoDB 5.0
run as host services on Ubuntu 20.04 (focal) arm64, serving the app on **`:80`**.

The two services the host cannot run well — **zvec search and Piper TTS** (focal's
Python is 3.8, which can't install their requirements) — run as **containers** by
default (`--sidecars docker`), using host networking so they publish 46333 / 5002 /
8089 straight onto the host where Apache/PHP expect them, and reach the host's
MongoDB on `127.0.0.1:27017` without exposing it to the LAN. `looma-ai` runs the
same way when AI is on. `--sidecars host` is the legacy path: it installs a venv +
`looma-search`/`looma-piper`/`looma-ai` systemd units instead (needs Python ≥ 3.9).

A `looma-cpu-cap.service` caps the CPU frequency at boot (the brownout guard above),
and if observability is turned on the obs **stack** still runs in Docker, with an
override that makes the collector tail the host's Apache logs.

## Offline install (no internet at all)

Two phases. **Phase 1** runs once on a machine that has internet and is **arm64**
(same CPU as the odroid — images and .debs are architecture-specific):

```bash
sudo <disk>/Looma/deploy/odroid/looma-installer.sh build-bundle docker
# or: build-bundle native   (Ubuntu 20.04 focal arm64 — .debs, wheels, PHP mongodb.so)
# or: build-bundle all
```

**If the disk is mounted read-only** (very common — `mkdir: Read-only file system`),
the bundle cannot be written to it. Either remount the disk read-write
(`sudo mount -o remount,rw "/media/odroid/<DISK>"`), or keep the bundle elsewhere and
point both commands at it:

```bash
sudo ./looma-installer.sh build-bundle native --bundle-dir /var/lib/looma-bundle
sudo ./looma-installer.sh --native --offline --bundle-dir /var/lib/looma-bundle
```

By default the payload is written onto the disk:

```
deploy/odroid/offline/docker/docker-27.5.1.tgz   # Docker Engine static binaries
deploy/odroid/offline/docker/docker-compose      # Compose v2 plugin
deploy/odroid/offline/images/looma-images.tar    # ALL images (loomaweb, loomadb, opensearch, …)
deploy/odroid/native-bundle/                     # native only: deb/ wheels/ php-ext/ piper/ hf/
```

**Phase 2** — move the disk to the odroid and install, choosing **offline** in the
form (or `--offline`). The installer puts Docker on the box from the bundle,
`docker load`s every image, and starts the stack without building or pulling
anything. `/etc/looma-odroid.env` keeps `OFFLINE=1`, so every reboot stays offline
too (`up` always passes `--pull never`).

TTS is **Piper** only — local and offline, with its English and Nepali voices baked
into the `looma-web` image.

## After install

```bash
# manage by hand (the same script, now at the install root)
/var/www/html/Looma/deploy/odroid/looma-installer.sh up
/var/www/html/Looma/deploy/odroid/looma-installer.sh down     # --volumes also wipes data
sudo systemctl start|stop|status looma.service
docker ps ; docker stats --no-stream ; free -h
```

Toggle observability/AI later: edit `/etc/looma-odroid.env` (`WITH_OBSERVABILITY`,
`WITH_AI`, `WITH_ANALYSIS`, `OFFLINE`) and run `looma-installer.sh up`.

## Verify

```bash
curl -I http://localhost:48080          # Docker app (native: http://localhost/) — expect 200/302
curl http://localhost:46333/health      # search (zvec)
docker ps                               # looma-web, looma-db, looma-search (+ looma-ai)
systemctl is-enabled looma.service      # -> enabled
```

Then Grafana on `:43000`, OpenSearch Dashboards on `:45601`, and a reboot to confirm
the stack auto-starts and Chromium opens Looma fullscreen.

## Troubleshooting (8 GB box)

- **`address already in use` on 46333 (or 8089/47017/48080)**: a leftover native `looma-search`/`looma-ai`/`looma-piper` service is holding the port — and because it has `Restart=always`, `fuser -k` frees it only for a moment before systemd respawns it. `looma-installer.sh up` now disables those services and clears the port automatically; to fix it by hand: `sudo systemctl disable --now looma-search.service looma-ai.service looma-piper.service` (check the holder first with `sudo ss -ltnp 'sport = :46333'`).
- **`getcwd: cannot access parent directories: Input/output error`** / **`rsync: getcwd(): Input/output error (5)`**: the USB disk's mount went stale under your shell (it was re-mounted, or the bus dropped), so the shell's working directory is a dead handle — `sudo` passes it to the installer. Fresh lookups of the same absolute path still work, which is why the script itself runs but `rsync` refuses to start. The installer now steps onto `/` immediately and never uses the caller's directory, so this can't stop an install any more. In your own shell just `cd /`. If it persists, the disk really is failing: `dmesg | tail -30` for USB resets, then re-plug it (or use a powered hub — this board browns out under load and drops the bus).
- **`Conflict. The container name "/looma-ai" is already in use`**: another compose project (the Docker stack vs. the native sidecars, or a hand-run `docker compose up`) still owns the name. The installer now takes it back automatically; by hand: `sudo docker rm -f looma-ai looma-search looma-piper`, then re-run.
- **`WARN volume "looma_ai_data" already exists but was created for project "looma" (expected "looma-native")`**: **harmless** — Compose warns and then reuses the volume, and the install continues. `looma_search_index` / `looma_search_hf` / `looma_ai_data` are deliberately shared by both deployments, so the native sidecar file declares them `external` (Compose skips the ownership check on external volumes) and the installer creates them up front. **Nothing is deleted** — the zvec index and the HF cache survive a docker ↔ native switch.
- **`mongorestore … key too large to index` on `looma.dictionary`**: a pre-existing data issue (a dictionary key exceeds WiredTiger's 1024-byte index limit). Only that one index fails — **the documents are restored** and the install continues, which is why it is a `[warn]`.
- **The board resets during TTS**: the CPU-frequency cap isn't in effect. Re-run with `--cpu-max-freq 1500000` (the default), and confirm `looma.service` / `looma-cpu-cap.service` is enabled.
- **Host OOM / instability**: observability is off by default; if you turned it on, stop the obs stack: `cd /var/www/html/Looma/observability && docker compose -f docker-compose.yml -f docker-compose.odroid.yml down`.
- **zvec too heavy**: stop `looma-search` — Looma still serves content, just without semantic search.
- **`exec format error` after `docker load`**: the offline bundle was built on x86. Rebuild Phase 1 on arm64.
- **Content missing**: `cd /var/www/html/Looma && docker compose config | grep -A2 "/usr/local/var/www/content"` — `source:` must be `/var/www/html/content`.
- The first ARM build is slow, and torch (looma-search/looma-ai) plus some obs images must resolve arm64.
