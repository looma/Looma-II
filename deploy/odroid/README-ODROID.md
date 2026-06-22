# Looma on Odroid — disk-as-installer (standalone box)

The external disk is used **only to install**. **After installing, you can remove
the disk** and reuse it on the next box. The install root on the box is
**`/var/www/html`** (the same place the native Looma used).

The installer is one command and handles both cases automatically:
- **Box already running native Looma** (`/var/www/html`): updates content/code/DB
  from the disk, **reuses `/var/www/html/content` in place** (incremental rsync —
  no 80 GB duplicate), **disables the native Apache/MongoDB/Piper**, and switches
  to Docker.
- **Fresh box**: copies the whole project into `/var/www/html` (needs ~90 GB free
  on that filesystem).

Installs:
- **App**: looma-web, looma-db (Mongo), looma-search (zvec), looma-mimic (Piper TTS). `looma-ai` is optional (`--ai`, heavy/torch). App runs with **no resource limits**.
- **Observability** (optional, on by default; trimmed for 8 GB with limits): OpenSearch + Dashboards + Grafana + Prometheus + OTel + Data Prepper + Vector + Metricbeat + topology probe. The Coroot stack stays off (behind a profile).
- **Content/images** copied next to the repo on internal storage and served read-only.
- **Autostart**: systemd at boot + Chromium kiosk on desktop login.

## Box layout after install (install root = /var/www/html)
```
/var/www/html/Looma/        <- repo: compose, Dockerfiles, mongo-dump, looma-ai, …
/var/www/html/content/      <- books, pdfs, images, epaath, …
/var/www/html/voices/       <- mimic voices (needed by the looma-mimic build)
/var/www/html/maps2018/  /mimic/  /piper/  /includes/
/var/www/html/.dockerignore <- keeps the 80 GB content/ out of the build context
```
The Docker build context for `looma-mimic` / `looma-search` is this root (`..`
from the repo), so `voices/` and the `.dockerignore` must live here.

## What travels vs. regenerates

| Travels (copied/baked) | Regenerated on the box |
|---|---|
| App code | OpenSearch log/trace/metric indices |
| MongoDB content (baked into `loomadb` image from `mongo-dump/`) | zvec index (built on first start from Mongo) |
| Content / maps2018 / epaath (copied to internal storage) | trace service maps (after some traffic) |
| 23 Grafana dashboards (baked into the grafana image) | |
| Observability Applications + panels + saved objects (`observability/state/`) | |

## Prerequisites
- Odroid (arm64) with a desktop session, user `odroid`.
  - If the box has NO content yet: **~90 GB free** on the `/var/www/html` filesystem.
  - If it already runs native Looma: only a few GB free (content reused in place).
- Docker Compose **v2.24+** (installer's `get.docker.com` step provides it).
- The disk plugged in, containing this repo with `content/` and `maps2018/` as siblings.

## Install (one command, from the disk)
```bash
sudo /media/odroid/<DISK>/.../Looma/deploy/odroid/install-odroid.sh
```
The installer (auto-detects a previous native install) does:
1. Installs Docker (if missing) and creates an 8 GB swapfile.
2. Copies the project into `/var/www/html` (repo → `/var/www/html/Looma`; `voices/`,
   `maps2018/`, `mimic/`, `piper/`, `.dockerignore`).
3. **Content**: rsync to `/var/www/html/content` **in place** (`--size-only`) — full
   copy on a fresh box, incremental update on a box that already has it.
4. MIGRATE only: **disables native `apache2`/`httpd`/`mongod`/`piper`** AND the native
   **browser kiosk autostart** (e.g. `firefox.startup`) so Docker takes over and you don't
   get a second/blank browser window on login.
5. Creates `loomanet` + `looma_apache_logs`; builds images and starts the stack
   (first build slow on ARM; Mongo restores itself from the disk dump; zvec builds on first start).
6. Installs `looma.service` (boot) + Chromium kiosk autostart.
7. Prints “you can remove the disk”.

> **MIGRATE note:** the Docker MongoDB is restored from the **disk's** `mongo-dump`
> (latest), so DB changes made only on that box are replaced — same behaviour as
> the old `loomaupdate`. Back up first (`mongodump`) if you need them. The native
> code at `/var/www/html/Looma` is left in place but unused.

### Flags
| Flag | Effect |
|---|---|
| `--no-observability` | App only (lightest; recommended if 8 GB is too tight) |
| `--no-ai` | Do NOT run looma-ai — the assistant is **ON by default** |
| `--analysis` | Also run the heavy obs AI analysis workers (separate from the assistant) |
| `--no-kiosk` | Don't auto-open Chromium on login |
| `--no-swap` | Don't create a swapfile |
| `--www PATH` | Install root (default `/var/www/html`) |
| `--user NAME` | Desktop user (default `odroid`) |

## After install
Remove the disk. Reboot to confirm the stack comes up and Chromium opens Looma.

```bash
# manage by hand
/var/www/html/Looma/deploy/odroid/looma-up.sh
/var/www/html/Looma/deploy/odroid/looma-down.sh        # add --volumes to wipe data
sudo systemctl start|stop|status looma.service
docker ps ; docker stats --no-stream ; free -h
```
Toggle observability/AI later: edit `/etc/looma-odroid.env` (`WITH_OBSERVABILITY` / `WITH_AI`) and run `looma-up.sh`.

## Verify
1. `curl -I http://localhost:48080` → 200/302; open a book — PDF + cover load.
2. `curl http://localhost:46333/health` (search; index builds on first start).
3. Grafana `http://localhost:43000`, OS Dashboards `http://localhost:45601` → Observability → Applications.
4. Reboot → stack auto-starts, Chromium opens fullscreen on Looma.

## Tuning / troubleshooting (8 GB)
- **Host OOM / instability**: reinstall with `--no-observability`, or stop observability:
  `cd /var/www/html/Looma/observability && docker compose -f docker-compose.yml -f docker-compose.odroid.yml down`.
- **zvec too heavy**: stop `looma-search`; Looma still serves content, just without semantic search.
- **Content missing**: `cd /var/www/html/Looma && docker compose config | grep -A2 "/usr/local/var/www/content"` — `source:` must be `/var/www/html/content`. Books/PDFs/images are served read-only.
- **Not tested on ARM hardware by the author** — torch (looma-search/looma-ai) and some observability images must resolve arm64; first build is slow.
