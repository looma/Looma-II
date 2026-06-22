"""OpenTelemetry bootstrap for the looma-ai HTTP server.

Initializes a global tracer + auto-instruments downstream calls (pymongo,
urllib, requests, httpx). For the stdlib `http.server.BaseHTTPRequestHandler`
that this service uses we wrap `do_GET`/`do_POST`/`do_OPTIONS` manually so
each inbound request becomes a server span.

Configuration (all standard OTEL_* env vars):

    OTEL_SERVICE_NAME=looma-ai
    OTEL_EXPORTER_OTLP_ENDPOINT=http://looma-otel-collector:4318
    OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf
    OTEL_TRACES_EXPORTER=otlp

Import this module *before* the HTTP server starts (the server entrypoint
calls `init_tracing()` near the top of `looma_server.py`).
"""

from __future__ import annotations

import logging
import os
from typing import Optional

_TRACER = None
_METER = None
_METRICS_INITIALIZED = False
_INITIALIZED = False
_LOGS_INITIALIZED = False
_LOG = logging.getLogger(__name__)

# Pre-declared instruments (populated in init_metrics()). They are always
# importable so call sites can be unconditional and zero-cost when metrics
# are disabled.
INSTRUMENTS: dict = {}

# Tiny time-bounded cache so the ZVEC observable gauges sample the store at
# most once per ~10s no matter how many gauge callbacks fire.
_ZVEC_CACHE = {"t": 0.0, "data": {}}
_ZVEC_COLL = {"handle": None}


def _zvec_sample() -> dict:
    """Read ZVEC vector-store state directly (filesystem + sqlite + the zvec
    library). Self-contained — needs no wiring from looma_server, so it cannot
    be defeated by import-order or module-aliasing issues."""
    import os as _os
    import sqlite3 as _sql
    db_path = _os.environ.get("LOOMA_INDEX_DB", "data/index/looma.db")
    coll_path = _os.environ.get("LOOMA_ZVEC_PATH", "data/zvec/curriculum_chunks")
    s: dict = {}
    try:
        s["zvec_ready"] = 1.0 if _os.path.exists(coll_path) else 0.0
    except Exception:
        s["zvec_ready"] = 0.0
    try:
        if _ZVEC_COLL["handle"] is None:
            import zvec  # noqa: WPS433
            _ZVEC_COLL["handle"] = zvec.open(path=coll_path)
        coll = _ZVEC_COLL["handle"]
        s["zvec_docs"] = float(int(getattr(getattr(coll, "stats", None), "doc_count", 0) or 0))
    except Exception:
        _ZVEC_COLL["handle"] = None
    try:
        conn = _sql.connect(db_path, timeout=0.5)
        for key, table in (("sqlite_chunks", "chunks"),
                           ("sqlite_documents", "documents"),
                           ("sqlite_chapters", "chapters")):
            try:
                s[key] = float(int(conn.execute("SELECT COUNT(*) FROM " + table).fetchone()[0]))
            except Exception:
                pass
        conn.close()
    except Exception:
        pass
    return s


def _zvec_sample_cached() -> dict:
    import time as _tm
    now = _tm.time()
    if now - _ZVEC_CACHE["t"] > 10.0:
        _ZVEC_CACHE["data"] = _zvec_sample()
        _ZVEC_CACHE["t"] = now
    return _ZVEC_CACHE["data"]


def _truthy(name: str, default: str = "1") -> bool:
    return (os.environ.get(name, default) or "").strip().lower() in {"1", "true", "yes", "on"}


def init_tracing(service_name: Optional[str] = None) -> None:
    """Idempotent OpenTelemetry bootstrap. Safe to call multiple times."""
    global _TRACER, _INITIALIZED
    if _INITIALIZED:
        return
    if not _truthy("OTEL_ENABLED", "1"):
        _INITIALIZED = True
        return

    try:
        from opentelemetry import trace
        from opentelemetry.exporter.otlp.proto.http.trace_exporter import (
            OTLPSpanExporter,
        )
        from opentelemetry.sdk.resources import Resource
        from opentelemetry.sdk.trace import TracerProvider
        from opentelemetry.sdk.trace.export import BatchSpanProcessor
    except Exception as exc:  # pragma: no cover
        _LOG.warning("OpenTelemetry SDK unavailable; tracing disabled: %s", exc)
        _INITIALIZED = True
        return

    svc = service_name or os.environ.get("OTEL_SERVICE_NAME") or "looma-ai"
    endpoint = os.environ.get(
        "OTEL_EXPORTER_OTLP_TRACES_ENDPOINT"
    ) or os.environ.get(
        "OTEL_EXPORTER_OTLP_ENDPOINT"
    ) or "http://looma-otel-collector:4318"
    if endpoint and not endpoint.endswith("/v1/traces") and "://" in endpoint:
        # OTLP/HTTP traces always end in /v1/traces.
        endpoint = endpoint.rstrip("/") + "/v1/traces"

    resource = Resource.create({
        "service.name": svc,
        "service.namespace": "looma",
        "deployment.environment": os.environ.get("LOOMA_ENV", "local"),
    })
    provider = TracerProvider(resource=resource)
    provider.add_span_processor(BatchSpanProcessor(OTLPSpanExporter(endpoint=endpoint)))
    trace.set_tracer_provider(provider)
    _TRACER = trace.get_tracer(svc)

    # Auto-instrument the downstream libraries this service uses.
    _safe_instrument("opentelemetry.instrumentation.pymongo", "PymongoInstrumentor")
    _safe_instrument("opentelemetry.instrumentation.urllib", "URLLibInstrumentor")
    _safe_instrument("opentelemetry.instrumentation.urllib3", "URLLib3Instrumentor")
    _safe_instrument("opentelemetry.instrumentation.requests", "RequestsInstrumentor")
    _safe_instrument("opentelemetry.instrumentation.httpx", "HTTPXClientInstrumentor")
    _safe_instrument("opentelemetry.instrumentation.logging", "LoggingInstrumentor")

    _instrument_basehttp()
    _init_otel_logs()
    init_metrics(svc)
    _INITIALIZED = True
    _LOG.info("OpenTelemetry initialized: service=%s endpoint=%s", svc, endpoint)


def init_metrics(service_name: str) -> None:
    """Set up an OTLP metrics MeterProvider + a small library of instruments
    that the rest of looma-ai can use to record domain metrics.
    """
    global _METER, _METRICS_INITIALIZED, INSTRUMENTS
    if _METRICS_INITIALIZED:
        return
    if (os.environ.get("OTEL_METRICS_EXPORTER") or "").lower() == "none":
        _METRICS_INITIALIZED = True
        return
    try:
        from opentelemetry import metrics
        from opentelemetry.exporter.otlp.proto.http.metric_exporter import OTLPMetricExporter
        from opentelemetry.sdk.metrics import MeterProvider
        from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
        from opentelemetry.sdk.resources import Resource
    except Exception as exc:
        _LOG.debug("OTLP metrics SDK unavailable: %s", exc)
        _METRICS_INITIALIZED = True
        return

    endpoint = os.environ.get("OTEL_EXPORTER_OTLP_METRICS_ENDPOINT") or os.environ.get(
        "OTEL_EXPORTER_OTLP_ENDPOINT", "http://looma-otel-collector:4318",
    )
    if endpoint and "://" in endpoint and not endpoint.endswith("/v1/metrics"):
        endpoint = endpoint.rstrip("/") + "/v1/metrics"

    resource = Resource.create({
        "service.name": service_name,
        "service.namespace": "looma",
        "deployment.environment": os.environ.get("LOOMA_ENV", "local"),
    })
    reader = PeriodicExportingMetricReader(
        OTLPMetricExporter(endpoint=endpoint), export_interval_millis=15_000,
    )
    provider = MeterProvider(resource=resource, metric_readers=[reader])
    metrics.set_meter_provider(provider)
    _METER = metrics.get_meter("looma-ai")

    # Domain instruments
    INSTRUMENTS["search_calls"]      = _METER.create_counter("looma_search_calls_total",        unit="1",  description="Search invocations by mode")
    INSTRUMENTS["search_latency_ms"] = _METER.create_histogram("looma_search_latency_ms",       unit="ms", description="Search latency")
    INSTRUMENTS["search_results"]    = _METER.create_histogram("looma_search_results_count",    unit="1",  description="Number of search hits returned")
    INSTRUMENTS["gen_calls"]         = _METER.create_counter("looma_generation_calls_total",    unit="1",  description="Generation calls (lesson/quiz/summary/keywords/exam)")
    INSTRUMENTS["gen_latency_ms"]    = _METER.create_histogram("looma_generation_latency_ms",   unit="ms", description="Generation latency")
    INSTRUMENTS["chunks_used"]       = _METER.create_histogram("looma_chunks_used",             unit="1",  description="Number of chunks used in a generation call")
    # Per-endpoint instruments — populated by `traced_endpoint(...)`.
    INSTRUMENTS["endpoint_calls"]    = _METER.create_counter("looma_endpoint_calls_total",      unit="1",  description="HTTP endpoint invocations on looma-ai (status, route).")
    INSTRUMENTS["endpoint_latency_ms"] = _METER.create_histogram("looma_endpoint_latency_ms",   unit="ms", description="HTTP endpoint latency on looma-ai.")
    INSTRUMENTS["endpoint_errors"]   = _METER.create_counter("looma_endpoint_errors_total",     unit="1",  description="HTTP endpoint exceptions raised inside the handler.")
    # Domain-specific
    INSTRUMENTS["chat_calls"]        = _METER.create_counter("looma_chat_calls_total",          unit="1",  description="/chat and /rag_query invocations, by wh_kind.")
    INSTRUMENTS["chat_answer_chars"] = _METER.create_histogram("looma_chat_answer_chars",       unit="1",  description="Length of the answer returned by the chat model.")
    INSTRUMENTS["recommend_calls"]   = _METER.create_counter("looma_recommend_calls_total",     unit="1",  description="/recommend_after_score invocations, by mastered.")
    INSTRUMENTS["didyouknow_calls"]  = _METER.create_counter("looma_didyouknow_calls_total",    unit="1",  description="/did_you_know fact lookups.")
    INSTRUMENTS["chapter_status_calls"] = _METER.create_counter("looma_chapter_status_calls_total", unit="1", description="Chapter status / generated / chapters list calls.")
    INSTRUMENTS["resource_actions"]  = _METER.create_counter("looma_resource_actions_total",    unit="1",  description="replace_pdf / delete_resource / save_summary / save_keywords / publish_resources / rebuild_activities actions.")
    INSTRUMENTS["lesson_slides"]     = _METER.create_histogram("looma_lesson_slides_count",     unit="1",  description="Slide count of generated lessons.")
    INSTRUMENTS["exam_questions"]    = _METER.create_histogram("looma_exam_questions_count",    unit="1",  description="Number of questions rendered in /generate_exam.")
    INSTRUMENTS["quiz_questions"]    = _METER.create_histogram("looma_quiz_questions_count",    unit="1",  description="Number of questions rendered in /quiz_html.")
    INSTRUMENTS["vocab_questions"]   = _METER.create_histogram("looma_vocab_questions_count",   unit="1",  description="Number of questions rendered in /vocab_html.")
    INSTRUMENTS["wikipedia_calls"]   = _METER.create_counter("looma_wikipedia_calls_total",     unit="1",  description="Wikipedia REST fallbacks performed by the chat model.")
    INSTRUMENTS["dictionary_calls"]  = _METER.create_counter("looma_dictionary_calls_total",    unit="1",  description="Mongo dictionary lookups performed by chat / recommendations.")
    INSTRUMENTS["embed_calls"]       = _METER.create_counter("looma_embed_calls_total",         unit="1",  description="Embedding model invocations")
    INSTRUMENTS["embed_latency_ms"]  = _METER.create_histogram("looma_embed_latency_ms",        unit="ms", description="Embedding latency")
    INSTRUMENTS["recommendation_hits"] = _METER.create_counter("looma_recommendation_hits_total", unit="1", description="Resource recommendations served after a quiz/exam")
    INSTRUMENTS["pdf_extract_calls"] = _METER.create_counter("looma_pdf_extract_total",         unit="1",  description="PDF text extractions")
    INSTRUMENTS["pdf_extract_latency_ms"] = _METER.create_histogram("looma_pdf_extract_latency_ms", unit="ms", description="PDF extraction latency")
    INSTRUMENTS["http_inflight"]     = _METER.create_up_down_counter("looma_http_inflight",      unit="1",  description="In-flight HTTP requests")

    # ZVEC vector-store state — self-contained observable gauges. Each callback
    # samples the store directly (via _zvec_sample_cached) on every export
    # cycle, giving a live view of ZVEC independent of query traffic.
    try:
        from opentelemetry.metrics import Observation

        def _zvec_obs(stat_key):
            def _callback(_options):
                try:
                    val = _zvec_sample_cached().get(stat_key)
                    return [] if val is None else [Observation(float(val))]
                except Exception:
                    return []
            return _callback

        _METER.create_observable_gauge("looma_zvec_ready",            callbacks=[_zvec_obs("zvec_ready")],        unit="1", description="ZVEC curriculum vector store present on disk (1) or missing (0).")
        _METER.create_observable_gauge("looma_zvec_doc_count",        callbacks=[_zvec_obs("zvec_docs")],         unit="1", description="Vectors indexed in the ZVEC curriculum collection.")
        _METER.create_observable_gauge("looma_zvec_sqlite_chunks",    callbacks=[_zvec_obs("sqlite_chunks")],     unit="1", description="Source curriculum chunks in SQLite (ZVEC ingestion target).")
        _METER.create_observable_gauge("looma_zvec_sqlite_documents", callbacks=[_zvec_obs("sqlite_documents")],  unit="1", description="Source documents in SQLite.")
        _METER.create_observable_gauge("looma_zvec_sqlite_chapters",  callbacks=[_zvec_obs("sqlite_chapters")],   unit="1", description="Chapters in SQLite.")
    except Exception as exc:
        _LOG.debug("ZVEC observable gauges unavailable: %s", exc)

    _safe_instrument("opentelemetry.instrumentation.system_metrics", "SystemMetricsInstrumentor")
    _safe_instrument("opentelemetry.instrumentation.threading", "ThreadingInstrumentor")
    _safe_instrument("opentelemetry.instrumentation.sqlite3", "SQLite3Instrumentor")
    _safe_instrument("opentelemetry.instrumentation.flask", "FlaskInstrumentor")

    _METRICS_INITIALIZED = True
    _LOG.info("OpenTelemetry metrics initialized: %s", endpoint)


def record(name: str, value=1, **attrs):
    """Best-effort instrument recorder. Silently no-ops if metrics are off."""
    inst = INSTRUMENTS.get(name)
    if inst is None:
        return
    try:
        # Counters use add(); histograms / updown use add()/record() respectively.
        if hasattr(inst, "add"):
            inst.add(value, attributes=attrs or None)
        elif hasattr(inst, "record"):
            inst.record(value, attributes=attrs or None)
    except Exception:
        pass


def traced_endpoint(route: str, **extra_attrs):
    """Decorator: wrap any HTTP-handler-shaped callable in a span + metrics.

    Usage:
        @traced_endpoint('/quiz_html', kind='render')
        def _serve_quiz_html(self, q1, qint): ...

    The decorator:
      • opens a child span named `endpoint:<route>` with kind=INTERNAL,
      • increments `looma_endpoint_calls_total{route, status}`,
      • records `looma_endpoint_latency_ms{route}`,
      • records `looma_endpoint_errors_total{route, error}` on raise.

    All best-effort: if OpenTelemetry isn't loaded, the wrapper is a no-op.
    """
    def _wrap(fn):
        try:
            from opentelemetry import trace as _trace
        except Exception:
            _trace = None

        def inner(*args, **kwargs):
            import time as _t
            t0 = _t.time()
            tracer = None
            if _trace is not None:
                try:
                    tracer = _trace.get_tracer("looma-ai.endpoint")
                except Exception:
                    tracer = None
            cm = (tracer.start_as_current_span("endpoint:" + route)
                  if tracer is not None else _NullCM())
            status = "ok"
            err_name = None
            try:
                with cm as span:
                    if span is not None:
                        try:
                            span.set_attribute("http.route", route)
                            span.set_attribute("looma.endpoint", route)
                            for k, v in (extra_attrs or {}).items():
                                if v is not None:
                                    span.set_attribute(str(k), v)
                        except Exception:
                            pass
                    try:
                        return fn(*args, **kwargs)
                    except Exception as exc:
                        status = "error"
                        err_name = type(exc).__name__
                        try:
                            if span is not None:
                                span.record_exception(exc)
                        except Exception:
                            pass
                        raise
            finally:
                dt_ms = (_t.time() - t0) * 1000.0
                record("endpoint_calls", 1, route=route, status=status)
                record("endpoint_latency_ms", dt_ms, route=route, status=status)
                if status == "error":
                    record("endpoint_errors", 1, route=route, error=err_name or "Exception")
        try:
            inner.__name__ = getattr(fn, "__name__", "traced_endpoint")
        except Exception:
            pass
        return inner
    return _wrap


class _NullCM:
    def __enter__(self): return None
    def __exit__(self, *a): return False


def _safe_instrument(module: str, cls: str) -> None:
    try:
        mod = __import__(module, fromlist=[cls])
        getattr(mod, cls)().instrument()
    except Exception as exc:  # pragma: no cover
        _LOG.debug("Instrumentation %s.%s skipped: %s", module, cls, exc)


def _instrument_basehttp() -> None:
    """Wrap http.server.BaseHTTPRequestHandler so each request is a span."""
    from http import server as _hsrv
    from opentelemetry import trace
    from opentelemetry.propagate import extract
    from opentelemetry.trace import SpanKind

    if getattr(_hsrv.BaseHTTPRequestHandler, "_otel_wrapped", False):
        return

    tracer = trace.get_tracer("looma-ai.http")

    def _wrap(method_name: str):
        original = getattr(_hsrv.BaseHTTPRequestHandler, method_name, None)
        if original is None:
            return

        def wrapped(self, *args, **kwargs):
            path = getattr(self, "path", "") or "/"
            route = path.split("?", 1)[0]
            span_name = f"{method_name[3:].upper()} {route}"
            carrier = {}
            try:
                # email.message.Message -> dict-like
                carrier = {k: v for (k, v) in getattr(self, "headers", {}).items()}
            except Exception:  # pragma: no cover
                carrier = {}
            ctx = extract(carrier)
            with tracer.start_as_current_span(span_name, context=ctx, kind=SpanKind.SERVER) as span:
                try:
                    span.set_attribute("http.request.method", method_name[3:].upper())
                    span.set_attribute("url.path", route)
                    span.set_attribute("http.route", route)
                    span.set_attribute(
                        "client.address",
                        getattr(self, "client_address", ("",))[0],
                    )
                except Exception:  # pragma: no cover
                    pass
                try:
                    return original(self, *args, **kwargs)
                except Exception as exc:
                    span.record_exception(exc)
                    raise

        wrapped.__name__ = method_name
        setattr(_hsrv.BaseHTTPRequestHandler, method_name, wrapped)

    for m in ("do_GET", "do_POST", "do_OPTIONS", "do_PUT", "do_DELETE"):
        _wrap(m)

    # Best-effort status code attribution: BaseHTTPRequestHandler sends the
    # status via send_response(). Capture it on the current span.
    if not getattr(_hsrv.BaseHTTPRequestHandler, "_otel_send_response_wrapped", False):
        _orig_send_response = _hsrv.BaseHTTPRequestHandler.send_response

        def _wrapped_send_response(self, code, message=None):  # type: ignore[no-untyped-def]
            try:
                span = trace.get_current_span()
                if span and span.is_recording():
                    span.set_attribute("http.response.status_code", int(code))
            except Exception:  # pragma: no cover
                pass
            return _orig_send_response(self, code, message)

        _hsrv.BaseHTTPRequestHandler.send_response = _wrapped_send_response  # type: ignore[assignment]
        _hsrv.BaseHTTPRequestHandler._otel_send_response_wrapped = True  # type: ignore[attr-defined]
    _hsrv.BaseHTTPRequestHandler._otel_wrapped = True  # type: ignore[attr-defined]


def _init_otel_logs() -> None:
    """Export Python stdlib logs as OTLP logs (Data Prepper -> otel-events-*)."""
    global _LOGS_INITIALIZED
    if _LOGS_INITIALIZED:
        return

    if (os.environ.get("OTEL_LOGS_EXPORTER") or "").strip().lower() != "otlp":
        return

    try:
        from opentelemetry._logs import set_logger_provider
        from opentelemetry.exporter.otlp.proto.http._log_exporter import OTLPLogExporter
        from opentelemetry.sdk._logs import LoggerProvider, LoggingHandler
        from opentelemetry.sdk._logs.export import BatchLogRecordProcessor
        from opentelemetry.sdk.resources import Resource
    except Exception as exc:  # pragma: no cover
        _LOG.debug("OTLP logs exporter unavailable; skipping OTEL logs: %s", exc)
        return

    provider = LoggerProvider(resource=Resource.create({}))
    set_logger_provider(provider)
    provider.add_log_record_processor(BatchLogRecordProcessor(OTLPLogExporter()))

    root = logging.getLogger()
    root.addHandler(LoggingHandler(level=logging.NOTSET, logger_provider=provider))
    if root.level == logging.NOTSET:
        root.setLevel(logging.INFO)

    _LOGS_INITIALIZED = True


def get_tracer():
    return _TRACER
