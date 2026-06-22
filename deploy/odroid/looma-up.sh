#!/usr/bin/env bash
# Bring up Looma on the box. The APP starts FIRST (that's what the kiosk needs),
# then observability is started BEST-EFFORT — a failure there must never stop the
# app/box from coming up (this is why a broken data-prepper used to leave a white
# screen on boot). Self-locates the repo; reads /etc/looma-odroid.env.
set -uo pipefail   # NOTE: no `-e` — we handle failures explicitly so obs can't abort the app.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
OBS_DIR="$REPO_DIR/observability"

WITH_OBSERVABILITY=1
WITH_AI=1            # looma-ai = the in-app assistant (on by default)
WITH_ANALYSIS=0     # heavy obs analysis workers (looma-analysis-worker/...) — off
WITH_AGENTS=0       # agents-only mode: run just Vector+Metricbeat locally and
                    # ship to a REMOTE obs stack (set when WITH_OBSERVABILITY=0)
# Where looma-web reads content from. Defaults assume content sits next to the
# repo; the installer writes the real paths (e.g. /var/www/html/...) to the env.
LOOMA_CONTENT_DIR="$(cd "$REPO_DIR/.." && pwd)/content"
LOOMA_MAPS_DIR="$(cd "$REPO_DIR/.." && pwd)/maps2018"
LOOMA_EPAATH_DIR="$(cd "$REPO_DIR/.." && pwd)/content/epaath"
# Remote obs targets (used in agents-only mode). Default to the local containers
# so a single-host (16 GB) setup is unaffected.
LOOMA_OTEL_ENDPOINT="http://looma-otel-collector:4318"
LOOMA_OPENSEARCH_URL="http://looma-opensearch:9200"
# shellcheck disable=SC1091
[ -f /etc/looma-odroid.env ] && . /etc/looma-odroid.env
export LOOMA_CONTENT_DIR LOOMA_MAPS_DIR LOOMA_EPAATH_DIR LOOMA_OTEL_ENDPOINT LOOMA_OPENSEARCH_URL

# App profile: `ai` turns on looma-ai (the assistant). Obs profile: `analysis`
# turns on the heavy AI analysis workers — kept SEPARATE so enabling the
# assistant does NOT also start those.
app_profiles=(); [ "$WITH_AI" = "1" ] && app_profiles+=(--profile ai)
obs_profiles=(); [ "$WITH_ANALYSIS" = "1" ] && obs_profiles+=(--profile analysis)

# `--build` (passed by the installer) rebuilds images so Dockerfile changes take
# effect — e.g. the data-prepper arm64 bump. Boots run WITHOUT it (fast: reuse
# the already-built images).
build_args=()
[ "${1:-}" = "--build" ] && build_args=(--build)

# Shared network + external volume must exist first.
docker network inspect loomanet >/dev/null 2>&1 || docker network create loomanet
docker volume inspect looma_apache_logs >/dev/null 2>&1 || docker volume create looma_apache_logs >/dev/null

# --- APP FIRST (critical: kiosk depends on looma-web :48080) ---------------
echo "[looma-up] app…"
# No -f here on purpose: docker-compose.override.yml auto-loads (content binds,
# no resource limits, looma-ai gated off unless --profile ai).
if ! ( cd "$REPO_DIR" && docker compose "${app_profiles[@]}" up -d "${build_args[@]}" ); then
  echo "[looma-up] ERROR: the app stack failed to start" >&2
  exit 1
fi

# --- OBSERVABILITY: best-effort (never blocks the app/box) ------------------
if [ "$WITH_OBSERVABILITY" = "1" ]; then
  echo "[looma-up] observability (trimmed for 8 GB; best-effort)…"
  if ! ( cd "$OBS_DIR" && docker compose \
          -f docker-compose.yml -f docker-compose.odroid.yml "${obs_profiles[@]}" up -d "${build_args[@]}" ); then
    echo "[looma-up] WARN: observability did not fully start — app is up regardless." >&2
    echo "[looma-up]       check: cd $OBS_DIR && docker compose -f docker-compose.yml -f docker-compose.odroid.yml ps" >&2
  fi
fi

# --- AGENTS-ONLY mode: just Vector + Metricbeat, shipping to a REMOTE obs ----
# Used on the 8 GB odroid: no local OpenSearch/otel-collector. Vector sends logs
# to the remote OpenSearch ($LOOMA_OPENSEARCH_URL) and Metricbeat -> local Vector
# -> remote OpenSearch; the app exports OTLP to the remote otel-collector
# ($LOOMA_OTEL_ENDPOINT). `--no-deps` so it does NOT pull in OpenSearch & co.
if [ "$WITH_AGENTS" = "1" ] && [ "$WITH_OBSERVABILITY" != "1" ]; then
  echo "[looma-up] agents (Vector+Metricbeat -> remote $LOOMA_OPENSEARCH_URL)…"
  if ! ( cd "$OBS_DIR" && docker compose \
          -f docker-compose.yml -f docker-compose.odroid.yml \
          up -d --no-deps "${build_args[@]}" vector metricbeat ); then
    echo "[looma-up] WARN: agents did not start — app is up regardless." >&2
  fi
fi

# Warm up the zvec search index in the BACKGROUND. It is built lazily/in-memory
# on the first request (full-corpus embedding) — slow on ARM — so we kick it off
# now, detached, so it's ready before the first user search and never blocks boot.
(
  for _ in $(seq 1 90); do curl -fsS "http://localhost:46333/health" >/dev/null 2>&1 && break; sleep 5; done
  curl -fsS -X POST "http://localhost:46333/rebuild" >/dev/null 2>&1 || true
) >/dev/null 2>&1 &

echo "[looma-up] done."
