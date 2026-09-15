#!/usr/bin/env bash
#
# One-time move of the DATA-SERVER stack's persistent Docker volumes onto the
# dedicated Looma data disk (LOOMA_DATA_ROOT, see ../.env / ../.env.example).
# Only relevant when this machine runs docker-compose.data-server.yml — a
# plain on-box "full" observability install (odroid) never has this disk and
# never runs this script.
#
# Before: plain `local` named volumes under Docker's own storage.
# After : the same volume NAMES, bind-backed at
#         $LOOMA_DATA_ROOT/{opensearch,snapshots,prometheus,grafana,otel,vector}
#         (driver_opts already set in docker-compose.data-server.yml).
#
# Idempotent-ish: safe to re-run; it skips a volume whose data already looks
# migrated. Needs sudo for writes under $LOOMA_DATA_ROOT and docker access.
#
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_DIR="$(dirname "$HERE")"
cd "$COMPOSE_DIR"

COMPOSE=(docker compose -f docker-compose.yml -f docker-compose.data-server.yml)

# shellcheck disable=SC1091
[ -f .env ] && set -a && . ./.env && set +a
DATA_ROOT="${LOOMA_DATA_ROOT:-/mnt/looma}"

# name  ->  subdir under $DATA_ROOT
# looma_opensearch_snapshots and looma_vector_buffer are declared ONLY in
# docker-compose.data-server.yml (brand new on a first-ever data-server
# deploy), so they normally don't exist yet as a volume to migrate FROM —
# the "no such volume" branch below just creates their target dir instead.
VOLS="
looma_opensearch_data:opensearch
looma_opensearch_snapshots:snapshots
looma_prometheus_data:prometheus
looma_grafana_data:grafana
looma_otel_storage:otel
looma_vector_buffer:vector
"

say() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }

parent_mount="$(dirname "$DATA_ROOT")"
if ! mountpoint -q "$parent_mount" && ! mountpoint -q "$DATA_ROOT"; then
  echo "Refusing: neither $DATA_ROOT nor $parent_mount is a mountpoint." >&2
  echo "Mount the Looma data disk there first." >&2
  exit 1
fi

say "Stopping the data-server stack (data is kept)"
"${COMPOSE[@]}" down

# Owner each service's data dir needs — a bind mount Docker creates on demand
# is root:root 0755, and these containers cannot write into that as anyone
# but their own uid. otel/vector run as root in this stack (not listed here),
# so root:root is already correct for them.
owner_for() {
  case "$1" in
    opensearch|snapshots) echo "1000:1000" ;;
    grafana)              echo "472:472" ;;
    prometheus)           echo "65534:65534" ;;
    *)                    echo "" ;;
  esac
}

say "Copying each volume onto $DATA_ROOT"
for entry in $VOLS; do
  vol="${entry%%:*}"; sub="${entry##*:}"
  dst="$DATA_ROOT/$sub"

  if ! docker volume inspect "$vol" >/dev/null 2>&1; then
    echo "  $vol: no such volume yet — creating $dst"
    sudo mkdir -p "$dst"
    owner="$(owner_for "$sub")"
    [ -n "$owner" ] && sudo chown "$owner" "$dst"
    continue
  fi

  src="$(docker volume inspect "$vol" -f '{{ .Mountpoint }}')"
  if [ -z "$src" ] || [ ! -d "$src" ]; then
    echo "  $vol: mountpoint '$src' missing — skipping" >&2
    continue
  fi

  # Already bind-backed at the target? (re-run)
  cur_device="$(docker volume inspect "$vol" -f '{{ index .Options "device" }}' 2>/dev/null || true)"
  if [ "$cur_device" = "$dst" ]; then
    echo "  $vol: already bind-backed at $dst — leaving as is"
    continue
  fi

  echo "  $vol: $src  ->  $dst"
  sudo mkdir -p "$dst"
  sudo rsync -aHAX --numeric-ids --delete --info=progress2 "$src"/ "$dst"/
  # match the data dir's ownership (opensearch=1000, grafana=472, …)
  sudo chown --reference "$src" "$dst"
  sudo docker volume rm "$vol"   # so compose recreates it with the bind driver_opts
done

say "Recreating volumes (bind-backed) and starting the stack"
"${COMPOSE[@]}" up -d

say "Verify"
for entry in $VOLS; do
  vol="${entry%%:*}"
  printf '  %-32s device=' "$vol"
  docker volume inspect "$vol" -f '{{ index .Options "device" }}' 2>/dev/null || echo '(none)'
done
echo
echo "df $DATA_ROOT:"; df -h "$DATA_ROOT" | tail -1
echo
echo "Then sanity-check: curl -s localhost:49200/_cat/indices?v | head"
