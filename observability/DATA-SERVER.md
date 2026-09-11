# Looma observability — data-server deployment

This is how to run the observability stack as a **standalone, dedicated
collection server**: one machine that every Looma box in the field (odroids,
or any future deployment target) ships its traces, logs and metrics to, so
data survives independently of any single box and is not lost when one is
reimaged. Modelled on the Artrackr observability data-server, which was
itself modelled on this stack — same idea, adapted to Looma's single
docker-compose.yml instead of a separate data-server/monitored-server split:
the odroid installer's `--remote-obs` flag already **is** Looma's
"monitored-server" side (see `deploy/odroid/README-ODROID.md`).

```
                         EVERY LOOMA BOX (odroid, --remote-obs <this-IP>)
                         ─────────────────────────────────────────────────
                         vector (docker logs)   ──┐
                         metricbeat ──(via vector)─┼── HTTP ──┐
                         app OTLP traces ──────────┼──────────┼── network ──┐
                                                                             │
                         ═══════════════════════════════════════════════════╪═══
                                                                             ▼
                         THIS MACHINE (docker-compose.data-server.yml)
                         ──────────────────────────────────────────────
                         otel-collector ──> data-prepper ──┐
                                                            ▼
                                                       opensearch ──> opensearch-dashboards
                                                            ▲                (Trace Analytics,
                         vector, metricbeat ───────────────┘                 Service Map, Discover)
                                                            │
                         prometheus <───────── /metrics ────┘
                              │
                              ▼
                         grafana

                         All of the above persisted on LOOMA_DATA_ROOT (/mnt/looma)
```

Every box sends **directly** to this stack's published ports — there is no
central Vector/Beats aggregator listening for forwarded traffic the way
Artrackr's data-server does. Each box's own Vector already does the parsing
and writes straight to `http://<this-host>:49200` (bulk HTTP), and each app's
OTel SDK writes straight to `http://<this-host>:4318` (OTLP/HTTP). This
overlay does not change any of that — see `deploy/odroid/README-ODROID.md`
(`--remote-obs`) and `observability/vector/vector.toml` for the sending side.

## What this overlay actually changes

Nothing about which containers run or how they talk to each other — only
**where the data lives**. The canonical `docker-compose.yml` keeps its
OpenSearch/Prometheus/Grafana/OTel volumes as plain Docker-managed volumes,
which is fine for a single Looma box's own on-box "full" profile (small,
disposable, reinstalled with the box). This overlay instead:

- Bind-mounts `looma_opensearch_data`, `looma_prometheus_data`,
  `looma_grafana_data` and `looma_otel_storage` onto a dedicated data disk
  (`LOOMA_DATA_ROOT`, default `/mnt/looma`) instead of Docker's own storage.
- Adds `looma_vector_buffer` (Vector's own checkpoint state — not persisted
  at all otherwise) and `looma_opensearch_snapshots` (a fs snapshot
  repository — does not exist at all outside this overlay).
- Gives OpenSearch `path.repo` so it can write to that snapshot repo, and
  `state/bootstrap.sh` (section 8) registers it plus a **daily Snapshot
  Management policy** (`looma-daily`: full snapshot at 02:00 UTC, keeps 30,
  minimum 7, up to 45 days) — the actual backup of the fleet's collected data.

## Deploy

```sh
cd observability
cp .env.example .env          # LOOMA_DATA_ROOT — defaults to /mnt/looma
mountpoint -q /mnt/looma || { echo "mount the Looma data disk at /mnt/looma first"; exit 1; }

# Pre-create each subdir with the OWNER the container inside expects — a
# bind mount Docker creates on demand is root:root 0755, and OpenSearch
# (uid 1000) / Grafana (uid 472) cannot write into that. otel/vector run as
# root in this stack, so they need no chown.
sudo mkdir -p /mnt/looma/{opensearch,snapshots,prometheus,grafana,otel,vector}
sudo chown 1000:1000 /mnt/looma/opensearch /mnt/looma/snapshots   # opensearch
sudo chown 472:472   /mnt/looma/grafana                           # grafana
sudo chown 65534:65534 /mnt/looma/prometheus                      # prometheus (nobody)

docker network create loomanet   # only if it doesn't exist yet
docker compose -f docker-compose.yml -f docker-compose.data-server.yml up -d --build
docker compose -f docker-compose.yml -f docker-compose.data-server.yml ps
```

First boot builds several images and pulls OpenSearch — give it a few
minutes. `opensearch-aliases` and `state` each run once and exit 0; `state`
must finish (ISM policies, rollover aliases, the snapshot repo) before
`data-prepper`/`vector` start writing, so give it a moment on a first-ever
`up`.

If this box already ran the plain (non-disk-backed) stack before and has real
data in the Docker-managed volumes, move it onto the disk first:

```sh
./scripts/migrate-volumes-to-disk.sh
```

It stops the stack, `rsync`s each volume's data onto `$LOOMA_DATA_ROOT`,
drops the old Docker-managed volume so Compose recreates it bind-backed, and
brings the stack back up. Safe to re-run — it skips a volume already
bind-backed at the target.

## Point the fleet at this server

On each Looma box:

```sh
sudo ./deploy/odroid/looma-installer.sh install --docker --remote-obs <this-server-LAN-IP> --box-name <box-name>
```

or pick **Observability → remote** in the installer's form and enter this
server's IP. See `deploy/odroid/README-ODROID.md` for the full flag/port
table, and `observability/vector/vector.toml` for how `box_name`/`box_ip` get
stamped onto every log and metric so the fleet is distinguishable in one
shared OpenSearch.

## UIs and ports

Same as the plain stack — this overlay changes storage, not networking. See
`observability/README.md` for the port table (Grafana `:43000`, OpenSearch
Dashboards `:45601`, OpenSearch HTTP `:49200`, OTLP gRPC/HTTP `:4317`/`:4318`,
…) and `deploy/odroid/README-ODROID.md` for which of those a remote box needs
reachable (`:4318` OTLP, `:49200` OpenSearch).

Every service already binds `0.0.0.0`, so this is reachable on the LAN as-is.
There is **no authentication anywhere in this stack** (OpenSearch runs with
`DISABLE_SECURITY_PLUGIN`, Grafana ships `admin/admin` with anonymous
viewers) — treat the network between the boxes and this server as trusted
(a private LAN/VPN), or firewall these ports to the boxes' own IPs before
exposing this machine any further.

## Retention

- OpenSearch: the same ISM policy as the plain stack (`state/bootstrap.sh`) —
  see `observability/state/ism-policies/looma-7day-delete.json` — plus the
  `retention` sidecar's daily delete-by-query.
- **New in this overlay**: a daily OpenSearch snapshot to
  `$LOOMA_DATA_ROOT/snapshots`, retained 30 days (minimum 7, maximum 45).
  Check status: `curl -s localhost:49200/_plugins/_sm/policies/looma-daily`.
- Prometheus TSDB retention is whatever `observability/prometheus/prometheus.yml`
  sets — unchanged by this overlay.
