## Observability stack

Single-pane setup for Looma:

- **Logs** — OpenSearch (Vector tails Docker + files; OTel Collector can also forward OTLP logs via Data Prepper)
- **Traces** — OpenSearch (Data Prepper → Trace Analytics + Service Map; optional Jaeger UI)
- **Metrics** — Prometheus → Grafana (OTel Collector exports app metrics + RED-style `spanmetrics` derived from traces; Vector self-metrics)

```
apps ──OTLP──> otel-collector ──> data-prepper ──> opensearch ──> opensearch-dashboards
                     │                               ▲
                     │ /metrics (8889)               │
                     ▼                               │ (logs+traces datasources)
                prometheus ──────────────────────────┼───────────────► grafana
                     ▲                               │
log files ──> vector ─┴───────────────> opensearch ──┘
```

### Start

From `Looma/Looma/observability`:

```
docker network create loomanet  # only if loomanet doesn't exist yet
docker compose -f docker-compose.yml up -d
docker compose -f docker-compose.yml ps
```

Running this on a dedicated server that collects traces/logs/metrics from
**every Looma box in the field** (not just this one machine)? See
[DATA-SERVER.md](DATA-SERVER.md) — an additional overlay that moves every
persistent volume onto its own data disk and adds daily OpenSearch snapshots,
so the fleet's data outlives any single container recreate.

### UIs

| URL | What |
| --- | --- |
| http://localhost:43000 | Grafana (admin/admin) — metrics dashboards + OpenSearch logs/traces datasources |
| http://localhost:45601 | OpenSearch Dashboards — Trace Analytics, Service Map, Discover for logs |
| http://localhost:16686 | Jaeger UI (optional) |
| http://localhost:49200 | OpenSearch HTTP API |
| internal: http://looma-prometheus:9091 | Prometheus query API |
| internal: looma-vector:6000 | Vector's own wire protocol — remote agent boxes forward here, see `vector/vector-agent.toml` |

Grafana ships pre-provisioned into two folders (`grafana/dashboards/data-stack/`
and `grafana/dashboards/school-usage/`, see `grafana/provisioning/dashboards/dashboards.yml`):

- **Looma — Data Stack**: infra health — OpenSearch ingestion, OTel Collector,
  Vector pipeline, Prometheus, MongoDB, containers, RUM, zvec, Services RED
  (spanmetrics), pipeline/trace-pipeline health, Go runtime, logs.
- **Looma — School Usage**: how the fleet is actually being used — exams,
  exercises, scores, page & chapter engagement, TTS (Piper/ResponsiveVoice/
  browser speech).

Datasources:

- `Prometheus`
- `OpenSearch-Logs` (`looma-logs-*`)
- `OpenSearch-Traces` (`otel-v1-apm-span-*`)

### Sending data from your apps (OTLP)

Point your OpenTelemetry SDK at the **OTel Collector**:

- OTLP gRPC: `localhost:4317`
- OTLP HTTP: `localhost:4318`

The collector forwards traces and logs to Data Prepper (`21890`/`21892`) which writes them to OpenSearch. Metrics surface on `http://looma-otel-collector:8889/metrics` and are scraped by Prometheus.

### What is traced today (out of the box)

- `looma-web` (PHP): one span per PHP request via `includes/otel.php` (and child spans for TTS synthesis).
- `piper-tts` (Flask sidecar inside `looma-web`): spans per request + `piper.synthesize` span.
- `looma-ai`, `looma-search`, `looma-search-legacy`: Python services emit OTLP traces to the collector.

### Logs from files (Vector)

Drop log files in `Looma/Looma/observability/logs/` (mounted read-only as `/var/log/looma/`). Or edit `Looma/Looma/observability/vector/vector.toml` to point at the real log file path you want shipped.

### Logs from Docker (Vector)

Vector also tails Docker stdout/stderr and ships Looma container logs into OpenSearch (index `looma-logs-*`) for:

- `looma-web`, `looma-ai`, `looma-db`, `looma-search`, `looma-search-legacy`, `looma-qdrant`

### Useful debug endpoints

- OTel Collector health: `http://localhost:43133`
- OTel Collector zpages: `http://localhost:41888/debug/tracez`
- Data Prepper health: `http://localhost:44900/health`
