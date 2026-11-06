#!/usr/bin/env python3
"""Looma stack status for the ESP8266 LED / 7-segment panel
============================================================

This watches the **Looma** stack (a separate app running its own containers
on this same host — `looma-*`), NOT Artrackr. It is the sibling of
`../fan-status/fan_status.py` (which drives Corsair fans for Artrackr's own
stack) but instead of pushing colours to OpenRGB itself, it serves a small
JSON summary over plain HTTP that the ESP8266 firmware (see
./looma_led_status/) polls over WiFi and renders on a 7-segment display + a
red/green LED strip.

One code per technology, in display-cycle order. The JSON `items` list is
the cycle: the firmware shows each code for a couple of seconds and colours
the strip to match.

  App
    H  web — Apache + PHP (looma-web)     GET {WEB_URL}
                                          green = HTTP 200..399, red = anything else
    d  database — MongoDB (looma-db)      TCP connect {MONGO_HOST}:{MONGO_PORT}
                                          green = accepts connections, red = refused
    t  TTS — Piper (looma-piper)          GET http://<container-ip>:{PIPER_PORT}/health
                                          green = ok + both voices present,
                                          yellow = up but voices missing, red = down
    S  semantic search (looma-search)     GET {SEARCH_URL}
                                          green = HTTP 200 + an open index, red = down
    A  AI assistant (looma-ai)            GET {AI_URL}
                                          green = HTTP 200, red = down / container
                                          exited (it is optional: an ABSENT container
                                          reports yellow, not red)
  Observability
    O  OpenSearch cluster health          GET {OS_URL}/_cluster/health
                                          the API's own status, except that a
                                          single-node cluster whose only unassigned
                                          shards are REPLICAS counts as green — a
                                          replica can never be placed on one node,
                                          so "yellow" there is permanent and says
                                          nothing about the data
    U  log/trace pipeline (looma-vector)  `docker inspect` State.Status
                                          green = running, red = anything else
    P  metrics (looma-prometheus)         GET http://<container-ip>:{PROM_PORT}{PROM_HEALTH_PATH}
                                          green = HTTP 200..399, red = anything else

Codes O/H/U/d/P keep the letters the original 5-signal firmware hard-codes,
so a panel that has not been re-flashed still shows those five correctly
(it looks codes up by name and ignores the ones it doesn't know).

A failed probe never crashes the loop — the reason is visible in the JSON
`detail` field and in stdout (journalctl).

Zero third-party dependencies: stdlib only, using the `docker` CLI already
on this host (the user running this must be in the `docker` group).

CLI:
    status_server.py            run the HTTP server + poll loop
    status_server.py --once     one poll of every signal, print JSON, exit
"""

from __future__ import annotations

import argparse
import json
import os
import socket
import sys
import subprocess
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

    web_url: str
    mongo_host: str
    mongo_port: int
    mongo_url: str
    piper_container: str
    piper_port: int
    piper_url: str
    search_url: str
    ai_container: str
    ai_url: str

    os_url: str
    vector_container: str
    prom_container: str
    prom_port: int
    prom_health_path: str

    up_max: int
    timeout: float
    docker_timeout: float
    poll_interval: float

    @staticmethod
    def from_env() -> "Config":
        return Config(
            http_host=_env("LOOMA_LED_HTTP_HOST", "0.0.0.0"),
            http_port=_env_int("LOOMA_LED_HTTP_PORT", 38070),
            web_url=_env("LOOMA_LED_WEB_URL", "http://localhost:48080/"),
            mongo_host=_env("LOOMA_LED_MONGO_HOST", "localhost"),
            mongo_port=_env_int("LOOMA_LED_MONGO_PORT", 47017),
            mongo_url=_env("LOOMA_LED_MONGO_URL", ""),
            piper_container=_env("LOOMA_LED_PIPER_CONTAINER", "looma-piper"),
            piper_port=_env_int("LOOMA_LED_PIPER_PORT", 5002),
            piper_url=_env("LOOMA_LED_PIPER_URL", ""),
            search_url=_env("LOOMA_LED_SEARCH_URL", "http://localhost:46333/health"),
            ai_container=_env("LOOMA_LED_AI_CONTAINER", "looma-ai"),
            ai_url=_env("LOOMA_LED_AI_URL", "http://localhost:8089/health"),
            os_url=_env("LOOMA_LED_OS_URL", "http://localhost:49200").rstrip("/"),
            vector_container=_env("LOOMA_LED_VECTOR_CONTAINER", "looma-vector"),
            prom_container=_env("LOOMA_LED_PROM_CONTAINER", "looma-prometheus"),
            prom_port=_env_int("LOOMA_LED_PROM_PORT", 9091),
            prom_health_path=_env("LOOMA_LED_PROM_HEALTH_PATH", "/-/healthy"),
            up_max=_env_int("LOOMA_LED_UP_MAX", 399),
            timeout=_env_float("LOOMA_LED_TIMEOUT", 5.0),
            docker_timeout=_env_float("LOOMA_LED_DOCKER_TIMEOUT", 5.0),
            poll_interval=_env_float("LOOMA_LED_POLL_INTERVAL", 10.0),
        )


# --------------------------------------------------------------------------- #
# tiny helpers
# --------------------------------------------------------------------------- #
def _http(url: str, timeout: float) -> tuple[int, bytes]:
    """(status, body) — HTTP errors are returned, not raised."""
    req = urllib.request.Request(
        url, headers={"User-Agent": _env("LOOMA_LED_USER_AGENT", "looma-ledstatus/2.0"), "Accept": "application/json"}
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status, resp.read()
    except urllib.error.HTTPError as exc:
        return exc.code, b""


def _http_json(url: str, timeout: float) -> dict:
    code, body = _http(url, timeout)
    if code != 200:
        raise RuntimeError(f"HTTP {code}")
    return json.loads(body.decode("utf-8"))


def _run(argv: list[str], timeout: float) -> str:
    return subprocess.run(
        argv, capture_output=True, text=True, timeout=timeout, check=True
    ).stdout


def _container_state(name: str, cfg: Config) -> str | None:
    """`running`, `exited (137)`, ... or None when the container doesn't exist."""
    try:
        out = _run(
            ["docker", "inspect", "-f", "{{.State.Status}} {{.State.ExitCode}}", name],
            cfg.docker_timeout,
        ).split()
    except subprocess.CalledProcessError:
        return None
    if not out:
        return None
    return out[0] if out[0] == "running" else f"{out[0]} ({out[1]})"


def _container_ip(name: str, cfg: Config) -> str:
    return _run(
        [
            "docker", "inspect", "-f",
            "{{range .NetworkSettings.Networks}}{{.IPAddress}} {{end}}", name,
        ],
        cfg.docker_timeout,
    ).split()[0]


def _http_up(url: str, cfg: Config) -> tuple[str, str]:
    try:
        code, _ = _http(url, cfg.timeout)
    except Exception as exc:  # noqa: BLE001
        return "red", f"{exc.__class__.__name__}: {exc}"[:80]
    if 200 <= code <= cfg.up_max:
        return "green", f"HTTP {code}"
    return "red", f"HTTP {code}"


# --------------------------------------------------------------------------- #
# Readings — app
# --------------------------------------------------------------------------- #
def read_web(cfg: Config) -> tuple[str, str]:
    return _http_up(cfg.web_url, cfg)


def read_mongo(cfg: Config) -> tuple[str, str]:
    # A remote box keeps Mongo on loopback, so read a known dictionary word
    # through its PHP instead. Only a returned `_id` proves a real document was
    # read: a word that isn't found still answers HTTP 200 with a stub.
    if cfg.mongo_url:
        try:
            body = _http_json(cfg.mongo_url, cfg.timeout)
        except Exception as exc:  # noqa: BLE001
            return "red", f"{exc.__class__.__name__}: {exc}"[:80]
        if isinstance(body, dict) and body.get("_id"):
            return "green", "document read"
        return "red", "no document returned"
    try:
        with socket.create_connection((cfg.mongo_host, cfg.mongo_port), timeout=cfg.timeout):
            return "green", f"accepting on :{cfg.mongo_port}"
    except OSError as exc:
        return "red", f"{exc.__class__.__name__}: {exc}"[:80]


def read_piper(cfg: Config) -> tuple[str, str]:
    # Local Piper isn't published to the host, so reach it on its Docker-network
    # IP; a remote box's Piper is reached directly at LOOMA_LED_PIPER_URL.
    try:
        url = cfg.piper_url
        if not url:
            url = f"http://{_container_ip(cfg.piper_container, cfg)}:{cfg.piper_port}/health"
        body = _http_json(url, cfg.timeout)
    except Exception as exc:  # noqa: BLE001
        return "red", f"{exc.__class__.__name__}: {exc}"[:80]
    if not body.get("ok"):
        return "red", "health ok=false"
    voices = body.get("voices_exist") or {}
    if voices and not all(voices.values()):
        missing = ",".join(k for k, v in voices.items() if not v)
        return "yellow", f"voice missing: {missing}"
    return "green", f"{body.get('voice_count', '?')} voices"


def read_search(cfg: Config) -> tuple[str, str]:
    try:
        body = _http_json(cfg.search_url, cfg.timeout)
    except Exception as exc:  # noqa: BLE001
        return "red", f"{exc.__class__.__name__}: {exc}"[:80]
    if body.get("last_open_error"):
        return "red", f"index: {body['last_open_error']}"[:80]
    return "green", f"{body.get('doc_count', '?')} docs"


def read_ai(cfg: Config) -> tuple[str, str]:
    # Blank container = looma-ai is on a remote box, so only its URL can be checked.
    if not cfg.ai_container:
        return _http_up(cfg.ai_url, cfg)
    state = _container_state(cfg.ai_container, cfg)
    if state is None:
        return "yellow", "not installed"
    if state != "running":
        return "red", state
    return _http_up(cfg.ai_url, cfg)


# --------------------------------------------------------------------------- #
# Readings — observability
# --------------------------------------------------------------------------- #
def read_opensearch(cfg: Config) -> tuple[str, str]:
    try:
        body = _http_json(f"{cfg.os_url}/_cluster/health", cfg.timeout)
    except Exception as exc:  # noqa: BLE001
        return "red", f"unreachable: {exc.__class__.__name__}"
    status = str(body.get("status", "")).lower()
    if status != "yellow" or body.get("number_of_nodes") != 1:
        return (status, status) if status in ("green", "red") else ("yellow", status or "?")
    # Single node: yellow is permanent if only replicas are unassigned.
    try:
        shards = _http_json(f"{cfg.os_url}/_cat/shards?format=json&h=prirep,state", cfg.timeout)
    except Exception as exc:  # noqa: BLE001
        return "yellow", f"yellow (shards unreadable: {exc.__class__.__name__})"
    unassigned = [s for s in shards if s.get("state") != "STARTED"]
    if all(s.get("prirep") == "r" for s in unassigned):
        return "green", f"yellow: {len(unassigned)} replicas unplaceable on 1 node"
    return "yellow", "primary shards not started"


def read_vector(cfg: Config) -> tuple[str, str]:
    state = _container_state(cfg.vector_container, cfg)
    if state == "running":
        return "green", "running"
    return "red", state or "missing"


def read_prometheus(cfg: Config) -> tuple[str, str]:
    try:
        ip = _container_ip(cfg.prom_container, cfg)
    except Exception as exc:  # noqa: BLE001
        return "red", f"no container IP: {exc.__class__.__name__}"
    return _http_up(f"http://{ip}:{cfg.prom_port}{cfg.prom_health_path}", cfg)


# (code, label, reader) — the display cycle, in order.
SIGNALS = (
    ("H", "web", read_web),
    ("d", "mongodb", read_mongo),
    ("t", "tts-piper", read_piper),
    ("S", "search", read_search),
    ("A", "ai", read_ai),
    ("O", "opensearch", read_opensearch),
    ("U", "vector", read_vector),
    ("P", "prometheus", read_prometheus),
)


# --------------------------------------------------------------------------- #
# Poll loop + shared state
# --------------------------------------------------------------------------- #
class Status:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._items = {
            code: {"label": label, "color": "yellow", "detail": "starting"}
            for code, label, _ in SIGNALS
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


def poll_all(cfg: Config, status: Status) -> None:
    for code, _label, fn in SIGNALS:
        try:
            colour, detail = fn(cfg)
        except Exception as exc:  # noqa: BLE001
            colour, detail = "yellow", f"error: {exc.__class__.__name__}"
        status.set(code, colour, detail)


def poll_loop(cfg: Config, status: Status) -> None:
    while not _STOP:
        started = time.monotonic()
        poll_all(cfg, status)
        snap = status.snapshot()["items"]
        print(
            "looma-ledstatus: " + " ".join(f"{i['code']}={i['color']}" for i in snap),
            flush=True,
        )
        elapsed = time.monotonic() - started
        _sleep_until(started + max(cfg.poll_interval, elapsed))


def _sleep_until(deadline: float) -> None:
    while not _STOP and time.monotonic() < deadline:
        time.sleep(min(0.5, max(0.0, deadline - time.monotonic())))


def make_handler(status: Status):
    class Handler(BaseHTTPRequestHandler):
        def log_message(self, fmt, *args):  # noqa: A002 - silence default access log
            pass

        def do_GET(self) -> None:  # noqa: N802
            if self.path.rstrip("/") in ("", "/status"):
                # Default json.dumps separators (", " / ": ") on purpose: the
                # firmware finds each entry by the literal `"code": "X"`.
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
    threading.Thread(target=poll_loop, args=(cfg, status), daemon=True).start()
    server = ThreadingHTTPServer((cfg.http_host, cfg.http_port), make_handler(status))
    print(
        f"looma-ledstatus: serving http://{cfg.http_host}:{cfg.http_port}/status "
        f"(poll={cfg.poll_interval}s, signals={''.join(c for c, _, _ in SIGNALS)})",
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
    poll_all(cfg, status)
    print(json.dumps(status.snapshot(), indent=2))
    return 0


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description="Looma stack status for the ESP8266 LED panel")
    parser.add_argument("--once", action="store_true", help="one poll of every signal, print JSON, exit")
    args = parser.parse_args(argv)
    cfg = Config.from_env()
    if args.once:
        return run_once(cfg)
    return run_server(cfg)


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
