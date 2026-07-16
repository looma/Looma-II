# Looma on ODROID — one installer, one script

```bash
sudo /media/odroid/<DISK>/Looma/deploy/odroid/looma-installer.sh
```

With no flags you get a **navigable form** (whiptail, with a plain-text fallback):
each row shows its current value, you pick a row to change it, and nothing happens
until you choose *Review and install*.

```
=== Looma ODROID installer ===
   1) Deployment ............ docker
   2) Install source ........ online (internet)
   3) Observability ......... none
   4) AI assistant (looma-ai) on
   5) Obs analysis workers .. off
   6) Chromium kiosk ........ on
   7) Kiosk URL ............. http://localhost:48080
   8) Swapfile (8G) ......... yes
   9) Install root .......... /var/www/html
  10) Desktop user .......... odroid
  11) ==> Review and install
  12) Quit without changing anything
```

Rows that don't apply are not offered (the zvec row only appears for a native
install; the analysis-workers row only when the full obs stack is on), and the
kiosk URL follows the deployment (`:48080` for Docker, `:8080` for native) until
you set it yourself.

## Commands

| Command | What it does |
|---|---|
| `sudo ./looma-installer.sh` | Interactive form, then install |
| `sudo ./looma-installer.sh install [flags]` | Scripted install — **any flag skips the form** |
| `sudo ./looma-installer.sh up [--build]` | Start the stack (this is what `looma.service` runs at boot) |
| `sudo ./looma-installer.sh down [--volumes]` | Stop it (`--volumes` also **wipes** Mongo/zvec/OpenSearch data) |
| `./looma-installer.sh build-bundle docker\|native\|all` | Build the **offline** payload — run on a build box **with internet, arm64** |
| `./looma-installer.sh --help` | All flags |

### Install flags

| Flag | Effect |
|---|---|
| `--docker` / `--native` | Containers (default), or legacy Apache/PHP 7.4/MongoDB/Piper on the host |
| `--offline` / `--online` | Install from the disk bundle with **no internet**, or from the network |
| `--observability` | Run the full obs stack on this box (OpenSearch/Grafana/traces). **Off by default** — it is the heaviest thing on an 8 GB box |
| `--no-observability` | App only — this is the default |
| `--remote-obs IP` | This box runs only Vector+Metricbeat and ships traces/logs to the obs stack on `IP` (`:4318` OTLP, `:49200` OpenSearch) |
| `--analysis` | Also run the heavy obs AI analysis workers (torch) |
| `--ai` / `--no-ai` | The in-app assistant `looma-ai` — **on by default** |
| `--no-search` | Native only: skip the zvec search service |
| `--no-kiosk` / `--no-swap` | Skip the Chromium kiosk autostart / the 8 GB swapfile |
| `--www PATH` / `--user NAME` / `--kiosk-url URL` | Install root (`/var/www/html`), desktop user (`odroid`), kiosk URL |
| `--bundle-dir PATH` | Where the offline bundle lives (default: next to the script, on the disk). **Use it when the disk is mounted read-only** — build and install with the same `PATH`. |

## What the Docker install does

1. Installs Docker Engine + Compose (from `get.docker.com`, or from the disk bundle when offline) and creates an 8 GB swapfile.
2. Copies the project into the install root: repo → `/var/www/html/Looma`, plus `maps2018/`, `piper/`, `includes/` and the `.dockerignore` that keeps the 80 GB `content/` out of the build context.
3. **Content**: rsync to `/var/www/html/content` **in place** (`--size-only`) — a full copy on a fresh box, an incremental update on a box that already has it, so it never re-copies 80 GB.
4. **Migrating a native box**: disables `apache2`/`httpd`/`mongod`/`piper` **and** the native browser kiosk autostart (e.g. `firefox.startup`), so Docker takes over and you don't get a second, blank browser window on login.
5. Creates `loomanet` + `looma_apache_logs`, builds the images and starts the stack (the first build is slow on ARM; Mongo restores itself from the disk's dump).
6. Builds the **zvec** search index and verifies it, so the box ships with working semantic search.
7. Installs `looma.service` (boot) + the Chromium kiosk autostart, then tells you to remove the disk.

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

## Native install (legacy)

Choose *native* in the form, or `--native`. Apache + PHP 7.4 (mod_php) + MongoDB 5.0
+ Piper + zvec + looma-ai run as systemd services on the host (Ubuntu 20.04 focal
arm64), serving the app on `:8080`. If observability is turned on, the obs **stack**
still runs in Docker, with an override that makes the collector tail the host's
Apache logs.

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
curl -I http://localhost:48080          # app (native: :8080) — expect 200/302
curl http://localhost:46333/health      # search (zvec)
docker ps                               # looma-web, looma-db, looma-search (+ looma-ai)
systemctl is-enabled looma.service      # -> enabled
```

Then Grafana on `:43000`, OpenSearch Dashboards on `:45601`, and a reboot to confirm
the stack auto-starts and Chromium opens Looma fullscreen.

## Troubleshooting (8 GB box)

- **Host OOM / instability**: observability is off by default; if you turned it on, stop the obs stack: `cd /var/www/html/Looma/observability && docker compose -f docker-compose.yml -f docker-compose.odroid.yml down`.
- **zvec too heavy**: stop `looma-search` — Looma still serves content, just without semantic search.
- **`exec format error` after `docker load`**: the offline bundle was built on x86. Rebuild Phase 1 on arm64.
- **Content missing**: `cd /var/www/html/Looma && docker compose config | grep -A2 "/usr/local/var/www/content"` — `source:` must be `/var/www/html/content`.
- The first ARM build is slow, and torch (looma-search/looma-ai) plus some obs images must resolve arm64.
