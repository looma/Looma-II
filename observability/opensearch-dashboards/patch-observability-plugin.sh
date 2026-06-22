#!/bin/sh
# Patch the OpenSearch Dashboards Observability plugin bundle so that the
# "View associated logs" PPL query uses double quotes (which work in the
# Observability Logs Explorer) instead of single quotes (which the explorer
# silently rejects, returning 400 from the PPL /api/ppl/search endpoint).
#
# Idempotent — re-runnable, leaves a backup of the original next to each file.
# Run as root (docker exec -u 0). Requires OSD 3.6.x; for other versions
# inspect the bundle to confirm the patterns still match.

set -e

DIR=/usr/share/opensearch-dashboards/plugins/observabilityDashboards/target/public
F=$DIR/observabilityDashboards.plugin.js

if [ ! -f "$F" ]; then
  echo "[patch-observability] plugin bundle not found at $F — skipping"
  exit 0
fi

# Detect already-patched state (idempotent).
if grep -aq "correlatedFieldName,'=\"'" "$F"; then
  echo "[patch-observability] bundle already patched, nothing to do"
  exit 0
fi

# Snapshot originals once.
if [ ! -f "$F.bak.original" ]; then
  cp "$F" "$F.bak.original"
  [ -f "$F.gz" ] && cp "$F.gz" "$F.gz.bak.original"
  [ -f "$F.br" ] && cp "$F.br" "$F.br.bak.original"
fi

python3 - "$F" <<'PYEOF'
import sys
path = sys.argv[1]
with open(path, "rb") as f:
    data = f.read()
old1 = b'correlatedFieldName,"=\'"'
new1 = b'correlatedFieldName,\'="\''
old2 = b'correlatedFieldValue,"\'"'
new2 = b'correlatedFieldValue,\'"\''
n1, n2 = data.count(old1), data.count(old2)
if n1 != 1 or n2 != 1:
    sys.exit(f"[patch-observability] expected exactly 1/1 pattern hits, got {n1}/{n2} — bundle layout changed, aborting")
data = data.replace(old1, new1).replace(old2, new2)
with open(path, "wb") as f:
    f.write(data)
print("[patch-observability] patched plugin.js")
PYEOF

# Regenerate gzip from patched .js so browsers using Accept-Encoding: gzip
# receive the patched bytes (otherwise the original cached .gz would be served).
gzip -9 -c "$F" > "$F.gz"
echo "[patch-observability] regenerated .gz ($(wc -c <"$F.gz") bytes)"

# Brotli regen needs the brotli binary, which the OSD image doesn't ship.
# Removing the stale .br forces browsers to negotiate gzip or identity.
if command -v brotli >/dev/null 2>&1; then
  brotli -f -q 5 -o "$F.br" "$F"
  echo "[patch-observability] regenerated .br ($(wc -c <"$F.br") bytes)"
else
  rm -f "$F.br"
  echo "[patch-observability] removed stale .br (no brotli binary; gzip negotiated)"
fi
