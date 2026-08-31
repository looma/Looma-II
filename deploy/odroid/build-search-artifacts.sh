#!/usr/bin/env bash
# Build the search artifacts HERE, on a fast machine, so the box never has to.
#
# The install has two expensive halves, and neither of them has to happen on an
# ODROID:
#
#   1. READING the content — opening ~96k files, pulling the text out of PDFs and
#      stripping the HTML. IO- and CPU-bound, and the box's content lives on the
#      same slow disk it is installing from.
#   2. EMBEDDING it — one 384-dim vector per document through all-MiniLM-L6-v2.
#      This is the one the native unit has to cap to OMP_NUM_THREADS=1 to keep
#      the OOM killer from taking it out halfway through.
#
# Both produce artifacts that travel: the extracted text is Mongo documents (the
# install already restores mongo-dump/), and the index is a float32 matrix plus
# its metadata (search_service.py loads it from INDEX_DIR instead of rebuilding).
# So run this once on a workstation, and every box installed from the resulting
# disk comes up with a working index in seconds.
#
# It runs against the DEV compose stack (looma-db + looma-ai + looma-search) and
# writes into the repo:
#
#   mongo-dump/dump/     <- the database, now including the ingested content text
#   search-index/        <- index_meta.json + dense.npy
#
# The installer picks both up on its own; there is no flag to remember.
#
#   ./deploy/odroid/build-search-artifacts.sh
#   ./deploy/odroid/build-search-artifacts.sh --exclude "W4S W4S2013"
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$SCRIPT_DIR/../.." && pwd)"

EXCLUDE=""
# INDEX WHAT SHIPS. The installer rsyncs the disk's content/ to the box, so that
# is the tree to read — NOT looma-ai's looma_content volume, which is a dev copy
# that drifts from it (an extra folder here is an index entry pointing at a file
# no box will have). Same default as the compose override: content/ next to the
# repo. The ingest runs in a throwaway container with this bind-mounted, rather
# than `docker exec looma-ai`, for the same reason.
CONTENT_DIR="${LOOMA_CONTENT_DIR:-$(cd "$REPO/.." && pwd)/content}"
SEARCH_URL="http://127.0.0.1:46333"
NETWORK="loomanet"

log()  { printf '\033[1;32m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m!!\033[0m %s\n' "$*" >&2; }
die()  { printf '\033[1;31mXX\033[0m %s\n' "$*" >&2; exit 1; }

while [ $# -gt 0 ]; do
  case "$1" in
    --exclude)     EXCLUDE="${2:-}"; shift 2;;
    --content-dir) CONTENT_DIR="${2:-}"; shift 2;;
    --search-url)  SEARCH_URL="${2:-}"; shift 2;;
    --network)     NETWORK="${2:-}"; shift 2;;
    -h|--help)
      sed -n '2,30p' "$0" | sed 's/^# \{0,1\}//'
      exit 0;;
    *) die "unknown argument: $1";;
  esac
done

cd "$REPO"

command -v docker >/dev/null 2>&1 || die "docker is not on PATH"

# The two services are behind compose profiles (they are off by default on an
# 8 GB box), so ask for them explicitly.
compose() { docker compose --profile ai --profile search "$@"; }

[ -d "$CONTENT_DIR" ] || die "content not found at $CONTENT_DIR (pass --content-dir)"

# How much of each document ends up embedded. The compose reads it; it is set
# here so the number that shaped a shipped index is visible in the build log
# next to the index it produced.
export LOOMA_SEARCH_MAX_CHUNKS="${LOOMA_SEARCH_MAX_CHUNKS:-4}"

# THIS machine is the fast one -- that is the entire premise of this script -- so
# let the embed use its cores. The service defaults every thread pool to 1 for
# the board's sake; here that turns a one-off build into an overnight one.
export LOOMA_SEARCH_THREADS="${LOOMA_SEARCH_THREADS:-$(nproc 2>/dev/null || echo 4)}"

# looma-ai only has to be up for the model/deps image to exist; the ingest itself
# runs as a throwaway container off that image. looma-search does the embedding.
log "starting looma-db and looma-search…"
log "  embedding windows per document: $LOOMA_SEARCH_MAX_CHUNKS"
log "  embedding threads:              $LOOMA_SEARCH_THREADS"
compose up -d looma-db looma-search

log "waiting for looma-search to answer…"
n=0
until curl -fsS --max-time 5 "$SEARCH_URL/health" >/dev/null 2>&1; do
  n=$((n+1)); [ "$n" -gt 60 ] && die "looma-search never came up — docker logs looma-search"
  sleep 5
done

# --- 1. content -> mongo ----------------------------------------------------
# The SAME arguments the installer uses, so what ships is what a box would have
# built for itself: everything under content/, with the chapters as HTML only.
#
# The PDF depth defaults live in the ingester (40 pages / 60k chars) rather than
# here, so a box that has to ingest for itself reads exactly as deep as this
# does. Reading is the half that touches every file on the drive; re-embedding
# what is already in Mongo is cheap, so it is read deep once and embedded to
# whatever SEARCH_MAX_CHUNKS_PER_DOC asks for.
args="--all --html-only chapters --exclude _downloads --exclude _reports"
for x in $EXCLUDE; do args="$args --exclude $x"; done

log "ingesting the content into mongo (the slow half — it reads every file)"
log "  from: $CONTENT_DIR"
log "  args: $args"
docker run --rm --network "$NETWORK" \
  -v "$CONTENT_DIR":/content:ro \
  -v "$REPO/looma-ai/scripts":/app/scripts:ro \
  -e LOOMA_MONGO_URL=mongodb://looma-db:27017 \
  -e LOOMA_MONGO_DB=looma \
  -e LOOMA_MONGO_COLLECTION=activities \
  looma-ai:latest \
  python scripts/ingest_bulk_content_to_mongo.py --content-root /content $args \
  || die "the ingest failed"

# --- 2. mongo -> embeddings -------------------------------------------------
doc_count() {  # the count the service is currently SERVING
  curl -fsS --max-time 10 "$SEARCH_URL/health" 2>/dev/null \
    | sed -n 's/.*"doc_count":[[:space:]]*\([0-9]*\).*/\1/p'
}

# Remember what it serves BEFORE asking for a rebuild. /rebuild returns 202 and
# builds in a background thread, and — this is the trap — a service that already
# has an index keeps serving the OLD count the whole time. So "doc_count is not
# zero" does NOT mean the build finished: on any re-run it is true one second
# after the POST, and the export then copies the PREVIOUS index. The count
# CHANGING is the only honest completion signal (the box's installer can use the
# simpler test only because it runs against a service with no index yet).
before="$(doc_count)"
log "building the search index… (currently serving ${before:-0} documents)"
curl -fsS -X POST --max-time 60 "$SEARCH_URL/rebuild" >/dev/null \
  || die "looma-search refused the rebuild — docker logs looma-search"

log "waiting for the index to finish (embedding every document — this is slow)…"
n=0
while :; do
  now="$(doc_count)"
  if [ -n "$now" ] && [ "$now" != "0" ] && [ "$now" != "$before" ]; then
    log "index built: $now documents (was ${before:-0})"
    break
  fi
  n=$((n+1))
  # 6 hours, not 3: the index now embeds several windows per text-bearing
  # document, so there is materially more work than when this guard was written.
  # Dying early here is expensive -- the build keeps running inside the container
  # but nothing exports it, so the whole wait is wasted.
  [ "$n" -gt 2160 ] && die "the index did not finish in 6 hours — docker logs looma-search"
  # a progress line every 5 minutes, so a long build does not look like a hang
  [ $((n % 30)) -eq 0 ] && log "  still building… ($((n / 6)) min elapsed, still serving ${now:-?})"
  sleep 10
done

# --- 3. export --------------------------------------------------------------
# The index files come out of the container's INDEX_DIR. Copy the vectors first
# and the metadata last, for the same reason the installer does: index_meta.json
# is what search_service.py keys off.
log "exporting the index to search-index/…"
rm -rf "$REPO/search-index.tmp"
mkdir -p "$REPO/search-index.tmp"
# `cd` + a RELATIVE destination on purpose. Under Git Bash on Windows an absolute
# POSIX path (/d/Vasco/…) is handed to docker.exe unchanged when MSYS_NO_PATHCONV
# is set, and it cannot resolve it — the copy then fails silently and the export
# ships whatever was in search-index/ before. A relative path works on both.
# /data/search-index is the current path; /data/zvec-index is where an older
# image put it (the directory was renamed once the "zvec" in the name was found
# to be untrue). Try both so this script works against either image.
( cd "$REPO/search-index.tmp" && for f in dense.npy matrix.npz index_meta.json; do
    docker cp "looma-search:/data/search-index/$f" "./$f" 2>/dev/null       || docker cp "looma-search:/data/zvec-index/$f" "./$f" 2>/dev/null || true
  done )
[ -f "$REPO/search-index.tmp/index_meta.json" ] \
  || die "no index_meta.json came out of looma-search (tried /data/search-index and /data/zvec-index)"
rm -rf "$REPO/search-index"
mv "$REPO/search-index.tmp" "$REPO/search-index"

log "exporting the database to mongo-dump/dump/…"
docker exec looma-db mongodump --db looma --out /tmp/looma-dump >/dev/null \
  || die "mongodump failed — docker logs looma-db"
rm -rf "$REPO/mongo-dump/dump.tmp"
( cd "$REPO/mongo-dump" && docker cp looma-db:/tmp/looma-dump ./dump.tmp >/dev/null )
docker exec looma-db rm -rf /tmp/looma-dump >/dev/null 2>&1 || true
# mongodump writes <out>/<db>/, and the installer restores mongo-dump/dump as the
# dump ROOT (mongorestore --drop "$SRC_REPO/mongo-dump/dump"), so keep that shape.
rm -rf "$REPO/mongo-dump/dump"
mv "$REPO/mongo-dump/dump.tmp" "$REPO/mongo-dump/dump"

log "done."
printf '\n'
printf '  search-index/   %s\n' "$(du -sh "$REPO/search-index" 2>/dev/null | cut -f1)"
printf '  mongo-dump/dump %s\n' "$(du -sh "$REPO/mongo-dump/dump" 2>/dev/null | cut -f1)"
printf '\n'
# The index is held in RAM by the search service, so its size on disk is very
# nearly what the box pays for it. Worth a glance before shipping to an 8 GB
# board: if it has grown too far, rebuild with a smaller LOOMA_SEARCH_MAX_CHUNKS.
printf 'search-index/ is loaded into memory whole (%s embedding windows per document).\n' \
  "$LOOMA_SEARCH_MAX_CHUNKS"
printf '\n'
printf 'Both travel with the repo, so an install from this disk skips the ingest\n'
printf 'and the embedding entirely. A box whose search service ends up on a\n'
printf 'different backend (no torch -> the hashing fallback) rejects the index on\n'
printf 'load and rebuilds by itself, so this can never leave a box with a wrong one.\n'
