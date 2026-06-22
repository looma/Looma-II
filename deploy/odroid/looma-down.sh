#!/usr/bin/env bash
# Stop Looma on the box (app first, then observability).
# Pass --volumes to ALSO delete data volumes (DANGER: wipes Mongo, zvec index,
# OpenSearch/Grafana data). Content/maps are host copies and are never touched.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
OBS_DIR="$REPO_DIR/observability"

EXTRA=()
[ "${1:-}" = "--volumes" ] && EXTRA+=(--volumes)

echo "[looma-down] app…"
( cd "$REPO_DIR" && docker compose --profile ai down "${EXTRA[@]}" ) || true

echo "[looma-down] observability…"
( cd "$OBS_DIR" && docker compose \
    -f docker-compose.yml -f docker-compose.odroid.yml --profile heavy --profile ai down "${EXTRA[@]}" ) || true

echo "[looma-down] done."
