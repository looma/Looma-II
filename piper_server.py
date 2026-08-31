from __future__ import annotations

"""Flask sidecar that wraps Piper TTS for Looma (looma-TTS.php calls it on :5002).

Three things matter here, in this order:

1. LATENCY. A classroom "Speak" press must start talking in about a second. The
   old version ran one `piper` process PER REQUEST, so every press paid the
   onnxruntime start-up + model load (seconds on an ODROID) before the first
   phoneme. This version keeps WARM piper processes (`--json-input`) that have
   the model already resident, caches the resulting WAVs, and pre-warms the two
   default voices at start-up.
2. CHOICE OF VOICE. /voices lists every model in the voice directory, expanding
   MULTI-SPEAKER models (the Nepali ne_NP-google models carry 18 speakers) into
   one selectable voice each, so Nepali speakers can audition them on the
   Reading Settings page and pick the default.
3. SPEED. Looma sends a `rate` (rate > 1 is faster); Piper takes a
   `length_scale` (larger is slower), so the two are reciprocal.
"""

import hashlib
import json
import logging
import os
import re
import shutil
import subprocess
import tempfile
import threading
import time
from collections import OrderedDict, deque
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


# Looma sends a *rate* (rate > 1 is faster, default 2/3 = deliberately slower
# than natural for Nepali classrooms). Piper instead takes a *length_scale*,
# where LARGER is SLOWER — so the two are reciprocal. Without this Piper ran at
# its built-in length_scale of 1.0, which is why it sounded rushed and why the
# speed chosen on the Reading Settings page had no audible effect.
DEFAULT_RATE = float(os.environ.get("LOOMA_PIPER_DEFAULT_RATE", "0.6667"))
MIN_LENGTH_SCALE = 0.5   # ~2x faster than natural
MAX_LENGTH_SCALE = 3.0   # ~3x slower than natural

# Silence Piper appends after each sentence. Looma already splits the text into
# one-sentence segments and plays them back to back, so a long tail here is just
# dead air the listener reads as lag.
#
# 0.05 rather than Piper's 0.2: those extra 0.15s are synthesized like any other
# audio, so they cost BOTH latency and silence. Measured at 357ms -> 318ms per
# sentence (11%) on x86 — and an ODROID, which synthesizes slower than real time,
# pays proportionally more. Raise it with LOOMA_PIPER_SENTENCE_SILENCE if a class
# wants a longer pause between sentences.
SENTENCE_SILENCE = os.environ.get("LOOMA_PIPER_SENTENCE_SILENCE", "0.05")

# Warm workers are what keep the first sentence under a second, but each one
# holds a whole model in RAM — so the pool is bounded and evicts the
# least-recently-used worker. One (voice, speed) pair = one worker.
MAX_WORKERS = max(1, int(os.environ.get("LOOMA_PIPER_MAX_WORKERS", "4")))

# Synthesized WAVs are cached on disk: re-reading the same sentence (the common
# classroom case — a teacher presses Speak again) then costs no synthesis at all.
CACHE_DIR = Path(os.environ.get("LOOMA_PIPER_CACHE_DIR", "/tmp/looma_piper_cache"))
MAX_CACHE_FILES = max(0, int(os.environ.get("LOOMA_PIPER_CACHE_FILES", "400")))

MAX_TEXT_LENGTH = int(os.environ.get("LOOMA_PIPER_MAX_TEXT", "2500"))

# How many voices a MULTI-SPEAKER model may contribute to the catalog. Piper
# publishes research corpora as single models with hundreds of speakers
# (en_US-libritts: 904), and the Reading Settings page lists one row per speaker
# — so without a cap the page grows to ~2000 rows. 24 keeps every speaker of the
# models a classroom uses (Nepali's ne_NP-google has 18) while trimming the tail.
MAX_SPEAKERS_LISTED = max(1, int(os.environ.get("LOOMA_PIPER_MAX_SPEAKERS", "24")))

# Warm workers are an OPTIMIZATION, never a dependency. If the warm path
# misbehaves on a box (an odd piper build, a wedged process), synthesis falls
# back to the plain one-process run that Looma used before — slower, but it
# SPEAKS. Two consecutive warm failures switch the whole server to that mode
# rather than making every sentence pay a timeout first.
# LOOMA_PIPER_WARM=0 turns warm workers off from the start.
WARM_ENABLED = os.environ.get("LOOMA_PIPER_WARM", "1") != "0"
WARM_TIMEOUT = float(os.environ.get("LOOMA_PIPER_WARM_TIMEOUT", "25"))
_warm_failures = 0
_WARM_FAILURE_LIMIT = 2

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [looma-piper] %(levelname)s %(message)s",
)
log = logging.getLogger("looma-piper")


def _note_warm_failure(reason: str) -> None:
    """Count a warm-path failure and fall back for good once it repeats."""
    global _warm_failures, WARM_ENABLED
    _warm_failures += 1
    log.warning("warm piper worker failed (%s/%s): %s",
                _warm_failures, _WARM_FAILURE_LIMIT, reason)
    if _warm_failures >= _WARM_FAILURE_LIMIT and WARM_ENABLED:
        WARM_ENABLED = False
        log.error(
            "disabling warm piper workers for this process - falling back to one "
            "process per request (slower, but speech keeps working). Restart the "
            "service to try warm mode again."
        )
        stop_all_workers()


def _length_scale_for(rate) -> str:
    try:
        rate = float(rate)
    except (TypeError, ValueError):
        rate = DEFAULT_RATE
    if not (0 < rate <= 2):
        rate = DEFAULT_RATE
    scale = 1.0 / rate
    scale = max(MIN_LENGTH_SCALE, min(MAX_LENGTH_SCALE, scale))
    # Two decimals: the handful of speeds the UI offers then collapse onto a
    # handful of workers/cache keys instead of one per floating-point wobble.
    return f"{scale:.2f}"


def _pick_voice(language: str) -> str:
    lang = (language or "").strip().lower()
    if lang in {"ne", "np", "native", "nep", "nepali"}:
        return DEFAULT_VOICE_NE
    return DEFAULT_VOICE_EN


# ---------------------------------------------------------------------------
# Voice ids
#
# A voice id is a model filename, optionally followed by "#<speaker>" for a
# multi-speaker model — e.g. "ne_NP-google-x_low.onnx#7". That keeps the whole
# choice in the single string Looma already stores in its tts-voice-* cookies.
# ---------------------------------------------------------------------------

_VOICE_ID_RE = re.compile(r"^([A-Za-z0-9_.+-]+?)(?:#(\d{1,4}))?$")


def _parse_voice_id(voice: str) -> tuple[str, int | None]:
    """Split a voice id into (model filename, speaker id or None)."""
    voice = (voice or "").strip()
    match = _VOICE_ID_RE.match(voice)
    if not match:
        return "", None

    model = match.group(1)
    if ".." in model or "/" in model or "\\" in model:
        return "", None
    if not model.endswith(".onnx"):
        model += ".onnx"

    speaker = int(match.group(2)) if match.group(2) is not None else None
    return model, speaker


def _resolve_model(model: str) -> Path:
    model = (model or "").strip()
    p = Path(model)
    if p.is_absolute():
        return p
    return VOICE_DIR / model


def _usable_voice(requested: str, language: str):
    """Resolve a requested voice to (voice id, model path, speaker), NEVER failing
    over a bad request when something else can read the text.

    A voice id reaches us from a cookie, so it easily outlives the model it names:
    a box re-imaged with fewer voices, a settings page filled in against a newer
    server, a hand-edited value. Refusing those means the Speak button goes
    silent with no explanation — so anything unusable falls back to the default
    voice for the language and Looma keeps reading. (None is returned only when
    even the defaults are missing, i.e. the voice directory is broken.)
    """
    candidates = []
    if requested:
        candidates.append(requested)
    fallback = _pick_voice(language)
    if fallback not in candidates:
        candidates.append(fallback)
    # A Nepali box missing its Nepali model should still read English aloud.
    for extra in (DEFAULT_VOICE_EN, DEFAULT_VOICE_NE):
        if extra not in candidates:
            candidates.append(extra)

    for index, candidate in enumerate(candidates):
        model, speaker = _parse_voice_id(candidate)
        if not model:
            continue
        model_path = _resolve_model(model)
        if not model_path.exists():
            continue

        # A speaker index from a different (or newer) model is clamped rather
        # than passed through, which piper would reject.
        speakers = _speaker_ids(_model_config(model_path))
        if speaker is not None and speakers and speaker not in speakers:
            speaker = speakers[0]
        elif speaker is not None and not speakers:
            speaker = None

        if index > 0 and requested:
            log.warning("voice %r is not available here - falling back to %s",
                        requested, model_path.name)
        return candidate, model_path, speaker

    log.error("no usable voice model in %s (asked for %r)", VOICE_DIR, requested)
    return requested, None, None


# ---------------------------------------------------------------------------
# Voice catalog
# ---------------------------------------------------------------------------

_CATALOG_LOCK = threading.Lock()
_catalog_cache: list[dict] = []
_catalog_stamp: tuple[float, int] | None = None

_QUALITY_LABEL = {
    "x_low": "fastest",
    "low": "fast",
    "medium": "better quality",
    "high": "best quality",
}

# ---------------------------------------------------------------------------
# THE VOICES LOOMA OFFERS  —  this list is the Reading Settings page
# ---------------------------------------------------------------------------
# Eight voices: four English, four Nepali. Everything installed but not named
# here is still perfectly usable by id (looma-TTS.php will happily synthesize
# with it) — it just is not put in front of a teacher.
#
# Curating is the whole point. Left to itself the catalog expands every model
# into one row per speaker, and the Nepali models are MULTI-SPEAKER: ne_NP-google
# carries 18 voices in one file, so the page listed 36 Nepali rows against 4
# English ones. Nobody picks a voice out of 36 rows called "voice 11 of 18".
#
# WHY THESE EIGHT, and what you may freely change:
#
#   English — four separate single-speaker models, two female, two male. Piper
#   ships no gender metadata for any voice (not in the .onnx.json, not in
#   voices.json, not in the MODEL_CARDs), so those labels come from the source
#   datasets and are written by hand here.
#
#   Nepali — three speakers of ne_NP-google plus ne_NP-chitwan. There is no
#   male Nepali voice to be had: ne_NP-google is trained on OpenSLR SLR43, whose
#   one download is `ne_np_female.zip`, "Nepali data from female speakers" — all
#   18 speakers are female. ne_NP-chitwan (OHF-Voice/voice-datasets, CC0) is the
#   only Nepali voice from any other dataset, and its speaker's gender is not
#   documented anywhere upstream. It is listed WITHOUT a gender label rather
#   than with a guessed one; listen to it and write the right word in.
#
#   The three google speaker numbers (#0, #6, #12) are spread across the 18 on
#   purpose and are NOT a judgement about how they sound — nobody has listened.
#   Audition all 18 with LOOMA_PIPER_VOICES_ALL=1 (below) and swap the numbers.
#
# Entries are (voice id, language family, label). A voice id is a model
# filename, plus "#<speaker>" for one speaker of a multi-speaker model.
CURATED_VOICES: list[tuple[str, str, str]] = [
    ("en_US-amy-low.onnx",       "en", "English (US) — Amy (female)"),
    ("en_US-lessac-low.onnx",    "en", "English (US) — Lessac (female)"),
    ("en_US-ryan-low.onnx",      "en", "English (US) — Ryan (male)"),
    ("en_GB-alan-low.onnx",      "en", "English (UK) — Alan (male)"),
    ("ne_NP-google-x_low.onnx#0",  "ne", "Nepali — voice 1 (female)"),
    ("ne_NP-google-x_low.onnx#6",  "ne", "Nepali — voice 2 (female)"),
    ("ne_NP-google-x_low.onnx#12", "ne", "Nepali — voice 3 (female)"),
    ("ne_NP-chitwan-medium.onnx",  "ne", "Nepali — Chitwan"),
]

# Show every installed voice instead of the eight above — the way to AUDITION
# all 18 Nepali speakers before choosing which three to list. Not a mode to
# leave a classroom box in.
VOICES_SHOW_ALL = os.environ.get("LOOMA_PIPER_VOICES_ALL", "0").strip().lower() in {"1", "true", "yes", "on"}


def _model_config(model_path: Path) -> dict:
    """Read a model's sidecar .onnx.json, or {} when it is missing/unreadable."""
    config_path = Path(str(model_path) + ".json")
    try:
        with config_path.open(encoding="utf-8") as handle:
            return json.load(handle) or {}
    except Exception:
        return {}


def _language_of(model_path: Path, config: dict) -> tuple[str, str]:
    """Return (family, human label) for a model, e.g. ("ne", "Nepali (ne_NP)")."""
    language = config.get("language") or {}
    family = (language.get("family") or "").strip().lower()
    code = (language.get("code") or "").strip()
    name = (language.get("name_english") or "").strip()

    if not family:
        # No sidecar config: piper filenames start with the locale, e.g.
        # "ne_NP-google-x_low.onnx".
        stem = model_path.name.split("-", 1)[0]
        code = code or stem
        family = stem.split("_", 1)[0].lower()

    if not name:
        name = {"en": "English", "ne": "Nepali"}.get(family, family.upper() or "Unknown")

    return family, (f"{name} ({code})" if code else name)


def _speaker_ids(config: dict) -> list[int]:
    """Return the sorted speaker ids of a model (empty for single-speaker)."""
    try:
        count = int(config.get("num_speakers") or 1)
    except (TypeError, ValueError):
        count = 1
    if count <= 1:
        return []

    id_map = config.get("speaker_id_map") or {}
    ids = sorted({int(v) for v in id_map.values()}) if id_map else []
    return ids or list(range(count))


def _voice_dir_stamp() -> tuple[float, int]:
    """Cheap fingerprint of the voice directory, to know when to rescan."""
    try:
        models = sorted(VOICE_DIR.glob("*.onnx"))
        return (max((m.stat().st_mtime for m in models), default=0.0), len(models))
    except Exception:
        return (0.0, 0)


def _build_catalog() -> list[dict]:
    """Scan the voice directory and expand every model into selectable voices."""
    voices: list[dict] = []

    try:
        models = sorted(VOICE_DIR.glob("*.onnx"))
    except Exception:
        models = []

    for model_path in models:
        config = _model_config(model_path)
        family, language_label = _language_of(model_path, config)
        quality = ((config.get("audio") or {}).get("quality") or "").strip()
        # "ne_NP-google-x_low" -> dataset "google"
        parts = model_path.stem.split("-")
        dataset = parts[1] if len(parts) > 1 else model_path.stem
        quality_note = _QUALITY_LABEL.get(quality, quality)

        speakers = _speaker_ids(config)
        is_default = model_path.name in {DEFAULT_VOICE_EN, DEFAULT_VOICE_NE}

        if not speakers:
            label = f"{language_label} — {dataset}"
            if quality_note:
                label += f" ({quality_note})"
            voices.append({
                "id": model_path.name,
                "model": model_path.name,
                "speaker": None,
                "language": family,
                "language_label": language_label,
                "dataset": dataset,
                "quality": quality,
                "label": label,
                "default": is_default,
            })
            continue

        # Multi-speaker: one entry per speaker. This is what gives Nepali real
        # choice — ne_NP-google carries 18 different voices in one model, and
        # the point of listing them is to let Nepali speakers pick.
        #
        # Capped, because "one entry per speaker" does not scale: en_US-libritts
        # and libritts_r carry 904 speakers EACH and en_GB-vctk 109, so listing
        # every one would put ~2000 rows in the Reading Settings dropdown and make
        # the page useless. The cap is well above the models a classroom actually
        # picks from (Nepali's 18 all fit), and raising it is one variable.
        shown = speakers[:MAX_SPEAKERS_LISTED]
        for index, speaker in enumerate(shown, start=1):
            label = f"{language_label} — {dataset} voice {index} of {len(shown)}"
            if quality_note:
                label += f" ({quality_note})"
            voices.append({
                "id": f"{model_path.name}#{speaker}",
                "model": model_path.name,
                "speaker": speaker,
                "language": family,
                "language_label": language_label,
                "dataset": dataset,
                "quality": quality,
                "label": label,
                # The default voice id has no "#speaker", so speaker 0 of the
                # default model is the one Looma falls back to.
                "default": is_default and index == 1,
            })

    return voices


def _curate(catalog: list[dict]) -> list[dict]:
    """Reduce the full catalog to the voices Looma OFFERS (see CURATED_VOICES).

    Order, labels and which one is the per-language default all come from that
    list, so the Reading Settings page reads the way it is written there rather
    than the way the voice directory happens to sort.

    A curated voice that is not installed on this box is skipped, not offered:
    listing it would put a row in the dropdown that fails at the first press.
    If NONE of them are installed the full catalog is returned instead — a box
    with different models still gets a usable settings page rather than an empty
    one.
    """
    if VOICES_SHOW_ALL:
        return catalog

    by_id = {voice.get("id"): voice for voice in catalog}
    curated: list[dict] = []
    have_default: set[str] = set()

    for voice_id, family, label in CURATED_VOICES:
        source = by_id.get(voice_id)
        if source is None:
            continue
        entry = dict(source)
        entry["label"] = label
        entry["language"] = family or entry.get("language")
        # First one listed for a language is that language's default.
        entry["default"] = family not in have_default
        have_default.add(family)
        curated.append(entry)

    if not curated:
        log.warning("none of the %d curated voices are installed in %s - "
                    "offering every installed voice instead",
                    len(CURATED_VOICES), VOICE_DIR)
        return catalog

    missing = [voice_id for voice_id, _, _ in CURATED_VOICES if voice_id not in by_id]
    if missing:
        log.warning("curated voice(s) NOT installed, so not offered: %s", ", ".join(missing))

    return curated


def voice_catalog(force: bool = False) -> list[dict]:
    """Return the (cached) voice catalog, rescanning when the directory changes."""
    global _catalog_cache, _catalog_stamp

    stamp = _voice_dir_stamp()
    with _CATALOG_LOCK:
        if force or stamp != _catalog_stamp or not _catalog_cache:
            _catalog_cache = _curate(_build_catalog())
            _catalog_stamp = stamp
        return list(_catalog_cache)


# ---------------------------------------------------------------------------
# Warm Piper workers
# ---------------------------------------------------------------------------

class PiperWorker:
    """A piper process kept alive with its model loaded, fed line-delimited JSON.

    Piper's `--json-input` mode reads one request per line and can switch
    speaker per line, but length_scale is fixed at process start — so the pool
    key is (model, length_scale).
    """

    def __init__(self, model_path: Path, length_scale: str) -> None:
        self.model_path = model_path
        self.length_scale = length_scale
        self.process: subprocess.Popen | None = None
        self.lock = threading.Lock()
        self.multi_speaker = bool(_speaker_ids(_model_config(model_path)))
        # Last few stderr lines, for reporting a worker that dies. Piper has no
        # --quiet flag (v1.2.0 silently ignores unknown options) and logs a line
        # per utterance, so stderr MUST be drained: a full 64K pipe buffer would
        # otherwise block the process mid-lesson, with no error anywhere.
        self.stderr_tail: deque[str] = deque(maxlen=20)

    def _command(self) -> list[str]:
        return [
            PIPER_BIN,
            "--model", str(self.model_path),
            "--length_scale", self.length_scale,
            "--sentence_silence", SENTENCE_SILENCE,
            "--json-input",
        ]

    def _drain_stderr(self, process: subprocess.Popen) -> None:
        try:
            for line in process.stderr:  # type: ignore[union-attr]
                line = line.strip()
                if line:
                    self.stderr_tail.append(line)
        except Exception:
            pass

    def ensure_started(self) -> None:
        if self.process and self.process.poll() is None:
            return
        self.stop()
        self.stderr_tail.clear()
        self.process = subprocess.Popen(
            self._command(),
            stdin=subprocess.PIPE,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.PIPE,
            text=True,
            # Explicit UTF-8: Devanagari must survive the pipe whatever locale
            # the service happens to start under. Left to the locale default it
            # is one LANG=C away from failing on every Nepali sentence.
            encoding="utf-8",
            errors="replace",
            bufsize=1,
        )
        threading.Thread(
            target=self._drain_stderr, args=(self.process,),
            name=f"piper-stderr-{self.model_path.stem}", daemon=True,
        ).start()

    def stop(self) -> None:
        process, self.process = self.process, None
        if not process:
            return
        try:
            if process.stdin:
                process.stdin.close()
        except Exception:
            pass
        try:
            process.terminate()
            process.wait(timeout=2)
        except Exception:
            try:
                process.kill()
            except Exception:
                pass

    def running(self) -> bool:
        return bool(self.process and self.process.poll() is None)

    def synthesize(self, text: str, speaker: int | None, output_path: Path,
                   timeout: float = 120.0) -> None:
        """Synthesize one request through the warm process."""
        payload: dict = {"text": text, "output_file": str(output_path)}
        # Piper keeps the speaker it was last given, so a multi-speaker model is
        # always told explicitly which speaker to use (0 when unspecified).
        if self.multi_speaker:
            payload["speaker_id"] = int(speaker or 0)

        line = json.dumps(payload, ensure_ascii=False) + "\n"

        with self.lock:
            self.ensure_started()
            try:
                self._write(line)
            except BrokenPipeError:
                # The process died between requests — restart once and retry.
                self.stop()
                self.ensure_started()
                self._write(line)
            self._wait_for_output(output_path, timeout)

    def _write(self, line: str) -> None:
        if not self.process or not self.process.stdin:
            raise RuntimeError(f"piper worker for {self.model_path.name} is not available")
        self.process.stdin.write(line)
        self.process.stdin.flush()

    # Poll fast so the audio is handed back almost as soon as Piper has finished
    # writing it. Two equal-size reads at 5 ms still confirm the WAV is complete —
    # Piper writes a sentence-sized file in one burst — and cost 10 ms instead of
    # the 30 ms three reads at 10 ms did. That was pure fixed tax on every single
    # sentence, paid after the audio was already on disk.
    _POLL_INTERVAL = 0.005
    _STABLE_READS = 2

    def _wait_for_output(self, output_path: Path, timeout: float) -> None:
        deadline = time.time() + timeout
        last_size = -1
        stable_reads = 0

        while time.time() < deadline:
            if self.process and self.process.poll() is not None:
                stderr = " | ".join(self.stderr_tail)
                self.stop()
                raise RuntimeError(
                    f"piper worker for {self.model_path.name} exited. {stderr}".strip()
                )

            if output_path.exists():
                size = output_path.stat().st_size
                if size > 44:
                    if size == last_size:
                        stable_reads += 1
                        if stable_reads >= self._STABLE_READS:
                            return
                    else:
                        last_size = size
                        stable_reads = 0

            time.sleep(self._POLL_INTERVAL)

        raise TimeoutError(f"piper worker for {self.model_path.name} timed out")


_WORKERS: "OrderedDict[tuple[str, str], PiperWorker]" = OrderedDict()
_WORKERS_LOCK = threading.Lock()


def get_worker(model_path: Path, length_scale: str) -> PiperWorker:
    """Return the warm worker for this (model, speed), starting it if needed."""
    key = (str(model_path), length_scale)
    with _WORKERS_LOCK:
        worker = _WORKERS.pop(key, None)
        if worker is None:
            worker = PiperWorker(model_path, length_scale)
        _WORKERS[key] = worker           # most recently used last

        evicted = []
        while len(_WORKERS) > MAX_WORKERS:
            _, old = _WORKERS.popitem(last=False)
            evicted.append(old)

    for old in evicted:
        old.stop()

    return worker


def stop_all_workers() -> None:
    with _WORKERS_LOCK:
        workers = list(_WORKERS.values())
        _WORKERS.clear()
    for worker in workers:
        worker.stop()


# ---------------------------------------------------------------------------
# WAV cache
# ---------------------------------------------------------------------------

_CACHE_LOCK = threading.Lock()


def _cache_path(model_path: Path, speaker: int | None, length_scale: str, text: str) -> Path:
    fingerprint = "\x1f".join([
        model_path.name,
        str(speaker if speaker is not None else ""),
        length_scale,
        text,
    ])
    digest = hashlib.sha256(fingerprint.encode("utf-8")).hexdigest()
    return CACHE_DIR / f"{model_path.stem}-{digest}.wav"


def _prune_cache() -> None:
    if MAX_CACHE_FILES <= 0:
        return
    try:
        cached = sorted(
            (p for p in CACHE_DIR.glob("*.wav") if p.is_file()),
            key=lambda p: p.stat().st_mtime,
            reverse=True,
        )
    except Exception:
        return
    for path in cached[MAX_CACHE_FILES:]:
        try:
            path.unlink()
        except OSError:
            pass


def _synthesize_one_shot(model_path: Path, speaker: int | None, length_scale: str,
                         text: str, output_path: Path, timeout: float) -> None:
    """Fallback: a plain one-process run, used only if the warm worker fails.

    Slow (it reloads the model), but it means an unexpected piper build without
    --json-input still speaks instead of returning an error.
    """
    command = [
        PIPER_BIN,
        "--model", str(model_path),
        "--length_scale", length_scale,
        "--sentence_silence", SENTENCE_SILENCE,
        "--output_file", str(output_path),
    ]
    if speaker is not None:
        command += ["--speaker", str(int(speaker))]

    proc = subprocess.run(
        command, input=text, text=True, encoding="utf-8", errors="replace",
        capture_output=True, timeout=timeout, check=False,
    )
    if proc.returncode != 0 or not output_path.exists() or output_path.stat().st_size <= 44:
        raise RuntimeError((proc.stderr or "piper synthesis failed").strip()[:2000])


def synthesize_cached(model_path: Path, speaker: int | None, length_scale: str,
                      text: str, timeout: float = 120.0) -> tuple[Path, bool]:
    """Return (wav path, cache_hit) for this request, synthesizing when needed."""
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    cache_path = _cache_path(model_path, speaker, length_scale, text)

    if cache_path.exists() and cache_path.stat().st_size > 44:
        # Touch it so the pruner treats a re-read sentence as recently used.
        try:
            os.utime(cache_path, None)
        except OSError:
            pass
        return cache_path, True

    tmp = tempfile.NamedTemporaryFile(prefix="looma_piper_", suffix=".wav", delete=False)
    tmp_path = Path(tmp.name)
    tmp.close()
    tmp_path.unlink(missing_ok=True)   # piper writes the file itself

    try:
        # The warm path gets a SHORT deadline. A sentence that a loaded model
        # cannot produce in that time is a wedged worker, and waiting out the
        # full timeout would show up in class as "the Speak button does
        # nothing" — so give up early and synthesize the old way instead.
        warmed = False
        if WARM_ENABLED:
            worker = get_worker(model_path, length_scale)
            try:
                worker.synthesize(text, speaker, tmp_path,
                                  timeout=min(WARM_TIMEOUT, timeout))
                warmed = True
            except Exception as exc:
                worker.stop()
                tmp_path.unlink(missing_ok=True)
                _note_warm_failure(f"{type(exc).__name__}: {exc}")

        if not warmed:
            _synthesize_one_shot(model_path, speaker, length_scale, text, tmp_path, timeout)

        with _CACHE_LOCK:
            if not (cache_path.exists() and cache_path.stat().st_size > 44):
                shutil.move(str(tmp_path), str(cache_path))
                _prune_cache()
        return cache_path, False
    finally:
        if tmp_path.exists():
            try:
                tmp_path.unlink()
            except OSError:
                pass


def describe_setup() -> None:
    """Log what this server found at start-up — the first thing to check when
    TTS goes quiet is whether the models are actually there."""
    log.info("piper binary: %s", PIPER_BIN)
    log.info("voice dir:    %s", VOICE_DIR)
    catalog = voice_catalog(force=True)
    models = sorted({v["model"] for v in catalog})
    if not models:
        log.error("NO VOICE MODELS in %s - Looma cannot speak. Check the image "
                  "build / installer step that downloads them.", VOICE_DIR)
    else:
        log.info("%s model(s) -> %s selectable voice(s): %s",
                 len(models), len(catalog), ", ".join(models))
    for label, voice in (("en", DEFAULT_VOICE_EN), ("ne", DEFAULT_VOICE_NE)):
        path = _resolve_model(_parse_voice_id(voice)[0])
        if not path.exists():
            log.error("default %s voice is MISSING: %s", label, path)
    log.info("warm workers: %s (max %s), cache: %s",
             "on" if WARM_ENABLED else "off", MAX_WORKERS, CACHE_DIR)


def prewarm() -> None:
    """Load the two default voices before the first teacher presses Speak.

    Without this the FIRST press of the day still pays the model load; the whole
    point of the warm pool is that nobody ever waits for it. It doubles as the
    start-up self-test: if synthesis cannot work here, it says so in the log now
    instead of at the first press in a classroom.
    """
    samples = [
        (DEFAULT_VOICE_EN, "Looma is ready."),
        (DEFAULT_VOICE_NE, "नमस्ते।"),
    ]
    for voice, text in samples:
        model, speaker = _parse_voice_id(voice)
        model_path = _resolve_model(model)
        if not model_path.exists():
            continue
        try:
            t0 = time.time()
            synthesize_cached(model_path, speaker, _length_scale_for(DEFAULT_RATE),
                              text, timeout=180.0)
            log.info("pre-warmed %s in %d ms", model_path.name,
                     int((time.time() - t0) * 1000))
        except Exception as exc:
            # Pre-warming is an optimization; never let it stop the server.
            log.error("could not pre-warm %s: %s", model_path.name, exc)


# ---------------------------------------------------------------------------
# HTTP API
# ---------------------------------------------------------------------------

@app.get("/health")
def health():
    try:
        model_en = _resolve_model(_parse_voice_id(DEFAULT_VOICE_EN)[0])
        model_ne = _resolve_model(_parse_voice_id(DEFAULT_VOICE_NE)[0])
        with _WORKERS_LOCK:
            workers = {
                f"{Path(model).name}@{scale}": worker.running()
                for (model, scale), worker in _WORKERS.items()
            }
        try:
            cached_files = len(list(CACHE_DIR.glob("*.wav")))
        except Exception:
            cached_files = 0

        return jsonify(
            {
                "ok": True,
                "piper_bin": PIPER_BIN,
                "voice_dir": str(VOICE_DIR),
                "voices": {"en": str(model_en), "ne": str(model_ne)},
                "voices_exist": {"en": model_en.exists(), "ne": model_ne.exists()},
                "voice_count": len(voice_catalog()),
                "warm": {"enabled": WARM_ENABLED, "failures": _warm_failures},
                "workers": workers,
                "cache": {"dir": str(CACHE_DIR), "files": cached_files},
            }
        )
    except Exception as exc:
        return jsonify({"ok": False, "error": str(exc)}), 500


@app.get("/voices")
def voices():
    """List every installed voice, so the UI can offer them per language."""
    catalog = voice_catalog(force=request.args.get("refresh") == "1")
    return jsonify({
        "ok": True,
        "defaults": {"en": DEFAULT_VOICE_EN, "ne": DEFAULT_VOICE_NE},
        "voices": catalog,
    })


@app.post("/tts")
def tts():
    payload = request.get_json(silent=True) or {}
    text = (payload.get("text") or "").strip()
    if not text:
        return jsonify({"error": "Missing text"}), 400
    if len(text) > MAX_TEXT_LENGTH:
        return jsonify({"error": f"Text too long. Max {MAX_TEXT_LENGTH} chars."}), 400

    language = (payload.get("language") or "").strip()
    requested_voice = (payload.get("voice") or "").strip()
    _, model_path, speaker = _usable_voice(requested_voice, language)

    if model_path is None:
        # Nothing installed can read this text — the only case left worth an error.
        return jsonify({
            "error": "No usable voice model",
            "voice": requested_voice,
            "voice_dir": str(VOICE_DIR),
        }), 400

    # What we actually synthesize with, which is not always what was asked for.
    voice_id = model_path.name + (f"#{speaker}" if speaker is not None else "")
    length_scale = _length_scale_for(payload.get("rate"))

    # Wrap synthesis in its own span so latency, voice and text length show up in
    # OpenSearch Trace Analytics / Grafana.
    if _tracer is not None:
        span_ctx = _tracer.start_as_current_span("piper.synthesize")
    else:
        class _Noop:
            def __enter__(self_inner):
                class _S:
                    def set_attribute(self, *_a, **_kw): pass
                    def record_exception(self, *_a, **_kw): pass
                return _S()
            def __exit__(self_inner, *_): return False
        span_ctx = _Noop()

    t0 = time.time()
    try:
        with span_ctx as span:
            try:
                span.set_attribute("piper.voice", voice_id)
                span.set_attribute("piper.model_path", str(model_path))
                span.set_attribute("piper.speaker", speaker if speaker is not None else -1)
                span.set_attribute("piper.text_chars", len(text))
                span.set_attribute("piper.language", language or "")
                span.set_attribute("piper.length_scale", length_scale)
            except Exception:
                pass

            wav_path, cache_hit = synthesize_cached(model_path, speaker, length_scale, text)
            duration_ms = int((time.time() - t0) * 1000)

            try:
                span.set_attribute("piper.duration_ms", duration_ms)
                span.set_attribute("piper.cache_hit", cache_hit)
                span.set_attribute("piper.output_bytes", int(wav_path.stat().st_size))
            except Exception:
                pass

        resp: Response = send_file(str(wav_path), mimetype="audio/wav", as_attachment=False)
        resp.headers["Cache-Control"] = "no-store"
        # Handy when measuring the "under a second" target from the browser.
        resp.headers["X-Looma-TTS-Cache"] = "hit" if cache_hit else "miss"
        resp.headers["X-Looma-TTS-Ms"] = str(duration_ms)
        resp.headers["X-Looma-TTS-Voice"] = voice_id
        return resp
    except (TimeoutError, subprocess.TimeoutExpired) as exc:
        log.error("synthesis timed out (voice=%s, %d chars): %s", voice_id, len(text), exc)
        return jsonify({"error": "Piper synthesis timed out", "details": str(exc)}), 504
    except Exception as exc:
        log.error("synthesis failed (voice=%s, %d chars): %s", voice_id, len(text), exc)
        return jsonify({"error": "Piper synthesis failed", "details": str(exc)}), 500


if __name__ == "__main__":
    host = os.environ.get("LOOMA_PIPER_HOST", "127.0.0.1")
    port = int(os.environ.get("LOOMA_PIPER_PORT", "5002"))
    describe_setup()
    log.info("listening on %s:%s", host, port)
    # Pre-warm off the main thread so /health answers immediately while the two
    # default models load.
    if os.environ.get("LOOMA_PIPER_PREWARM", "1") != "0":
        threading.Thread(target=prewarm, name="piper-prewarm", daemon=True).start()
    try:
        app.run(host=host, port=port, threaded=True, use_reloader=False)
    finally:
        stop_all_workers()
