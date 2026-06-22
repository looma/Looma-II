"""
Looma topology probe
====================

Emits synthetic OTel traces and metrics that describe the full Looma service
mesh on a fixed interval. The collector's service_graph connector + the
Data Prepper service-map pipeline pick these up and populate the OpenSearch
service map with every node and edge — including infrastructure services
(OpenSearch, Prometheus, Grafana, Vector, …) that don't normally
emit traces of their own.

How the map gets built
----------------------
For every edge (A -> B) in TOPOLOGY we emit, in the SAME trace:

  ResourceSpans for A (service.name=A):
    SERVER root span    "<A>.entrypoint"             (span.kind = SERVER, no parent)
    CLIENT child span   "<A> -> <B>"                 (span.kind = CLIENT, parent = root)
       + attribute peer.service=B

  ResourceSpans for B (service.name=B):
    SERVER child span   "<B>.handle"                 (span.kind = SERVER, parent = CLIENT)

That pattern is what the Data Prepper `service_map` processor expects: a
client-on-A / server-on-B pair sharing a traceId, where the server's
parentSpanId matches the client's spanId.

The probe also pings each service's known endpoint when reachable so that
the per-service health is reflected in real metrics (request_total /
request_duration_seconds) — handy for the OpenSearch Discover view.

This file is intentionally dependency-free: stdlib only, so the container
stays tiny.
"""

import json
import os
import secrets
import socket
import time
import urllib.request as ur
from urllib.error import URLError


OTLP_HTTP = os.environ.get('OTLP_HTTP_ENDPOINT', 'http://looma-otel-collector:4318')
TRACES_URL = OTLP_HTTP.rstrip('/') + '/v1/traces'
METRICS_URL = OTLP_HTTP.rstrip('/') + '/v1/metrics'
LOGS_URL = OTLP_HTTP.rstrip('/') + '/v1/logs'

INTERVAL_SEC = int(os.environ.get('LOOMA_PROBE_INTERVAL_SEC', '30'))
TIMEOUT_SEC = float(os.environ.get('LOOMA_PROBE_TIMEOUT_SEC', '10'))


# Full topology of the Looma stack. Each entry is:
#   (source_service, target_service, attrs)
# where `attrs` are extra attributes attached to the CLIENT span so the
# data-prepper service_map processor labels the edge correctly (db.system,
# http.method, rpc.system, messaging.system, …).
TOPOLOGY = [
    # --- browser tier ---
    ('looma-web-rum',               'looma-web',                     {'http.method': 'GET',    'http.route': '/'}),

    # --- application tier ---
    ('looma-web',                   'looma-db',                      {'db.system': 'mongodb',  'db.name': 'looma'}),
    ('looma-web',                   'looma-search',                  {'http.method': 'GET',    'http.route': '/search'}),
    ('looma-web',                   'looma-ai',                      {'http.method': 'GET',    'http.route': '/generate_exam'}),
    ('looma-web',                   'looma-otel-collector',          {'http.method': 'POST',   'http.route': '/v1/traces'}),

    # --- search tier ---
    ('looma-search',                'looma-db',                      {'db.system': 'mongodb',  'db.name': 'looma'}),
    ('looma-search',                'looma-otel-collector',          {'http.method': 'POST',   'http.route': '/v1/traces'}),

    # --- AI tier ---
    ('looma-ai',                    'looma-db',                      {'db.system': 'mongodb',  'db.name': 'looma'}),
    ('looma-ai',                    'looma-otel-collector',          {'http.method': 'POST',   'http.route': '/v1/traces'}),

    # --- collector → backends ---
    ('looma-otel-collector',        'looma-data-prepper',            {'rpc.system': 'grpc',    'rpc.service': 'opentelemetry.proto.collector.trace.v1.TraceService'}),
    ('looma-otel-collector',        'looma-opensearch',              {'http.method': 'POST',   'http.route': '/_bulk'}),

    # --- ingestion paths into OpenSearch ---
    ('looma-data-prepper',          'looma-opensearch',              {'http.method': 'POST',   'http.route': '/_bulk'}),
    ('looma-vector',                'looma-opensearch',              {'http.method': 'POST',   'http.route': '/_bulk'}),
    ('looma-metricbeat',            'looma-opensearch',              {'http.method': 'POST',   'http.route': '/_bulk'}),

    # --- Prometheus scrape targets (Prometheus -> exporters/exposers) ---
    ('looma-prometheus',            'looma-otel-collector',          {'http.method': 'GET',    'http.route': '/metrics'}),
    ('looma-prometheus',            'looma-docker-stats',            {'http.method': 'GET',    'http.route': '/metrics'}),
    ('looma-prometheus',            'looma-vector',                  {'http.method': 'GET',    'http.route': '/metrics'}),
    ('looma-prometheus',            'looma-grafana',                 {'http.method': 'GET',    'http.route': '/metrics'}),
    ('looma-prometheus',            'looma-data-prepper',            {'http.method': 'GET',    'http.route': '/metrics/prometheus'}),
    ('looma-prometheus',            'looma-opensearch',              {'http.method': 'GET',    'http.route': '/_prometheus/metrics'}),
    ('looma-prometheus',            'looma-metricbeat',              {'http.method': 'GET',    'http.route': '/stats'}),
    ('looma-prometheus',            'looma-ai',                      {'http.method': 'GET',    'http.route': '/metrics'}),
    ('looma-prometheus',            'looma-search',                  {'http.method': 'GET',    'http.route': '/metrics'}),

    # --- docker-stats exporter ---
    ('looma-docker-stats',          'looma-otel-collector',          {'http.method': 'POST',   'http.route': '/v1/metrics'}),

    # --- Grafana datasource queries ---
    ('looma-grafana',               'looma-prometheus',              {'http.method': 'POST',   'http.route': '/api/v1/query'}),
    ('looma-grafana',               'looma-opensearch',              {'http.method': 'POST',   'http.route': '/_search'}),

    # --- OpenSearch Dashboards ---
    ('looma-opensearch-dashboards', 'looma-opensearch',              {'http.method': 'POST',   'http.route': '/_search'}),
]


# Real health/scrape endpoints. The probe uses them to flip a synthetic
# `up{service=…}` metric so dashboards reflect each service's reachability
# from the same vantage point.
HEALTH_ENDPOINTS = {
    'looma-web':                  'http://looma-web:8080/home',
    'looma-ai':                   'http://looma-ai:8089/health',
    'looma-search':               'http://looma-search:46333/health',
    'looma-db':                   ('looma-db', 27017),                       # TCP
    'looma-otel-collector':       'http://looma-otel-collector:13133/',
    'looma-opensearch':           'http://looma-opensearch:9200/_cluster/health',
    'looma-opensearch-dashboards':'http://looma-opensearch-dashboards:5601/api/status',
    'looma-prometheus':           'http://looma-prometheus:9091/-/healthy',
    'looma-grafana':              'http://looma-grafana:3000/api/health',
    'looma-vector':               'http://looma-vector:8686/health',
    'looma-data-prepper':         'http://looma-data-prepper:4900/metrics/prometheus',
    'looma-metricbeat':           ('looma-metricbeat', 5066),                # TCP
    'looma-docker-stats':         'http://looma-docker-stats:9417/metrics',
}


# ----------------------------------------------------------------------
# OTLP/JSON helpers
# ----------------------------------------------------------------------
def now_nanos() -> int:
    return int(time.time() * 1e9)


def hex_id(n_bytes: int) -> str:
    return secrets.token_hex(n_bytes)


def otlp_id(hex_str: str) -> str:
    # The collector's OTLP/JSON receiver expects traceId/spanId as lowercase hex.
    return hex_str


def attr_str(key: str, value: str) -> dict:
    return {'key': key, 'value': {'stringValue': str(value)}}


def attr_bool(key: str, value: bool) -> dict:
    return {'key': key, 'value': {'boolValue': bool(value)}}


def attr_int(key: str, value: int) -> dict:
    return {'key': key, 'value': {'intValue': str(int(value))}}


COMMON_RESOURCE_ATTRS = [
    attr_str('service.namespace', 'looma'),
    attr_str('deployment.environment', os.environ.get('LOOMA_ENV', 'looma')),
    attr_bool('looma.topology_probe', True),
]


def make_resource(service_name: str) -> dict:
    return {
        'attributes': [attr_str('service.name', service_name)] + COMMON_RESOURCE_ATTRS
    }


def make_span(name: str, trace_b64: str, span_b64: str,
              parent_b64: str | None, kind: int,
              start_ns: int, end_ns: int,
              attrs: list[dict]) -> dict:
    out = {
        'traceId': trace_b64,
        'spanId': span_b64,
        'name': name,
        'kind': kind,
        'startTimeUnixNano': str(start_ns),
        'endTimeUnixNano': str(end_ns),
        'attributes': attrs + [
            attr_bool('looma.topology_probe', True),
        ],
        'status': {'code': 1},   # OK
    }
    if parent_b64:
        out['parentSpanId'] = parent_b64
    return out


def build_topology_payload(edges: list[tuple]) -> dict:
    resource_spans: list[dict] = []
    base_time = now_nanos()
    for i, (source, target, edge_attrs) in enumerate(edges):
        trace = hex_id(16)
        root_id = hex_id(8)
        client_id = hex_id(8)
        server_id = hex_id(8)
        start = base_time - 50_000_000 + i * 200_000   # ~50ms ago, staggered
        end = start + 5_000_000                          # 5ms span duration

        edge_attr_list = [attr_str(k, v) for k, v in edge_attrs.items()]
        client_attrs = edge_attr_list + [
            attr_str('peer.service', target),
            attr_str('server.address', target),
        ]

        # Source: SERVER root + CLIENT child
        root_span = make_span(
            f'{source}.entrypoint', otlp_id(trace), otlp_id(root_id), None,
            2, start, end,
            [attr_str('span.role', 'topology-root')]
        )
        client_span = make_span(
            f'{source} → {target}', otlp_id(trace), otlp_id(client_id), otlp_id(root_id),
            3, start + 500_000, end - 500_000,
            client_attrs
        )
        resource_spans.append({
            'resource': make_resource(source),
            'scopeSpans': [{
                'scope': {'name': 'looma.topology-probe', 'version': '1.0.0'},
                'spans': [root_span, client_span],
            }],
        })

        # Target: SERVER span as child of CLIENT (this is what creates the
        # service_map edge in data-prepper).
        server_span = make_span(
            f'{target}.handle', otlp_id(trace), otlp_id(server_id), otlp_id(client_id),
            2, start + 1_000_000, end - 1_000_000,
            [attr_str('span.role', 'topology-target')]
        )
        resource_spans.append({
            'resource': make_resource(target),
            'scopeSpans': [{
                'scope': {'name': 'looma.topology-probe', 'version': '1.0.0'},
                'spans': [server_span],
            }],
        })

    return {'resourceSpans': resource_spans}


def build_health_metrics_payload(results: dict[str, bool]) -> dict:
    now = now_nanos()
    # One gauge per service: looma_topology_up{service=…} = 1|0.
    data_points = []
    for service_name, is_up in sorted(results.items()):
        data_points.append({
            'asInt': str(1 if is_up else 0),
            'startTimeUnixNano': str(now - 60_000_000_000),
            'timeUnixNano': str(now),
            'attributes': [attr_str('looma.service', service_name)],
        })

    resource = {
        'attributes': [
            attr_str('service.name', 'looma-topology-probe'),
        ] + COMMON_RESOURCE_ATTRS,
    }
    return {
        'resourceMetrics': [{
            'resource': resource,
            'scopeMetrics': [{
                'scope': {'name': 'looma.topology-probe', 'version': '1.0.0'},
                'metrics': [{
                    'name': 'looma_topology_up',
                    'description': 'Reachability of each Looma service from the topology probe',
                    'unit': '1',
                    'gauge': {'dataPoints': data_points},
                }],
            }],
        }],
    }


def build_heartbeat_log_payload(results: dict[str, bool]) -> dict:
    now = now_nanos()
    log_records = []
    for service_name, is_up in sorted(results.items()):
        log_records.append({
            'timeUnixNano': str(now),
            'observedTimeUnixNano': str(now),
            'severityNumber': 9 if is_up else 17,  # 9=INFO, 17=ERROR
            'severityText': 'INFO' if is_up else 'ERROR',
            'body': {'stringValue': f'service={service_name} up={is_up}'},
            'attributes': [
                attr_str('looma.event', 'topology_heartbeat'),
                attr_str('looma.service', service_name),
                attr_bool('looma.up', is_up),
            ],
        })

    return {
        'resourceLogs': [{
            'resource': {
                'attributes': [
                    attr_str('service.name', 'looma-topology-probe'),
                ] + COMMON_RESOURCE_ATTRS,
            },
            'scopeLogs': [{
                'scope': {'name': 'looma.topology-probe', 'version': '1.0.0'},
                'logRecords': log_records,
            }],
        }],
    }


# ----------------------------------------------------------------------
# HTTP/TCP probing
# ----------------------------------------------------------------------
def probe_one(endpoint) -> bool:
    """Return True if the endpoint responds (HTTP 2xx/3xx or TCP open)."""
    if isinstance(endpoint, tuple):
        host, port = endpoint
        try:
            with socket.create_connection((host, port), timeout=TIMEOUT_SEC):
                return True
        except OSError:
            return False
    url = str(endpoint)
    try:
        req = ur.Request(url, headers={'User-Agent': 'looma-topology-probe/1.0'})
        with ur.urlopen(req, timeout=TIMEOUT_SEC) as r:
            return 200 <= r.status < 400
    except URLError:
        return False
    except Exception:
        return False


def probe_all() -> dict[str, bool]:
    return {svc: probe_one(ep) for svc, ep in HEALTH_ENDPOINTS.items()}


# ----------------------------------------------------------------------
# OTLP/HTTP transport
# ----------------------------------------------------------------------
def post_json(url: str, payload: dict) -> bool:
    try:
        data = json.dumps(payload).encode('utf-8')
        req = ur.Request(
            url, data=data, method='POST',
            headers={'Content-Type': 'application/json',
                     'User-Agent': 'looma-topology-probe/1.0'},
        )
        with ur.urlopen(req, timeout=TIMEOUT_SEC) as r:
            r.read()
        return True
    except Exception as e:
        print(f'[probe] POST {url} failed: {e}', flush=True)
        return False


def main() -> None:
    print(
        f'[probe] starting. edges={len(TOPOLOGY)} '
        f'health_endpoints={len(HEALTH_ENDPOINTS)} '
        f'interval={INTERVAL_SEC}s otlp={OTLP_HTTP}',
        flush=True,
    )
    while True:
        try:
            health = probe_all()
            up_count = sum(1 for v in health.values() if v)

            traces_ok = post_json(TRACES_URL, build_topology_payload(TOPOLOGY))
            metrics_ok = post_json(METRICS_URL, build_health_metrics_payload(health))
            logs_ok = post_json(LOGS_URL, build_heartbeat_log_payload(health))

            print(
                f'[probe] tick up={up_count}/{len(HEALTH_ENDPOINTS)} '
                f'traces={traces_ok} metrics={metrics_ok} logs={logs_ok}',
                flush=True,
            )
        except Exception as e:
            print(f'[probe] tick error: {e}', flush=True)
        time.sleep(INTERVAL_SEC)


if __name__ == '__main__':
    main()
