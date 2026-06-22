# Observability state

Versioned snapshot of the cluster-side configuration that the dashboards depend
on but that doesn't live in a config file: Saved Objects (dashboards,
visualizations, index patterns), Observability Applications, OSD Advanced
Settings, and ISM policies. The
`bootstrap` service replays this snapshot into a fresh cluster on every
`docker compose up`, so the same machine — or a new one — comes up with
identical dashboards and retention rules.

## Files

| File | Source | Re-imported by |
|---|---|---|
| `saved-objects.ndjson` | OSD `/api/saved_objects/_export` (dashboards, visualizations, index-patterns, searches, maps) | `bootstrap.sh` via `/api/saved_objects/_import?overwrite=true` |
| `advanced-settings.json` | `.kibana_1/_doc/config:<osd-version>` | `bootstrap.sh` via `PUT .kibana_1/_doc/config:<osd-version>` |
| `applications.ndjson` | `.opensearch-observability` documents where `application.name` exists | `bootstrap.sh` via OpenSearch `_bulk?refresh=true` |
| `ism-policies/*.json` | `_plugins/_ism/policies/<id>` | `bootstrap.sh` via `PUT _plugins/_ism/policies/<id>` |
| `alerting-monitors/*.json` | Handcrafted OpenSearch Alerting monitor definitions | `bootstrap.sh` via `_plugins/_alerting/monitors` |
| `anomaly-detectors/*.json` | Handcrafted OpenSearch Anomaly Detection detector definitions | `bootstrap.sh` via `_plugins/_anomaly_detection/detectors` |
| `patch-observability-plugin.sh` | n/a (handcrafted) | OSD Dockerfile at build time |
| `bootstrap.sh` | n/a | The `bootstrap` service entrypoint |
| `snapshot.sh` | n/a | Run manually on the host to refresh the files above |

## Workflows

### First-time setup on a new machine

```sh
cd observability
docker compose up -d
```

`docker compose up` will:

1. Build the customized OSD image (Dockerfile applies the Observability
   plugin patch so "View associated logs" emits double-quoted PPL values).
2. Start OpenSearch + OSD.
3. Run the `bootstrap` service once, which:
   - Waits for OS and OSD to be healthy.
   - Upserts each ISM policy under `ism-policies/`.
   - Imports `saved-objects.ndjson` with `overwrite=true`.
   - Writes `advanced-settings.json` to the live `config:<osd-version>` doc.
   - Imports `applications.ndjson` into `.opensearch-observability`.
   - Recreates Alerting monitors for trace errors, slow spans, log errors, and
     ingestion failures.
   - Recreates and starts the Anomaly Detection detectors (all high-cardinality,
     split per service/container): span latency, span error rate, span
     throughput, log volume, error-log volume, HTTP 5xx, container CPU, and
     container memory.
   - Forces `number_of_replicas=0` on current indices so the single-node
     Docker cluster stays green.

Bootstrap is idempotent — re-running `docker compose up` re-applies the
snapshot without duplicating objects.

### After you edit dashboards / Applications / settings / policies in the UI

Run the snapshot script from the host to capture the new state into the repo:

```sh
./observability/state/snapshot.sh
```

On Windows / PowerShell, use:

```powershell
.\observability\state\snapshot.ps1
```

Review the diff, commit, push. The next machine that pulls and runs
`docker compose up -d` from `observability/` gets the new state.

### Reverting the Observability plugin patch

The patch is applied at OSD image build time. To revert:

```sh
docker exec -u 0 looma-opensearch-dashboards sh -c '
D=/usr/share/opensearch-dashboards/plugins/observabilityDashboards/target/public
cp $D/observabilityDashboards.plugin.js.bak.original    $D/observabilityDashboards.plugin.js
cp $D/observabilityDashboards.plugin.js.gz.bak.original $D/observabilityDashboards.plugin.js.gz
[ -f $D/observabilityDashboards.plugin.js.br.bak.original ] && \
  cp $D/observabilityDashboards.plugin.js.br.bak.original $D/observabilityDashboards.plugin.js.br
'
docker restart looma-opensearch-dashboards
```

Or remove the `RUN /opt/patch-observability-plugin.sh` line in
`observability/opensearch-dashboards/Dockerfile` and rebuild.

## Caveats

- **Alert actions**: the monitor definitions intentionally have empty
  `actions` arrays. They surface trigger state in OpenSearch Dashboards; add
  notification channels later if you want email, Slack, webhook, etc.
- **Not included in the snapshot**: ingested data itself (traces, metrics,
  logs), Data Prepper internal state, OS index templates created by Data
  Prepper at runtime, Grafana dashboards (those live under
  `observability/grafana/`). A fresh machine starts with empty indices.
- **OSD version**: the `config:` doc id includes the OSD version. If you bump
  OSD past 3.6.0, the bootstrap will write the settings to the new doc id and
  the old one becomes stale (harmless, just clutter). You can re-snapshot
  after the upgrade to refresh.
- **Index pattern field caches**: the exported index patterns include a
  cached field list captured at snapshot time. On a fresh cluster with no
  data yet, the cached list is correct schema but may show "no data". OSD
  refreshes it the first time the pattern is opened.
