#!/bin/sh
# Re-export the current OpenSearch / Dashboards state into observability/state/.
# Run this from the host whenever you've edited dashboards, advanced settings,
# or ISM policies in the running cluster and want to commit the change.
#
# Usage:  ./observability/state/snapshot.sh
#
# Requires docker, with the looma-opensearch-node and looma-opensearch-dashboards
# containers running.

set -eu

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
OS_CTR=${OS_CTR:-looma-opensearch-node}
OSD_CTR=${OSD_CTR:-looma-opensearch-dashboards}

echo "[snapshot] target dir: $SCRIPT_DIR"

# 1) Saved objects (dashboards + visualizations + index patterns + searches + maps).
echo "[snapshot] exporting saved objects..."
docker exec "$OSD_CTR" sh -c 'cat > /tmp/export.json' <<'JSON'
{"type":["dashboard","visualization","index-pattern","search","query","map"],"includeReferencesDeep":true,"excludeExportDetails":false}
JSON
docker exec "$OSD_CTR" sh -c "curl -s -X POST 'http://localhost:5601/api/saved_objects/_export' \
  -H 'Content-Type: application/json' -H 'osd-xsrf: true' \
  --data-binary @/tmp/export.json -o /tmp/saved-objects.ndjson"
docker cp "$OSD_CTR:/tmp/saved-objects.ndjson" "$SCRIPT_DIR/saved-objects.ndjson"
count=$(grep -c '"type"' "$SCRIPT_DIR/saved-objects.ndjson" || echo 0)
echo "[snapshot]   saved-objects.ndjson ($count lines)"

# 2) Advanced settings (config:<osd-version>).
echo "[snapshot] exporting advanced settings..."
ver=$(docker exec "$OSD_CTR" sh -c "curl -s http://localhost:5601/api/status | sed -n 's/.*\"number\":\"\\([^\"]*\\)\".*/\\1/p' | head -1")
[ -z "$ver" ] && ver=3.6.0
docker exec "$OS_CTR" sh -c "curl -s 'http://localhost:9200/.kibana_1/_doc/config:$ver' -o /tmp/cfg-raw.json"
# Strip _seq_no / _primary_term / _version metadata so the file is portable.
docker exec "$OS_CTR" sh -c 'python3 -c "
import json, sys
with open(\"/tmp/cfg-raw.json\") as f: d = json.load(f)
src = d.get(\"_source\", {})
out = {\"config\": src.get(\"config\", {}), \"type\": \"config\", \"references\": src.get(\"references\", []), \"migrationVersion\": src.get(\"migrationVersion\", {})}
with open(\"/tmp/cfg.json\", \"w\") as f: json.dump(out, f, indent=2)
"'
docker cp "$OS_CTR:/tmp/cfg.json" "$SCRIPT_DIR/advanced-settings.json"
echo "[snapshot]   advanced-settings.json (osd version $ver)"

# 3) ISM policies (only the looma-managed ones).
echo "[snapshot] exporting ISM policies..."
mkdir -p "$SCRIPT_DIR/ism-policies"
for policy_id in looma-7day-delete; do
  docker exec "$OS_CTR" sh -c "curl -s 'http://localhost:9200/_plugins/_ism/policies/$policy_id' -o /tmp/ism-$policy_id.json"
  docker exec "$OS_CTR" sh -c "python3 -c '
import json
with open(\"/tmp/ism-$policy_id.json\") as f: d = json.load(f)
out = {\"policy\": d.get(\"policy\", {}).get(\"policy\", d.get(\"policy\", {}))}
with open(\"/tmp/ism-$policy_id-clean.json\", \"w\") as f: json.dump(out, f, indent=2)
'"
  docker cp "$OS_CTR:/tmp/ism-$policy_id-clean.json" "$SCRIPT_DIR/ism-policies/$policy_id.json"
  echo "[snapshot]   ism-policies/$policy_id.json"
done

# 4) Observability objects (applications + operational panels + saved visualizations).
#    The whole .opensearch-observability index is exported so the Panel tab of
#    each application (panelId -> operationalPanel -> savedVisualization) survives
#    a fresh install. Filtering by application.name would drop panels and viz.
echo "[snapshot] exporting Observability objects (apps + panels + visualizations)..."
docker exec "$OS_CTR" sh -c 'cat > /tmp/applications-query.json' <<'JSON'
{"size":5000,"query":{"match_all":{}}}
JSON
docker exec "$OS_CTR" sh -c "curl -s -X POST 'http://localhost:9200/.opensearch-observability/_search' \
  -H 'Content-Type: application/json' \
  --data-binary @/tmp/applications-query.json -o /tmp/applications-raw.json"
docker exec "$OS_CTR" sh -c 'python3 -c "
import json
with open(\"/tmp/applications-raw.json\") as f:
    data = json.load(f)
apps = panels = viz = 0
with open(\"/tmp/applications.ndjson\", \"w\") as f:
    for hit in data.get(\"hits\", {}).get(\"hits\", []):
        src = hit.get(\"_source\", {})
        if \"application\" in src: apps += 1
        elif \"operationalPanel\" in src: panels += 1
        elif \"savedVisualization\" in src: viz += 1
        f.write(json.dumps({\"index\": {\"_index\": \".opensearch-observability\", \"_id\": hit.get(\"_id\")}}, separators=(\",\", \":\")) + \"\\n\")
        f.write(json.dumps(src, separators=(\",\", \":\")) + \"\\n\")
print(f\"apps={apps} panels={panels} viz={viz}\")
"'
docker cp "$OS_CTR:/tmp/applications.ndjson" "$SCRIPT_DIR/applications.ndjson"
docs_count=$(( $(wc -l < "$SCRIPT_DIR/applications.ndjson") / 2 ))
echo "[snapshot]   applications.ndjson ($docs_count observability objects)"

# 5) Cleanup temp inside containers.
docker exec -u 0 "$OS_CTR"  sh -c 'rm -f /tmp/cfg*.json /tmp/ism-*.json /tmp/applications*.json /tmp/applications.ndjson' 2>/dev/null || true
docker exec -u 0 "$OSD_CTR" sh -c 'rm -f /tmp/export.json /tmp/saved-objects.ndjson' 2>/dev/null || true

echo "[snapshot] done. Commit the changes under observability/state/."
