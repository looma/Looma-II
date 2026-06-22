# Looma Observability Stack — Restore / Portability Guide

This directory is a **self-contained, portable observability stack**: OpenSearch,
OpenSearch Dashboards, Grafana, Prometheus, OTel Collector, Data Prepper, Vector,
Metricbeat, Jaeger and the Looma topology probe.

Copying this folder to another machine and running `docker compose up` brings the
whole stack online **with every Grafana and OpenSearch dashboard already loaded**.

## What is and is NOT in a backup

| Included (ships with the folder) | NOT included (regenerated per device) |
|---|---|
| `docker-compose.yml` + every service config | Trace / log / metric **data** indices |
| All Dockerfiles (`*/Dockerfile`) | Docker named volumes (`looma_opensearch_data`, …) |
| 23 Grafana dashboards (`grafana/dashboards/`) | Anything under `logs/` at runtime |
| Grafana provisioning (datasources, dashboard provider) | |
| `state/applications.ndjson` — Observability **Applications + Panels + Visualizations** | |
| `state/saved-objects.ndjson` — OpenSearch Dashboards saved objects | |
| `state/advanced-settings.json`, `state/ism-policies/` | |

Each device generates its own telemetry, so data indices are intentionally not
saved — only the *definitions* (dashboards, panels, applications) travel.

## Prerequisites on the new device

- Docker + Docker Compose v2
- The sibling directory `../looma-ai` and `../looma-ai-data` must exist — the
  compose file bind-mounts them for the AI service. If you don't run the AI
  service, comment out the `looma-ai` / `looma-ai-rebuild` services.

## Deploy

```sh
# from inside this observability/ directory
docker compose up -d --build
```

What happens automatically:

1. All `looma-*` images build from their `build: context:` directories.
2. Empty Docker named volumes are created (fresh, per-device data).
3. The **`looma-bootstrap`** container waits for OpenSearch + Dashboards, then:
   - imports `state/saved-objects.ndjson` (index patterns, OSD objects)
   - imports `state/applications.ndjson` (Observability Applications, their
     Panels and 250+ saved Visualizations) into `.opensearch-observability`
   - applies `state/advanced-settings.json` and `state/ism-policies/`
4. **Grafana** starts with all 23 dashboards baked into its image
   (`grafana/Dockerfile` does `COPY dashboards /opt/looma-dashboards`) and
   provisioned via `grafana/provisioning/`.

First boot takes a few minutes (image builds + OpenSearch shard recovery).

## Endpoints (default ports)

| UI | URL |
|---|---|
| Grafana | http://localhost:43000 |
| OpenSearch Dashboards | http://localhost:45601 |
| Jaeger UI | http://localhost:16686 |
| Prometheus | internal: http://looma-prometheus:9091 |
| OpenSearch API | http://localhost:49200 |

## Re-snapshotting after you change things

If you edit dashboards/panels/applications in the running cluster and want the
change to travel with the folder, re-export the state:

```sh
# Linux / macOS / WSL
./state/snapshot.sh

# Windows PowerShell
powershell -ExecutionPolicy Bypass -File state\snapshot.ps1
```

This rewrites `state/applications.ndjson`, `state/saved-objects.ndjson`,
`state/advanced-settings.json` and `state/ism-policies/`. Grafana dashboards are
plain JSON under `grafana/dashboards/` — edit the files directly (or export from
the Grafana UI and overwrite them).

> Note: the `bootstrap` service bakes `state/` into its image (`state/Dockerfile`)
> instead of bind-mounting it, so it cannot fail to start when Docker Desktop's
> host-path mount layer is unhealthy. After re-running `snapshot.sh`, rebuild the
> image so the next install picks up the new state:
>
> ```sh
> docker compose build bootstrap
> ```

> Note: `state/applications.ndjson` captures the **entire**
> `.opensearch-observability` index (applications **and** their panels **and**
> visualizations). A snapshot that only captured `application` documents would
> drop the Panel tab content on the next install.
