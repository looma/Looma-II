#!/bin/sh
# Patches to the OpenSearch Dashboards Observability plugin bundles. Idempotent:
# re-runnable, and leaves a backup of the original next to each file. Run as root
# (docker exec -u 0). Requires OSD 3.6.x; for other versions inspect the bundles
# to confirm the patterns still match.
#
# 1) plugin.js: the "View associated logs" PPL query uses double quotes, which work
#    in the Logs Explorer, instead of single quotes, which it silently rejects with
#    a 400 from /api/ppl/search.
#
# 2) chunk.19.js: opening a saved query or visualization needs data_sources and
#    query_lang, but the opensearch-observability 3.6.0 backend drops both when it
#    stores and returns an object, even one saved from this UI. Without them the
#    Explorer shows "Cannot parse datasources from saved object" and falls back to
#    the default time range. Default them to the cluster's own indices and PPL.
#
# 3) plugin.js: operational panels read a chart's config from userConfigs, but saved
#    charts only carry user_configs, so every panel chart ignored its saved style.
#
# 4) plugin.js: with no span chosen, panels forced every chart's interval to 1 hour,
#    contradicting the chart's own query. Keep the query's interval unless one is given.

set -e

DIR=/usr/share/opensearch-dashboards/plugins/observabilityDashboards/target/public

patch_bundle() {  # file  python-replacement-pairs-as-args
  F="$1"; MARKER="$2"; shift 2
  if [ ! -f "$F" ]; then
    echo "[patch-observability] $F not found, skipping"
    return 0
  fi
  if grep -aqF "$MARKER" "$F"; then
    echo "[patch-observability] $(basename "$F") already patched"
    return 0
  fi

  # Snapshot originals once.
  if [ ! -f "$F.bak.original" ]; then
    cp "$F" "$F.bak.original"
    [ -f "$F.gz" ] && cp "$F.gz" "$F.gz.bak.original"
    [ -f "$F.br" ] && cp "$F.br" "$F.br.bak.original"
  fi

  python3 - "$F" "$@" <<'PYEOF'
import sys
path = sys.argv[1]
pairs = sys.argv[2:]
with open(path, "rb") as f:
    data = f.read()
for old, new in zip(pairs[::2], pairs[1::2]):
    old, new = old.encode(), new.encode()
    if data.count(old) != 1:
        sys.exit(f"[patch-observability] expected 1 hit for {old[:60]!r}, got {data.count(old)}: bundle layout changed")
    data = data.replace(old, new)
with open(path, "wb") as f:
    f.write(data)
print(f"[patch-observability] patched {path}")
PYEOF

  # Browsers must receive the patched bytes, not a stale precompressed copy. The
  # OSD image has no brotli binary, so removing .br makes them negotiate gzip.
  gzip -9 -c "$F" > "$F.gz"
  if command -v brotli >/dev/null 2>&1; then
    brotli -f -q 5 -o "$F.br" "$F"
  else
    rm -f "$F.br"
  fi
}

patch_bundle "$DIR/observabilityDashboards.plugin.js" "correlatedFieldName,'=\"'" \
  'correlatedFieldName,"='"'"'"' "correlatedFieldName,'=\"'" \
  'correlatedFieldValue,"'"'"'"' "correlatedFieldValue,'\"'"

patch_bundle "$DIR/observabilityDashboards.plugin.js" 'userConfigs:visualization.user_configs' \
  'id:res.observabilityObjectList[0].objectId,timeField:visualization.selected_timestamp.name' \
  'id:res.observabilityObjectList[0].objectId,timeField:visualization.selected_timestamp.name,userConfigs:visualization.user_configs' \
  'filterQuery=param.filterQuery,_param_span=param.span,span=_param_span===void 0?"1":_param_span' \
  'filterQuery=param.filterQuery,_param_span=param.span,span=_param_span'

patch_bundle "$DIR/observabilityDashboards.chunk.19.js" 'looma-default-data-source' \
  'objectData=isObjectSavedQuery(savedObjectData)?savedObjectData.savedQuery:savedObjectData.savedVisualization;' \
  'objectData=isObjectSavedQuery(savedObjectData)?savedObjectData.savedQuery:savedObjectData.savedVisualization;objectData=Object.assign({data_sources:JSON.stringify([{name:"Default cluster",type:"DEFAULT_INDEX_PATTERNS",label:"Default cluster",looma:"looma-default-data-source"}]),query_lang:"PPL"},objectData);'
