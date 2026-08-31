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
   2) Observability ......... none
   3) zvec .................. off  (search + AI + exams)
   4) zvec deploy ........... (turn zvec on first)
   5) piper deploy .......... on the host
   6) Chromium kiosk ........ on
   7) Kiosk URL ............. http://localhost/home
   8) Swapfile (8G) ......... yes
   9) CPU max freq .......... 1800 MHz, capped at boot
  10) Install root .......... /var/www/html
  11) Desktop user .......... odroid
  12) ==> Review and install
  13) Quit without changing anything
```

The **defaults** shown above are what a box gets when nothing is chosen: zvec
**off**, Piper **on the host**, CPUs capped at **1800 MHz**.

Rows that don't apply are not offered: the *zvec deploy* and *piper deploy*
rows only appear for a native install; the *Obs analysis workers* row only for a
Docker install with the full obs stack on. The kiosk URL follows the deployment
(`http://localhost/home` for native, `http://localhost:48080/home` for Docker)
until you set it yourself.

## Installing a box, step by step

### 1. Prepare the disk (once, on a workstation)

The disk carries the repo, `content/`, and — if these boxes are to have semantic
search — the **prebuilt search index**, which is what keeps the install to minutes
instead of hours:

```bash
# only if the boxes will be installed with --search
./deploy/odroid/build-search-artifacts.sh
#   -> writes search-index/ (~500 MB) and mongo-dump/dump/ into the repo
```

Then copy the whole project tree to the disk, keeping the layout — the installer
reads `Dockerfile.piper` and `content/` from **one level above** the repo:

```
<DISK>/Looma/                 <- content/, maps2018/, Dockerfile.piper, docker-compose.yml
<DISK>/Looma/Looma/           <- the repo: the installer, search-index/, mongo-dump/
```

For a box with **no internet at all**, also build the offline payload — on an
**arm64** machine, since images and .debs are architecture-specific (see
*Offline install* below).

### 2. Run the installer on the box

Plug the disk in, open a terminal on the odroid, and run it **as root, from the
disk**:

```bash
sudo "/media/odroid/<DISK>/Looma/Looma/deploy/odroid/looma-installer.sh"
```

No flags gets you the form. Nothing is touched until you choose *Review and
install*, so it is safe to look around first.

### 3. Choose what this box is

The three that matter, and what they cost:

| Row | Default | Change it when |
|---|---|---|
| **Deployment** | native | `docker` puts everything in containers — heavier, but identical on every box |
| **zvec** | **off** | Turn it **on** for semantic search, the AI Assistant and exam generation. It is the heaviest part of Looma; with the prebuilt index on the disk it still installs in minutes |
| **piper deploy** | **on the host** | Leave it. `docker` works too, but adds a container to the audio path for no gain |
| **CPU max freq** | 1800 MHz | Drop to **1500** if the board resets mid-sentence during TTS |

Scripted equivalent, no form:

```bash
sudo ./looma-installer.sh install --native --search          # with semantic search
sudo ./looma-installer.sh install --native                   # app + TTS only
sudo ./looma-installer.sh install --native --search --ingest-exclude "W4S W4S2013"
```

### 4. Wait — and know what is slow and why

The install prints each step. The two that take real time:

- **The first build on ARM is slow.** Docker deployment only; the native one
  installs packages instead.
- **The search index.** With `search-index/` on the disk you will see
  `installed the prebuilt search index into … (502M)` and the box is ready in
  seconds. **Without** it, the box reads every file under `content/` and embeds
  it — hours on this hardware, and the installer gives up waiting after 30
  minutes and warns. If you see that warning, the disk was missing the artifacts.

### 5. Check it works, then remove the disk

`verify` runs automatically at the end and prints a green/red list. Re-run it any
time:

```bash
sudo ./looma-installer.sh verify
```

When it passes, **remove the disk** — the box is standalone — and reuse it on the
next one.

## Commands

| Command | What it does |
|---|---|
| `sudo ./looma-installer.sh` | Interactive form, then install |
| `sudo ./looma-installer.sh install [flags]` | Scripted install — **any flag skips the form** |
| `sudo ./looma-installer.sh up [--build]` | Start the stack (this is what `looma.service` runs at boot). **Docker deployment only** — on a box whose `/etc/looma-odroid.env` says `DEPLOY=native` it refuses, and disables the stray `looma.service` that called it |
| `sudo ./looma-installer.sh down [--volumes]` | Stop it (`--volumes` also **wipes** Mongo/zvec/OpenSearch data). Same native guard as `up` |
| `sudo ./looma-installer.sh verify` | Check that the box **works**: app answers, content is present *and* reachable over HTTP, and TTS really speaks English + Nepali (printing its latency), and the **right autostart unit for this deployment** is enabled so it still works after a reboot. Runs automatically at the end of every install; exits non-zero if anything failed |
| `sudo ./diagnose-piper.sh [--fix]` | Walk the whole TTS chain (`browser → looma-TTS.php → :5002 → piper binary + voices`) and print which link is broken, including *what switched Piper off at boot*. `--fix` flips the systemd units back and re-tests |
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
| `--native` / `--docker` | **native is the default**: Apache/PHP 7.4/MongoDB on the host, Piper on the host, and the semantic stack (if installed) as containers. `--docker`: the whole app in containers |
| `--sidecars docker\|host` | Native only: run the semantic stack as containers (default), or on the host with a venv + systemd units (needs Python ≥ 3.9) |
| `--piper docker\|host` | Native only: where Piper TTS runs. **`host` is the default** — the binary plus a systemd unit, no Docker in the audio path. `docker` builds the small `Dockerfile.piper` image (~1 GB), never the 34 GB web image |
| `--offline` / `--online` | Install from the disk bundle with **no internet**, or from the network |
| `--observability` | Run the full obs stack on this box (OpenSearch/Grafana/traces). **Off by default** — it is the heaviest thing on an 8 GB box |
| `--no-observability` | App only — this is the default |
| `--remote-obs IP` | This box runs only Vector+Metricbeat and ships traces/logs to the obs stack on `IP` (`:4318` OTLP, `:49200` OpenSearch) |
| `--analysis` | Also run the heavy obs AI analysis workers (torch) |
| `--ai` / `--no-ai` | Obsolete, accepted and ignored: the assistant is part of the semantic stack (`--search`) |
| `--search` | Install the **zvec stack** — semantic search, the AI Assistant and exam generation. **Off by default**: it is the heaviest part of Looma (torch + an index over the whole curriculum) |
| `--no-search` | Leave the semantic stack out — **this is the default**; the app hides all three features |
| `--ingest-exclude "A B"` | Content folders to leave **out** of the search index. With zvec on, the install indexes **all** of `content/` (chapters as HTML only) — the Wikipedia trees are ~93% of the indexable files, so `--ingest-exclude "W4S W4S2013"` is the usual way to keep a small box's ingest and index rebuilds short |
| `--swap` / `--no-swap` | Create the swapfile / skip it. **On by default** — 8 GB of RAM is tight once Piper's voice models stay resident, and without swap the OOM killer takes out a service mid-lesson |
| `--swap-gb N` | Swapfile size in GB (default 8). On a re-install with a different N, **replaces** the existing swapfile |
| `--cpu-max-freq kHz` | Cap every CPU's max frequency at boot (default **1800000 = 1.8 GHz**; `0` = leave the CPUs alone). **1500000 is the value confirmed on real hardware** to stop Piper TTS browning out / resetting the board — the 1.8 GHz default trades some of that protection for speed, so set it back to 1500000 on a board that resets |
| `--www PATH` / `--user NAME` / `--kiosk-url URL` | Install root (`/var/www/html`), desktop user (`odroid`), kiosk URL (default: native `:80`, Docker `:48080`) |
| `--no-kiosk` | Skip the Chromium kiosk autostart |
| `--bundle-dir PATH` | Where the offline bundle lives (default: next to the script, on the disk). **Use it when the disk is mounted read-only** — build and install with the same `PATH` |

> **CPU brownout guard:** on this board Piper TTS at full clock draws enough current
> to reset the box mid-synthesis. Both deployments cap the CPU frequency at boot
> (1.8 GHz by default) via an `ExecStartPre` on `looma.service` (Docker) or the
> `looma-cpu-cap.service` (native). Set `--cpu-max-freq 0` only if you know the board
> can take it.

## What the Docker install does

1. Installs Docker Engine + Compose (from `get.docker.com`, or from the disk bundle when offline). An 8 GB swapfile is created **by default** (`--no-swap` skips it; a box that already has swap of its own is left alone).
2. Copies the project into the install root: repo → `/var/www/html/Looma`, plus `maps2018/`, `piper/`, `includes/` and the `.dockerignore` that keeps the 80 GB `content/` out of the build context.
3. **Content**: rsync to `/var/www/html/content` **in place** (`--size-only`) — a full copy on a fresh box, an incremental update on a box that already has it, so it never re-copies 80 GB.
4. **Migrating a native box**: disables `apache2`/`httpd`/`mongod`/`piper` and the native `looma-search`/`looma-ai`/`looma-piper` services **and** the native browser kiosk autostart, so Docker takes over and you don't get a second, blank browser window on login. It also brings the `looma-native` sidecar project down and **takes back any container name** it still owns (see *Re-installing is always safe* below).
5. Creates `loomanet` + `looma_apache_logs`, then **frees the app's host ports** and starts the stack (the first build is slow on ARM; Mongo restores itself from the disk's dump).
6. **Installs the prebuilt search index** if the disk carries one (`search-index/`, built by `build-search-artifacts.sh` — see below), so the box comes up searchable in seconds. Otherwise it falls back to **ingesting the content and building the index on the box**, then verifies it either way, so a box never ships with an empty index. With zvec on, this reads **every top-level folder** under `content/` — encyclopedias, dictionaries, lessons, teacher tools, subtitles, the lot. The **chapters go in as HTML only**: each one ships as a `.pdf` and the `.html` generated from it, the app opens the HTML, and indexing both would return one lesson twice with the worse text of the two. Skipped only with `--no-search` (no zvec at all) or trimmed with `--ingest-exclude`.
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
| MongoDB content (baked into `loomadb` from `mongo-dump/`) | zvec index — **only when the disk has no `search-index/`** |
| Content / maps2018 / epaath | Trace service maps (after some traffic) |
| **zvec search index (`search-index/`)** | |
| Grafana dashboards + obs saved objects (`observability/state/`) | |

### Prebuilding the search index (`build-search-artifacts.sh`)

The install has two expensive halves, and **neither has to run on the box**:
reading ~96k content files to pull their text out, and embedding that text into
384-dim vectors. Both produce artifacts that travel — the text is MongoDB
documents, the index is a float32 matrix plus its metadata — so build them once
on a workstation:

```bash
./deploy/odroid/build-search-artifacts.sh                        # everything
./deploy/odroid/build-search-artifacts.sh --exclude "W4S W4S2013"  # without the Wikipedia trees
```

It ingests the content with the **same arguments the installer would use** (all of
`content/`, chapters as HTML only), rebuilds the index, and writes
`mongo-dump/dump/` and `search-index/` into the repo. Every box installed from
that disk then loads the index instead of building it — seconds instead of a full
embed of the corpus on an ARM CPU, and no exposure to the OOM killer that the
native unit caps `OMP_NUM_THREADS=1` to avoid.

`search_service.py` re-validates the artifact on load (index format, embedding
backend, model name). A mismatch — a box that fell back to the hashing backend
because torch would not install, say — is **rejected**, and that box ingests and
builds for itself exactly as before. The prebuilt index can only make an install
faster, never wrong.

## Native install (the default)

Choose *native* in the form, or `--native`. Apache + PHP 7.4 (mod_php) + MongoDB 5.0
run as host services on Ubuntu 20.04 (focal) arm64, serving the app on **`:80`**.

**Piper TTS runs on the host by default** (`--piper host`): the binary plus a
`looma-piper` systemd unit, no Docker in the audio path. `--piper docker` runs it as
a container instead, built from `Dockerfile.piper` — a ~1 GB image with just the
binary, the voices and the Flask wrapper. (It used to run the 34 GB `looma-web`
image with `piper_server.py` as its command, which on a real board meant building
torch and the HuggingFace models to say a sentence out loud; the build never
finished, so the container never existed and pressing *Speak* did nothing. If the
disk has no `Dockerfile.piper`, the installer says so and falls back to Piper on the
host rather than leaving the box mute.)

**The semantic stack** — the search service and `looma-ai` — runs as **containers** by
default when it is installed at all (`--sidecars docker`), because focal's Python
3.8 cannot install torch. Host networking means they publish 46333 / 8089 straight
onto the host where Apache/PHP expect them, and reach the host's MongoDB on
`127.0.0.1:27017` without exposing it to the LAN. `--sidecars host` is the legacy
path: a venv + `looma-search`/`looma-ai` systemd units instead (needs Python ≥ 3.9).

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

TTS is **Piper** only — local and offline. The voices travel three ways, so an
offline box always has them: baked into the `looma-web` image (Docker deployment),
in the `looma-piper` image the bundle now carries (native + `--piper docker`), and
in `native-bundle/piper/` for the default native install.

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

The install ends by checking itself, and you can re-run the same checks whenever
you want:

```bash
sudo ./looma-installer.sh verify
```

It reports `[ ok ] / [warn] / [FAIL]` per check — the app, the content (on disk
**and** served over `/content`), maps2018, ePaath, Piper's health, how many
English/Nepali voices the Reading Settings page will offer, and one real
synthesis in each language **with its latency** (a warning if a sentence takes
more than ~2 s, which means the warm voices are not working). A `[FAIL]` line
always names the command that shows why.

### Health endpoints

| Service | Endpoint | Port |
|---|---|---|
| App (native) | `http://localhost/home` | 80 |
| App (Docker) | `http://localhost:48080/home` | 48080 |
| Piper TTS | `http://127.0.0.1:5002/health` | 5002 |
| zvec search | `http://127.0.0.1:46333/health` | 46333 |
| looma-ai (assistant/exams) | `http://127.0.0.1:8089/health` | 8089 |

```bash
curl -I http://localhost:48080          # Docker app (native: http://localhost/) — expect 200/302
curl -s http://127.0.0.1:46333/health   # search (zvec)
curl -s http://127.0.0.1:5002/health    # Piper TTS — must include the voices, en + ne
docker ps                               # looma-web, looma-db, looma-search (+ looma-ai)
```

**Autostart — check the unit that belongs to *your* deployment.** They are not
interchangeable, and mixing them up is what makes a box go mute overnight:

```bash
# Docker deployment:
systemctl is-enabled looma.service        # -> enabled

# Native deployment: looma.service must be OFF (see the note below); each
# service autostarts on its own instead.
systemctl is-enabled looma.service        # -> disabled  (or not installed)
systemctl is-enabled apache2 mongod looma-piper   # -> enabled enabled enabled
```

> **Never `systemctl enable looma.service` on a native box.** `looma.service` runs
> `looma-installer.sh up`, the **Docker** deployment's boot command, and `up`'s
> first job is to clear the host services off the ports the containers want — so
> it disables `looma-piper` (and `looma-search`, `looma-ai`) about a minute after
> systemd started them. `disable` beats the unit's own `Restart=always`, so the
> board comes up **mute** and the journal shows a Piper that started perfectly and
> was then stopped by nobody in particular. `up`/`down` now refuse to run on a box
> whose `/etc/looma-odroid.env` says `DEPLOY=native`, and disable the stray unit
> themselves — but on a box installed before that, fix it with
> `sudo systemctl disable --now looma.service && sudo systemctl enable --now looma-piper`.

> **"Up" is not "working" — check `doc_count`.** The search service answers
> `/health` perfectly happily with an EMPTY index, and then every classroom search
> returns nothing:
>
> ```bash
> curl -s http://127.0.0.1:46333/health | grep -o '"doc_count":[0-9]*'
> ```
>
> A box installed from a disk with the prebuilt index reports the same number the
> artifact was built with (e.g. `315175`). `0` means the index is not there.
> **While a rebuild is running, `doc_count` keeps reporting the OLD value** and
> search returns nothing — so a number that never changes during a rebuild is not
> proof of anything. Rebuild by hand (hours on this hardware — prefer the prebuilt
> index) with `curl -X POST http://127.0.0.1:46333/rebuild`.

The Piper equivalent of "answers but says nothing" is worth testing directly:

```bash
curl -s -X POST http://127.0.0.1:5002/tts -H "Content-Type: application/json"      -d '{"text":"Looma speaks","lang":"en"}' -o /tmp/t.wav && file /tmp/t.wav
#   -> RIFF (little-endian) data, WAVE audio
```

Then Grafana on `:43000`, OpenSearch Dashboards on `:45601`, and a reboot to confirm
the stack auto-starts and Chromium opens Looma fullscreen.

## Tuning: TTS latency and search timeouts

This board synthesizes speech **slower than real time**, so the numbers below are
about how long a teacher waits, not about audio quality.

**What already ships tuned.** Piper keeps its voice models warm
(`LOOMA_PIPER_PREWARM=1`, `MAX_WORKERS=3`), appends 0.05 s of silence per sentence
instead of Piper's own 0.2 s (measured 357 ms → 318 ms per sentence), and the app
cuts only the FIRST segment of a reading at a clause boundary so sound starts after
part of a sentence rather than all of it — measured **413 ms → 255 ms** to first
audio on x86, and the same proportion applies here.

**The voices installed are the FASTEST tier only** — 8 models, ~450 MB, 25 rows
on the Reading Settings page. Quality is a speed choice on this hardware, so the
box ships with the fast ones and the page labels what they are: `x_low` =
*fastest*, `low` = *fast*.

Note what "fastest tier" means per language, because it is not symmetric: piper
publishes exactly **one** `x_low` model and it is Nepali (`ne_NP-google-x_low`,
which carries 18 speakers). **English has no `x_low` at all**, so its fastest tier
is `low` — alan, southern_english_female, amy, danny, kathleen, lessac and ryan.

`medium` and `high` exist upstream (25 and 5 English models, 2 more Nepali) and
are deliberately left out: `medium` measured ~1.4x slower than `x_low` on the same
sentence, and this board already synthesizes slower than real time. To offer them,
add their paths to the `PIPER_EXTRA_VOICES` build arg — the page lists whatever is
in the voice directory and labels the quality itself, so nothing else changes.

**The one knob worth touching: the Nepali voice.** `ne_NP-google-medium` measured
**400 ms** against **285 ms** for `ne_NP-google-x_low` — 1.4× — on the same text.
Both are installed; the choice is on the Reading Settings page, and the server's
own default is already `x_low`.

| Variable | Default | Effect |
|---|---|---|
| `LOOMA_PIPER_SENTENCE_SILENCE` | `0.05` | Silence appended per sentence. It is synthesized like any other audio, so it costs latency *and* dead air |
| `LOOMA_PIPER_MAX_WORKERS` | `3` | Warm (voice, speed) pairs kept resident. Each holds a model in RAM |
| `LOOMA_PIPER_PREWARM` | `1` | Load the default voices at startup so the first press is not the slow one |
| `LOOMA_PIPER_MAX_SPEAKERS` | `24` | Voices a single multi-speaker model may contribute to the Reading Settings list |
| `LOOMA_SEARCH_TIMEOUT` | `20` | Seconds the app waits for the zvec service. **On timeout the search silently falls back to a lexical one** — it looks like it worked, it just stopped being semantic. The old flat 4 s was below what this board needs |

Three things measured and ruled out, so nobody spends a day on them again:

- **Parallel workers buy nothing.** Piper already uses all cores for a single
  synthesis — 3 parallel requests were 1.1× faster than 3 sequential, not 3×.
- **Piper v1.2.0 exposes no thread-count option.**
- **Streaming (`--output_raw`) does not start the audio sooner.** Piper emits per
  SENTENCE, not progressively within one: a long sentence produced its first byte
  at 0.36 s and its last at 0.37 s. Since Looma already sends one sentence per
  request, the floor stays "inference time of the first sentence". Feeding a
  player live would be worse than useless here — the board synthesizes slower than
  real time, so playback would start early and then run dry mid-sentence.

## Troubleshooting (8 GB box)

- **`address already in use` on 46333 (or 8089/47017/48080)**: a leftover native `looma-search`/`looma-ai`/`looma-piper` service is holding the port — and because it has `Restart=always`, `fuser -k` frees it only for a moment before systemd respawns it. `looma-installer.sh up` now disables those services and clears the port automatically; to fix it by hand: `sudo systemctl disable --now looma-search.service looma-ai.service looma-piper.service` (check the holder first with `sudo ss -ltnp 'sport = :46333'`).
- **`getcwd: cannot access parent directories: Input/output error`** / **`rsync: getcwd(): Input/output error (5)`**: the USB disk's mount went stale under your shell (it was re-mounted, or the bus dropped), so the shell's working directory is a dead handle — `sudo` passes it to the installer. Fresh lookups of the same absolute path still work, which is why the script itself runs but `rsync` refuses to start. The installer now steps onto `/` immediately and never uses the caller's directory, so this can't stop an install any more. In your own shell just `cd /`. If it persists, the disk really is failing: `dmesg | tail -30` for USB resets, then re-plug it (or use a powered hub — this board browns out under load and drops the bus).
- **`Conflict. The container name "/looma-ai" is already in use`**: another compose project (the Docker stack vs. the native sidecars, or a hand-run `docker compose up`) still owns the name. The installer now takes it back automatically; by hand: `sudo docker rm -f looma-ai looma-search looma-piper`, then re-run.
- **`WARN volume "looma_ai_data" already exists but was created for project "looma" (expected "looma-native")`**: **harmless** — Compose warns and then reuses the volume, and the install continues. `looma_search_index` / `looma_search_hf` / `looma_ai_data` are deliberately shared by both deployments, so the native sidecar file declares them `external` (Compose skips the ownership check on external volumes) and the installer creates them up front. **Nothing is deleted** — the zvec index and the HF cache survive a docker ↔ native switch.
- **`trying to overwrite '/usr/bin/bsondump', which is also in package mongo-tools`** while apt installs `mongodb-org`: Ubuntu's **`mongo-tools`** (note the name — `mongo-tools`, not `mongodb-tools`) is still installed and owns the same binaries as `mongodb-database-tools`. It is a *dependency* of `mongodb-clients`, so purging the MongoDB packages does not take it with them. The whole apt transaction fails at unpack, leaving packages unpacked-but-unconfigured. Fixed in the installer's purge list; by hand: `sudo apt-get purge -y mongo-tools && sudo dpkg --configure -a && sudo apt-get -f install`, then re-run the installer.
- **`no reachable servers` / nothing listening on 27017 after installing MongoDB**: `mongod` did not start. Two causes on these boards, and the client-side message is identical for both — look at `systemctl status mongod` and `sudo tail -40 /var/log/mongodb/mongod.log`.
  1. **`Illegal instruction` / `status=4/SIGILL`**: **MongoDB 5.0+ requires ARMv8.2-A**, and the ODROID-N2/N2+ (Cortex-A73 + A53) is ARMv8.0-A. Check with `grep -qw asimdhp /proc/cpuinfo` — no output means the board is affected. **4.4 is the ceiling** there, and that is fine: wire version 9, well above pymongo's 4.2 cutoff. The installer now detects this and picks 4.4 automatically; force it by hand with `sudo MONGO_SERIES=4.4 ./looma-installer.sh install --native`.
  2. **`Failed to start up WiredTiger under any compatibility version` / `Terminating. reason: "95: Operation not supported"` (exit `status=14`)**: `/var/lib/mongodb` still holds data files written by an older MongoDB, and WiredTiger cannot read them across that many series. `systemctl status` shows only a bare `status=14` — the real message is in `/var/log/mongodb/mongod.log`, because mongod logs the failure *after* it opens its log file. The installer now moves the directory to `/var/lib/mongodb.incompatible-<timestamp>` and starts clean (the repo dump is restored on top); by hand: `sudo systemctl stop mongod && sudo mv /var/lib/mongodb /var/lib/mongodb.old && sudo mkdir -p /var/lib/mongodb && sudo chown -R mongodb:mongodb /var/lib/mongodb && sudo systemctl start mongod`.
  3. **`Unable to create/open the lock file … Permission denied`**: `/var/lib/mongodb` was left behind by a previous MongoDB and is owned by a uid the new `mongodb` user doesn't have. `sudo chown -R mongodb:mongodb /var/lib/mongodb /var/log/mongodb && sudo systemctl restart mongod`.
- **`pymongo.errors.ConfigurationError: Server at 127.0.0.1:27017 reports wire version 6, but this version of PyMongo requires at least 8`** (native install): the box is running **MongoDB 3.6** — focal's own `mongodb-server` package, kept from a pre-existing native Looma. `pymongo` 4.x, which both `looma-ai` and the search service use, refuses to talk to anything older than 4.2. Two things break, and **only the first one is visible**: the chapter ingestion prints this traceback, and the **zvec index silently builds empty** (`POST /rebuild` returns 202 immediately and does the work in a background thread, so the installer's `curl` succeeds either way — check `curl -s http://127.0.0.1:46333/health` and look at `doc_count`). The installer now detects a MongoDB older than 5.0 in step 1 and replaces it with `mongodb-org` (dumping the old database to `/var/backups/looma-mongo<N>-<timestamp>` first, since 3.6's files cannot be read by 5.0), so re-running the installer fixes a box that is already in this state.
- **`mongorestore … key too large to index` on `looma.dictionary`**: a pre-existing data issue (a dictionary key exceeds WiredTiger's 1024-byte index limit). Only that one index fails — **the documents are restored** and the install continues, which is why it is a `[warn]`.
- **TTS worked, then the box came up mute after a reboot** (`looma-piper.service: inactive (disabled)`, nothing on `:5002`, and the journal shows it starting cleanly at boot and being stopped a minute later): a **`looma.service` left enabled on a native box**. It runs `looma-installer.sh up` at boot, and `up` clears the host services off the container ports — so it disables `looma-piper`, `looma-search` and `looma-ai`, and `disable` survives the unit's `Restart=always`. Two things used to lead here: `verify` printing *"looma.service is NOT enabled — Looma will not start at boot"* on a native box (it now reports the right unit per deployment, and treats an enabled `looma.service` on native as a **failure**), and switching a box from Docker to native. Fixed in the installer — `up`/`down` refuse on `DEPLOY=native` and disable the stray unit, and every install now asserts the boot path before it finishes. On a box already in this state:
  ```bash
  sudo ./diagnose-piper.sh --fix      # names the cause, flips the units back, re-tests
  # or by hand:
  sudo systemctl disable --now looma.service
  sudo systemctl enable  --now looma-piper.service
  ```
- **The board resets during TTS**: the CPU-frequency cap isn't in effect. Re-run with `--cpu-max-freq 1500000` (the default), and confirm `looma-cpu-cap.service` (native) or `looma.service` (Docker) is enabled.
- **Host OOM / instability**: observability is off by default; if you turned it on, stop the obs stack: `cd /var/www/html/Looma/observability && docker compose -f docker-compose.yml -f docker-compose.odroid.yml down`.
- **zvec too heavy**: stop `looma-search` — Looma still serves content, just without semantic search.
- **`exec format error` after `docker load`**: the offline bundle was built on x86. Rebuild Phase 1 on arm64.
- **Content missing**: `cd /var/www/html/Looma && docker compose config | grep -A2 "/usr/local/var/www/content"` — `source:` must be `/var/www/html/content`.
- The first ARM build is slow, and torch (looma-search/looma-ai) plus some obs images must resolve arm64.
