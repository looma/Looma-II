from __future__ import annotations

import os

for _thread_env in (
    "OMP_NUM_THREADS",
    "OPENBLAS_NUM_THREADS",
    "MKL_NUM_THREADS",
    "NUMEXPR_NUM_THREADS",
    "TOKENIZERS_PARALLELISM",
):
    os.environ.setdefault(_thread_env, "1" if _thread_env != "TOKENIZERS_PARALLELISM" else "false")
import json
import re
import threading
import time
from pathlib import Path
from typing import Any

def _init_otel_logs() -> None:
    if (os.environ.get("OTEL_LOGS_EXPORTER") or "").strip().lower() != "otlp":
        return
    try:
        import logging

        from opentelemetry._logs import set_logger_provider
        from opentelemetry.exporter.otlp.proto.http._log_exporter import OTLPLogExporter
        from opentelemetry.sdk._logs import LoggerProvider, LoggingHandler
        from opentelemetry.sdk._logs.export import BatchLogRecordProcessor
        from opentelemetry.sdk.resources import Resource
    except Exception:
        return

    provider = LoggerProvider(resource=Resource.create({}))
    set_logger_provider(provider)
    provider.add_log_record_processor(BatchLogRecordProcessor(OTLPLogExporter()))

    root = logging.getLogger()
    root.addHandler(LoggingHandler(level=logging.NOTSET, logger_provider=provider))
    if root.level == logging.NOTSET:
        root.setLevel(logging.INFO)


_init_otel_logs()

from flask import Flask, jsonify, request
from pymongo import MongoClient
from scipy import sparse
from sklearn.feature_extraction.text import HashingVectorizer


def _suppress_health_access_logs() -> None:
    try:
        import logging

        logging.getLogger("httpx").setLevel(logging.WARNING)
        logging.getLogger("httpcore").setLevel(logging.WARNING)

        class _HealthFilter(logging.Filter):
            def filter(self, record: logging.LogRecord) -> bool:
                msg = record.getMessage()
                return '"GET /health ' not in msg and '"HEAD /health ' not in msg

        logging.getLogger("werkzeug").addFilter(_HealthFilter())
    except Exception:
        pass


_suppress_health_access_logs()

# Best-effort tracer handle for manual spans on the heavy embedding / index
# build / search paths. Auto-instrumentation (FlaskInstrumentor + Pymongo via
# `opentelemetry-instrument`) already covers HTTP server + Mongo, but those
# spans don't show CPU-bound work like sentence-transformer encode() — which
# is the lion's share of latency on cold starts and on every /search call.
try:
    from opentelemetry import trace as _otel_trace
    _tracer = _otel_trace.get_tracer("looma-search")
except Exception:  # pragma: no cover
    _tracer = None


def _span(name: str, **attrs):
    """Context manager that yields a span if OTel is loaded, else a no-op."""
    if _tracer is None:
        class _N:
            def __enter__(self): return None
            def __exit__(self, *a): return False
        return _N()
    cm = _tracer.start_as_current_span(name)

    class _Wrap:
        def __enter__(self_inner):
            self_inner._span = cm.__enter__()
            try:
                if self_inner._span is not None:
                    for k, v in attrs.items():
                        if v is None:
                            continue
                        self_inner._span.set_attribute(k, v)
            except Exception:
                pass
            return self_inner._span

        def __exit__(self_inner, exc_type, exc, tb):
            try:
                if exc is not None and self_inner._span is not None:
                    self_inner._span.record_exception(exc)
            except Exception:
                pass
            return cm.__exit__(exc_type, exc, tb)

    return _Wrap()


app = Flask(__name__)
import logging as _logging
_logging.getLogger(__name__).info("search service started")

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://looma-db:27017")
MONGO_DB = os.environ.get("MONGO_DB", "looma")
MONGO_COLLECTION = os.environ.get("MONGO_COLLECTION", "activities")
MODEL_NAME = os.environ.get("MODEL_NAME", "sentence-transformers/all-MiniLM-L6-v2")
INDEX_DIR = Path(os.environ.get("INDEX_DIR", "/data/zvec-index"))
SEARCH_PORT = int(os.environ.get("SEARCH_PORT", "46333"))
SEARCH_TOPK = int(os.environ.get("SEARCH_TOPK", "12"))
SEARCH_REBUILD_ON_START = os.environ.get("SEARCH_REBUILD_ON_START", "1") == "1"
EMBEDDING_DIM = int(os.environ.get("EMBEDDING_DIM", "384"))
# When 1 (default), try to load a sentence-transformers model for true semantic
# embeddings before falling back to HashingVectorizer. Set to 0 to force the
# lightweight vectorizer (e.g. on machines where torch crashes with SIGILL).
USE_SBERT = os.environ.get("LOOMA_USE_SBERT", "1") == "1"

STRING_KEYS = {
    "dn",
    # `ndn` (Nepali display name) carries the Devanagari title for Nepali
    # content. ~2.8k activities have it and they were silently invisible to
    # search before — including 3 docs whose ONLY indexable field is `ndn`.
    "ndn",
    "nfn",
    "title",
    "name",
    "description",
    "text",
    "body",
    "content",
    "caption",
    "captions",
    "summary",
    "keywords",
    "key1",
    "key2",
    "key3",
    "key4",
    "subject",
    "grade",
    "area",
    "author",
}
SKIP_KEYS = {"_id", "fp", "fn", "rm", "thumbnail", "thumb", "url", "src"}


def _default_fp_for_ft(ft: str | None) -> str | None:
    if not ft:
        return None
    ft = str(ft).lower().strip()
    if ft in {"video", "mp4", "mov", "m4v", "mp5"}:
        return "../content/videos/"
    if ft in {"audio", "mp3", "m4a", "wav", "ogg"}:
        return "../content/audio/"
    if ft in {"image", "jpg", "jpeg", "png", "gif", "webp"}:
        return "../content/pictures/"
    if ft in {"pdf"}:
        return "../content/pdfs/"
    if ft in {"slideshow"}:
        return "../content/slideshows/"
    if ft in {"lesson"}:
        return "../content/lessons/"
    return None


def clean_text(value: str) -> str:
    value = re.sub(r"<[^>]+>", " ", value)
    value = re.sub(r"\s+", " ", value)
    return value.strip()


def collect_strings(value: Any, key: str | None = None) -> list[str]:
    parts: list[str] = []
    if isinstance(value, str):
        text = clean_text(value)
        # Accept single-char values too (e.g. the dictionary-images activities
        # whose only display name is "s" or "I"); the previous >=2 cutoff
        # silently dropped them and left the docs unindexed.
        if len(text) >= 1 and (key in STRING_KEYS or key is None):
            parts.append(text)
    elif isinstance(value, dict):
        for child_key, child_value in value.items():
            if child_key in SKIP_KEYS:
                continue
            parts.extend(collect_strings(child_value, child_key))
    elif isinstance(value, list):
        for item in value:
            parts.extend(collect_strings(item, key))
    return parts


# Lower-bound cosine score below which we treat a match as "weak" and offer
# spelling suggestions instead. Tuned for the HashingVectorizer backend; SBERT
# usually scores higher so this threshold rarely fires in semantic mode.
SEARCH_LOW_SCORE = float(os.environ.get("SEARCH_LOW_SCORE", "0.18"))


class ZvecSearchIndex:
    def __init__(self) -> None:
        self._lock = threading.RLock()
        # Guards the background-build state only (kept separate from the heavy
        # `self._lock`, which rebuild() holds for the whole build — readers must
        # never block on that or they trip gunicorn's worker timeout).
        self._build_lock = threading.Lock()
        self._building = False
        # Try sentence-transformers first (true semantic embeddings); on failure
        # we transparently fall back to the lightweight HashingVectorizer below.
        self._sbert = None
        self._backend = "hashing-vectorizer"
        if USE_SBERT:
            try:
                from sentence_transformers import SentenceTransformer  # type: ignore
                self._sbert = SentenceTransformer(MODEL_NAME)
                self._backend = MODEL_NAME
                _logging.getLogger(__name__).info(
                    "loaded sentence-transformer model %s", MODEL_NAME,
                )
            except Exception as exc:  # noqa: BLE001
                self._sbert = None
                _logging.getLogger(__name__).warning(
                    "sentence-transformer unavailable (%s); falling back to HashingVectorizer", exc,
                )
        # HashingVectorizer gives a stable, CPU-safe embedding without torch/AVX requirements.
        self._vectorizer = HashingVectorizer(
            n_features=EMBEDDING_DIM,
            alternate_sign=False,
            norm="l2",
            ngram_range=(1, 2),
        )
        self._doc_ids: list[str] = []
        self._doc_dn: list[str | None] = []
        self._doc_ft: list[str | None] = []
        self._doc_fp: list[str | None] = []
        self._doc_fn: list[str | None] = []
        self._matrix: sparse.csr_matrix | None = None
        self._dense = None  # type: ignore[assignment]  # numpy ndarray when sbert is active
        self._last_build_count = 0
        self._last_open_error: str | None = None
        # Vocabulary used to suggest "did you mean" terms when a search returns
        # nothing useful. Populated during rebuild() from the same text we feed
        # the embedder; small dict so a Levenshtein scan stays sub-millisecond.
        self._vocab: set[str] = set()

    def _embed(self, texts: list[str]):
        """Return either a sparse csr matrix (HashingVectorizer) or a dense numpy
        array (sentence-transformers, l2-normalized)."""
        with _span(
            "search.embed",
            **{
                "looma.search.backend": "sbert" if self._sbert is not None else "hashing",
                "looma.search.batch_size": len(texts),
                "looma.search.embedding_dim": EMBEDDING_DIM,
            },
        ):
            if self._sbert is not None:
                import numpy as np  # local import keeps optional dep isolated
                arr = self._sbert.encode(
                    texts, normalize_embeddings=True, convert_to_numpy=True, show_progress_bar=False,
                )
                return np.asarray(arr, dtype="float32")
            return self._vectorizer.transform(texts).tocsr()

    def _connect_mongo(self) -> MongoClient:
        last_error: Exception | None = None
        for _ in range(30):
            try:
                client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=3000)
                client.admin.command("ping")
                return client
            except Exception as exc:
                last_error = exc
                time.sleep(2)
        raise RuntimeError(f"Could not connect to MongoDB at {MONGO_URL}: {last_error}")

    def rebuild(self) -> int:
        with _span(
            "search.index.rebuild",
            **{
                "looma.search.backend": "sbert" if self._sbert is not None else "hashing",
                "db.system": "mongodb",
                "db.name": MONGO_DB,
                "db.mongodb.collection_name": MONGO_COLLECTION,
            },
        ) as _rebuild_span:
            with self._lock:
                # Reset in-memory index before rebuilding.
                self._doc_ids = []
                self._doc_dn = []
                self._doc_ft = []
                self._doc_fp = []
                self._doc_fn = []
                self._matrix = None
                self._dense = None
                self._vocab = set()

                with _span("search.mongo.fetch_all", **{
                    "db.system": "mongodb",
                    "db.name": MONGO_DB,
                    "db.mongodb.collection_name": MONGO_COLLECTION,
                    "db.operation": "find",
                }) as _fetch_span:
                    client = self._connect_mongo()
                    collection = client[MONGO_DB][MONGO_COLLECTION]
                    mongo_docs = list(collection.find({}))
                    if _fetch_span is not None:
                        try:
                            _fetch_span.set_attribute("looma.search.docs_fetched", len(mongo_docs))
                        except Exception:
                            pass
                if not mongo_docs:
                    raise RuntimeError(
                        f"No documents found in MongoDB collection {MONGO_DB}.{MONGO_COLLECTION}"
                    )

                batch_size = 32
                texts_to_embed: list[str] = []
                ids: list[str] = []
                dns: list[str | None] = []
                fts: list[str | None] = []
                fps: list[str | None] = []
                fns: list[str | None] = []

                for mongo_doc in mongo_docs:
                    source_id = str(mongo_doc["_id"])
                    texts = collect_strings(mongo_doc)
                    if not texts:
                        continue

                    search_text = " ".join(dict.fromkeys(texts))[:12000]
                    # Pull individual lowercase tokens of length >= 3 into the
                    # suggestion vocabulary. We strip punctuation so "Cellulose."
                    # contributes "cellulose", not "cellulose.".
                    for tok in re.findall(r"[A-Za-zऀ-ॿ]{3,30}", search_text):
                        self._vocab.add(tok.lower())
                    ids.append(source_id)
                    dn = mongo_doc.get("dn")
                    ft = mongo_doc.get("ft")
                    fp = mongo_doc.get("fp") or mongo_doc.get("nfp")
                    fn = mongo_doc.get("fn") or mongo_doc.get("nfn")
                    if not fp:
                        fp = _default_fp_for_ft(ft)
                    dns.append(str(dn)[:1000] if dn is not None else None)
                    fts.append(str(ft)[:200] if ft is not None else None)
                    fps.append(str(fp)[:2000] if fp is not None else None)
                    fns.append(str(fn)[:512] if fn is not None else None)
                    texts_to_embed.append(search_text)

                    # Keep memory usage stable by chunking matrix builds.
                    if len(texts_to_embed) >= batch_size:
                        self._append_matrix(ids, dns, fts, fps, fns, texts_to_embed)
                        ids, dns, fts, fps, fns, texts_to_embed = [], [], [], [], [], []

                if texts_to_embed:
                    self._append_matrix(ids, dns, fts, fps, fns, texts_to_embed)

                self._last_build_count = len(self._doc_ids)
                if _rebuild_span is not None:
                    try:
                        _rebuild_span.set_attribute("looma.search.docs_indexed", self._last_build_count)
                    except Exception:
                        pass
                # Persist so a restart reuses the index (the compose mounts a
                # persistent volume at INDEX_DIR and runs with SEARCH_REBUILD_ON_START=0
                # precisely so the heavy embed doesn't re-run on every boot).
                self._save_index()
                return self._last_build_count

    def _append_matrix(
        self,
        ids: list[str],
        dns: list[str | None],
        fts: list[str | None],
        fps: list[str | None],
        fns: list[str | None],
        texts: list[str],
    ) -> None:
        X = self._embed(texts)
        if self._sbert is not None:
            import numpy as np
            if self._dense is None:
                self._dense = X
            else:
                self._dense = np.vstack([self._dense, X])
        else:
            if self._matrix is None:
                self._matrix = X
            else:
                self._matrix = sparse.vstack([self._matrix, X], format="csr")
        self._doc_ids.extend(ids)
        self._doc_dn.extend(dns)
        self._doc_ft.extend(fts)
        self._doc_fp.extend(fps)
        self._doc_fn.extend(fns)

    # --- Persistence ------------------------------------------------------
    # The index is saved to INDEX_DIR after each rebuild and loaded on startup, so
    # a restart reuses it instead of re-embedding the whole corpus (which is the
    # heavy CPU/IO spike the compose tries to avoid with SEARCH_REBUILD_ON_START=0).
    _INDEX_FORMAT = 2

    def _index_meta_path(self) -> Path:
        return INDEX_DIR / "index_meta.json"

    def _save_index(self) -> None:
        try:
            import numpy as np  # local import keeps optional dep isolated
            INDEX_DIR.mkdir(parents=True, exist_ok=True)
            meta = {
                "format": self._INDEX_FORMAT,
                "backend": self._backend,
                "is_sbert": self._sbert is not None,
                "model_name": MODEL_NAME if self._sbert is not None else None,
                "embedding_dim": EMBEDDING_DIM,
                "count": self._last_build_count,
                "doc_ids": self._doc_ids,
                "doc_dn": self._doc_dn,
                "doc_ft": self._doc_ft,
                "doc_fp": self._doc_fp,
                "doc_fn": self._doc_fn,
                "vocab": sorted(self._vocab),
            }
            # Write the vectors next to the metadata.
            if self._sbert is not None and self._dense is not None:
                np.save(INDEX_DIR / "dense.npy", np.asarray(self._dense, dtype="float32"))
            elif self._matrix is not None:
                sparse.save_npz(str(INDEX_DIR / "matrix.npz"), self._matrix)
            # Write metadata last + atomically so a half-written index never loads.
            tmp = INDEX_DIR / "index_meta.json.tmp"
            tmp.write_text(json.dumps(meta), encoding="utf-8")
            tmp.replace(self._index_meta_path())
            _logging.getLogger(__name__).info(
                "saved zvec index (%d docs, backend=%s) to %s",
                self._last_build_count, self._backend, INDEX_DIR,
            )
        except Exception:  # noqa: BLE001
            _logging.getLogger(__name__).exception("failed to persist zvec index")

    def load_index(self) -> bool:
        """Load a previously-saved index from INDEX_DIR. Returns True only when a
        valid index matching the current backend/model was loaded."""
        try:
            meta_path = self._index_meta_path()
            if not meta_path.exists():
                return False
            import numpy as np
            meta = json.loads(meta_path.read_text(encoding="utf-8"))
            if int(meta.get("format", 0)) != self._INDEX_FORMAT:
                return False
            # Don't load an index built with a different embedding backend/model —
            # the query vectors wouldn't be comparable. Rebuild instead.
            if bool(meta.get("is_sbert")) != (self._sbert is not None):
                return False
            if self._sbert is not None and meta.get("model_name") != MODEL_NAME:
                return False

            with self._lock:
                if self._sbert is not None:
                    dense_path = INDEX_DIR / "dense.npy"
                    if not dense_path.exists():
                        return False
                    self._dense = np.load(dense_path)
                    self._matrix = None
                else:
                    matrix_path = INDEX_DIR / "matrix.npz"
                    if not matrix_path.exists():
                        return False
                    self._matrix = sparse.load_npz(str(matrix_path))
                    self._dense = None
                self._doc_ids = list(meta.get("doc_ids") or [])
                self._doc_dn = list(meta.get("doc_dn") or [])
                self._doc_ft = list(meta.get("doc_ft") or [])
                self._doc_fp = list(meta.get("doc_fp") or [])
                self._doc_fn = list(meta.get("doc_fn") or [])
                self._vocab = set(meta.get("vocab") or [])
                self._last_build_count = int(meta.get("count") or len(self._doc_ids))

            if not self.is_ready():
                return False
            _logging.getLogger(__name__).info(
                "loaded persisted zvec index (%d docs, backend=%s) from %s",
                self._last_build_count, self._backend, INDEX_DIR,
            )
            return True
        except Exception:  # noqa: BLE001
            _logging.getLogger(__name__).exception("failed to load persisted zvec index")
            return False

    def is_ready(self) -> bool:
        # Cheap, lock-free readiness gate (attribute reads are atomic enough here).
        # Must never block on the heavy build lock or callers trip the worker timeout.
        return bool(self._doc_ids) and (self._matrix is not None or self._dense is not None)

    def start_background_rebuild(self) -> bool:
        """Run rebuild() in a daemon thread. Returns False if one is already running.
        Used by the gunicorn warmup at import and as a lazy trigger from requests."""
        with self._build_lock:
            if self._building:
                return False
            self._building = True

        def _run() -> None:
            try:
                self.rebuild()
            except Exception:  # noqa: BLE001
                _logging.getLogger(__name__).exception("background zvec index build failed")
            finally:
                with self._build_lock:
                    self._building = False

        threading.Thread(target=_run, name="zvec-index-build", daemon=True).start()
        return True

    def ensure_ready(self) -> None:
        # Non-blocking on purpose: we must NOT rebuild inside the caller's request.
        # That synchronous full-corpus embed is exactly what blocked the gunicorn
        # worker past its timeout and returned 500. Just make sure a background build
        # is in flight; the caller handles the "not ready yet" case.
        if self.is_ready() or self._building:
            return
        self.start_background_rebuild()

    def search(self, query_text: str, topk: int) -> list[dict[str, Any]]:
        with _span(
            "search.query",
            **{
                "looma.search.backend": "sbert" if self._sbert is not None else "hashing",
                "looma.search.query_len": len(query_text or ""),
                "looma.search.topk": int(topk or SEARCH_TOPK),
            },
        ) as _query_span:
            self.ensure_ready()
            # While the index is (re)building, return no results instead of blocking
            # the worker or reading a half-built matrix. Clients can retry shortly.
            if self._building or not self.is_ready():
                return []

            q = self._embed([query_text])
            with _span("search.score", **{
                "looma.search.doc_count": len(self._doc_ids),
                "looma.search.backend": "sbert" if self._sbert is not None else "hashing",
            }):
                if self._sbert is not None and self._dense is not None:
                    import numpy as np
                    # Both q and self._dense are l2-normalized → cosine = dot product.
                    scores = (self._dense @ q[0]).astype("float32")
                elif self._matrix is not None:
                    q_sparse = q  # csr_matrix (1, dim)
                    scores = (self._matrix @ q_sparse.T).toarray().ravel()
                else:
                    return []
                if scores.size == 0:
                    return []

                k = max(1, min(int(topk or SEARCH_TOPK), scores.size))
                # Partial sort to find top-k efficiently.
                idx = scores.argpartition(-k)[-k:]
                idx = idx[idx.argsort()[::-1]]

            out: list[dict[str, Any]] = []
            for i in idx.tolist():
                fp = self._doc_fp[i]
                fn = self._doc_fn[i]
                source_path = (str(fp) + str(fn)) if (fp and fn) else None
                out.append(
                    {
                        "source_id": self._doc_ids[i],
                        "dn": self._doc_dn[i],
                        "ft": self._doc_ft[i],
                        "looma_fp": fp,
                        "looma_fn": fn,
                        "source_path": source_path,
                        "score": float(scores[i]),
                    }
                )
            if _query_span is not None:
                try:
                    _query_span.set_attribute("looma.search.results", len(out))
                    if out:
                        _query_span.set_attribute("looma.search.top_score", float(out[0]["score"]))
                except Exception:
                    pass
            return out

    def suggest(self, query_text: str, max_results: int = 6) -> list[str]:
        """Return up to `max_results` close vocabulary terms for a typo'd query.

        Uses Python's stdlib `difflib` (ratio-based) over the indexed vocab —
        no extra dependency, scales fine to a few tens of thousands of tokens.
        """
        from difflib import get_close_matches

        with self._lock:
            vocab = list(self._vocab)
        if not vocab or not query_text:
            return []
        q = query_text.strip().lower()
        # Multi-word queries: suggest per-word so "celluloze fnction" gets two
        # corrections joined back into one phrase the user can re-submit.
        words = re.findall(r"[A-Za-zऀ-ॿ]{2,30}", q)
        if len(words) <= 1:
            return get_close_matches(q, vocab, n=max_results, cutoff=0.72)
        suggestions: list[str] = []
        any_changed = False
        for w in words:
            if w in self._vocab:
                suggestions.append(w)
                continue
            close = get_close_matches(w, vocab, n=1, cutoff=0.72)
            if close:
                suggestions.append(close[0])
                any_changed = True
            else:
                suggestions.append(w)
        if not any_changed:
            return []
        return [" ".join(suggestions)]

    @property
    def stats(self) -> dict[str, Any]:
        return {
            "ready": (self._matrix is not None) or (self._dense is not None),
            "doc_count": self._last_build_count,
            "index_dir": str(INDEX_DIR),
            "model_name": self._backend,
            "backend": "sbert" if self._sbert is not None else "hashing",
            "embedding_dim": EMBEDDING_DIM,
            "mongo_url": MONGO_URL,
            "mongo_db": MONGO_DB,
            "mongo_collection": MONGO_COLLECTION,
            "last_open_error": self._last_open_error,
        }


search_index = ZvecSearchIndex()

# Warm the index up at import time so it's ready under gunicorn too. The previous
# warmup lived only in `if __name__ == "__main__"`, which gunicorn never runs — so
# the build fell to the first /search and blocked the worker until it timed out.
#
# First try to LOAD a persisted index from INDEX_DIR (instant, no embedding). Only
# (re)build — in a background thread, so the worker boots and serves immediately —
# when there's no usable persisted index, or when SEARCH_REBUILD_ON_START forces it.
_loaded_index = search_index.load_index()
if SEARCH_REBUILD_ON_START or not _loaded_index:
    search_index.start_background_rebuild()


@app.get("/health")
def health() -> Any:
    return jsonify(search_index.stats)


@app.post("/rebuild")
def rebuild() -> Any:
    # Trigger the rebuild in the background and return immediately, so this endpoint
    # never blocks the worker past gunicorn's timeout on a large corpus.
    started = search_index.start_background_rebuild()
    return jsonify({
        "ok": True,
        "building": True,
        "already_running": not started,
    }), 202


@app.get("/search")
def search() -> Any:
    query_text = request.args.get("q", "").strip()
    topk = int(request.args.get("topk", str(SEARCH_TOPK)))
    # Existing PHP callers (looma-database-utilities.php) expect a plain JSON
    # array of {source_id, dn, ft, score}. New callers that want the
    # `{results, suggestions, top_score}` envelope must pass `with_suggestions=1`.
    with_suggestions = request.args.get("with_suggestions", "0") == "1"
    if not query_text:
        return jsonify({"error": "Missing search query"}), 400

    try:
        results = search_index.search(query_text, topk)
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500

    # Backwards-compatible: when no suggestions are needed (or the caller
    # opted out), keep returning a bare JSON array.
    if not with_suggestions:
        return jsonify(results)

    top_score = results[0]["score"] if results else 0.0
    needs_suggest = (not results) or top_score < SEARCH_LOW_SCORE
    suggestions = search_index.suggest(query_text) if needs_suggest else []
    return jsonify({
        "results": results,
        "suggestions": suggestions,
        "query": query_text,
        "top_score": top_score,
    })


@app.get("/suggest")
def suggest() -> Any:
    query_text = request.args.get("q", "").strip()
    if not query_text:
        return jsonify({"error": "Missing query"}), 400
    try:
        return jsonify({
            "query": query_text,
            "suggestions": search_index.suggest(query_text),
        })
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


# Alias kept for PHP callers that hard-code the legacy looma-ai endpoint name.
# Both URLs return Mongo ObjectIds in `source_id`, so the result shape is
# identical. We keep the legacy bare-array contract unconditionally here so
# nothing breaks for older callers; new callers should use /search directly.
@app.get("/search_activities")
def search_activities() -> Any:
    query_text = request.args.get("q", "").strip()
    topk = int(request.args.get("topk", str(SEARCH_TOPK)))
    if not query_text:
        return jsonify({"error": "Missing search query"}), 400
    try:
        return jsonify(search_index.search(query_text, topk))
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


if __name__ == "__main__":
    # The background warmup above (run at import) already kicks off the build for
    # both gunicorn and `python search_service.py`, so we don't rebuild again here.
    app.run(host="0.0.0.0", port=SEARCH_PORT)
