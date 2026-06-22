#!/bin/sh
# Looma observability state bootstrap.
# On every container start, imports the snapshotted OpenSearch / Dashboards
# state (saved objects, advanced settings, ISM policies, Applications,
# Alerting monitors, Anomaly Detection detectors) into the running
# cluster. Idempotent — re-running is safe; objects are upserted by id.
#
# Inputs (under /state, mounted from observability/state/ on the host):
#   saved-objects.ndjson            — dashboards + visualizations + index patterns
#   advanced-settings.json          — OSD Advanced Settings (config:<osd-version>)
#   ism-policies/*.json             — ISM policies
#
# Env:
#   OS_URL      — OpenSearch base URL (default http://looma-opensearch:9200)
#   OSD_URL     — Dashboards base URL (default http://looma-opensearch-dashboards:5601)
#   OSD_VERSION — explicit OSD version for the config:* doc id; auto-detected if unset

set -eu

OS_URL="${OS_URL:-http://looma-opensearch:9200}"
OSD_URL="${OSD_URL:-http://looma-opensearch-dashboards:5601}"

log() { echo "[$(date -u +%H:%M:%SZ)] bootstrap: $*"; }

wait_for() {
  url="$1"; label="$2"
  log "waiting for $label at $url"
  i=0
  while [ $i -lt 120 ]; do
    code=$(curl -s -o /dev/null -w '%{http_code}' "$url" || echo "000")
    case "$code" in
      2*|3*) log "$label ready (http $code)"; return 0 ;;
    esac
    i=$((i+1)); sleep 5
  done
  log "$label not ready after 600s"; return 1
}

wait_for "$OS_URL/_cluster/health" "OpenSearch cluster"
wait_for "$OSD_URL/api/status"     "OpenSearch Dashboards"

# --- 1) Single-node index hygiene -------------------------------------------
# This Docker stack runs OpenSearch as one node. Replica shards cannot be
# assigned to the same node, so force replicas to 0 for current indices.
log "forcing current indices to number_of_replicas=0"
curl -s -o /tmp/replicas-resp.json -w '%{http_code}' -H 'Content-Type: application/json' \
  -X PUT "$OS_URL/_all/_settings?preserve_existing=false&expand_wildcards=all" \
  -d '{"index":{"number_of_replicas":0}}' >/tmp/replicas-code.txt || true
code=$(cat /tmp/replicas-code.txt 2>/dev/null || echo 000)
if echo "$code" | grep -qE '^2'; then
  log "replicas: ok ($code)"
else
  log "replicas: partial/failed ($code): $(head -c 200 /tmp/replicas-resp.json 2>/dev/null || true)"
fi
curl -s "$OS_URL/_cat/shards?h=index,prirep,state" \
  | awk '$2 == "r" && $3 == "UNASSIGNED" { print $1 }' \
  | sort -u \
  | while IFS= read -r idx; do
      [ -n "$idx" ] || continue
      curl -s -o /dev/null -H 'Content-Type: application/json' \
        -X PUT "$OS_URL/$idx/_settings?preserve_existing=false" \
        -d '{"index":{"number_of_replicas":0}}' || true
    done

# --- 2) ISM policies ---------------------------------------------------------
if [ -d /state/ism-policies ]; then
  for f in /state/ism-policies/*.json; do
    [ -f "$f" ] || continue
    name=$(basename "$f" .json)
    # Read current _seq_no / _primary_term for optimistic concurrency.
    current=$(curl -s "$OS_URL/_plugins/_ism/policies/$name" || echo '{}')
    seq=$(echo "$current"  | sed -n 's/.*"_seq_no":\([0-9]*\).*/\1/p' | head -1)
    pt=$(echo "$current"   | sed -n 's/.*"_primary_term":\([0-9]*\).*/\1/p' | head -1)
    if [ -n "$seq" ] && [ -n "$pt" ]; then
      url="$OS_URL/_plugins/_ism/policies/$name?if_seq_no=$seq&if_primary_term=$pt"
      log "updating ISM policy $name (seq=$seq term=$pt)"
    else
      url="$OS_URL/_plugins/_ism/policies/$name"
      log "creating ISM policy $name"
    fi
    code=$(curl -s -o /tmp/ism-resp.json -w '%{http_code}' -H 'Content-Type: application/json' \
      -X PUT "$url" --data-binary @"$f")
    if echo "$code" | grep -qE '^2'; then
      log "ISM $name: ok ($code)"
    else
      log "ISM $name: failed ($code): $(head -c 200 /tmp/ism-resp.json)"
    fi
  done
fi

# --- 3) Saved objects (dashboards, visualizations, index patterns) -----------
if [ -f /state/saved-objects.ndjson ]; then
  log "importing saved-objects.ndjson"
  # overwrite=true to upsert; createNewCopies=false to preserve ids so dashboards
  # keep pointing at the same visualization/index-pattern uuids.
  resp=$(curl -s -X POST "$OSD_URL/api/saved_objects/_import?overwrite=true" \
    -H 'osd-xsrf: true' \
    -F file=@/state/saved-objects.ndjson)
  success=$(echo "$resp" | sed -n 's/.*"success":\(true\|false\).*/\1/p' | head -1)
  count=$(echo "$resp"   | sed -n 's/.*"successCount":\([0-9]*\).*/\1/p' | head -1)
  log "saved objects import: success=$success count=$count"
  if [ "$success" != "true" ]; then
    log "import response (first 500 chars): $(echo "$resp" | head -c 500)"
  fi
fi

# --- 4) Advanced settings (config:<osd-version>) ----------------------------
if [ -f /state/advanced-settings.json ]; then
  # The doc id is "config:<osd-version>". Discover the running OSD version.
  ver="${OSD_VERSION:-}"
  if [ -z "$ver" ]; then
    ver=$(curl -s "$OSD_URL/api/status" | sed -n 's/.*"number":"\([^"]*\)".*/\1/p' | head -1)
  fi
  if [ -z "$ver" ]; then
    log "could not detect OSD version, skipping advanced settings"
  else
    log "writing advanced settings to config:$ver"
    # Write through the OSD-managed `.kibana` alias, NOT a hardcoded `.kibana_1`.
    # bootstrap only reaches this point after OSD is ready (wait_for above), so
    # the alias already resolves to OSD's current versioned index. Targeting a
    # literal `.kibana_1` auto-created a rogue concrete index that collided with
    # OSD's own `.kibana` -> `.kibana_N` migration on the next restart, wedging
    # Dashboards in an endless "Another instance appears to be migrating" loop.
    code=$(curl -s -o /tmp/cfg-resp.json -w '%{http_code}' -H 'Content-Type: application/json' \
      -X PUT "$OS_URL/.kibana/_doc/config:$ver" --data-binary @/state/advanced-settings.json)
    if echo "$code" | grep -qE '^2'; then
      log "advanced settings: ok ($code)"
    else
      log "advanced settings: failed ($code): $(head -c 200 /tmp/cfg-resp.json)"
    fi
  fi
fi

# --- 5) Observability Applications ------------------------------------------
if [ -f /state/applications.ndjson ]; then
  # Let the Observability plugin create `.opensearch-observability` with its OWN
  # field mappings BEFORE we bulk-import. Previously this script pre-created the
  # index with a bare `PUT` (settings only); the subsequent _bulk then let
  # dynamic mapping pick the wrong types (tenant -> text, *TimeMs -> long).
  # The plugin's Applications API later tries to enforce its schema (tenant ->
  # keyword, *TimeMs -> date) and fails with "mapper cannot be changed",
  # leaving the Observability > Applications tab empty. Hitting the plugin's
  # getAll endpoint ensures-index with the correct mapping; epoch-millis values
  # are valid for the resulting date fields, so the bulk import still works.
  log "ensuring .opensearch-observability exists with the plugin's mapping"
  curl -s -o /dev/null "$OS_URL/_plugins/_observability/object?objectType=application" || true
  curl -s -o /dev/null -H 'Content-Type: application/json' \
    -X PUT "$OS_URL/.opensearch-observability/_settings?preserve_existing=false" \
    -d '{"index":{"number_of_replicas":0}}' >/tmp/apps-create-code.txt || true

  log "importing Observability Applications"
  code=$(curl -s -o /tmp/apps-bulk-resp.json -w '%{http_code}' -H 'Content-Type: application/x-ndjson' \
    -X POST "$OS_URL/_bulk?refresh=true" --data-binary @/state/applications.ndjson)
  if echo "$code" | grep -qE '^2'; then
    log "applications import: ok ($code)"
  else
    log "applications import: failed ($code): $(head -c 500 /tmp/apps-bulk-resp.json)"
  fi

  curl -s -o /tmp/apps-settings-resp.json -w '%{http_code}' -H 'Content-Type: application/json' \
    -X PUT "$OS_URL/.opensearch-observability/_settings?preserve_existing=false" \
    -d '{"index":{"number_of_replicas":0}}' >/tmp/apps-settings-code.txt || true
fi

# --- 6) Alerting monitors ----------------------------------------------------
if [ -d /state/alerting-monitors ]; then
  for f in /state/alerting-monitors/*.json; do
    [ -f "$f" ] || continue
    name=$(sed -n 's/^[[:space:]]*"name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$f" | head -1)
    if [ -z "$name" ]; then
      log "skipping alerting monitor $(basename "$f"): missing name"
      continue
    fi

    log "recreating alerting monitor $name"
    search_body='{"query":{"term":{"monitor.name.keyword":"'"$name"'"}},"_source":false,"size":20}'
    search_resp=$(curl -s -H 'Content-Type: application/json' \
      -X POST "$OS_URL/_plugins/_alerting/monitors/_search" \
      -d "$search_body" || echo '{}')
    ids=$(echo "$search_resp" | grep -o '"_id":"[^"]*"' | cut -d '"' -f4 || true)
    for id in $ids; do
      curl -s -o /dev/null -X DELETE "$OS_URL/_plugins/_alerting/monitors/$id" || true
    done

    code=$(curl -s -o /tmp/monitor-resp.json -w '%{http_code}' \
      -H 'Content-Type: application/json' \
      -X POST "$OS_URL/_plugins/_alerting/monitors" --data-binary @"$f")
    if echo "$code" | grep -qE '^2'; then
      log "alerting monitor $name: ok ($code)"
    else
      log "alerting monitor $name: failed ($code): $(head -c 300 /tmp/monitor-resp.json)"
    fi
  done
fi

# --- 7) Anomaly Detection detectors -----------------------------------------
if [ -d /state/anomaly-detectors ]; then
  for f in /state/anomaly-detectors/*.json; do
    [ -f "$f" ] || continue
    name=$(sed -n 's/^[[:space:]]*"name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$f" | head -1)
    if [ -z "$name" ]; then
      log "skipping anomaly detector $(basename "$f"): missing name"
      continue
    fi

    log "recreating anomaly detector $name"
    search_body='{"query":{"term":{"name.keyword":"'"$name"'"}},"_source":false,"size":20}'
    search_resp=$(curl -s -H 'Content-Type: application/json' \
      -X POST "$OS_URL/_plugins/_anomaly_detection/detectors/_search" \
      -d "$search_body" || echo '{}')
    ids=$(echo "$search_resp" | grep -o '"_id":"[^"]*"' | cut -d '"' -f4 || true)
    for id in $ids; do
      curl -s -o /dev/null -X POST "$OS_URL/_plugins/_anomaly_detection/detectors/$id/_stop" || true
      curl -s -o /dev/null -X DELETE "$OS_URL/_plugins/_anomaly_detection/detectors/$id" || true
    done

    code=$(curl -s -o /tmp/detector-resp.json -w '%{http_code}' \
      -H 'Content-Type: application/json' \
      -X POST "$OS_URL/_plugins/_anomaly_detection/detectors" --data-binary @"$f")
    if echo "$code" | grep -qE '^2'; then
      detector_id=$(sed -n 's/.*"_id":"\([^"]*\)".*/\1/p' /tmp/detector-resp.json | head -1)
      log "anomaly detector $name: ok ($code)"
      if [ -n "$detector_id" ]; then
        start_code=$(curl -s -o /tmp/detector-start-resp.json -w '%{http_code}' \
          -H 'Content-Type: application/json' \
          -X POST "$OS_URL/_plugins/_anomaly_detection/detectors/$detector_id/_start" || echo 000)
        if echo "$start_code" | grep -qE '^2'; then
          log "anomaly detector $name started ($start_code)"
        else
          log "anomaly detector $name start skipped/failed ($start_code): $(head -c 300 /tmp/detector-start-resp.json 2>/dev/null || true)"
        fi
      fi
    else
      log "anomaly detector $name: failed ($code): $(head -c 300 /tmp/detector-resp.json)"
    fi
  done
fi

log "bootstrap done"
