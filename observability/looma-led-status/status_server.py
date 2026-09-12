#!/usr/bin/env python3
"""Looma stack status for the ESP32 LED / 7-segment panel
==========================================================

This watches the **Looma** stack (a separate app running its own containers
on this same host — `looma-*`), NOT Artrackr. It is the sibling of
`../fan-status/fan_status.py` (which drives Corsair fans for Artrackr's own
stack) but instead of pushing colours to OpenRGB itself, it serves a small
JSON summary over plain HTTP that the ESP32 firmware (see ./firmware/)
polls over WiFi and renders on a 7-segment display + an RGB strip.

Signals, fixed order (matches the ESP32 display cycle):

    O  Looma OpenSearch cluster health   GET {OS_URL}/_cluster/health
                                          green/yellow/red = the API's own status
    H  looma.website reachability        GET {HEARTBEAT_URL}
                                          green = HTTP 200..399, red = anything else
    U  looma-vector container state      `docker inspect` State.Status
                                          green = running, red = anything else
    d  Size of looma_* Docker volumes    `docker run --rm busybox du -csb <volumes>`
                                          green/yellow/red vs DISK_WARN_GB/CRIT_GB
                                          (measured every DISK_POLL_INTERVAL — it
                                          spins a throwaway container, so it is not
                                          run on the fast poll loop)
    P  looma-prometheus health           GET http://<container-ip>:{PROM_PORT}{PROM_HEALTH_PATH}
                                          green = HTTP 200..399, red = anything else
                                          (not published to the host, so this resolves
                                          the container's own Docker-network IP first)

A missing/unreachable signal never crashes the loop — it just reports
"yellow" (unknown) and the reason is visible in the JSON `detail` field and
in stdout (journalctl).

Zero third-party dependencies: stdlib only, using the `docker` CLI already
on this host (the user running this must be in the `docker` group).

CLI:
    status_server.py            run the HTTP server + poll loops
    status_server.py --once     one poll of every signal, print JSON, exit
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer


# --------------------------------------------------------------------------- #
# Config
# --------------------------------------------------------------------------- #
def _env(name: str, default: str) -> str:
    return os.environ.get(name, default).strip()


def _env_int(name: str, default: int) -> int:
    try:
        return int(_env(name, str(default)))
    except ValueError:
        return default


def _env_float(name: str, default: float) -> float:
    try:
        return float(_env(name, str(default)))
    except ValueError:
        return default


@dataclass(frozen=True)
class Config:
    http_host: str
    http_port: int

    os_url: str
    os_timeout: float

    heartbeat_url: str
    heartbeat_up_max: int
    heartbeat_timeout: float

    vector_container: str
    docker_timeout: float

    prom_container: str
    prom_port: int
    prom_health_path: str
    prom_timeout: float

    volume_prefix: str
    disk_warn_gb: float
    disk_crit_gb: float
    disk_measure_timeout: float

    poll_interval: float
    disk_poll_interval: float

    @staticmethod
    def from_env() -> "Config":
        return Config(
            http_host=_env("LOOMA_LED_HTTP_HOST", "0.0.0.0"),
            http_port=_env_int("LOOMA_LED_HTTP_PORT", 38070),
            os_url=_env("LOOMA_LED_OS_URL", "http://localhost:49200").rstrip("/"),
            os_timeout=_env_float("LOOMA_LED_OS_TIMEOUT", 5.0),
            heartbeat_url=_env("LOOMA_LED_HEARTBEAT_URL", "https://looma.website"),
            heartbeat_up_max=_env_int("LOOMA_LED_HEARTBEAT_UP_MAX", 399),
            heartbeat_timeout=_env_float("LOOMA_LED_HEARTBEAT_TIMEOUT", 5.0),
            vector_container=_env("LOOMA_LED_VECTOR_CONTAINER", "looma-vector"),
            docker_timeout=_env_float("LOOMA_LED_DOCKER_TIMEOUT", 5.0),
            prom_container=_env("LOOMA_LED_PROM_CONTAINER", "looma-prometheus"),
            prom_port=_env_int("LOOMA_LED_PROM_PORT", 9091),
            prom_health_path=_env("LOOMA_LED_PROM_HEALTH_PATH", "/-/healthy"),
            prom_timeout=_env_float("LOOMA_LED_PROM_TIMEOUT", 5.0),
            volume_prefix=_env("LOOMA_LED_VOLUME_PREFIX", "looma_"),
            disk_warn_gb=_env_float("LOOMA_LED_DISK_WARN_GB", 5.0),
            disk_crit_gb=_env_float("LOOMA_LED_DISK_CRIT_GB", 10.0),
            disk_measure_timeout=_env_float("LOOMA_LED_DISK_MEASURE_TIMEOUT", 60.0),
            poll_interval=_env_float("LOOMA_LED_POLL_INTERVAL", 10.0),
            disk_poll_interval=_env_float("LOOMA_LED_DISK_POLL_INTERVAL", 300.0),
        )


# --------------------------------------------------------------------------- #
# tiny helpers
# --------------------------------------------------------------------------- #
def _http_json(url: str, timeout: float) -> dict:
    req = urllib.request.Request(
        url, headers={"User-Agent": "looma-ledstatus/1.0", "Accept": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def _run(argv: list[str], timeout: float) -> str:
    return subprocess.run(
        argv, capture_output=True, text=True, timeout=timeout, check=True
    ).stdout


# --------------------------------------------------------------------------- #
# Readings
# --------------------------------------------------------------------------- #
def read_opensearch(cfg: Config) -> tuple[str, str]:
    try:
        body = _http_json(f"{cfg.os_url}/_cluster/health", cfg.os_timeout)
    except Exception as exc:  # noqa: BLE001
        return "yellow", f"unreachable: {exc.__class__.__name__}"
    status = str(body.get("status", "")).lower()
    if status in ("green", "yellow", "red"):
        return status, status
    return "yellow", f"unexpected response: {body!r}"[:80]


def read_heartbeat(cfg: Config) -> tuple[str, str]:
    req = urllib.request.Request(
        cfg.heartbeat_url, headers={"User-Agent": "looma-ledstatus/1.0"}
    )
    try:
        with urllib.request.urlopen(req, timeout=cfg.heartbeat_timeout) as resp:
            code = resp.status
    except urllib.error.HTTPError as exc:
        code = exc.code
    except Exception as exc:  # noqa: BLE001
        return "red", f"{exc.__class__.__name__}: {exc}"[:80]
    if 200 <= code <= cfg.heartbeat_up_max:
        return "green", f"HTTP {code}"
    return "red", f"HTTP {code}"


def read_vector(cfg: Config) -> tuple[str, str]:
    try:
        out = _run(
            ["docker", "inspect", "-f", "{{.State.Status}}", cfg.vector_container],
            cfg.docker_timeout,
        ).strip()
    except Exception as exc:  # noqa: BLE001
        return "yellow", f"docker inspect failed: {exc.__class__.__name__}"
    if out == "running":
        return "green", "running"
    return "red", out or "unknown"


def read_disk(cfg: Config) -> tuple[str, str]:
    try:
        vol_out = _run(
            [
                "docker", "volume", "ls", "-q",
                "--filter", f"name=^{cfg.volume_prefix}",
            ],
            cfg.docker_timeout,
        )
    except Exception as exc:  # noqa: BLE001
        return "yellow", f"docker volume ls failed: {exc.__class__.__name__}"
    volumes = [v for v in vol_out.split() if v]
    if not volumes:
        return "yellow", "no looma_* volumes found"
    mount_args: list[str] = []
    targets: list[str] = []
    for v in volumes:
        target = f"/vols/{v}"
        mount_args += ["-v", f"{v}:{target}:ro"]
        targets.append(target)
    try:
        out = _run(
            [
                "docker", "run", "--rm", "--network", "none",
                *mount_args, "busybox", "du", "-csb", *targets,
            ],
            cfg.disk_measure_timeout,
        )
    except Exception as exc:  # noqa: BLE001
        return "yellow", f"du failed: {exc.__class__.__name__}"
    total_lines = [ln for ln in out.splitlines() if ln.strip().endswith("total")]
    if not total_lines:
        return "yellow", "du produced no total"
    try:
        total_bytes = int(total_lines[-1].split()[0])
    except (ValueError, IndexError):
        return "yellow", "du output unparseable"
    gb = total_bytes / (1024**3)
    if gb < cfg.disk_warn_gb:
        colour = "green"
    elif gb < cfg.disk_crit_gb:
        colour = "yellow"
    else:
        colour = "red"
    return colour, f"{gb:.2f} GB"


def read_prometheus(cfg: Config) -> tuple[str, str]:
    try:
        ip = _run(
            [
                "docker", "inspect", "-f",
                "{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}",
                cfg.prom_container,
            ],
            cfg.docker_timeout,
        ).strip()
    except Exception as exc:  # noqa: BLE001
        return "yellow", f"docker inspect failed: {exc.__class__.__name__}"
    if not ip:
        return "yellow", "no container IP (not running?)"
    url = f"http://{ip}:{cfg.prom_port}{cfg.prom_health_path}"
    req = urllib.request.Request(url, headers={"User-Agent": "looma-ledstatus/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=cfg.prom_timeout) as resp:
            code = resp.status
    except urllib.error.HTTPError as exc:
        code = exc.code
    except Exception as exc:  # noqa: BLE001
        return "red", f"{exc.__class__.__name__}: {exc}"[:80]
    if 200 <= code <= 399:
        return "green", f"HTTP {code}"
    return "red", f"HTTP {code}"


# --------------------------------------------------------------------------- #
# Poll loop + shared state
# --------------------------------------------------------------------------- #
class Status:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._items = {
            "O": {"label": "opensearch", "color": "yellow", "detail": "starting"},
            "H": {"label": "heartbeat", "color": "yellow", "detail": "starting"},
            "U": {"label": "vector", "color": "yellow", "detail": "starting"},
            "d": {"label": "disk", "color": "yellow", "detail": "starting"},
            "P": {"label": "prometheus", "color": "yellow", "detail": "starting"},
        }
        self._ts = 0.0

    def set(self, code: str, color: str, detail: str) -> None:
        with self._lock:
            self._items[code] = {
                "label": self._items[code]["label"],
                "color": color,
                "detail": detail,
            }
            self._ts = time.time()

    def snapshot(self) -> dict:
        with self._lock:
            items = [{"code": c, **v} for c, v in self._items.items()]
            return {"ts": int(self._ts), "items": items}


_STOP = False


def fast_loop(cfg: Config, status: Status) -> None:
    while not _STOP:
        started = time.monotonic()
        for code, fn in (
            ("O", read_opensearch), ("H", read_heartbeat),
            ("U", read_vector), ("P", read_prometheus),
        ):
            try:
                colour, detail = fn(cfg)
            except Exception as exc:  # noqa: BLE001
                colour, detail = "yellow", f"error: {exc.__class__.__name__}"
            status.set(code, colour, detail)
        print(
            f"looma-ledstatus: {' '.join(f'{c}={status.snapshot()['items'][i]['color']}' for i, c in enumerate('OHUP'))}",
            flush=True,
        )
        elapsed = time.monotonic() - started
        _sleep_until(started + max(cfg.poll_interval, elapsed))


def disk_loop(cfg: Config, status: Status) -> None:
    while not _STOP:
        started = time.monotonic()
        try:
            colour, detail = read_disk(cfg)
        except Exception as exc:  # noqa: BLE001
            colour, detail = "yellow", f"error: {exc.__class__.__name__}"
        status.set("d", colour, detail)
        print(f"looma-ledstatus: disk={colour} ({detail})", flush=True)
        _sleep_until(started + cfg.disk_poll_interval)


def _sleep_until(deadline: float) -> None:
    while not _STOP and time.monotonic() < deadline:
        time.sleep(min(0.5, max(0.0, deadline - time.monotonic())))


def make_handler(status: Status):
    class Handler(BaseHTTPRequestHandler):
        def log_message(self, fmt, *args):  # noqa: A002 - silence default access log
            pass

        def do_GET(self) -> None:  # noqa: N802
            if self.path.rstrip("/") in ("", "/status"):
                body = json.dumps(status.snapshot()).encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
            else:
                self.send_response(404)
                self.end_headers()

    return Handler


def run_server(cfg: Config) -> int:
    status = Status()
    threads = [
        threading.Thread(target=fast_loop, args=(cfg, status), daemon=True),
        threading.Thread(target=disk_loop, args=(cfg, status), daemon=True),
    ]
    for t in threads:
        t.start()
    server = ThreadingHTTPServer((cfg.http_host, cfg.http_port), make_handler(status))
    print(
        f"looma-ledstatus: serving http://{cfg.http_host}:{cfg.http_port}/status "
        f"(poll={cfg.poll_interval}s, disk_poll={cfg.disk_poll_interval}s)",
        flush=True,
    )
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        global _STOP
        _STOP = True
        server.shutdown()
    return 0


def run_once(cfg: Config) -> int:
    status = Status()
    for code, fn in (
        ("O", read_opensearch), ("H", read_heartbeat),
        ("U", read_vector), ("P", read_prometheus),
    ):
        colour, detail = fn(cfg)
        status.set(code, colour, detail)
    colour, detail = read_disk(cfg)
    status.set("d", colour, detail)
    print(json.dumps(status.snapshot(), indent=2))
    return 0


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description="Looma stack status for the ESP32 LED panel")
    parser.add_argument("--once", action="store_true", help="one poll of every signal, print JSON, exit")
    args = parser.parse_args(argv)
    cfg = Config.from_env()
    if args.once:
        return run_once(cfg)
    return run_server(cfg)


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
