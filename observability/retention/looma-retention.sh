#!/bin/sh
# Daily delete-by-query for accumulating indices (single index, no date rollover).
# Time-series indices with date suffix are handled by ISM policy looma-7day-delete.

set -u
OS_URL="${OS_URL:-http://looma-opensearch:9200}"
OS_AUTH="${OS_AUTH:-}"
RETENTION="${RETENTION:-now-7d}"

log() { echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $*"; }

dbq() {
  indices="$1"
  field="$2"
  body=$(printf '{"query":{"range":{"%s":{"lt":"%s"}}}}' "$field" "$RETENTION")
  response=$(curl -s ${OS_AUTH:+-u "$OS_AUTH"} -H 'Content-Type: application/json' \
    -X POST "$OS_URL/$indices/_delete_by_query?conflicts=proceed&slices=auto&refresh=true&wait_for_completion=true" \
    -d "$body")
  deleted=$(echo "$response" | sed -n 's/.*"deleted":\([0-9]*\).*/\1/p')
  failures=$(echo "$response" | grep -o '"failures":\[[^]]*\]' | head -1)
  log "dbq field=$field indices=$indices deleted=${deleted:-?} ${failures}"
}

run_once() {
  log "retention cycle start (cutoff: $RETENTION)"
  dbq "looma-app-logs"                                                "@timestamp"
  # otel-events-${service}-DD-MM-YYYY are now daily indices managed by ISM
  # policy `looma-7day-delete` (pattern: otel-events-*-*-*-*); no DBQ needed.
  dbq "otel-metrics,otel-metrics-looma-ai,otel-metrics-looma-search,otel-metrics-looma-search-legacy,otel-metrics-looma-web,otel-metrics-otel-collector,otel-metrics-otel-self,otel-metrics-otelcol-contrib,otel-metrics-otelcol_internal,otel-metrics-data-prepper,otel-metrics-docker_stats,otel-metrics-federated" "time"
  dbq "otel-v1-apm-span-looma-*,otel-v1-apm-span-jaeger-*"            "startTime"
  dbq "ss4o_traces-*"                                                 "endTime"
  log "retention cycle done"
}

# If RUN_ONCE=1, exit after a single run (useful for cron). Otherwise loop daily.
if [ "${RUN_ONCE:-0}" = "1" ]; then
  run_once
  exit 0
fi

# Wait for OpenSearch to be reachable on start.
until curl -s ${OS_AUTH:+-u "$OS_AUTH"} -o /dev/null -w '%{http_code}' "$OS_URL/_cluster/health" | grep -qE '^2'; do
  log "waiting for OpenSearch at $OS_URL"
  sleep 10
done

while true; do
  run_once
  log "sleeping 86400s until next cycle"
  sleep 86400
done
