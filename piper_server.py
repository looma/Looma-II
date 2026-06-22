from __future__ import annotations

import os
import subprocess
import tempfile
import time
from pathlib import Path

from flask import Flask, Response, jsonify, request, send_file


# ---------------------------------------------------------------------------
# OpenTelemetry tracing (best-effort: if the libraries aren't installed the
# server still runs without instrumentation).
# ---------------------------------------------------------------------------

_tracer = None  # type: ignore[var-annotated]
_otel_enabled = False
try:
    from opentelemetry import trace  # type: ignore
    from opentelemetry.sdk.resources import Resource  # type: ignore
    from opentelemetry.sdk.trace import TracerProvider  # type: ignore
    from opentelemetry.sdk.trace.export import BatchSpanProcessor  # type: ignore
    from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter  # type: ignore
    from opentelemetry.instrumentation.flask import FlaskInstrumentor  # type: ignore

    _otlp_endpoint = os.environ.get(
        "OTEL_EXPORTER_OTLP_ENDPOINT",
        "http://looma-otel-collector:4318",
    ).rstrip("/")

    _resource = Resource.create({
        "service.name": os.environ.get("OTEL_SERVICE_NAME", "piper-tts"),
        "deployment.environment": os.environ.get("DEPLOYMENT_ENV", "looma"),
    })
    _provider = TracerProvider(resource=_resource)
    _provider.add_span_processor(
        BatchSpanProcessor(
            OTLPSpanExporter(endpoint=f"{_otlp_endpoint}/v1/traces")
        )
    )
    trace.set_tracer_provider(_provider)
    _tracer = trace.get_tracer("piper-tts")
    _otel_enabled = True
except Exception as _exc:  # pragma: no cover
    _tracer = None
    _otel_enabled = False


app = Flask(__name__)

if _otel_enabled:
    try:
        FlaskInstrumentor().instrument_app(app)  # type: ignore[name-defined]
    except Exception:
        pass

PIPER_BIN = os.environ.get("LOOMA_PIPER_BIN", "piper")
VOICE_DIR = Path(os.environ.get("LOOMA_PIPER_VOICE_DIR", "/usr/share/piper"))

# Piper uses the "low" quality voice models — smaller and faster than "medium".
# Nepali's lowest published quality is "x_low"; English (amy) uses "low".
DEFAULT_VOICE_EN = os.environ.get("LOOMA_PIPER_VOICE_EN", "en_US-amy-low.onnx")
DEFAULT_VOICE_NE = os.environ.get("LOOMA_PIPER_VOICE_NE", "ne_NP-google-x_low.onnx")


def _pick_voice(language: str) -> str:
    lang = (language or "").strip().lower()
    if lang in {"ne", "np", "native", "nep", "nepali"}:
        return DEFAULT_VOICE_NE
    return DEFAULT_VOICE_EN


def _resolve_model(voice: str) -> Path:
    voice = (voice or "").strip()
    p = Path(voice)
    if p.is_absolute():
        return p
    return VOICE_DIR / voice


@app.get("/health")
def health():
    try:
        model_en = _resolve_model(DEFAULT_VOICE_EN)
        model_ne = _resolve_model(DEFAULT_VOICE_NE)
        return jsonify(
            {
                "ok": True,
                "piper_bin": PIPER_BIN,
                "voice_dir": str(VOICE_DIR),
                "voices": {"en": str(model_en), "ne": str(model_ne)},
                "voices_exist": {"en": model_en.exists(), "ne": model_ne.exists()},
            }
        )
    except Exception as exc:
        return jsonify({"ok": False, "error": str(exc)}), 500


@app.post("/tts")
def tts():
    payload = request.get_json(silent=True) or {}
    text = (payload.get("text") or "").strip()
    if not text:
        return jsonify({"error": "Missing text"}), 400

    language = (payload.get("language") or "").strip()
    voice = (payload.get("voice") or "").strip() or _pick_voice(language)
    model_path = _resolve_model(voice)

    if not model_path.exists():
        return jsonify({"error": "Voice model not found", "voice": voice, "model_path": str(model_path)}), 400

    tmp = tempfile.NamedTemporaryFile(prefix="looma_piper_", suffix=".wav", delete=False)
    tmp_path = Path(tmp.name)
    tmp.close()

    try:
        # Wrap the actual TTS synthesis in its own span so latency, voice and
        # text length show up in OpenSearch Trace Analytics / Grafana.
        if _tracer is not None:
            _span_ctx = _tracer.start_as_current_span("piper.synthesize")
        else:
            class _Noop:
                def __enter__(self_inner):
                    class _S:
                        def set_attribute(self, *_a, **_kw): pass
                        def record_exception(self, *_a, **_kw): pass
                    return _S()
                def __exit__(self_inner, *_): return False
            _span_ctx = _Noop()
        with _span_ctx as span:
            try:
                span.set_attribute("piper.voice", voice)
                span.set_attribute("piper.model_path", str(model_path))
                span.set_attribute("piper.text_chars", len(text))
                span.set_attribute("piper.language", language or "")
            except Exception:
                pass
            t0 = time.time()
            proc = subprocess.run(
                [PIPER_BIN, "--model", str(model_path), "--output_file", str(tmp_path)],
                input=text,
                text=True,
                capture_output=True,
                timeout=120,
                check=False,
            )
            try:
                span.set_attribute("piper.duration_ms", int((time.time() - t0) * 1000))
                span.set_attribute("piper.returncode", int(proc.returncode))
                if tmp_path.exists():
                    span.set_attribute("piper.output_bytes", int(tmp_path.stat().st_size))
            except Exception:
                pass
        if proc.returncode != 0 or not tmp_path.exists() or tmp_path.stat().st_size <= 44:
            return (
                jsonify(
                    {
                        "error": "Piper synthesis failed",
                        "returncode": proc.returncode,
                        "stderr": (proc.stderr or "").strip()[:4000],
                        "stdout": (proc.stdout or "").strip()[:2000],
                    }
                ),
                500,
            )

        resp: Response = send_file(str(tmp_path), mimetype="audio/wav", as_attachment=False)
        resp.headers["Cache-Control"] = "no-store"
        return resp
    except subprocess.TimeoutExpired:
        return jsonify({"error": "Piper synthesis timed out"}), 504
    finally:
        try:
            if tmp_path.exists():
                tmp_path.unlink()
        except Exception:
            pass


if __name__ == "__main__":
    host = os.environ.get("LOOMA_PIPER_HOST", "127.0.0.1")
    port = int(os.environ.get("LOOMA_PIPER_PORT", "5002"))
    app.run(host=host, port=port)

