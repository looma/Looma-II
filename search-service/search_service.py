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
# WHERE THE INDEX LIVES.
#
# This directory used to be called "zvec-index", which was simply untrue: this
# service has never imported zvec. It is a NumPy matrix and a JSON sidecar. The
# name was left over from a design that was never built, and it cost real
# debugging time because `looma-ai` next door DOES use zvec, so "the zvec index"
# pointed at two different things depending on who said it.
#
# Renaming a path that already exists on installed boxes would orphan their
# index and trigger a multi-hour rebuild on first boot, so the old location is
# still honoured: if the configured directory holds no index but a sibling
# `zvec-index` does, we read from there. That covers both layouts —
# /data/search-index -> /data/zvec-index (docker) and
# /var/lib/looma/search-index -> /var/lib/looma/zvec-index (native).
#
# Nothing WRITES to the legacy path; the next rebuild lands in the new one.
_LEGACY_INDEX_DIRNAME = "zvec-index"


def _resolve_index_dir() -> Path:
    configured = Path(os.environ.get("INDEX_DIR", "/data/search-index"))
    if (configured / "index_meta.json").exists():
        return configured
    legacy = configured.parent / _LEGACY_INDEX_DIRNAME
    if legacy != configured and (legacy / "index_meta.json").exists():
        return legacy
    return configured


INDEX_DIR = _resolve_index_dir()
SEARCH_PORT = int(os.environ.get("SEARCH_PORT", "46333"))
SEARCH_TOPK = int(os.environ.get("SEARCH_TOPK", "12"))
SEARCH_REBUILD_ON_START = os.environ.get("SEARCH_REBUILD_ON_START", "1") == "1"
# How much of a long document is reachable by a semantic search.
#
# The embedding model has a 256-word-piece window (~1000 characters). Everything
# past it is DISCARDED by the encoder, so a one-vector-per-document index can
# only ever match a textbook on its cover page, no matter how much text the
# ingester pulled out of the PDF. That was the real ceiling on "search the
# content": raising the ingester's page limit alone changed nothing.
#
# So a document is embedded as up to MAX_CHUNKS windows of CHUNK_CHARS, each one
# its own row, all carrying the SAME Mongo id. search() collapses them back to
# one hit per document, keeping the best-scoring window.
#
# The cap is what keeps this affordable. The corpus is ~315k documents but the
# large majority (images, videos, audio) are a filename and nothing else, so
# they stay one row; only PDFs and HTML pages grow. Raising the cap raises the
# index file AND the service's resident memory roughly in proportion to the
# text-bearing share — which matters on an 8 GB box, so measure before raising.
SEARCH_CHUNK_CHARS = int(os.environ.get("SEARCH_CHUNK_CHARS", "1000"))
SEARCH_CHUNK_OVERLAP = int(os.environ.get("SEARCH_CHUNK_OVERLAP", "100"))
SEARCH_MAX_CHUNKS_PER_DOC = max(1, int(os.environ.get("SEARCH_MAX_CHUNKS_PER_DOC", "4")))
# How far into a document the "did you mean" vocabulary is collected from. Wider
# than the embedding budget on purpose — collecting a word costs a regex match,
# not a vector — and unchanged from what the one-vector index used.
VOCAB_SCAN_CHARS = int(os.environ.get("SEARCH_VOCAB_SCAN_CHARS", "12000"))
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


def chunk_for_embedding(text: str) -> list[str]:
    """Split one document's searchable text into embeddable windows.

    Always returns at least one window (so a document is never dropped), never
    more than SEARCH_MAX_CHUNKS_PER_DOC. Windows overlap slightly so a sentence
    straddling a boundary is still whole in one of them.
    """
    text = (text or "").strip()
    if not text:
        return []
    size = max(200, SEARCH_CHUNK_CHARS)
    if len(text) <= size or SEARCH_MAX_CHUNKS_PER_DOC == 1:
        return [text[:size]]

    step = max(1, size - max(0, SEARCH_CHUNK_OVERLAP))
    out: list[str] = []
    start = 0
    while start < len(text) and len(out) < SEARCH_MAX_CHUNKS_PER_DOC:
        out.append(text[start:start + size])
        start += step
    return out


class SemanticSearchIndex:
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
        self._doc_src: list[str | None] = []
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
                self._doc_src = []
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
                # How much of one document the windows below can cover: they step
                # by (CHUNK_CHARS - OVERLAP) and there are at most MAX_CHUNKS.
                embed_budget = (
                    max(1, SEARCH_MAX_CHUNKS_PER_DOC - 1)
                    * max(1, SEARCH_CHUNK_CHARS - max(0, SEARCH_CHUNK_OVERLAP))
                    + max(200, SEARCH_CHUNK_CHARS)
                )
                texts_to_embed: list[str] = []
                ids: list[str] = []
                dns: list[str | None] = []
                fts: list[str | None] = []
                fps: list[str | None] = []
                fns: list[str | None] = []
                srcs: list[str | None] = []

                for mongo_doc in mongo_docs:
                    source_id = str(mongo_doc["_id"])
                    texts = collect_strings(mongo_doc)
                    if not texts:
                        continue

                    full_text = " ".join(dict.fromkeys(texts))[:VOCAB_SCAN_CHARS]
                    # Pull individual lowercase tokens of length >= 3 into the
                    # suggestion vocabulary. We strip punctuation so "Cellulose."
                    # contributes "cellulose", not "cellulose.".
                    #
                    # Scanned from the FULL text, not from the windows that get
                    # embedded. "Did you mean" is a spelling aid: a word is worth
                    # suggesting wherever in the document it appeared, and this
                    # costs a regex pass, not a vector.
                    for tok in re.findall(r"[A-Za-zऀ-ॿ]{3,30}", full_text):
                        self._vocab.add(tok.lower())

                    # Embed only as far as the windows can actually reach. Text
                    # past the budget is dead weight in the encoder -- raise
                    # SEARCH_MAX_CHUNKS_PER_DOC and this follows it down the page.
                    windows = chunk_for_embedding(full_text[:embed_budget])
                    if not windows:
                        continue

                    dn = mongo_doc.get("dn")
                    ft = mongo_doc.get("ft")
                    fp = mongo_doc.get("fp") or mongo_doc.get("nfp")
                    fn = mongo_doc.get("fn") or mongo_doc.get("nfn")
                    if not fp:
                        fp = _default_fp_for_ft(ft)
                    # `src` is the Source checkbox column (CEHRD / PhET / Khan / …).
                    # Kept beside ft so the Source filter can be pushed down too.
                    src = mongo_doc.get("src")

                    # One ROW per window, all repeating the same document id and
                    # metadata. search() collapses them back to one hit per id.
                    for window in windows:
                        ids.append(source_id)
                        dns.append(str(dn)[:1000] if dn is not None else None)
                        fts.append(str(ft)[:200] if ft is not None else None)
                        fps.append(str(fp)[:2000] if fp is not None else None)
                        fns.append(str(fn)[:512] if fn is not None else None)
                        srcs.append(str(src)[:120] if src is not None else None)
                        texts_to_embed.append(window)

                    # Keep memory usage stable by chunking matrix builds.
                    if len(texts_to_embed) >= batch_size:
                        self._append_matrix(ids, dns, fts, fps, fns, srcs, texts_to_embed)
                        ids, dns, fts, fps, fns, srcs, texts_to_embed = [], [], [], [], [], [], []

                if texts_to_embed:
                    self._append_matrix(ids, dns, fts, fps, fns, srcs, texts_to_embed)

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
        srcs: list[str | None],
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
        self._doc_src.extend(srcs)

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
                "doc_src": self._doc_src,
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
                "saved search index (%d docs, backend=%s) to %s",
                self._last_build_count, self._backend, INDEX_DIR,
            )
        except Exception:  # noqa: BLE001
            _logging.getLogger(__name__).exception("failed to persist search index")

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
                # doc_src arrived after the first prebuilt indexes shipped, and it
                # is NOT worth invalidating a 3-hour build over: an index without
                # it still answers every query, it just cannot push the Source
                # filter down (looma-database-utilities.php still applies Source
                # as a hard Mongo filter either way). Pad so the lists stay
                # index-aligned with doc_ids.
                self._doc_src = list(meta.get("doc_src") or [])
                if len(self._doc_src) != len(self._doc_ids):
                    self._doc_src = [None] * len(self._doc_ids)
                self._vocab = set(meta.get("vocab") or [])
                self._last_build_count = int(meta.get("count") or len(self._doc_ids))

            if not self.is_ready():
                return False
            _logging.getLogger(__name__).info(
                "loaded persisted search index (%d docs, backend=%s) from %s",
                self._last_build_count, self._backend, INDEX_DIR,
            )
            return True
        except Exception:  # noqa: BLE001
            _logging.getLogger(__name__).exception("failed to load persisted search index")
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
                _logging.getLogger(__name__).exception("background search index build failed")
            finally:
                with self._build_lock:
                    self._building = False

        threading.Thread(target=_run, name="search-index-build", daemon=True).start()
        return True

    def ensure_ready(self) -> None:
        # Non-blocking on purpose: we must NOT rebuild inside the caller's request.
        # That synchronous full-corpus embed is exactly what blocked the gunicorn
        # worker past its timeout and returned 500. Just make sure a background build
        # is in flight; the caller handles the "not ready yet" case.
        if self.is_ready() or self._building:
            return
        self.start_background_rebuild()

    def _allowed_mask(self, fts: set[str] | None, srcs: set[str] | None):
        """Boolean mask over the corpus for the Type / Source checkboxes.

        Returns None when nothing is filtered, so the common case pays nothing.

        WHY THIS IS HERE AND NOT ONLY IN MONGO. The checkboxes were always hard
        filters — looma-database-utilities.php ANDs them into the Mongo query, so
        a semantic hit of the wrong type is dropped. The problem was that the
        drop happened AFTER top-k: the service scored the whole corpus, returned
        its 12 best documents of ANY type, and Mongo then threw away the ones the
        teacher had not ticked. Tick "Video" and you would routinely get zero
        semantic results — not because the corpus has no relevant videos, but
        because the 12 globally-best documents happened to be PDFs and pages.
        Masking BEFORE the top-k means "the 12 best videos", which is what the
        checkbox is asking for.

        Matching is case-insensitive: the form posts "CEHRD"/"Dr Dann" while the
        documents carry whatever case the importer wrote.
        """
        if not fts and not srcs:
            return None
        import numpy as np

        n = len(self._doc_ids)
        mask = np.ones(n, dtype=bool)
        if fts:
            wanted = {f.strip().lower() for f in fts if f and f.strip()}
            if wanted:
                mask &= np.fromiter(
                    ((ft or "").strip().lower() in wanted for ft in self._doc_ft),
                    dtype=bool,
                    count=n,
                )
        if srcs:
            wanted = {x.strip().lower() for x in srcs if x and x.strip()}
            # An index built before doc_src existed has None everywhere; filtering
            # on it would return nothing at all, which is far worse than ignoring
            # a filter Mongo is about to apply anyway.
            if wanted and any(self._doc_src):
                mask &= np.fromiter(
                    ((sv or "").strip().lower() in wanted for sv in self._doc_src),
                    dtype=bool,
                    count=n,
                )
        return mask

    def search(
        self,
        query_text: str,
        topk: int,
        *,
        fts: set[str] | None = None,
        srcs: set[str] | None = None,
    ) -> list[dict[str, Any]]:
        with _span(
            "search.query",
            **{
                "looma.search.backend": "sbert" if self._sbert is not None else "hashing",
                "looma.search.query_len": len(query_text or ""),
                "looma.search.topk": int(topk or SEARCH_TOPK),
                "looma.search.filter_ft": ",".join(sorted(fts)) if fts else "",
                "looma.search.filter_src": ",".join(sorted(srcs)) if srcs else "",
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

                # Apply the Type / Source checkboxes BEFORE the top-k cut, so the
                # k results are the k best MATCHING documents rather than
                # whatever survives a global top-k. -inf keeps the array shape
                # (and therefore the index -> document mapping) intact.
                mask = self._allowed_mask(fts, srcs)
                if mask is not None:
                    if not mask.any():
                        return []
                    import numpy as np
                    scores = np.where(mask, scores, -np.inf)
                    candidates = int(mask.sum())
                else:
                    candidates = int(scores.size)

                want = max(1, int(topk or SEARCH_TOPK))
                # Rows are WINDOWS, and one document can own several of them, so
                # ask for more rows than the caller wants hits: in the worst case
                # every one of the best rows belongs to the same document. Pull
                # want * max-chunks and dedupe below.
                k = max(1, min(want * SEARCH_MAX_CHUNKS_PER_DOC, candidates))
                # Partial sort to find top-k efficiently, then order those k by
                # SCORE, best first.
                #
                # This used to read `idx = idx[idx.argsort()[::-1]]`, which sorts
                # the row NUMBERS, not their scores — the k best rows came back in
                # descending row order. It was invisible because the only caller
                # (looma-database-utilities.php) re-sorts by `semantic_score`
                # before rendering. It is not invisible any more: the dedupe below
                # keeps the FIRST row it sees per document and stops at `want`, so
                # a wrong order would pick an arbitrary window and truncate the
                # result set arbitrarily.
                import numpy as np
                idx = scores.argpartition(-k)[-k:]
                idx = idx[np.argsort(scores[idx], kind="stable")[::-1]]

            # One hit per DOCUMENT. `idx` is ordered best-first, so the first row
            # seen for a document is its best-scoring window; later windows of
            # the same document are dropped. Callers (and the PHP that maps
            # source_id onto a Mongo _id) must never see the same id twice.
            out: list[dict[str, Any]] = []
            seen: set[str] = set()
            for i in idx.tolist():
                source_id = self._doc_ids[i]
                if source_id in seen:
                    continue
                seen.add(source_id)
                fp = self._doc_fp[i]
                fn = self._doc_fn[i]
                source_path = (str(fp) + str(fn)) if (fp and fn) else None
                out.append(
                    {
                        "source_id": source_id,
                        "dn": self._doc_dn[i],
                        "ft": self._doc_ft[i],
                        "looma_fp": fp,
                        "looma_fn": fn,
                        "source_path": source_path,
                        "src": self._doc_src[i] if i < len(self._doc_src) else None,
                        "score": float(scores[i]),
                    }
                )
                if len(out) >= want:
                    break
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
            # doc_count is the ROW count and stays that way: build-search-artifacts.sh
            # and the installer both watch it change to know a rebuild finished,
            # and it is the number that predicts memory. `unique_docs` is the one
            # to read as "how much of the library is indexed".
            "doc_count": self._last_build_count,
            "unique_docs": len(set(self._doc_ids)) if self._doc_ids else 0,
            "max_chunks_per_doc": SEARCH_MAX_CHUNKS_PER_DOC,
            "chunk_chars": SEARCH_CHUNK_CHARS,
            "index_dir": str(INDEX_DIR),
            "model_name": self._backend,
            "backend": "sbert" if self._sbert is not None else "hashing",
            "embedding_dim": EMBEDDING_DIM,
            "mongo_url": MONGO_URL,
            "mongo_db": MONGO_DB,
            "mongo_collection": MONGO_COLLECTION,
            "last_open_error": self._last_open_error,
        }


search_index = SemanticSearchIndex()

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


def _warm_query_encoder() -> None:
    """Pay the embedding model's first-call cost HERE, not on a teacher's first search.

    Loading the model is not the same as being ready to use it: the first encode
    also builds torch's kernels and allocates its buffers, and that showed up as a
    ~14s first query even on x86 with the model already resident. On an ODROID it
    is far worse, and the caller gives up long before it lands — looma-web's curl
    times out, the id list comes back empty, and the search silently degrades to a
    lexical one. One throwaway encode in a background thread costs nothing and
    makes the first real query as fast as the second.
    """
    try:
        search_index.ensure_ready()
        search_index._embed(["warm up"])
        _logging.getLogger(__name__).info("query encoder warmed")
    except Exception:  # noqa: BLE001 — a failed warm-up must never stop the service
        _logging.getLogger(__name__).exception("query encoder warm-up failed")


threading.Thread(target=_warm_query_encoder, name="search-warm", daemon=True).start()


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


def _filter_args() -> tuple[set[str] | None, set[str] | None]:
    """Read the Type / Source checkbox filters off the query string.

    Accepted either repeated (`?ft=video&ft=audio`, which is what a form's
    `type[]` naturally becomes) or comma-joined (`?ft=video,audio`). Empty means
    "no filter" — an empty set must NOT be read as "match nothing".
    """
    def _collect(*names: str) -> set[str] | None:
        values: set[str] = set()
        for name in names:
            for raw in request.args.getlist(name):
                for part in str(raw).split(","):
                    part = part.strip()
                    if part:
                        values.add(part)
        return values or None

    return _collect("ft", "type", "type[]"), _collect("src", "src[]", "source")


@app.get("/search")
def search() -> Any:
    query_text = request.args.get("q", "").strip()
    topk = int(request.args.get("topk", str(SEARCH_TOPK)))
    fts, srcs = _filter_args()
    # Existing PHP callers (looma-database-utilities.php) expect a plain JSON
    # array of {source_id, dn, ft, score}. New callers that want the
    # `{results, suggestions, top_score}` envelope must pass `with_suggestions=1`.
    with_suggestions = request.args.get("with_suggestions", "0") == "1"
    if not query_text:
        return jsonify({"error": "Missing search query"}), 400

    try:
        results = search_index.search(query_text, topk, fts=fts, srcs=srcs)
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
    fts, srcs = _filter_args()
    if not query_text:
        return jsonify({"error": "Missing search query"}), 400
    try:
        return jsonify(search_index.search(query_text, topk, fts=fts, srcs=srcs))
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


if __name__ == "__main__":
    # The background warmup above (run at import) already kicks off the build for
    # both gunicorn and `python search_service.py`, so we don't rebuild again here.
    app.run(host="0.0.0.0", port=SEARCH_PORT)
