"""
Tiny Docker → Prometheus exporter.

Polls `docker stats` for every running container, computes CPU% / memory /
network / IO deltas, and exposes them at :9417/metrics in Prometheus format.

Used because cAdvisor doesn't work reliably on Docker Desktop / WSL2 (it
relies on filesystem paths Docker Desktop doesn't expose).
"""
from __future__ import annotations

import os
import threading
import time
from http.server import BaseHTTPRequestHandler, HTTPServer

import docker
from prometheus_client import (
    CollectorRegistry,
    Gauge,
    generate_latest,
    CONTENT_TYPE_LATEST,
)


SCRAPE_INTERVAL = float(os.environ.get("DOCKER_STATS_INTERVAL", "10"))
HTTP_PORT = int(os.environ.get("DOCKER_STATS_PORT", "9417"))
REGISTRY = CollectorRegistry()

LABEL_NAMES = ["name", "image"]

# Use the same metric names cAdvisor exposes so existing dashboards
# (Grafana Container dashboards, panels) keep working without changes.
G_CPU = Gauge(
    "container_cpu_usage_seconds_total",
    "Cumulative container CPU time (seconds).",
    LABEL_NAMES,
    registry=REGISTRY,
)
G_MEM_RSS = Gauge(
    "container_memory_rss",
    "Resident set size of the container, in bytes.",
    LABEL_NAMES,
    registry=REGISTRY,
)
G_MEM_USAGE = Gauge(
    "container_memory_usage_bytes",
    "Current memory usage of the container, in bytes.",
    LABEL_NAMES,
    registry=REGISTRY,
)
G_MEM_LIMIT = Gauge(
    "container_spec_memory_limit_bytes",
    "Container memory limit in bytes (0 = unbounded).",
    LABEL_NAMES,
    registry=REGISTRY,
)
G_NET_RX = Gauge(
    "container_network_receive_bytes_total",
    "Cumulative bytes received over the network.",
    LABEL_NAMES,
    registry=REGISTRY,
)
G_NET_TX = Gauge(
    "container_network_transmit_bytes_total",
    "Cumulative bytes transmitted over the network.",
    LABEL_NAMES,
    registry=REGISTRY,
)
G_FS_READ = Gauge(
    "container_fs_reads_bytes_total",
    "Cumulative bytes read from block I/O.",
    LABEL_NAMES,
    registry=REGISTRY,
)
G_FS_WRITE = Gauge(
    "container_fs_writes_bytes_total",
    "Cumulative bytes written to block I/O.",
    LABEL_NAMES,
    registry=REGISTRY,
)
G_LAST_SEEN = Gauge(
    "container_last_seen",
    "Unix timestamp the exporter last collected stats for this container.",
    LABEL_NAMES,
    registry=REGISTRY,
)


def _cpu_seconds(stats: dict) -> float | None:
    try:
        v = stats["cpu_stats"]["cpu_usage"]["total_usage"]
        return float(v) / 1e9  # nanoseconds -> seconds
    except Exception:
        return None


def _net_totals(stats: dict) -> tuple[int, int]:
    rx = tx = 0
    nets = stats.get("networks") or {}
    for _, n in nets.items():
        rx += int(n.get("rx_bytes") or 0)
        tx += int(n.get("tx_bytes") or 0)
    return rx, tx


def _io_totals(stats: dict) -> tuple[int, int]:
    read = write = 0
    blkio = (stats.get("blkio_stats") or {}).get("io_service_bytes_recursive") or []
    for entry in blkio:
        op = (entry.get("op") or "").lower()
        v = int(entry.get("value") or 0)
        if op == "read":
            read += v
        elif op == "write":
            write += v
    return read, write


def _safe_image_tag(c: "docker.models.containers.Container") -> str:
    """Containers whose image was GC'd raise 404 on `.image`; treat as empty.
    Without this, ONE removed image fails the whole collection cycle and
    every cycle logs 'collect cycle error: 404 Not Found' until the
    container is recreated."""
    try:
        img = c.image
        if img and img.tags:
            return img.tags[0]
    except Exception:
        pass
    return ""


def collect_loop(client: docker.DockerClient) -> None:
    while True:
        try:
            for c in client.containers.list():
                try:
                    s = c.stats(stream=False)
                except Exception:
                    continue
                labels = {"name": c.name, "image": _safe_image_tag(c)}

                cpu = _cpu_seconds(s)
                if cpu is not None:
                    G_CPU.labels(**labels).set(cpu)

                mem = s.get("memory_stats") or {}
                if mem.get("usage") is not None:
                    G_MEM_USAGE.labels(**labels).set(int(mem["usage"]))
                rss = ((mem.get("stats") or {}).get("rss")
                       or (mem.get("stats") or {}).get("anon")
                       or mem.get("usage") or 0)
                G_MEM_RSS.labels(**labels).set(int(rss))
                if mem.get("limit") is not None:
                    # Treat absurdly large limits as "unbounded" (= 0).
                    lim = int(mem["limit"])
                    if lim > (1 << 62):
                        lim = 0
                    G_MEM_LIMIT.labels(**labels).set(lim)

                rx, tx = _net_totals(s)
                G_NET_RX.labels(**labels).set(rx)
                G_NET_TX.labels(**labels).set(tx)

                r, w = _io_totals(s)
                G_FS_READ.labels(**labels).set(r)
                G_FS_WRITE.labels(**labels).set(w)

                G_LAST_SEEN.labels(**labels).set(time.time())
        except Exception as exc:
            print(f"[docker-stats] collect cycle error: {exc}", flush=True)

        time.sleep(SCRAPE_INTERVAL)


class _Handler(BaseHTTPRequestHandler):
    def do_GET(self):  # noqa: N802
        if self.path != "/metrics":
            self.send_response(404)
            self.end_headers()
            return
        body = generate_latest(REGISTRY)
        self.send_response(200)
        self.send_header("Content-Type", CONTENT_TYPE_LATEST)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *_args, **_kwargs):  # silence default access log
        return


def main() -> None:
    client = docker.from_env()
    t = threading.Thread(target=collect_loop, args=(client,), daemon=True)
    t.start()
    print(f"[docker-stats] listening on :{HTTP_PORT}/metrics, interval={SCRAPE_INTERVAL}s", flush=True)
    HTTPServer(("0.0.0.0", HTTP_PORT), _Handler).serve_forever()


if __name__ == "__main__":
    main()
