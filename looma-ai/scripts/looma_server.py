import argparse
import json
import os
import re
import random
import time
import shutil
import threading
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path as _Path
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import parse_qs, urlparse, quote
from urllib.request import Request, urlopen

# ---------------------------------------------------------------------------
# OpenTelemetry (optional)
# ---------------------------------------------------------------------------
# This service uses stdlib `http.server`. Tracing is set up via
# `scripts/otel_bootstrap.py`, which wraps BaseHTTPRequestHandler methods to
# create inbound spans. We keep this import best-effort so the server still
# runs if OpenTelemetry isn't available.

# Initialize OpenTelemetry as early as possible so that the http.server
# wrapper is in place before any handler is constructed.
try:
    from scripts.otel_bootstrap import init_tracing as _otel_init
except Exception:
    try:
        from otel_bootstrap import init_tracing as _otel_init  # type: ignore
    except Exception:
        _otel_init = None  # type: ignore
if _otel_init is not None:
    try:
        _otel_init("looma-ai")
    except Exception:
        pass


# ---------------------------------------------------------------------------
# Structured Logging for Feedback Loop Integration
# ---------------------------------------------------------------------------
try:
    from scripts.structured_logger import get_structured_logger, QueryLogger, log_model_event
except Exception:
    try:
        from structured_logger import get_structured_logger, QueryLogger, log_model_event  # type: ignore
    except Exception:
        # Fallback: create dummy functions if structured_logger is not available
        def get_structured_logger(name):
            import logging
            return logging.getLogger(name)
        class QueryLogger:
            def __init__(self, logger, query_type, request_id=None): pass
            def __enter__(self): return self
            def __exit__(self, *args): pass
            def log_feedback(self, *args, **kwargs): pass
        def log_model_event(*args, **kwargs): pass

logger = get_structured_logger(__name__)

def _otel_set_attrs(attrs: dict) -> None:
    """Best-effort: annotate the current server span with useful request fields."""
    try:
        from opentelemetry import trace  # type: ignore
        span = trace.get_current_span()
        if not span or not getattr(span, "is_recording", lambda: False)():
            return
        for k, v in (attrs or {}).items():
            if v is None:
                continue
            try:
                span.set_attribute(str(k), v)
            except Exception:
                pass
    except Exception:
        return


def _otel_record(name: str, value=1, **attrs):
    """Forwarder to scripts.otel_bootstrap.record. Safe no-op when missing."""
    try:
        from scripts.otel_bootstrap import record as _r
    except Exception:
        try:
            from otel_bootstrap import record as _r  # type: ignore
        except Exception:
            return
    try:
        _r(name, value, **attrs)
    except Exception:
        return


class _OtelTimer:
    """Small context manager that records a histogram on exit."""

    def __init__(self, hist_name: str, **attrs):
        self.hist = hist_name
        self.attrs = attrs
        self._t0 = 0.0

    def __enter__(self):
        self._t0 = time.time()
        return self

    def __exit__(self, exc_type, exc, tb):
        try:
            dt_ms = (time.time() - self._t0) * 1000.0
            attrs = dict(self.attrs)
            if exc_type is not None:
                attrs['error'] = exc_type.__name__
            _otel_record(self.hist, dt_ms, **attrs)
        except Exception:
            pass


# --- minimal multipart/form-data parser (stdlib-only) ---
# `cgi.FieldStorage` was deprecated in Python 3.11 and removed in 3.13. We
# only need to read a handful of small form fields plus a single file upload
# (used by /replace_pdf), so a small in-process parser is enough.
class _MultipartPart:
    __slots__ = ('name', 'filename', 'content_type', 'data')

    def __init__(self, name=None, filename=None, content_type=None, data=b''):
        self.name = name
        self.filename = filename
        self.content_type = content_type
        self.data = data


def _parse_multipart(body: bytes, content_type_header: str):
    """Parse a multipart/form-data body. Returns dict[name -> _MultipartPart]."""
    if not body or not content_type_header:
        return {}
    m = re.search(r'boundary=("?)([^";]+)\1', content_type_header, flags=re.I)
    if not m:
        return {}
    boundary = ('--' + m.group(2)).encode('latin-1')
    end_boundary = boundary + b'--'

    parts = {}
    cursor = 0
    blen = len(boundary)
    while True:
        idx = body.find(boundary, cursor)
        if idx < 0:
            break
        cursor = idx + blen
        # Skip optional CRLF after boundary marker.
        if body.startswith(b'\r\n', cursor):
            cursor += 2
        elif body.startswith(b'\n', cursor):
            cursor += 1
        # End boundary terminates parsing.
        if body.startswith(b'--', idx + blen):
            break
        # Find the start of the next boundary.
        next_idx = body.find(boundary, cursor)
        if next_idx < 0:
            break
        # Strip the trailing CRLF that precedes the next boundary.
        part_end = next_idx
        if part_end >= 2 and body[part_end - 2:part_end] == b'\r\n':
            part_end -= 2
        elif part_end >= 1 and body[part_end - 1:part_end] == b'\n':
            part_end -= 1

        # Headers / body split.
        sep = body.find(b'\r\n\r\n', cursor, part_end)
        if sep < 0:
            sep = body.find(b'\n\n', cursor, part_end)
            sep_len = 2
        else:
            sep_len = 4
        if sep < 0:
            cursor = next_idx
            continue

        header_blob = body[cursor:sep].decode('latin-1', 'replace')
        data = body[sep + sep_len:part_end]

        name = None
        filename = None
        ctype = None
        for line in header_blob.split('\r\n' if '\r\n' in header_blob else '\n'):
            line = line.strip()
            if not line:
                continue
            lower = line.lower()
            if lower.startswith('content-disposition:'):
                nm = re.search(r'name="([^"]*)"', line)
                fm = re.search(r'filename="([^"]*)"', line)
                if nm:
                    name = nm.group(1)
                if fm:
                    filename = fm.group(1)
            elif lower.startswith('content-type:'):
                ctype = line.split(':', 1)[1].strip()
        if name:
            parts[name] = _MultipartPart(name=name, filename=filename, content_type=ctype, data=data)
        cursor = next_idx
    return parts

import sys
from pathlib import Path

_PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

from pymongo import MongoClient
from bson import ObjectId

from app.embed.model import MODEL_NAME, load_model
from app.index.sqlite_store import get_conn


DB_PATH = 'data/index/looma.db'
COLLECTION_PATH = 'data/zvec/curriculum_chunks'
ACTIVITIES_INDEX_PATH = 'data/zvec/activities_index'
ACTIVITIES_BATCH_SIZE = 32
ACTIVITIES_TOPK_DEFAULT = 12
CONTENT_ROOT = os.environ.get('LOOMA_SOURCE_ROOT') or '/looma/content'


def get_doc_id(result):
    if hasattr(result, 'id'):
        return result.id
    if isinstance(result, dict) and 'id' in result:
        return result['id']
    raise ValueError(f'Could not extract id from result: {result!r}')


def looma_fp_fn_from_source_path(source_path: str):
    if not source_path:
        return None, None

    p = source_path.replace('\\', '/')
    pl = p.lower()
    marker = '/looma/content/'
    i = pl.find(marker)
    if i < 0:
        return None, None

    rel = p[i + len(marker):]
    rel = rel.lstrip('/')

    if '/' not in rel:
        return None, None

    fn = rel.split('/')[-1]
    fp = '../content/' + '/'.join(rel.split('/')[:-1]) + '/'
    return fp, fn


STRING_KEYS = {
    'dn', 'title', 'name', 'description', 'text', 'body', 'content', 'caption',
    'summary', 'keywords', 'key1', 'key2', 'key3', 'key4'
}
SKIP_KEYS = {'_id', 'fp', 'fn', 'rm', 'thumbnail', 'thumb', 'url', 'src'}


def clean_text(value: str) -> str:
    value = re.sub(r'<[^>]+>', ' ', value)
    value = re.sub(r'\s+', ' ', value)
    return value.strip()


def _norm_token(value: str) -> str:
    return re.sub(r'[^a-z0-9]+', '', (value or '').lower())


def find_chapter_dir_with_fallback(
    *, grade: int | None, subject: str | None, language: str | None,
) -> tuple["Path | None", "Path | None"]:
    """Resolve the requested chapter dir AND its English counterpart.

    Returns (primary, english_fallback). When `language='np'` and the np/ folder
    is missing a particular file (e.g. a `.summary` exists in en/ but not np/)
    callers can read from the English copy and translate it on the fly. The
    second value is None when the primary IS the English directory.
    """
    primary = find_chapter_dir(grade=grade, subject=subject, language=language)
    norm = (language or '').strip().lower()
    if norm in {'ne', 'np', 'nepali'}:
        english = find_chapter_dir(grade=grade, subject=subject, language='en')
    else:
        english = None
    return primary, english


_NP_FALLBACK_GLOSSARY = {
    'summary': 'सारांश',
    'keywords': 'मुख्य शब्दहरू',
    'chapter': 'अध्याय',
    'lesson': 'पाठ',
    'exercise': 'अभ्यास',
    'activity': 'क्रियाकलाप',
    'question': 'प्रश्न',
    'answer': 'उत्तर',
    'example': 'उदाहरण',
    'introduction': 'परिचय',
    'conclusion': 'निष्कर्ष',
    'definition': 'परिभाषा',
    'objective': 'उद्देश्य',
    'objectives': 'उद्देश्यहरू',
    'note': 'टिप्पणी',
    'practice': 'अभ्यास',
    'water': 'पानी',
    'air': 'हावा',
    'plant': 'बिरुवा',
    'animal': 'जनावर',
    'science': 'विज्ञान',
    'mathematics': 'गणित',
    'english': 'अंग्रेजी',
    'nepali': 'नेपाली',
    'health': 'स्वास्थ्य',
    'society': 'समाज',
}

_translation_cache: "dict[str, str]" = {}


def translate_text_en_to_np(text: str) -> str:
    """Translate English text into Nepali using:

      1. The looma `dictionary` Mongo collection (if reachable),
      2. A small built-in glossary, and
      3. As a last resort, a transformer model (NLLB) when available locally.

    Words that cannot be translated are kept verbatim — so AI pages always
    render *something* in Nepali rather than collapsing to empty content.
    """
    if not text or not isinstance(text, str):
        return text or ''

    key = ('np:' + text)[:512]
    if key in _translation_cache:
        return _translation_cache[key]

    # Optional: NLLB-200 if installed (single-shot, cached). Best quality.
    try:
        if os.environ.get('LOOMA_NLLB') == '1':
            from transformers import pipeline  # type: ignore
            global _nllb_pipe
            try:
                _nllb_pipe  # type: ignore[name-defined]
            except NameError:
                _nllb_pipe = pipeline(
                    'translation', model='facebook/nllb-200-distilled-600M',
                    src_lang='eng_Latn', tgt_lang='npi_Deva',
                )
            out = _nllb_pipe(text, max_length=512)
            if out and isinstance(out, list) and out[0].get('translation_text'):
                _translation_cache[key] = out[0]['translation_text']
                return _translation_cache[key]
    except Exception:
        pass

    # Word-by-word fallback using Mongo dictionary + built-in glossary.
    try:
        url = (os.environ.get('LOOMA_MONGO_URL') or 'mongodb://looma-db:27017').strip()
        db_name = (os.environ.get('LOOMA_MONGO_DB') or 'looma').strip()
        client = MongoClient(url, serverSelectionTimeoutMS=2000)
        coll = client[db_name]['dictionary']
    except Exception:
        coll = None

    def _word(w: str) -> str:
        wl = w.lower()
        if wl in _NP_FALLBACK_GLOSSARY:
            return _NP_FALLBACK_GLOSSARY[wl]
        if coll is not None:
            try:
                doc = coll.find_one({'en': wl}, projection={'np': 1, 'ne': 1})
                if doc:
                    return doc.get('np') or doc.get('ne') or w
            except Exception:
                return w
        return w

    parts: list[str] = []
    for tok in re.findall(r"\w+|\W+", text, flags=re.UNICODE):
        if tok.isalpha() and len(tok) > 1:
            parts.append(_word(tok))
        else:
            parts.append(tok)
    out_text = ''.join(parts)
    _translation_cache[key] = out_text
    return out_text


def find_chapter_dir(*, grade: int | None, subject: str | None, language: str | None) -> Path | None:
    if not grade or int(grade) <= 0:
        return None

    lang = (language or 'en').strip().lower()
    if lang == 'ne':
        lang = 'np'
    if lang not in {'en', 'np'}:
        lang = 'en'

    base = Path(CONTENT_ROOT).resolve()
    class_root = base / 'chapters' / f'Class{int(grade)}'
    if not class_root.exists():
        return None

    subj = (subject or '').strip()
    subj_norm = _norm_token(subj)
    if not subj_norm:
        return None

    candidates = [p for p in class_root.iterdir() if p.is_dir()]
    best = None
    for p in candidates:
        if _norm_token(p.name) == subj_norm:
            best = p
            break
    if best is None:
        for p in candidates:
            pn = _norm_token(p.name)
            if subj_norm in pn or pn in subj_norm:
                best = p
                break

    if best is None:
        return None

    lang_dir = best / lang
    if lang_dir.exists() and lang_dir.is_dir():
        return lang_dir

    return None


def looma_web_path_for_file(path: Path) -> str | None:
    try:
        base = Path(CONTENT_ROOT).resolve()
        rel = path.resolve().relative_to(base)
    except Exception:
        return None
    rel_str = str(rel).replace('\\', '/').lstrip('/')
    return '../content/' + rel_str


def safe_read_text(path: Path, *, limit_chars: int = 2000) -> str:
    try:
        data = path.read_text(encoding='utf-8', errors='ignore')
    except Exception:
        return ''
    data = data.strip()
    if limit_chars and len(data) > limit_chars:
        return data[:limit_chars].rstrip() + '…'
    return data


def _ensure_learning_tables(conn) -> None:
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS summary_feedback (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          chapter_id TEXT NOT NULL,
          summary_text TEXT NOT NULL,
          source TEXT NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS rag_feedback (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          question TEXT NOT NULL,
          engine TEXT NOT NULL,
          mode TEXT,
          chapter_id TEXT,
          subject TEXT,
          grade_level INTEGER,
          language TEXT,
          helpful INTEGER NOT NULL,
          answer TEXT,
          contexts_json TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
        """
    )


def _learned_summary_sentence(
    *,
    chunks_text: list[str],
    keywords: list[str],
    feedback_text: str,
    avoid_texts: list[str],
    seed: int,
) -> str:
    """
    Pick a single chapter sentence guided by feedback_text.

    Uses TF-IDF similarity against feedback_text (teacher edits + history), and
    tries to avoid repeating recently-used sentences.
    """
    try:
        import scripts.generate_assets as gen
        from sklearn.feature_extraction.text import TfidfVectorizer  # noqa: WPS433
    except Exception:
        return ''

    rnd = random.Random(int(seed or 0))

    sents = []
    for t in chunks_text or []:
        try:
            sents.extend(gen.split_sentences(t))
        except Exception:
            continue

    sents = [re.sub(r'\s+', ' ', (s or '')).strip() for s in sents]
    sents = [s for s in sents if len(s) >= 30 and 'http://' not in s and 'https://' not in s]
    if not sents:
        return ''

    avoid = {str(s or '').strip().lower() for s in (avoid_texts or []) if str(s or '').strip()}

    query = (feedback_text or '').strip()
    if not query:
        query = ' '.join([str(k).strip() for k in (keywords or []) if str(k).strip()][:6]).strip()
    if not query:
        query = 'This chapter focuses on key ideas and definitions.'

    corpus = sents + [query]
    try:
        vec = TfidfVectorizer(lowercase=True, stop_words='english', ngram_range=(1, 2), max_features=12000)
        X = vec.fit_transform(corpus)
        qv = X[-1]
        S = X[:-1]
        scores = (S @ qv.T).toarray().ravel()
    except Exception:
        scores = None

    if scores is None:
        ranked = list(range(len(sents)))
    else:
        ranked = sorted(range(len(sents)), key=lambda i: (-float(scores[i]), i))

    top = ranked[: min(25, len(ranked))]
    candidates = [i for i in top if sents[i].strip().lower() not in avoid]
    if not candidates:
        candidates = top or [0]

    pick_i = candidates[rnd.randrange(len(candidates))]
    out = (sents[pick_i] or '').strip()
    if out and out[-1] not in '.!?…':
        out += '.'
    return out


def _rag_boost_context_ids(conn, *, question: str, chapter_id: str | None, limit: int = 2) -> set[str]:
    """
    Return a small set of context ids to boost based on past 👍 feedback for similar questions.
    """
    try:
        from sklearn.feature_extraction.text import TfidfVectorizer  # noqa: WPS433
    except Exception:
        return set()

    q = (question or '').strip()
    if not q:
        return set()

    where = "helpful = 1"
    params: list = []
    if chapter_id:
        where += " AND (chapter_id = ? OR chapter_id IS NULL)"
        params.append(chapter_id)

    try:
        rows = conn.execute(
            f"""
            SELECT question, contexts_json
            FROM rag_feedback
            WHERE {where}
            ORDER BY id DESC
            LIMIT 40
            """,
            tuple(params),
        ).fetchall()
    except Exception:
        return set()

    past_q = []
    past_ctx = []
    for r in rows or []:
        pq = (r['question'] or '').strip()
        if not pq:
            continue
        past_q.append(pq)
        past_ctx.append(r['contexts_json'] or '[]')

    if not past_q:
        return set()

    corpus = past_q + [q]
    try:
        vec = TfidfVectorizer(lowercase=True, stop_words='english', ngram_range=(1, 2), max_features=12000)
        X = vec.fit_transform(corpus)
        qv = X[-1]
        S = X[:-1]
        scores = (S @ qv.T).toarray().ravel()
    except Exception:
        return set()

    best_i = max(range(len(past_q)), key=lambda i: float(scores[i] or 0.0))
    best_score = float(scores[best_i] or 0.0)
    if best_score < 0.18:
        return set()

    try:
        ids = json.loads(past_ctx[best_i] or '[]')
        ids = [str(x) for x in ids if str(x).strip()]
        return set(ids[: max(1, int(limit))])
    except Exception:
        return set()


def _chunk_text_simple(text: str, *, chunk_size: int = 1200, overlap: int = 200) -> list[str]:
    text = re.sub(r'\s+', ' ', (text or '')).strip()
    if not text:
        return []

    if chunk_size <= 0:
        return [text]

    chunks: list[str] = []
    i = 0
    n = len(text)
    step = max(1, chunk_size - max(0, overlap))

    while i < n:
        j = min(n, i + chunk_size)
        chunk = text[i:j].strip()
        if chunk:
            chunks.append(chunk)
        if j >= n:
            break
        i += step

    return chunks


def _tokenize_query(text: str) -> list[str]:
    tokens = re.findall(r"[0-9A-Za-z\u0900-\u097F]+", (text or '').lower())
    return [t for t in tokens if len(t) >= 2][:40]


# ---------------------------------------------------------------------------
# General-knowledge WH question handling
# ---------------------------------------------------------------------------
# The chat model has to answer ANY question — who/what/when/where/why/how —
# even when the local curriculum index has nothing relevant. We classify the
# question by interrogative, optionally rerank context sentences for the
# expected answer shape (date for "when", location for "where", named entity
# for "who", numeric for "how many"), and fall back to Wikipedia REST + the
# Looma dictionary when the local index has no useful match.

_WH_PATTERNS = [
    ('who',     re.compile(r'^\s*(who|whose|whom)\b', re.I),
                re.compile(r'\b(who|whom|by\s+whom)\b', re.I)),
    ('when',    re.compile(r'^\s*when\b', re.I),
                re.compile(r'\bwhen\b', re.I)),
    ('where',   re.compile(r'^\s*where\b', re.I),
                re.compile(r'\bwhere\b', re.I)),
    ('why',     re.compile(r'^\s*why\b', re.I),
                re.compile(r'\bwhy\b', re.I)),
    ('how',     re.compile(r'^\s*how\b', re.I),
                re.compile(r'\bhow\b', re.I)),
    ('what',    re.compile(r'^\s*(what|which)\b', re.I),
                re.compile(r'\b(what|which)\b', re.I)),
    ('how_many', re.compile(r'^\s*how\s+(many|much)\b', re.I),
                 re.compile(r'\bhow\s+(many|much)\b', re.I)),
    ('define',  re.compile(r'^\s*(define|definition\s+of|meaning\s+of|what\s+(does|is|are)\s+(the\s+)?(meaning|definition))\b', re.I),
                re.compile(r'\b(define|meaning|definition)\b', re.I)),
]

_WH_HINTS_NP = {
    # Common Nepali interrogatives so the same routing works for `language=np`.
    'who':   re.compile(r'\b(को|कस|कसले)\b'),
    'when':  re.compile(r'\b(कहिले|कहिलेसम्म)\b'),
    'where': re.compile(r'\b(कहाँ|कहां)\b'),
    'why':   re.compile(r'\b(किन)\b'),
    'how':   re.compile(r'\b(कसरी)\b'),
    'what':  re.compile(r'\b(के|कुन)\b'),
}

_DATE_RE = re.compile(
    r'\b('
    r'\d{1,2}(?:st|nd|rd|th)?\s+'                          # 12th
    r'(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)'
    r'(?:\s+\d{2,4})?'                                     # March 2024
    r'|'
    r'(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)'
    r'\s+\d{1,2}(?:,\s*\d{2,4})?'
    r'|'
    r'\d{4}'                                               # 1947
    r'|'
    r'\d{1,2}(?:st|nd|rd|th)?\s+century'
    r')\b',
    re.I,
)
_PROPER_NOUN_RE = re.compile(r'\b([A-Z][a-zà-ÿÀ-ɏ]{1,}(?:\s+[A-Z][a-zà-ÿÀ-ɏ]+){0,3})\b')
_NUMBER_RE = re.compile(r'\b\d+(?:[.,]\d+)?\s*(?:%|percent|kg|km|m|cm|mm|°C|°F|years?|days?|hours?|minutes?|seconds?)?\b', re.I)


def _classify_wh(question: str) -> str:
    q = (question or '').strip()
    if not q:
        return 'open'
    # Multi-word "how many" must beat plain "how".
    if _WH_PATTERNS[6][1].search(q) or _WH_PATTERNS[6][2].search(q):
        return 'how_many'
    for tag, head, body in _WH_PATTERNS:
        if tag == 'how_many':
            continue
        if head.search(q):
            return tag
    # Nepali fallbacks.
    for tag, pat in _WH_HINTS_NP.items():
        if pat.search(q):
            return tag
    # Imperative or trailing question mark with no leading WH → treat as "what".
    if q.rstrip().endswith('?'):
        return 'what'
    return 'open'


def _wh_score_bonus(wh: str, sentence: str) -> float:
    """Boost sentences that contain the answer shape implied by the WH type."""
    s = sentence or ''
    if not s:
        return 0.0
    bonus = 0.0
    if wh == 'when':
        if _DATE_RE.search(s):
            bonus += 12.0
        if re.search(r'\b(in|on|during|since|until|after|before|by)\b\s+\d', s, re.I):
            bonus += 4.0
    elif wh == 'where':
        if re.search(r'\b(in|at|near|on|inside|outside|northern|southern|eastern|western|located)\b', s, re.I):
            bonus += 4.0
        if _PROPER_NOUN_RE.search(s):
            bonus += 6.0
    elif wh == 'who':
        if _PROPER_NOUN_RE.search(s):
            bonus += 10.0
        if re.search(r'\bby\s+[A-Z]', s):
            bonus += 4.0
    elif wh in ('how_many',):
        if _NUMBER_RE.search(s):
            bonus += 12.0
    elif wh == 'why':
        if re.search(r'\b(because|due to|owing to|since|so that|as a result|caused by|reason)\b', s, re.I):
            bonus += 10.0
    elif wh == 'how':
        if re.search(r'\b(by|using|through|via|first|then|next|finally|step|process|method)\b', s, re.I):
            bonus += 6.0
    elif wh == 'what' or wh == 'define':
        if re.search(r'\b(is|are|was|were|means|refers to|defined as|known as|called)\b', s, re.I):
            bonus += 6.0
    return bonus


def _wikipedia_lookup(question: str, *, language: str | None = None, timeout: float = 4.0) -> dict | None:
    """Best-effort Wikipedia summary fallback.

    Returns {'title','extract','url'} or None. We pick a single noun phrase
    from the question (longest run of capitalised words, otherwise the longest
    content word) and call the public REST `/page/summary/<title>` endpoint.
    """
    if not question or not question.strip():
        return None
    lang = (language or '').strip().lower()
    if lang in ('np', 'ne', 'nepali'):
        host = 'ne.wikipedia.org'
    elif lang in ('hi', 'hindi'):
        host = 'hi.wikipedia.org'
    else:
        host = 'en.wikipedia.org'

    candidates: list[str] = []
    for m in _PROPER_NOUN_RE.finditer(question):
        candidates.append(m.group(1))
    if not candidates:
        # last-resort: longest non-stopword token
        tokens = [t for t in re.findall(r'[A-Za-zÀ-ÿऀ-ॿ]{3,}', question)
                  if t.lower() not in {'who','what','when','where','why','how','which','the','and','for'}]
        if tokens:
            candidates.append(max(tokens, key=len))
    if not candidates:
        _otel_record('wikipedia_calls', 1, language=lang or 'en', outcome='no_candidate')
        return None

    seen = set()
    for cand in candidates[:3]:
        c = cand.strip()
        if not c or c.lower() in seen:
            continue
        seen.add(c.lower())
        try:
            url = f"https://{host}/api/rest_v1/page/summary/{quote(c)}"
            req = Request(url, headers={'Accept': 'application/json',
                                        'User-Agent': 'looma-ai/1.0 (+https://looma.education)'})
            with urlopen(req, timeout=timeout) as resp:
                if resp.status != 200:
                    continue
                data = json.loads(resp.read().decode('utf-8', errors='ignore') or '{}')
        except Exception:
            continue
        extract = (data.get('extract') or '').strip()
        if not extract:
            continue
        _otel_record('wikipedia_calls', 1, language=lang or 'en', outcome='hit')
        return {
            'title': data.get('title') or c,
            'extract': extract,
            'url': (data.get('content_urls') or {}).get('desktop', {}).get('page'),
            'source': f'wikipedia:{host}',
        }
    _otel_record('wikipedia_calls', 1, language=lang or 'en', outcome='miss')
    return None


def _dictionary_lookup_general(word: str) -> dict | None:
    """Look up a word in the Looma dictionary (Mongo) for define/what questions."""
    w = (word or '').strip()
    if not w:
        _otel_record('dictionary_calls', 1, outcome='empty')
        return None
    _otel_record('dictionary_calls', 1, outcome='lookup')
    try:
        url = (os.environ.get('LOOMA_MONGO_URL') or 'mongodb://looma-db:27017').strip()
        db_name = (os.environ.get('LOOMA_MONGO_DB') or 'looma').strip()
        client = MongoClient(url, serverSelectionTimeoutMS=2500)
        coll = client[db_name]['dictionary']
        doc = coll.find_one(
            {'$or': [
                {'en': re.compile(f'^{re.escape(w)}$', re.I)},
                {'np': w},
            ]},
            projection={'_id': 0},
        )
        return doc or None
    except Exception:
        return None


def _shape_answer_for_wh(wh: str, raw_answer: str, question: str) -> str:
    """Lightly post-process a composed extractive answer so it reads like a
    natural reply to the WH question. We avoid hallucination — this is purely
    cosmetic shaping (capitalisation + sentence trimming).
    """
    txt = (raw_answer or '').strip()
    if not txt:
        return ''
    # Pick the most informative single sentence for short Q types.
    sents = re.split(r'(?<=[.!?])\s+', txt)
    if wh in ('when', 'where', 'who', 'how_many'):
        ranked = sorted(sents, key=lambda s: -_wh_score_bonus(wh, s))
        if ranked and _wh_score_bonus(wh, ranked[0]) > 0:
            txt = ranked[0]
    if not txt.endswith(('.', '!', '?', '…')):
        txt += '.'
    return txt[0].upper() + txt[1:] if txt else txt


def _direct_answer(question: str, context_texts: list[str], *, max_chars: int = 260) -> str:
    """Single-sentence fallback used when _compose_answer returns nothing."""
    q_tokens = _tokenize_query(question)
    qset = set(q_tokens)
    best = ''
    best_score = -1e9
    for ctx in context_texts or []:
        if not isinstance(ctx, str) or not ctx.strip():
            continue
        for sent in re.split(r'(?<=[.!?\u0964])\s+', ctx[:6000].strip()):
            sent = sent.strip()
            if len(sent) < 10:
                continue
            stoks = _tokenize_query(sent)
            if not stoks:
                continue
            overlap = len(set(stoks) & qset) if qset else 0
            score = overlap * 10.0 - (len(sent) / 80.0)
            if score > best_score:
                best_score = score
                best = sent
    best = (best or '').strip()
    if not best:
        for ctx in context_texts or []:
            if isinstance(ctx, str) and ctx.strip():
                best = ctx.strip()
                break
    if not best:
        return ''
    if len(best) > max_chars:
        best = best[:max_chars].rsplit(' ', 1)[0].rstrip() + '…'
    return best


_NAV_RE = re.compile(
    r'\b(find|show me|where (?:is|are|can I find)|navigate|go to|open|take me to|list|browse)\b'
    r'|\b(which chapter|what chapter|find chapter|find lesson|show chapter|show lesson)',
    re.IGNORECASE,
)


def _is_navigation_query(question: str) -> bool:
    return bool(_NAV_RE.search(question or ''))


def _navigate_chapters(conn, question: str, *, grade: int | None = None, subject: str | None = None, limit: int = 5) -> list[dict]:
    q_tokens = _tokenize_query(question)
    if not q_tokens:
        return []
    seen_ids: set = set()
    results: list[dict] = []
    for tok in q_tokens[:6]:
        if len(tok) < 3:
            continue
        try:
            rows = conn.execute(
                'SELECT chapter_id, title, grade_level, subject FROM chapters WHERE title LIKE ? LIMIT 6',
                (f'%{tok}%',),
            ).fetchall()
            for row in rows:
                cid = row['chapter_id']
                if cid not in seen_ids:
                    seen_ids.add(cid)
                    results.append({
                        'chapter_id': cid,
                        'title': row['title'],
                        'grade': row['grade_level'],
                        'subject': row['subject'],
                    })
        except Exception:
            continue
        if len(results) >= limit:
            break
    return results[:limit]


def _compose_answer(question: str, context_texts: list[str], *, history: list | None = None, wh: str | None = None) -> str:
    """Multi-sentence extractive answer using token-overlap scoring + MMR diversity.

    Expands the query with recent conversation history so follow-up questions
    retrieve better context coverage.
    """
    expanded_q = question
    if history:
        recent = [h.get('content', '') for h in (history or [])[-6:] if isinstance(h, dict) and h.get('content')]
        if recent:
            expanded_q = ' '.join(recent) + ' ' + question

    q_tokens = set(_tokenize_query(expanded_q))

    try:
        import scripts.generate_assets as _gen
        _split = _gen.split_sentences
    except Exception:
        def _split(t):
            return [s.strip() for s in re.split(r'(?<=[.!?\u0964])\s+', (t or '').strip()) if len(s.strip()) >= 25]

    all_sents: list[str] = []
    for ctx in context_texts or []:
        if not isinstance(ctx, str) or not ctx.strip():
            continue
        for sent in _split(ctx[:8000]):
            sent = sent.strip()
            if len(sent) >= 30:
                all_sents.append(sent)

    if not all_sents:
        return ''

    def _word_set(s: str) -> set:
        return set(re.findall(r'\b\w{3,}\b', s.lower()))

    def _overlap_sim(sa: set, sb: set) -> float:
        if not sa or not sb:
            return 0.0
        return len(sa & sb) / max(len(sa | sb), 1)

    wh_kind = wh or _classify_wh(question)

    def _score(sent: str) -> float:
        stoks = set(_tokenize_query(sent))
        if not stoks or not q_tokens:
            return 0.0
        overlap = len(stoks & q_tokens)
        precision = overlap / max(len(stoks), 1)
        recall = overlap / max(len(q_tokens), 1)
        base = overlap * 8.0 + precision * 4.0 + recall * 6.0
        return base + _wh_score_bonus(wh_kind, sent)

    scores = [_score(s) for s in all_sents]

    lambda_mmr = 0.65
    target = 5
    candidates = list(range(len(all_sents)))
    selected: list[int] = []
    selected_wsets: list[set] = []

    while candidates and len(selected) < target:
        best_ci = None
        best_sc = -1e9
        for ci in candidates:
            rel = scores[ci]
            if not selected_wsets:
                sc = rel
            else:
                max_sim = max(_overlap_sim(_word_set(all_sents[ci]), sw) for sw in selected_wsets)
                sc = lambda_mmr * rel - (1.0 - lambda_mmr) * max_sim
            if sc > best_sc:
                best_sc = sc
                best_ci = ci
        if best_ci is None or scores[best_ci] < 2.0:
            break
        candidates.remove(best_ci)
        selected.append(best_ci)
        selected_wsets.append(_word_set(all_sents[best_ci]))

    if not selected:
        if all_sents and any(s > 0 for s in scores):
            best_i = max(range(len(all_sents)), key=lambda i: scores[i])
            return all_sents[best_i].strip()
        return (all_sents[0] if all_sents else '').strip()

    selected.sort()
    out: list[str] = []
    seen: set[str] = set()
    for i in selected:
        s = all_sents[i].strip()
        key = s.lower()
        if key not in seen:
            seen.add(key)
            out.append(s)

    return ' '.join(out).strip()


def _context_as_activity(doc: dict, *, text: str | None = None, score: float | None = None) -> dict:
    # Match the shape Looma search UI expects (fp/fn/ft/dn/ndn/etc.).
    out = {}
    try:
        _id = doc.get('_id')
        out['_id'] = str(_id) if _id is not None else None
    except Exception:
        out['_id'] = None

    for k in ('dn', 'ndn', 'ft', 'fp', 'fn', 'nfp', 'nfn', 'thumb', 'url', 'ch_id', 'ID', 'grade', 'class', 'subject', 'lang'):
        try:
            v = doc.get(k)
            if v is not None:
                out[k] = v
        except Exception:
            continue

    if score is not None:
        out['score'] = float(score)
    if text:
        out['rag_text'] = str(text)
    return out


def _context_as_chapter_chunk(row: dict, *, score: float | None = None, max_chars: int = 1200) -> dict:
    # Convert a hydrated chunk row into an "activity-like" object so Looma UI can render it.
    chapter_id = row.get('chapter_id')
    chapter_title = row.get('chapter_title') or 'Chapter'
    page = row.get('page_start')
    fp = row.get('looma_fp')
    fn = row.get('looma_fn')
    dn = f"{chapter_title}" + (f" (p.{page})" if page is not None else '')

    doc = {
        '_id': row.get('id'),
        'dn': dn,
        'ndn': dn,
        'ft': 'pdf',
        'fp': fp,
        'fn': fn,
        'ch_id': chapter_id,
    }
    text = (row.get('text') or '').strip()
    if max_chars and len(text) > max_chars:
        text = text[:max_chars].rsplit(' ', 1)[0].rstrip() + '…'
    return _context_as_activity(doc, text=text, score=score)


def _extract_chapter_text_from_pdf(*, chapter_id: str, grade: int | None, subject: str | None, language: str | None) -> list[str]:
    ch_dir = find_chapter_dir(grade=grade, subject=subject, language=language)
    if ch_dir is None:
        return []

    pdf_path = ch_dir / f'{chapter_id}.pdf'
    if not pdf_path.exists():
        return []

    _otel_record('pdf_extract_calls', 1, chapter_id=chapter_id, language=str(language or ''))
    _t0 = time.time()
    try:
        from app.extract.text_extractors import extract_any  # noqa: WPS433

        pages = extract_any(pdf_path, ocr_langs='eng+nep')
    except Exception:
        _otel_record('pdf_extract_latency_ms', (time.time() - _t0) * 1000.0, error='1')
        return []
    _otel_record('pdf_extract_latency_ms', (time.time() - _t0) * 1000.0)

    parts: list[str] = []
    for p in pages or []:
        t = clean_text((p or {}).get('text') or '')
        if t and len(t) >= 25:
            parts.append(t)

    if not parts:
        return []

    # Chunk the concatenated content to keep keyword/summary models stable.
    return _chunk_text_simple('\n'.join(parts), chunk_size=1400, overlap=200)


# Match the textbook activity headings used throughout the CEHRD curriculum.
# Examples that this catches:
#     Activity 1.2
#     Activity 3.1 :  Find the missing number
#     ACTIVITY 2.4 — Group work
#     क्रियाकलाप १.२
# Captures the activity number and the rest of the title line.
_ACTIVITY_HEADING_RE = re.compile(
    r'(?im)^\s*(?:activity|exercise|क्रियाकलाप|अभ्यास)\s*'
    r'([0-9०-९]+(?:\.[0-9०-९]+)?)'
    r'\s*[:.\-—–]?\s*(.*)$'
)


# Splits a textbook Activity / Exercise body on numbered list markers:
#     "1. Find the sum of 23 and 45."
#     "2) Subtract 8 from 25."
#     "(3) Convert 5 m to cm."
# Each item becomes its own pseudo-block so the variant generator can recognise
# the arithmetic pattern inside that single exercise rather than across the
# whole activity body (which often mixes unrelated drills).
_NUMBERED_ITEM_RE = re.compile(r'(?m)(?:^|(?<=[\.\?!]\s)|(?<=[\.\?!]))\s*\(?(\d{1,2})[\.\)]\s+')


def _split_block_by_numbered_items(block: dict) -> list[dict]:
    body = (block.get('body') or '').strip()
    if not body:
        return [block]
    matches = list(_NUMBERED_ITEM_RE.finditer(body))
    if len(matches) < 2:
        return [block]
    out: list[dict] = []
    for i, m in enumerate(matches):
        num = m.group(1)
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(body)
        sub_body = body[start:end].strip(' .')
        if len(sub_body) < 8:
            continue
        out.append({
            'id': f"{block.get('id', '')}.{num}" if block.get('id') else num,
            'title': block.get('title') or '',
            'body': sub_body,
        })
    return out if out else [block]


# Subjects whose chapters are mostly computational/quantitative. For these we
# skip narrative cloze + true-false derivations and emit only worked-example
# variants — otherwise a Maths or Science exam ends up full of grammar-style
# fill-in-the-blank questions instead of actual problems.
_QUANTITATIVE_SUBJECT_KEYWORDS = (
    'math', 'mathematic', 'arithmetic', 'algebra', 'geometry',
    'science', 'physics', 'chemistry', 'biology', 'computer',
    'गणित', 'विज्ञान',  # Nepali: math, science
)


def _is_quantitative_subject(subject: str | None) -> bool:
    if not subject:
        return False
    s = subject.strip().lower()
    return any(k in s for k in _QUANTITATIVE_SUBJECT_KEYWORDS)


# Directory under the shared `looma_content` volume where generated exams are
# persisted as static HTML so the chapter Resources page (PHP / Apache) can
# list and re-open them later.
_EXAMS_DIR = _Path(os.environ.get('LOOMA_EXAMS_DIR') or '/looma/content/exams')


def _exams_dir() -> _Path:
    try:
        _EXAMS_DIR.mkdir(parents=True, exist_ok=True)
    except Exception:
        pass
    return _EXAMS_DIR


def _safe_token(value, *, max_len: int = 24, fallback: str = 'x') -> str:
    token = re.sub(r'[^A-Za-z0-9]', '', str(value or ''))[:max_len]
    return token or fallback


def _save_exam_html(html: str, *, grade, subject: str, prefix: str, language: str, seed: str, total_q: int) -> tuple[str, str]:
    """Persist a generated exam to /looma/content/exams/ and write a sidecar
    JSON file with the metadata the Resources page lister needs.

    Returns `(filename, '')` on success or `('', error_message)` on failure.
    """
    base = _exams_dir()
    ts = datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')
    grade_tok   = _safe_token(grade, max_len=4, fallback='x')
    subject_tok = _safe_token((subject or '').lower(), max_len=24, fallback='subject')
    prefix_tok  = _safe_token((prefix or '').upper(), max_len=12, fallback='all')
    lang_tok    = _safe_token((language or 'en').lower(), max_len=4, fallback='en')
    fname = f"exam_{grade_tok}_{subject_tok}_{prefix_tok}_{lang_tok}_{ts}.html"
    try:
        (base / fname).write_text(html, encoding='utf-8')
        meta = {
            'file': fname,
            'grade': str(grade) if grade is not None else '',
            'subject': subject or '',
            'prefix': prefix or '',
            'language': language or '',
            'seed': seed or '',
            'created_at': datetime.now(timezone.utc).isoformat(),
            'questions': int(total_q or 0),
        }
        (base / (fname + '.meta.json')).write_text(
            json.dumps(meta, ensure_ascii=False), encoding='utf-8',
        )
        return fname, ''
    except Exception as exc:
        return '', str(exc)


def _list_saved_exams(*, grade: str = '', subject: str = '', prefix: str = '', language: str = '') -> list[dict]:
    """Read every `*.meta.json` from the exams folder and return the entries
    that match the requested grade/subject/prefix/language filters (any field
    left blank acts as a wildcard)."""
    base = _exams_dir()
    if not base.exists():
        return []
    out: list[dict] = []
    norm_grade   = (grade or '').strip()
    norm_subject = (subject or '').strip().lower()
    norm_prefix  = (prefix or '').strip().upper()
    norm_lang    = (language or '').strip().lower()
    for meta_path in base.glob('*.meta.json'):
        try:
            meta = json.loads(meta_path.read_text(encoding='utf-8'))
        except Exception:
            continue
        if not isinstance(meta, dict):
            continue
        if norm_grade   and str(meta.get('grade', '')).strip()   != norm_grade:   continue
        if norm_subject and str(meta.get('subject', '')).strip().lower()  != norm_subject: continue
        if norm_prefix  and str(meta.get('prefix', '')).strip().upper()   != norm_prefix:  continue
        if norm_lang    and str(meta.get('language', '')).strip().lower() != norm_lang:    continue
        # Make sure the HTML is still on disk; otherwise drop the orphan.
        if not (base / str(meta.get('file', ''))).exists():
            continue
        out.append(meta)
    # Newest first so the Resources panel surfaces the most recent exam.
    out.sort(key=lambda m: str(m.get('created_at', '')), reverse=True)
    return out


def _extract_activity_blocks(chunks_text: list[str], *, max_blocks: int = 8, max_chars_per_block: int = 900) -> list[dict]:
    """Pull "Activity x.y" sub-sections out of the chapter text.

    These headings are written by the textbook authors as the canonical worked
    examples for each chapter, so they are by far the best seeds for quiz /
    exercise generation. Returns a list of dicts:
        {"id": "1.2", "title": "...", "body": "..."}
    """
    if not chunks_text:
        return []

    full = '\n'.join(c for c in chunks_text if c)
    if not full:
        return []

    matches = list(_ACTIVITY_HEADING_RE.finditer(full))
    if not matches:
        return []

    blocks: list[dict] = []
    for i, m in enumerate(matches):
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(full)
        body = full[start:end].strip()
        if not body:
            continue
        body = re.sub(r'\s+', ' ', body)[:max_chars_per_block]
        blocks.append({
            'id': (m.group(1) or '').strip(),
            'title': (m.group(2) or '').strip(),
            'body': body,
        })
        if len(blocks) >= max_blocks:
            break
    return blocks


def _lookup_dictionary_entries(
    keywords: list[str],
    *,
    chapter_language: str | None,
) -> dict[str, dict]:
    if not keywords:
        return {}

    try:
        url = (os.environ.get('LOOMA_MONGO_URL') or 'mongodb://looma-db:27017').strip()
        db_name = (os.environ.get('LOOMA_MONGO_DB') or 'looma').strip()
        client = MongoClient(url, serverSelectionTimeoutMS=3000)
        db = client[db_name]
        coll = db['dictionary']
    except Exception:
        return {}

    out: dict[str, dict] = {}
    ch_lang = (chapter_language or '').strip().lower()
    if ch_lang == 'ne':
        ch_lang = 'np'

    for kw in keywords[:50]:
        try:
            if not kw or not isinstance(kw, str):
                continue
            if ch_lang == 'np':
                doc = coll.find_one({'np': kw}, projection={'_id': 0})
                if not doc:
                    doc = coll.find_one({'ne': kw}, projection={'_id': 0})
            else:
                # Try exact, then case-insensitive match for English
                doc = coll.find_one({'en': kw}, projection={'_id': 0})
                if not doc:
                    doc = coll.find_one({'en': re.compile(f'^{re.escape(kw)}$', re.I)}, projection={'_id': 0})
            if doc:
                out[kw] = doc
        except Exception:
            continue

    return out


def _best_dictionary_definition(entry: dict) -> str:
    if not entry or not isinstance(entry, dict):
        return ''

    # Common formats:
    # - { meanings: [ { part: 'noun', def: '...' }, ... ] }
    # - { def: '...' }
    # - { definition: '...' }
    if isinstance(entry.get('meanings'), list):
        defs = []
        for m in entry['meanings']:
            if not isinstance(m, dict):
                continue
            d = (m.get('def') or m.get('definition') or '').strip()
            if d and d not in defs:
                defs.append(d)
            if len(defs) >= 2:
                break
        if defs:
            return ' / '.join(defs)

    for k in ('def', 'definition', 'gloss', 'meaning'):
        v = entry.get(k)
        if isinstance(v, str) and v.strip():
            return v.strip()

    return ''


def collect_strings(value, key: str | None = None) -> list[str]:
    parts: list[str] = []
    if isinstance(value, str):
        text = clean_text(value)
        if len(text) >= 2 and (key in STRING_KEYS or key is None):
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


def open_or_create_vector_collection(path: str, name: str, dim: int):
    # Import zvec lazily: on some older CPUs, native wheels can crash the interpreter
    # (Exit Code 132 / illegal instruction). Keeping the import inside this function
    # allows the server to run in FTS-only mode.
    import zvec  # noqa: WPS433

    if os.path.exists(path):
        return zvec.open(path=path)

    schema = zvec.CollectionSchema(
        name=name,
        vectors=zvec.VectorSchema('embedding', zvec.DataType.VECTOR_FP32, dim),
    )
    return zvec.create_and_open(path=path, schema=schema)


def lexical_search(conn, query, *, subject=None, grade_level=None, chapter_id=None, limit=10):
    # SQLite FTS5 "MATCH" uses its own query language; user text like "?" or "-" can
    # trigger syntax errors. Normalize into a safe bag-of-words query.
    def _fts5_safe_query(text: str) -> str:
        t = (text or '').strip()
        if not t:
            return ''
        tokens = _tokenize_query(t)
        return ' '.join(tokens[:30]).strip()

    safe_q = _fts5_safe_query(str(query or ''))
    if not safe_q:
        return []

    rows = conn.execute(
        """
        SELECT chunks_fts.chunk_id, bm25(chunks_fts) AS score
        FROM chunks_fts
        JOIN chunks c ON c.id = chunks_fts.chunk_id
        LEFT JOIN chapters ch ON c.chapter_id = ch.id
        WHERE chunks_fts MATCH ?
          AND (? IS NULL OR ch.subject = ?)
          AND (? IS NULL OR ch.grade_level = ?)
          AND (? IS NULL OR c.chapter_id = ?)
        ORDER BY score
        LIMIT ?
        """,
        (
            safe_q,
            subject,
            subject,
            grade_level,
            grade_level,
            chapter_id,
            chapter_id,
            limit,
        ),
    ).fetchall()

    out = []
    for row in rows:
        out.append({'id': row['chunk_id'], 'score': float(row['score']) if row['score'] is not None else 0.0, 'source': 'fts'})
    return out


def semantic_search(
    collection,
    model,
    conn,
    query,
    *,
    subject=None,
    grade_level=None,
    chapter_id=None,
    topk=25,
    limit=10,
    min_score=0.20,
):
    import zvec  # noqa: WPS433
    q = model.encode(query, normalize_embeddings=True).tolist()
    results = collection.query(zvec.VectorQuery('embedding', vector=q), topk=topk)

    out = []
    for rank, r in enumerate(results, start=1):
        doc_id = get_doc_id(r)
        score = getattr(r, 'score', None)
        if score is not None and min_score is not None and float(score) < float(min_score):
            continue

        if subject is not None or grade_level is not None or chapter_id is not None:
            row = conn.execute(
                """
                SELECT c.chapter_id, ch.subject, ch.grade_level
                FROM chunks c
                LEFT JOIN chapters ch ON c.chapter_id = ch.id
                WHERE c.id = ?
                """,
                (doc_id,),
            ).fetchone()
            if not row:
                continue
            if subject is not None and row['subject'] != subject:
                continue
            if grade_level is not None and row['grade_level'] != grade_level:
                continue
            if chapter_id is not None and row['chapter_id'] != chapter_id:
                continue

        if score is None:
            out.append({'id': doc_id, 'score': 1.0 / rank, 'source': 'zvec'})
        else:
            out.append({'id': doc_id, 'score': float(score), 'source': 'zvec'})
        if len(out) >= limit:
            break

    return out


def merge_results(fts_results, zvec_results, limit=10):
    merged = {}

    for rank, item in enumerate(fts_results, start=1):
        merged.setdefault(item['id'], 0.0)
        merged[item['id']] += 2.0 / rank

    for rank, item in enumerate(zvec_results, start=1):
        merged.setdefault(item['id'], 0.0)
        merged[item['id']] += 1.0 / rank

    ranked = [{'id': k, 'hybrid_score': v} for k, v in merged.items()]
    ranked.sort(key=lambda x: x['hybrid_score'], reverse=True)
    return ranked[:limit]


def hydrate_results(conn, merged):
    out = []
    for item in merged:
        row = conn.execute(
            """
            SELECT
                c.id,
                c.clean_text,
                c.page_start,
                ch.id AS chapter_id,
                ch.chapter_title,
                ch.chapter_number,
                d.file_name,
                d.source_path,
                d.subject,
                d.grade_level,
                d.language
            FROM chunks c
            LEFT JOIN chapters ch ON c.chapter_id = ch.id
            LEFT JOIN documents d ON c.document_id = d.id
            WHERE c.id = ?
            """,
            (item['id'],),
        ).fetchone()

        if row:
            fp, fn = looma_fp_fn_from_source_path(row['source_path'])
            href = (fp + fn) if (fp and fn) else None
            out.append(
                {
                    'id': row['id'],
                    'text': row['clean_text'],
                    'page_start': row['page_start'],
                    'chapter_id': row['chapter_id'],
                    'chapter_title': row['chapter_title'],
                    'chapter_number': row['chapter_number'],
                    'file_name': row['file_name'],
                    # "source_path" is meant to be a clickable Looma-served path (relative to Looma web root).
                    # Keep the original absolute path for debugging/auditing.
                    'source_path': href or row['source_path'],
                    'source_path_raw': row['source_path'],
                    'looma_fp': fp,
                    'looma_fn': fn,
                    'subject': row['subject'],
                    'grade_level': row['grade_level'],
                    'language': row['language'],
                    'hybrid_score': item['hybrid_score'],
                }
            )
    return out


def list_chapters(conn, *, subject=None, grade_level=None, language=None, limit=100):
    rows = conn.execute(
        """
        SELECT ch.id AS chapter_id, ch.chapter_title, ch.chapter_number, ch.subject, ch.grade_level, d.language
        FROM chapters ch
        JOIN documents d ON d.id = ch.document_id
        WHERE (? IS NULL OR ch.subject = ?)
          AND (? IS NULL OR ch.grade_level = ?)
          AND (? IS NULL OR d.language = ?)
        ORDER BY ch.grade_level, ch.subject, ch.sequence_order
        LIMIT ?
        """,
        (subject, subject, grade_level, grade_level, language, language, limit),
    ).fetchall()
    return [dict(r) for r in rows]


def get_generated(conn, *, chapter_id=None, content_type=None, limit=50):
    rows = conn.execute(
        """
        SELECT id, content_type, title, body, subject, grade_level, chapter_id, created_at
        FROM generated_content
        WHERE (? IS NULL OR chapter_id = ?)
          AND (? IS NULL OR content_type = ?)
        ORDER BY created_at DESC
        LIMIT ?
        """,
        (chapter_id, chapter_id, content_type, content_type, limit),
    ).fetchall()

    out = []
    for r in rows:
        d = dict(r)
        try:
            d['body'] = json.loads(d['body'])
        except Exception:
            pass
        out.append(d)
    return out


def _parse_grade_value(value) -> int | None:
    if value is None:
        return None
    try:
        return int(value)
    except Exception:
        m = re.search(r'\d+', str(value))
        return int(m.group(0)) if m else None


def _subject_code(subject: str | None) -> str | None:
    s = _norm_token(subject or '')
    if not s:
        return None
    if s in {'math', 'mathematics', 'maths'}:
        return 'M'
    if s in {'english', 'languageenglish'}:
        return 'EN'
    if s in {'science'}:
        return 'S'
    if s in {'socialstudies', 'socialstudieshumanvalueeducation', 'socialscience'}:
        return 'SS'
    if s in {'health', 'healthphysicalcreativeart'}:
        return 'H'
    if s in {'nepali', 'language'}:
        return 'N'
    if s in {'vocational'}:
        return 'V'
    return None


def _infer_exam_prefix(grade: int | None, subject: str | None) -> str:
    code = _subject_code(subject)
    if not grade or not code:
        return ''
    return f'{int(grade)}{code}'


def _resolve_exam_chapters(db, conn, *, prefix: str, grade: int | None, subject: str | None, language: str | None) -> list[dict]:
    """Return chapter docs for a whole grade+subject exam.

    Mongo is the UI source of truth for chapter order. SQLite is used as a
    fallback so exams still work after ingestion even if no prefix was passed.
    """
    ch_docs: list[dict] = []
    prefixes = [p for p in [prefix, _infer_exam_prefix(grade, subject)] if p]
    seen_prefixes: set[str] = set()
    for pfx in prefixes:
        if pfx in seen_prefixes:
            continue
        seen_prefixes.add(pfx)
        regex = '^' + re.escape(pfx) + r'\d'
        try:
            ch_docs = list(db['chapters'].find(
                {'_id': {'$regex': regex}},
                projection={'_id': 1, 'dn': 1, 'ndn': 1},
            ).sort('_id', 1))
        except Exception:
            ch_docs = []
        if ch_docs:
            return ch_docs

    fallback_prefix = prefix or _infer_exam_prefix(grade, subject)
    if not fallback_prefix:
        return []

    bad_title_terms = {'teacher guide', 'thumb', 'outline', 'plan', 'summary', 'keywords'}
    canonical_re = re.compile(r'^(' + re.escape(fallback_prefix) + r'\d{2}(?:\.\d{2})?)(?:\s+nepali)?$', re.I)
    lang = (language or 'en').strip().lower()
    if lang == 'ne':
        lang = 'np'

    try:
        rows = conn.execute(
            """
            SELECT ch.id AS chapter_id, ch.chapter_title, ch.chapter_number, ch.subject, ch.grade_level, d.language
            FROM chapters ch
            JOIN documents d ON d.id = ch.document_id
            WHERE ch.chapter_title LIKE ?
              AND (? IS NULL OR ch.subject = ?)
              AND (? IS NULL OR ch.grade_level = ?)
            ORDER BY ch.chapter_title, ch.sequence_order
            LIMIT 1000
            """,
            (fallback_prefix + '%', subject or None, subject or None, grade, grade),
        ).fetchall()
    except Exception:
        rows = []

    seen: set[str] = set()
    for r in rows:
        title = (r['chapter_title'] or '').strip()
        title_l = title.lower()
        if any(term in title_l for term in bad_title_terms):
            continue
        m = canonical_re.match(title)
        if not m:
            continue
        canonical = m.group(1).upper()
        is_np_title = 'nepali' in title_l
        if lang == 'en' and is_np_title and canonical in seen:
            continue
        if canonical in seen:
            continue
        seen.add(canonical)
        ch_docs.append({
            '_id': r['chapter_id'],
            'dn': canonical,
            'ndn': title if is_np_title else canonical,
        })
    return ch_docs


def _load_indexed_exercise_questions(conn, chapter_id: str, *, limit: int, seed: int) -> list[dict]:
    try:
        rows = conn.execute(
            """
            SELECT question_text, question_type, answer_options_json, correct_answer
            FROM exercises
            WHERE chapter_id = ?
            ORDER BY source_ref, id
            """,
            (chapter_id,),
        ).fetchall()
    except Exception:
        return []

    questions = []
    for r in rows:
        prompt = (r['question_text'] or '').strip()
        answer = (r['correct_answer'] or '').strip()
        if not prompt or not answer:
            continue
        try:
            opts = json.loads(r['answer_options_json'] or '[]')
        except Exception:
            opts = []
        questions.append({
            'type': r['question_type'] or 'mcq',
            'prompt': prompt,
            'options': opts if isinstance(opts, list) and opts else None,
            'answer': answer,
            'source_activity': 'Chapter exercise',
        })

    rnd = random.Random(seed)
    rnd.shuffle(questions)
    return questions[:limit]


def _dedupe_exam_questions(questions: list[dict], *, limit: int) -> list[dict]:
    out = []
    seen: set[str] = set()
    for q in questions:
        if not isinstance(q, dict):
            continue
        prompt = (q.get('prompt') or '').strip()
        answer = (q.get('answer') or '').strip() if isinstance(q.get('answer'), str) else ''
        if not prompt:
            continue
        key = re.sub(r'\s+', ' ', prompt).strip().lower()
        if key in seen:
            continue
        seen.add(key)
        q = dict(q)
        q['prompt'] = prompt
        if answer:
            q['answer'] = answer
        out.append(q)
        if len(out) >= limit:
            break
    return out


def _build_exam_questions_for_chapter(conn, gen, *, chapter_id: str, chunks_text: list[str], grade: int | None, subject: str | None, language: str | None, per_chapter: int, random_seed: str = '') -> list[dict]:
    """Single-source-of-truth exam builder.

    Pipeline:
      1. Seed the pool with exercises the indexer has already recognised in
         the chapter's lessons/PDFs (these are authored, not AI-generated).
      2. Run the unified `generate_activity_variants` over every Activity /
         Exercise block extracted from the chapter PDF. The generator returns
         numeric resampled variants, cloze and true/false questions.
      3. If the PDF has no explicit "Activity X.Y" headings, treat the
         chapter body as a single virtual block so the same generator can
         still produce questions over the chapter material.
      4. Dedupe and cap to `per_chapter`. A summary-based safety net is only
         used when the pipeline returns nothing at all.
    """
    # Mix in the URL-supplied seed so every "Generate Exam" click produces a
    # different question pool while still being reproducible for the saved
    # filename it gets written to.
    seed_key = f"{chapter_id}|{random_seed}" if random_seed else chapter_id
    seed = hash(seed_key) & 0x7fffffff
    pool: list[dict] = []
    is_quant = _is_quantitative_subject(subject)
    subject_kind = 'quantitative' if is_quant else 'narrative'

    pool.extend(_load_indexed_exercise_questions(conn, chapter_id, limit=max(per_chapter * 2, 6), seed=seed))

    # Keywords + dictionary lookups feed *definition*-style questions, which
    # only make sense on narrative subjects (English, Social Studies, …). For
    # Maths / Science we keep these empty so the generator stays focused on
    # the worked-example arithmetic recognised in the chapter.
    chapter_keywords: list[str] = []
    chapter_dict_entries: dict = {}
    if not is_quant:
        try:
            chapter_keywords = gen.compute_keywords(chunks_text, limit=18) or []
        except Exception:
            chapter_keywords = []
        if chapter_keywords:
            try:
                chapter_dict_entries = _lookup_dictionary_entries(chapter_keywords, chapter_language=language) or {}
            except Exception:
                chapter_dict_entries = {}

    try:
        pdf_chunks = _extract_chapter_text_from_pdf(
            chapter_id=chapter_id, grade=grade, subject=subject, language=language,
        )
        source_text = pdf_chunks or chunks_text
        # Lift the cap from 8 → 32 so chapters with many activities can
        # contribute every recognised block to the variant pool. The final
        # dedupe still caps the per-chapter output at `per_chapter`.
        act_blocks = _extract_activity_blocks(source_text, max_blocks=32)

        # If no explicit "Activity X.Y" headings, treat the chapter body as a
        # single virtual block so the unified generator still runs over it.
        is_virtual = False
        if not act_blocks and source_text:
            joined = ' '.join(t for t in source_text if t).strip()
            if joined:
                act_blocks = [{
                    'id': '',
                    'title': '',
                    'body': joined[:4000],
                }]
                is_virtual = True

        # Expand each Activity body into individual numbered items ("1. ...
        # 2. ... 3. ...") so the variant generator can recognise the
        # arithmetic pattern of each exercise on its own, instead of trying
        # to match the whole mixed body. This is the main reason exams for
        # Maths look like real practice drills rather than generic quizzes.
        expanded_blocks: list[dict] = []
        for blk in act_blocks:
            expanded_blocks.extend(_split_block_by_numbered_items(blk))
        act_blocks = expanded_blocks

        # How many variants we mine *per* activity block — bigger pool when
        # we only have a virtual block to draw from.
        if is_virtual:
            per_block_variants = max(per_chapter * 2, 6)
        else:
            per_block_variants = max(2, min(5, per_chapter))

        for idx, blk in enumerate(act_blocks):
            if not (blk.get('body') or '').strip():
                continue
            block_seed = hash(chapter_id + str(idx)) & 0x7fffffff
            try:
                variants = gen.generate_activity_variants(
                    blk,
                    n_variants=per_block_variants,
                    seed=block_seed,
                    keywords=chapter_keywords,
                    dict_entries=chapter_dict_entries,
                    subject_kind=subject_kind,
                ) or []
            except Exception:
                variants = []

            for q in variants:
                if not isinstance(q, dict):
                    continue
                if is_virtual:
                    q['source_activity'] = 'Chapter material'
                else:
                    q['source_activity'] = f"Activity {blk.get('id','')}".strip()
                    if blk.get('title'):
                        q['source_title'] = blk['title']
                pool.append(q)
    except Exception:
        pass

    picked = _dedupe_exam_questions(pool, limit=per_chapter)
    if picked:
        return picked

    try:
        summary = gen.summarize(chunks_text, sentence_limit=2)
    except Exception:
        summary = ''
    fallback_prompt = 'Explain one important idea from this chapter.'
    if summary:
        fallback_prompt = 'Using the chapter material, explain: ' + summary[:220].rstrip()
    return [{
        'type': 'short_answer',
        'prompt': fallback_prompt,
        'options': None,
        'answer': '',
        'source_activity': 'Chapter coverage fallback',
    }]


class Handler(BaseHTTPRequestHandler):
    _conn = None
    _model = None
    _collection = None
    _activities_collection = None
    _activities_lock = threading.RLock()
    _activities_count = 0
    _activities_error = None

    def log_message(self, format, *args):
        if getattr(self, 'path', '') == '/health':
            return
        return super().log_message(format, *args)

    def _gen_request_id(self):
        """Generate a unique request ID for tracking."""
        return str(uuid.uuid4())[:12]

    def _json(self, status, payload):
        try:
            body = json.dumps(payload, ensure_ascii=False).encode('utf-8')
            self.send_response(status)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type, traceparent, tracestate')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        except (BrokenPipeError, ConnectionResetError):
            # Client disconnected (common when the browser aborts/refreshes or UI timeouts).
            self.close_connection = True
            return

    def _html(self, status: int, html: str):
        try:
            body = (html or '').encode('utf-8')
            self.send_response(status)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type, traceparent, tracestate')
            # Allow this HTML to be embedded in cross-origin iframes (the AI
            # admin page lives on the looma-web container and frames the
            # quiz/vocab preview from looma-ai:8089).
            self.send_header('Content-Security-Policy', "frame-ancestors *")
            self.send_header('X-Frame-Options', 'ALLOWALL')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        except (BrokenPipeError, ConnectionResetError):
            self.close_connection = True
            return

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, traceparent, tracestate')
        # Cache preflight for 10 min so /chapter_status etc. don't pay the
        # OPTIONS round-trip on every poll.
        self.send_header('Access-Control-Max-Age', '600')
        self.end_headers()

    @classmethod
    def _get_conn(cls):
        if cls._conn is None:
            cls._conn = get_conn()
            try:
                _ensure_learning_tables(cls._conn)
                cls._conn.commit()
            except Exception:
                pass
        return cls._conn

    @classmethod
    def _get_model(cls):
        if cls._model is None:
            cls._model = load_model()
        return cls._model

    @classmethod
    def _get_collection(cls):
        if cls._collection is None:
            import zvec  # noqa: WPS433
            cls._collection = zvec.open(path=COLLECTION_PATH)
        return cls._collection

    @classmethod
    def _mongo_collection(cls):
        url = (os.environ.get('LOOMA_MONGO_URL') or 'mongodb://looma-db:27017').strip()
        db_name = (os.environ.get('LOOMA_MONGO_DB') or 'looma').strip()
        coll_name = (os.environ.get('LOOMA_MONGO_COLLECTION') or 'activities').strip()

        client = MongoClient(url, serverSelectionTimeoutMS=5000)
        return client[db_name][coll_name]

    @classmethod
    def _publish_resources(
        cls,
        conn,
        *,
        chapter_id: str,
        grade: int | None,
        subject: str | None,
        language: str | None,
        overwrite: bool,
    ) -> dict:
        import scripts.generate_assets as gen

        types = None
        # `types` is intentionally not in the signature so older callers don't break.
        # It can be injected by setting a temporary attribute on the class via payload handling.
        try:
            types = getattr(cls, '_publish_types', None)
        except Exception:
            types = None
        if not types:
            types = ['summary', 'keywords']
        types = [str(t).strip().lower() for t in types if str(t).strip()]

        ch_dir = find_chapter_dir(grade=grade, subject=subject, language=language)
        if ch_dir is None:
            raise ValueError('Could not resolve chapter directory from grade/subject/language')

        summary_path = ch_dir / f'{chapter_id}.summary'
        keywords_path = ch_dir / f'{chapter_id}.keywords'

        has_all = True
        if 'summary' in types and not summary_path.exists():
            has_all = False
        if 'keywords' in types and not keywords_path.exists():
            has_all = False

        if (not overwrite) and has_all:
            return {
                'ok': True,
                'skipped': True,
                'paths': {
                    'summary': str(summary_path),
                    'keywords': str(keywords_path),
                },
                'web_paths': {
                    'summary': looma_web_path_for_file(summary_path),
                    'keywords': looma_web_path_for_file(keywords_path),
                },
            }

        if overwrite:
            try:
                del_types = []
                if 'summary' in types:
                    del_types.append('chapter_summary')
                if 'keywords' in types:
                    del_types.append('chapter_keywords')
                if del_types:
                    placeholders = ','.join('?' for _ in del_types)
                    conn.execute(
                        f"DELETE FROM generated_content WHERE chapter_id = ? AND content_type IN ({placeholders})",
                        (chapter_id, *del_types),
                    )
            except Exception:
                pass

        chunk_ids, chunks_text = gen.get_chunks_for_chapter(conn, chapter_id)
        if not chunks_text:
            # Allow summary/keywords generation even when ingestion hasn't run yet:
            # extract directly from the chapter PDF if present.
            chunk_ids = []
            chunks_text = _extract_chapter_text_from_pdf(
                chapter_id=chapter_id,
                grade=grade,
                subject=subject,
                language=language,
            )
        if not chunks_text:
            raise ValueError(
                'No ingested chunks for chapter_id (and could not extract from chapter PDF). '
                'Run LOOMA ingestion so zvec+sqlite are populated, or upload/restore the chapter PDF.'
            )

        keywords = gen.compute_keywords(chunks_text, limit=12)

        # Collect teacher-approved summaries to use as keyword boost for
        # sentence scoring — makes regeneration converge towards teacher preference.
        teacher_hint_kw = []
        try:
            _ensure_learning_tables(conn)

            prev_summary_text = ''
            try:
                if summary_path.exists():
                    prev_summary_text = safe_read_text(summary_path, limit_chars=1200).strip()
            except Exception:
                pass

            if overwrite and prev_summary_text:
                try:
                    conn.execute(
                        "INSERT INTO summary_feedback (chapter_id, summary_text, source) VALUES (?, ?, ?)",
                        (chapter_id, prev_summary_text, 'replace_prev'),
                    )
                except Exception:
                    pass

            teacher_rows = conn.execute(
                """
                SELECT summary_text
                FROM summary_feedback
                WHERE chapter_id = ? AND source = 'teacher_save'
                ORDER BY id DESC
                LIMIT 3
                """,
                (chapter_id,),
            ).fetchall()
            teacher_text = '\n'.join(
                (r['summary_text'] or '').strip()
                for r in teacher_rows
                if (r['summary_text'] or '').strip()
            )
            if teacher_text:
                teacher_hint_kw = gen.compute_keywords([teacher_text], limit=6)
        except Exception:
            pass

        summary = gen.summarize(
            chunks_text,
            sentence_limit=5,
            keywords=keywords,
            keyword_boost=teacher_hint_kw,
            language=language,
        )
        summary_model = 'extractive_tfidf_v2'

        try:
            conn.execute(
                "INSERT INTO summary_feedback (chapter_id, summary_text, source) VALUES (?, ?, ?)",
                (chapter_id, str(summary or '').strip(), 'auto_replace' if overwrite else 'auto_generate'),
            )
        except Exception:
            pass

        dict_entries = _lookup_dictionary_entries(keywords, chapter_language=language)

        # Persist into generated_content table as well (for preview/traceability).
        kw_id = gen.stable_id('gen_kw', chapter_id, 'v1')
        gen.upsert_generated_content(
            conn,
            {
                'id': kw_id,
                'content_type': 'chapter_keywords',
                'title': f'Keywords: {chapter_id}',
                'body': json.dumps({'keywords': keywords}, ensure_ascii=False),
                'chapter_id': chapter_id,
                'source_chunk_ids': chunk_ids,
                'generator_model': 'tfidf',
                'prompt_version': 'v1',
                'status': 'generated',
                'zvec_doc_id': kw_id,
            },
        )

        sum_id = gen.stable_id('gen_sum', chapter_id, 'v1')
        gen.upsert_generated_content(
            conn,
            {
                'id': sum_id,
                'content_type': 'chapter_summary',
                'title': f'Summary: {chapter_id}',
                'body': json.dumps({'summary': summary}, ensure_ascii=False),
                'chapter_id': chapter_id,
                'source_chunk_ids': chunk_ids,
                'generator_model': summary_model,
                'prompt_version': 'v1',
                'status': 'generated',
                'zvec_doc_id': sum_id,
            },
        )

        # Home expects:
        # - `.summary`: plain text
        # - `.keywords`: JSON list of objects with keys {en,np,def}
        if 'summary' in types:
            summary_path.write_text(str(summary).strip() + '\n', encoding='utf-8')

        if 'keywords' in types:
            kw_payload = []
            for k in (keywords or []):
                k = str(k)
                entry = dict_entries.get(k) or {}
                if (language or '').strip().lower() in {'np', 'ne'}:
                    np_word = k
                    en_word = (entry.get('en') or entry.get('word') or '').strip()
                else:
                    en_word = k
                    np_word = (entry.get('np') or entry.get('ne') or entry.get('native') or '').strip()

                definition = _best_dictionary_definition(entry) or ''
                # Always provide *some* definition so quizzes/keyword views never show blank definitions.
                if not definition:
                    try:
                        import scripts.generate_assets as gen

                        definition = (gen.best_sentence_for_keyword(chunks_text, k) or '').strip()
                    except Exception:
                        definition = ''
                if not definition:
                    definition = 'Key term from chapter.'

                kw_payload.append({'en': en_word, 'np': np_word, 'def': definition})

            keywords_path.write_text(json.dumps(kw_payload, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

        return {
            'ok': True,
            'skipped': False,
            'summary_model': summary_model,
            'paths': {
                'summary': str(summary_path),
                'keywords': str(keywords_path),
            },
            'web_paths': {
                'summary': looma_web_path_for_file(summary_path),
                'keywords': looma_web_path_for_file(keywords_path),
            },
        }

    @classmethod
    def _rebuild_activities_index(cls) -> int:
        with cls._activities_lock:
            import zvec  # noqa: WPS433

            coll = cls._mongo_collection()
            cursor = coll.find({})

            if os.path.exists(ACTIVITIES_INDEX_PATH):
                shutil.rmtree(ACTIVITIES_INDEX_PATH, ignore_errors=True)

            model = cls._get_model()
            dim = int(getattr(model, 'get_sentence_embedding_dimension', lambda: 384)())
            vecs = open_or_create_vector_collection(ACTIVITIES_INDEX_PATH, 'activities', dim)

            docs = []
            texts = []
            count = 0

            for mongo_doc in cursor:
                source_id = str(mongo_doc.get('_id'))
                parts = collect_strings(mongo_doc)
                if not parts:
                    continue

                search_text = ' '.join(dict.fromkeys(parts))[:12000]
                docs.append(source_id)
                texts.append(search_text)

                if len(docs) >= ACTIVITIES_BATCH_SIZE:
                    embeddings = model.encode(texts, normalize_embeddings=True)
                    payload = [
                        zvec.Doc(id=doc_id, vectors={'embedding': emb.tolist()})
                        for doc_id, emb in zip(docs, embeddings)
                    ]
                    vecs.insert(payload)
                    count += len(payload)
                    docs, texts = [], []

            if docs:
                embeddings = model.encode(texts, normalize_embeddings=True)
                payload = [
                    zvec.Doc(id=doc_id, vectors={'embedding': emb.tolist()})
                    for doc_id, emb in zip(docs, embeddings)
                ]
                vecs.insert(payload)
                count += len(payload)

            cls._activities_collection = vecs
            cls._activities_count = count
            cls._activities_error = None
            return count

    @classmethod
    def _get_activities_collection(cls):
        with cls._activities_lock:
            if cls._activities_collection is not None:
                return cls._activities_collection

            try:
                model = cls._get_model()
                dim = int(getattr(model, 'get_sentence_embedding_dimension', lambda: 384)())
                cls._activities_collection = open_or_create_vector_collection(ACTIVITIES_INDEX_PATH, 'activities', dim)
                try:
                    cls._activities_count = int(getattr(cls._activities_collection.stats, 'doc_count', 0) or 0)
                except Exception:
                    cls._activities_count = 0
                cls._activities_error = None
            except Exception as exc:
                cls._activities_collection = None
                cls._activities_error = str(exc)

            if cls._activities_collection is None or cls._activities_count == 0:
                cls._rebuild_activities_index()

            return cls._activities_collection

    def do_POST(self):
        parsed = urlparse(self.path)
        _otel_record('http_inflight', 1, route=parsed.path)
        try:
            return self._do_POST_inner(parsed)
        finally:
            _otel_record('http_inflight', -1, route=parsed.path)

    def _do_POST_inner(self, parsed):

        if parsed.path == '/rebuild_activities':
            _otel_record('endpoint_calls', 1, route='/rebuild_activities', status='start')
            _otel_record('resource_actions', 1, action='rebuild_activities')
            try:
                count = self.__class__._rebuild_activities_index()
                return self._json(200, {'ok': True, 'doc_count': count})
            except Exception as exc:
                return self._json(500, {'ok': False, 'error': str(exc)})

        if parsed.path not in {'/generate', '/publish_resources', '/generate_teacher_guide', '/generate_lesson', '/update_lesson_theory', '/save_summary', '/save_keywords', '/rag_query', '/rag_feedback', '/replace_pdf', '/delete_resource'}:
            return self._json(404, {'error': 'Not found'})

        if parsed.path == '/replace_pdf':
            _otel_record('endpoint_calls', 1, route='/replace_pdf', status='start')
            _otel_record('resource_actions', 1, action='replace_pdf')
            ctype = str(self.headers.get('Content-Type') or '').lower()
            if 'multipart/form-data' not in ctype:
                return self._json(400, {'ok': False, 'error': 'Expected multipart/form-data'})

            try:
                length = int(self.headers.get('Content-Length') or '0')
            except ValueError:
                length = 0
            # Cap upload size at 64 MiB to avoid runaway reads on a tiny dev box.
            if length <= 0 or length > 64 * 1024 * 1024:
                return self._json(400, {'ok': False, 'error': 'Invalid or too-large upload'})
            body = self.rfile.read(length)
            try:
                fs = _parse_multipart(body, str(self.headers.get('Content-Type') or ''))
            except Exception as exc:
                return self._json(400, {'ok': False, 'error': f'Invalid multipart payload ({exc})'})
            if not fs:
                return self._json(400, {'ok': False, 'error': 'Empty multipart payload'})

            def _fs_str(key: str):
                p = fs.get(key)
                if p is None:
                    return None
                try:
                    s = (p.data or b'').decode('utf-8', 'replace').strip()
                except Exception:
                    return None
                return s or None

            chapter_id = _fs_str('chapter_id')
            if not chapter_id:
                return self._json(400, {'ok': False, 'error': 'Missing chapter_id'})
            if not re.fullmatch(r'[A-Za-z0-9._-]{1,120}', chapter_id):
                return self._json(400, {'ok': False, 'error': 'Invalid chapter_id'})

            grade = _fs_str('grade')
            try:
                grade_i = int(grade) if grade else None
            except Exception:
                grade_i = None
            subject = _fs_str('subject')
            language = _fs_str('language')

            ch_dir = find_chapter_dir(grade=grade_i, subject=subject, language=language)
            if ch_dir is None:
                return self._json(400, {'ok': False, 'error': 'Could not resolve chapter directory'})

            file_part = fs.get('file')
            if file_part is None or file_part.data is None:
                return self._json(400, {'ok': False, 'error': 'Missing file'})
            data = file_part.data

            if not data or len(data) < 16:
                return self._json(400, {'ok': False, 'error': 'Empty upload'})
            if data[:5] != b'%PDF-':
                return self._json(400, {'ok': False, 'error': 'Uploaded file does not look like a PDF'})

            pdf_path = ch_dir / f'{chapter_id}.pdf'
            backup_path = None

            if pdf_path.exists():
                stem = pdf_path.stem
                suffix = pdf_path.suffix
                for n in range(2, 100):
                    candidate = pdf_path.with_name(f'{stem}({n}){suffix}')
                    if not candidate.exists():
                        backup_path = candidate
                        break
                if backup_path is None:
                    return self._json(500, {'ok': False, 'error': 'Too many backups already exist for this chapter PDF'})
                try:
                    pdf_path.replace(backup_path)
                except Exception as exc:
                    return self._json(500, {'ok': False, 'error': f'Could not backup old PDF ({exc})'})

            try:
                pdf_path.write_bytes(data)
            except Exception as exc:
                try:
                    if backup_path and backup_path.exists() and not pdf_path.exists():
                        backup_path.replace(pdf_path)
                except Exception:
                    pass
                return self._json(500, {'ok': False, 'error': f'Could not write new PDF ({exc})'})

            return self._json(
                200,
                {
                    'ok': True,
                    'chapter_id': chapter_id,
                    'paths': {'pdf': str(pdf_path), 'backup': str(backup_path) if backup_path else None},
                    'web_paths': {'pdf': looma_web_path_for_file(pdf_path)},
                },
            )

        try:
            length = int(self.headers.get('Content-Length') or '0')
        except ValueError:
            length = 0

        raw = self.rfile.read(length) if length > 0 else b''
        try:
            payload = json.loads(raw.decode('utf-8') or '{}')
        except Exception:
            payload = {}

        conn = self._get_conn()

        if parsed.path == '/delete_resource':
            _otel_record('endpoint_calls', 1, route='/delete_resource', status='start')
            _otel_record('resource_actions', 1, action='delete_resource')
            chapter_id = (payload.get('chapter_id') or payload.get('chapter_id') or payload.get('ch_id') or '').strip()
            if not chapter_id:
                return self._json(400, {'ok': False, 'error': 'Missing chapter_id'})
            if not re.fullmatch(r'[A-Za-z0-9._-]{1,120}', chapter_id):
                return self._json(400, {'ok': False, 'error': 'Invalid chapter_id'})

            content_type = str(payload.get('type') or payload.get('content_type') or '').strip().lower()
            if content_type not in {'pdf', 'summary', 'keywords'}:
                return self._json(400, {'ok': False, 'error': 'Invalid type'})

            grade = payload.get('grade')
            try:
                grade = int(grade) if grade not in (None, '', False) else None
            except Exception:
                grade = None
            subject = payload.get('subject')
            subject = str(subject).strip() if subject else None
            language = payload.get('language')
            language = str(language).strip() if language else None

            ch_dir = find_chapter_dir(grade=grade, subject=subject, language=language)
            if ch_dir is None:
                return self._json(400, {'ok': False, 'error': 'Could not resolve chapter directory'})

            ext = {'pdf': 'pdf', 'summary': 'summary', 'keywords': 'keywords'}[content_type]
            target = (Path(ch_dir) / f'{chapter_id}.{ext}').resolve()
            try:
                ch_dir_res = Path(ch_dir).resolve()
            except Exception:
                ch_dir_res = Path(ch_dir)

            # Safety: only allow deleting the expected chapter file within the resolved chapter dir.
            try:
                if target.parent != ch_dir_res:
                    return self._json(400, {'ok': False, 'error': 'Refusing to delete outside chapter directory'})
            except Exception:
                return self._json(400, {'ok': False, 'error': 'Invalid delete target'})

            if not target.exists():
                return self._json(200, {'ok': True, 'deleted': False, 'path': str(target)})

            try:
                target.unlink()
            except Exception as exc:
                return self._json(500, {'ok': False, 'error': str(exc)})

            return self._json(200, {'ok': True, 'deleted': True, 'path': str(target)})

        if parsed.path == '/rag_query':
            _otel_record('endpoint_calls', 1, route='/rag_query', status='start')
            _otel_record('chat_calls', 1, route='/rag_query')
            _rag_t0 = time.time()
            request_id = self._gen_request_id()
            query_logger = QueryLogger(logger, "rag_query", request_id)
            query_logger.__enter__()
            
            ql_exited = False
            try:
                question = (payload.get('question') or payload.get('q') or '').strip()
                if not question:
                    return self._json(400, {'ok': False, 'error': 'Missing question'})

                # zvec is the only search engine; the legacy/Qdrant engine was removed.
                engine = 'zvec'
                mode = str(payload.get('mode') or 'hybrid').strip().lower()

                topk = int(payload.get('topk') or payload.get('limit') or 6)
                if topk < 1:
                    topk = 1
                if topk > 15:
                    topk = 15

                subject = payload.get('subject')
                subject = str(subject).strip() if subject else None
                grade = payload.get('grade')
                try:
                    grade = int(grade) if grade not in (None, '', False) else None
                except Exception:
                    grade = None
                chapter_id = payload.get('chapter_id')
                chapter_id = str(chapter_id).strip() if chapter_id else None
                language = payload.get('language')
                language = str(language).strip() if language else None

                include_contexts = bool(payload.get('include_contexts', True))
                max_context_chars = int(payload.get('max_context_chars') or 3200)
                if max_context_chars < 400:
                    max_context_chars = 400
                if max_context_chars > 20000:
                    max_context_chars = 20000
                answer_max_chars = int(payload.get('answer_max_chars') or 260)
                if answer_max_chars < 80:
                    answer_max_chars = 80
                if answer_max_chars > 800:
                    answer_max_chars = 800

                # Conversation history for query expansion in answer generation
                raw_history = payload.get('history')
                history = raw_history if isinstance(raw_history, list) else []
                history = history[-10:]

                _otel_set_attrs({
                    "looma.request_id": request_id,
                    "looma.ai.engine": engine,
                    "looma.ai.mode": mode,
                    "looma.ai.topk": topk,
                    "looma.ai.question_chars": len(question),
                    "looma.ai.history_len": len(history),
                    "looma.ai.subject": subject or "",
                    "looma.ai.grade": grade if grade is not None else -1,
                    "looma.ai.chapter_id": chapter_id or "",
                    "looma.ai.language": language or "",
                })

                # Always include contexts when we have relevant hits (UI depends on it).
                include_contexts = True

                # Learning: boost contexts that previously got 👍 for similar questions.
                try:
                    _ensure_learning_tables(conn)
                except Exception:
                    pass
                boost_ids = _rag_boost_context_ids(conn, question=question, chapter_id=chapter_id, limit=3)

            except Exception as exc:
                ql_exited = True
                try:
                    query_logger.__exit__(type(exc), exc, exc.__traceback__)
                except Exception:
                    pass
                return self._json(500, {'ok': False, 'error': str(exc)})
            finally:
                if not ql_exited:
                    try:
                        query_logger.__exit__(*sys.exc_info())
                    except Exception:
                        pass

            ingestion = {
                'sqlite_documents': None,
                'sqlite_chapters': None,
                'sqlite_chunks': None,
                'zvec_docs': None,
                'zvec_path': COLLECTION_PATH,
            }
            try:
                ingestion['sqlite_documents'] = int(conn.execute('SELECT COUNT(*) AS n FROM documents').fetchone()['n'])
            except Exception:
                ingestion['sqlite_documents'] = None
            try:
                ingestion['sqlite_chapters'] = int(conn.execute('SELECT COUNT(*) AS n FROM chapters').fetchone()['n'])
            except Exception:
                ingestion['sqlite_chapters'] = None
            try:
                ingestion['sqlite_chunks'] = int(conn.execute('SELECT COUNT(*) AS n FROM chunks').fetchone()['n'])
            except Exception:
                ingestion['sqlite_chunks'] = None
            try:
                coll = self._get_collection()
                ingestion['zvec_docs'] = int(getattr(getattr(coll, 'stats', None), 'doc_count', 0) or 0)
            except Exception:
                ingestion['zvec_docs'] = None

            wh_kind = _classify_wh(question)

            def _build_answer(context_texts: list[str]) -> str:
                return _compose_answer(question, context_texts, history=history, wh=wh_kind)

            # zvec/fts/hybrid over curriculum chunks (sqlite + optional zvec embeddings).
            if mode not in {'hybrid', 'fts', 'semantic'}:
                mode = 'hybrid'

            results = []
            degraded = None
            warning = None
            if mode == 'fts':
                fts_results = lexical_search(conn, question, subject=subject, grade_level=grade, chapter_id=chapter_id, limit=topk)
                results = hydrate_results(conn, [{'id': r['id'], 'hybrid_score': r['score']} for r in fts_results])
            else:
                try:
                    model = self._get_model()
                    collection = self._get_collection()
                except Exception as exc:
                    degraded = 'fts'
                    warning = f'Embeddings unavailable; fell back to FTS ({exc}).'
                    # Try with the current filters first; if we get nothing, broaden the search
                    # (still better than returning an empty answer).
                    fts_results = lexical_search(conn, question, subject=subject, grade_level=grade, chapter_id=chapter_id, limit=max(topk, 8))
                    if not fts_results and (subject is not None or grade is not None or chapter_id is not None):
                        fts_results = lexical_search(conn, question, subject=None, grade_level=None, chapter_id=None, limit=max(topk, 10))
                        warning = (warning + ' | Broadened FTS scope (no hits with filters).') if warning else 'Broadened FTS scope (no hits with filters).'
                    results = hydrate_results(conn, [{'id': r['id'], 'hybrid_score': r['score']} for r in fts_results])
                else:
                    if mode == 'semantic':
                        sem_results = semantic_search(
                            collection,
                            model,
                            conn,
                            question,
                            subject=subject,
                            grade_level=grade,
                            chapter_id=chapter_id,
                            topk=max(25, topk),
                            limit=topk,
                        )
                        results = hydrate_results(conn, [{'id': r['id'], 'hybrid_score': r['score']} for r in sem_results])
                    else:
                        fts_results = lexical_search(conn, question, subject=subject, grade_level=grade, chapter_id=chapter_id, limit=topk)
                        sem_results = semantic_search(
                            collection,
                            model,
                            conn,
                            question,
                            subject=subject,
                            grade_level=grade,
                            chapter_id=chapter_id,
                            topk=max(25, topk),
                            limit=topk,
                        )
                        merged = merge_results(fts_results, sem_results, limit=topk)
                        results = hydrate_results(conn, merged)

            # Convert chunk results to "activity-like" contexts so UI can distinguish and reuse thumbnails/icons.
            contexts = []
            context_texts = []
            for r in results:
                if not isinstance(r, dict):
                    continue
                t = (r.get('text') or '').strip()
                if not t:
                    continue
                context_texts.append(t[:max_context_chars])
                contexts.append(_context_as_chapter_chunk(r, score=r.get('hybrid_score'), max_chars=max_context_chars))

            if boost_ids and contexts:
                try:
                    contexts.sort(key=lambda c: (0 if str(c.get('_id') or '') in boost_ids else 1))
                except Exception:
                    pass
            answer = _build_answer(context_texts)
            answer_source = 'curriculum' if answer else None

            # If the curriculum index didn't yield a usable answer, try general
            # knowledge sources so the chat model can still respond to any
            # who/what/when/where/why/how question, on any topic.
            external_refs: list[dict] = []
            if (not answer) or _wh_score_bonus(wh_kind, answer) <= 0:
                # 1) Dictionary fallback — only useful for "define / what is X".
                if wh_kind in ('define', 'what'):
                    word_match = re.search(r'\b(?:define|meaning of|what is|what are)\s+(?:an?\s+|the\s+)?([A-Za-zÀ-ÿ\-]+)', question, re.I)
                    if word_match:
                        d = _dictionary_lookup_general(word_match.group(1))
                        if d:
                            definition = (d.get('def')
                                          or (isinstance(d.get('meanings'), list)
                                              and d['meanings']
                                              and (d['meanings'][0].get('def') or d['meanings'][0].get('definition')))
                                          or '')
                            if definition:
                                answer = f"{word_match.group(1).strip().capitalize()}: {definition}"
                                answer_source = 'dictionary'
                                external_refs.append({'type': 'dictionary', 'word': d.get('en'), 'np': d.get('np'), 'def': definition})

                # 2) Wikipedia summary — broad open-domain coverage.
                if not answer or answer.startswith('No relevant content'):
                    wiki = _wikipedia_lookup(question, language=language)
                    if wiki and wiki.get('extract'):
                        # Run the same WH-aware sentence picker over the Wikipedia
                        # extract so the answer matches the question shape.
                        wiki_answer = _compose_answer(question, [wiki['extract']], history=history, wh=wh_kind)
                        if not wiki_answer:
                            wiki_answer = wiki['extract']
                        answer = wiki_answer
                        answer_source = wiki.get('source') or 'wikipedia'
                        external_refs.append({
                            'type': 'wikipedia',
                            'title': wiki.get('title'),
                            'url': wiki.get('url'),
                        })

            if not answer:
                if results:
                    answer = _direct_answer(question, context_texts, max_chars=400) or ''
                if not answer:
                    answer = "I couldn't find a confident answer. Try rephrasing the question or adding more detail (subject, chapter, or a keyword)."
                    answer_source = answer_source or 'none'

            # Make the final wording match the WH type.
            answer = _shape_answer_for_wh(wh_kind, answer, question)

            # When the student has Nepali selected, answer in Nepali. Uses the
            # Looma dictionary + glossary (set env LOOMA_NLLB=1 for model-quality
            # translation) — the same path the AI pages use for summaries.
            if answer and str(language or '').strip().lower() in ('np', 'ne', 'nep', 'nepali', 'native'):
                try:
                    answer = translate_text_en_to_np(answer)
                except Exception:
                    pass

            # Navigation intent detection
            navigation = _navigate_chapters(conn, question, grade=grade, subject=subject) if _is_navigation_query(question) else []

            # Coverage check: if zvec has fewer docs than sqlite chunks, surface as warning.
            try:
                if ingestion.get('sqlite_chunks') and ingestion.get('zvec_docs') is not None:
                    if int(ingestion['zvec_docs'] or 0) < int(ingestion['sqlite_chunks'] or 0):
                        extra = f"ZVEC doc_count ({ingestion['zvec_docs']}) < sqlite chunks ({ingestion['sqlite_chunks']}); ingestion may be incomplete."
                        warning = (warning + ' | ' + extra) if warning else extra
            except Exception:
                pass

            out = {
                'ok': True,
                'engine': 'zvec',
                'mode': mode,
                'degraded_to': degraded,
                'warning': warning,
                'question': question,
                'answer': answer,
                'wh_kind': wh_kind,
                'answer_source': answer_source,
                'external_refs': external_refs,
                'contexts': contexts,
                'ingestion': ingestion,
                'navigation': navigation,
            }
            try:
                _otel_record('chat_calls', 1, route='/rag_query',
                             wh_kind=str(wh_kind or ''),
                             answer_source=str(answer_source or ''))
                _otel_record('chat_answer_chars', float(len(answer or '')))
                _otel_record('endpoint_latency_ms',
                             (time.time() - _rag_t0) * 1000.0,
                             route='/rag_query', status='ok')
                _otel_record('endpoint_calls', 1, route='/rag_query', status='ok')
            except Exception:
                pass
            return self._json(200, out)

        if parsed.path == '/rag_feedback':
            _otel_record('endpoint_calls', 1, route='/rag_feedback', status='start')
            question = str(payload.get('question') or '').strip()
            if not question:
                return self._json(400, {'ok': False, 'error': 'Missing question'})

            helpful = 1 if bool(payload.get('helpful')) else 0
            engine = str(payload.get('engine') or 'zvec').strip().lower()
            mode = payload.get('mode')
            mode = str(mode).strip().lower() if mode else None
            chapter_id = payload.get('chapter_id')
            chapter_id = str(chapter_id).strip() if chapter_id else None
            subject = payload.get('subject')
            subject = str(subject).strip() if subject else None
            grade = payload.get('grade')
            try:
                grade = int(grade) if grade not in (None, '', False) else None
            except Exception:
                grade = None
            language = payload.get('language')
            language = str(language).strip() if language else None
            answer = str(payload.get('answer') or '').strip() or None

            ctx = payload.get('contexts') or []
            if not isinstance(ctx, list):
                ctx = []
            ctx = [str(x) for x in ctx if str(x).strip()]
            ctx = ctx[:25]

            try:
                _ensure_learning_tables(conn)
                conn.execute(
                    """
                    INSERT INTO rag_feedback (
                      question, engine, mode, chapter_id, subject, grade_level, language,
                      helpful, answer, contexts_json
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        question,
                        engine,
                        mode,
                        chapter_id,
                        subject,
                        grade,
                        language,
                        helpful,
                        answer,
                        json.dumps(ctx, ensure_ascii=False),
                    ),
                )
                conn.commit()
                return self._json(200, {'ok': True})
            except Exception as exc:
                return self._json(500, {'ok': False, 'error': str(exc)})

        chapter_id = (payload.get('chapter_id') or '').strip()
        quiz_questions = int(payload.get('quiz_questions') or 10)
        seed = int(payload.get('seed') or 0)

        if not chapter_id:
            return self._json(400, {'error': 'Missing chapter_id'})

        if parsed.path == '/save_summary':
            _otel_record('endpoint_calls', 1, route='/save_summary', status='start')
            _otel_record('resource_actions', 1, action='save_summary')
            try:
                grade = int(payload.get('grade')) if payload.get('grade') else None
                subject = str(payload.get('subject')) if payload.get('subject') else None
                language = str(payload.get('language')) if payload.get('language') else None

                summary_text = str(payload.get('summary_text') or '').strip()
                if not summary_text:
                    return self._json(400, {'ok': False, 'error': 'Missing summary_text'})

                ch_dir = find_chapter_dir(grade=grade, subject=subject, language=language)
                if ch_dir is None:
                    return self._json(400, {'ok': False, 'error': 'Could not resolve chapter directory'})

                summary_path = ch_dir / f'{chapter_id}.summary'
                summary_path.write_text(summary_text.strip() + '\n', encoding='utf-8')
                try:
                    _ensure_learning_tables(conn)
                    conn.execute(
                        "INSERT INTO summary_feedback (chapter_id, summary_text, source) VALUES (?, ?, ?)",
                        (chapter_id, summary_text.strip(), 'teacher_save'),
                    )
                except Exception:
                    pass
                return self._json(
                    200,
                    {
                        'ok': True,
                        'paths': {'summary': str(summary_path)},
                        'web_paths': {'summary': looma_web_path_for_file(summary_path)},
                    },
                )
            except Exception as exc:
                return self._json(500, {'ok': False, 'error': str(exc)})

        if parsed.path == '/save_keywords':
            _otel_record('endpoint_calls', 1, route='/save_keywords', status='start')
            _otel_record('resource_actions', 1, action='save_keywords')
            try:
                grade = int(payload.get('grade')) if payload.get('grade') else None
                subject = str(payload.get('subject')) if payload.get('subject') else None
                language = str(payload.get('language')) if payload.get('language') else None

                keywords_text = str(payload.get('keywords_text') or '').strip()
                if not keywords_text:
                    return self._json(400, {'ok': False, 'error': 'Missing keywords_text'})

                ch_dir = find_chapter_dir(grade=grade, subject=subject, language=language)
                if ch_dir is None:
                    return self._json(400, {'ok': False, 'error': 'Could not resolve chapter directory'})

                keywords_path = ch_dir / f'{chapter_id}.keywords'
                keywords_path.write_text(keywords_text.strip() + '\n', encoding='utf-8')
                return self._json(
                    200,
                    {
                        'ok': True,
                        'paths': {'keywords': str(keywords_path)},
                        'web_paths': {'keywords': looma_web_path_for_file(keywords_path)},
                    },
                )
            except Exception as exc:
                return self._json(500, {'ok': False, 'error': str(exc)})

        if parsed.path == '/publish_resources':
            _otel_record('endpoint_calls', 1, route='/publish_resources', status='start')
            _otel_record('resource_actions', 1, action='publish_resources')
            try:
                types = payload.get('types')
                if isinstance(types, list) and types:
                    self.__class__._publish_types = types
                out = self.__class__._publish_resources(
                    conn,
                    chapter_id=chapter_id,
                    grade=int(payload.get('grade')) if payload.get('grade') else None,
                    subject=str(payload.get('subject')) if payload.get('subject') else None,
                    language=str(payload.get('language')) if payload.get('language') else None,
                    overwrite=bool(payload.get('overwrite') or False),
                )
                try:
                    delattr(self.__class__, '_publish_types')
                except Exception:
                    pass
                conn.commit()
                return self._json(200, out)
            except ValueError as exc:
                msg = str(exc)
                try:
                    delattr(self.__class__, '_publish_types')
                except Exception:
                    pass
                if 'No ingested chunks for chapter_id' in msg:
                    return self._json(404, {'ok': False, 'error': msg})
                return self._json(400, {'ok': False, 'error': msg})
            except Exception as exc:
                try:
                    delattr(self.__class__, '_publish_types')
                except Exception:
                    pass
                return self._json(500, {'ok': False, 'error': str(exc)})

        if parsed.path == '/generate_teacher_guide':
            _otel_record('endpoint_calls', 1, route='/generate_teacher_guide', status='start')
            _otel_record('gen_calls', 1, kind='teacher_guide')
            try:
                grade = int(payload.get('grade')) if payload.get('grade') else None
                subject = str(payload.get('subject')) if payload.get('subject') else None
                language = str(payload.get('language')) if payload.get('language') else None
                overwrite = bool(payload.get('overwrite') or False)

                ch_dir = find_chapter_dir(grade=grade, subject=subject, language=language)
                if ch_dir is None:
                    return self._json(400, {'ok': False, 'error': 'Could not resolve chapter directory'})

                # Build teacher guide content (concise + usable by teachers)
                import scripts.generate_assets as gen

                chunk_ids, chunks_text = gen.get_chunks_for_chapter(conn, chapter_id)
                if not chunks_text:
                    chunks_text = _extract_chapter_text_from_pdf(
                        chapter_id=chapter_id,
                        grade=grade,
                        subject=subject,
                        language=language,
                    )

                if not chunks_text:
                    return self._json(404, {'ok': False, 'error': 'No chunks for chapter_id (and could not extract from chapter PDF)'})

                keywords = gen.compute_keywords(chunks_text, limit=12)
                summary = gen.summarize(chunks_text, sentence_limit=5, keywords=keywords, language=language)
                dict_entries = _lookup_dictionary_entries(keywords, chapter_language=language)

                vocab_lines = []
                for k in keywords:
                    entry = dict_entries.get(k) or {}
                    d = _best_dictionary_definition(entry) or ''
                    if not d:
                        d = gen.best_sentence_for_keyword(chunks_text, k) or ''
                    if d:
                        vocab_lines.append(f'- {k}: {d}')
                    else:
                        vocab_lines.append(f'- {k}')

                guide_text = '\n'.join(
                    [
                        f'Teacher Guide (AI) — {chapter_id}',
                        '',
                        'Chapter summary',
                        summary.strip(),
                        '',
                        'Key vocabulary',
                        *(vocab_lines or ['(none)']),
                        '',
                        'Suggested activities',
                        '- Quick review: ask students to explain the summary in their own words.',
                        '- Vocabulary: pick 5 words and create example sentences.',
                        '- Quiz practice: generate a quiz from the AI page and discuss answers.',
                        '',
                    ]
                )

                fn = f'{chapter_id}.teacher_guide.txt'
                path = ch_dir / fn
                if path.exists() and not overwrite:
                    return self._json(
                        200,
                        {
                            'ok': True,
                            'skipped': True,
                            'paths': {'teacher_guide': str(path)},
                            'web_paths': {'teacher_guide': looma_web_path_for_file(path)},
                        },
                    )

                path.write_text(guide_text, encoding='utf-8')

                # Register into teacher_guides collection so the status shows "Present"
                try:
                    web_path = looma_web_path_for_file(path)
                    fp = None
                    fn2 = fn
                    if web_path and '/' in web_path:
                        fp = web_path.rsplit('/', 1)[0] + '/'
                    url = (os.environ.get('LOOMA_MONGO_URL') or 'mongodb://looma-db:27017').strip()
                    db_name = (os.environ.get('LOOMA_MONGO_DB') or 'looma').strip()
                    client = MongoClient(url, serverSelectionTimeoutMS=5000)
                    db = client[db_name]
                    tg = db['teacher_guides']
                    tg.update_one(
                        {'ch_id': chapter_id},
                        {
                            '$set': {
                                'ch_id': chapter_id,
                                'type': 'AI',
                                'ft': 'text',
                                'dn': f'Teacher guide (AI) — {chapter_id}',
                                'fn': fn2,
                                'fp': fp or '',
                            }
                        },
                        upsert=True,
                    )
                except Exception:
                    pass

                return self._json(
                    200,
                    {
                        'ok': True,
                        'skipped': False,
                        'paths': {'teacher_guide': str(path)},
                        'web_paths': {'teacher_guide': looma_web_path_for_file(path)},
                    },
                )
            except Exception as exc:
                return self._json(500, {'ok': False, 'error': str(exc)})

        if parsed.path == '/generate_lesson':
            _otel_record('gen_calls', 1, kind='lesson')
            _gen_t = _OtelTimer('gen_latency_ms', kind='lesson')
            _gen_t.__enter__()
            try:
                grade = int(payload.get('grade')) if payload.get('grade') else None
                subject = str(payload.get('subject')) if payload.get('subject') else None
                language = str(payload.get('language') or 'en').strip() or 'en'
                overwrite = bool(payload.get('overwrite') or False)
                n_slides = int(payload.get('n_slides') or 6)
                if n_slides < 3:
                    n_slides = 3
                if n_slides > 12:
                    n_slides = 12

                import scripts.generate_assets as gen

                chunk_ids, chunks_text = gen.get_chunks_for_chapter(conn, chapter_id)
                if not chunks_text:
                    chunks_text = _extract_chapter_text_from_pdf(
                        chapter_id=chapter_id,
                        grade=grade,
                        subject=subject,
                        language=language,
                    )
                # Final fallback: pull related chunks via hybrid search using the
                # chapter title from Mongo `chapters`. Lets curriculum-coded chapters
                # (e.g. "1EN02.00") still get theory text even when their IDs aren't
                # present in the local SQLite chunks index.
                if not chunks_text:
                    try:
                        url2 = (os.environ.get('LOOMA_MONGO_URL') or 'mongodb://looma-db:27017').strip()
                        db_name2 = (os.environ.get('LOOMA_MONGO_DB') or 'looma').strip()
                        ch_doc = MongoClient(url2, serverSelectionTimeoutMS=4000)[db_name2]['chapters'].find_one(
                            {'_id': chapter_id}, projection={'dn': 1, 'ndn': 1}
                        )
                        title = (ch_doc or {}).get('dn') or (ch_doc or {}).get('ndn') or ''
                        title = re.sub(r'\s+', ' ', title).strip()
                        if title:
                            fts_hits = []
                            try:
                                fts_hits = lexical_search(conn, title, limit=8)
                            except Exception:
                                fts_hits = []
                            zvec_hits = []
                            try:
                                model = self._get_model()
                                collection = self._get_collection()
                                zvec_hits = semantic_search(collection, model, conn, title, topk=20, limit=8)
                            except Exception:
                                zvec_hits = []
                            try:
                                merged = merge_results(fts_hits, zvec_hits, limit=8) if (fts_hits or zvec_hits) else []
                                hits = hydrate_results(conn, merged) if merged else []
                                texts = [(h.get('text') or '').strip() for h in hits if (h.get('text') or '').strip()]
                                if texts:
                                    chunks_text = texts
                            except Exception:
                                pass
                    except Exception:
                        pass
                if not chunks_text:
                    return self._json(404, {'ok': False, 'error': 'No content for this chapter (no indexed chunks, no chapter PDF, no title match in the vector index)'})

                keywords = gen.compute_keywords(chunks_text, limit=8)
                summary = (gen.summarize(chunks_text, sentence_limit=3, keywords=keywords, language=language) or '').strip()

                # Build the theory body from indexed curriculum chunks. We keep
                # only sentences that look like real, educational prose (real
                # words, reasonable length, not just digits/headers/page noise).
                joined = ' '.join((c or '').strip() for c in chunks_text if c).strip()
                joined = re.sub(r'\s+', ' ', joined)
                # Force a sentence break before:
                #   - numbered list items: " 1. ", " 2) ", " 3 - "
                #   - bullet markers: "•", "·", "-", "*", "○"
                #   - heading-like fragments at start of new topic ("Note:", "Example:")
                # so each enumerated/topical item lands on its own line later.
                joined = re.sub(r'(?<=\S)\s+(?=(?:\d{1,2})[\.\)\-]\s+[A-ZÀ-Ý])', '\n', joined)
                joined = re.sub(r'(?<=\S)\s+(?=[•·○\*]\s+)', '\n', joined)
                joined = re.sub(r'(?<=\S)\s+(?=(?:Note|Example|Tip|Exercise|Activity|Question)\s*[:\-])', '\n', joined, flags=re.I)
                # Now split into sentences, treating both real punctuation and the
                # explicit newlines we just inserted as boundaries.
                raw_sentences = re.split(r'(?<=[.!?])\s+|\n+', joined)

                _NOISE_RE = re.compile(r'^(?:page\s+\d+|chapter\s+\d+|figure\s*\d*|table\s*\d*|exercise\s*\d*)\s*$', re.I)
                _LETTER_RE = re.compile(r'[A-Za-zÀ-ÿ]')

                def _is_good_sentence(s: str) -> bool:
                    s = s.strip()
                    # Numbered/bulleted enumeration items get a small length
                    # relaxation — they are often shorter than full sentences
                    # ("1. Add the numbers", "2. Subtract the result").
                    is_enum = bool(re.match(r'^(?:\d{1,2}[\.\)\-]|[•·○\*])\s+', s))
                    min_len = 12 if is_enum else 25
                    max_len = 200 if is_enum else 160
                    if len(s) < min_len or len(s) > max_len:
                        return False
                    words = re.findall(r'[A-Za-zÀ-ÿ]+', s)
                    if len(words) < (3 if is_enum else 5) or len(words) > 26:
                        return False
                    letters = sum(1 for c in s if _LETTER_RE.match(c))
                    if letters < max(15, int(len(s) * 0.55)):
                        return False
                    if _NOISE_RE.match(s):
                        return False
                    if not re.search(r'[.!?]\s*$', s):
                        return False
                    return True

                sentences: list[str] = []
                seen_norm = set()
                for pos_idx, raw in enumerate(raw_sentences):
                    s = raw.strip()
                    if not _is_good_sentence(s):
                        continue
                    norm = re.sub(r'\W+', ' ', s.lower()).strip()
                    if norm in seen_norm:
                        continue
                    seen_norm.add(norm)
                    sentences.append(s)

                # Per-slide budget. The slide canvas is 84vw x 86vh with
                # overflow:hidden, so we cap each slide's body at ~640
                # characters across ~5 short paragraphs. The renderer wraps
                # text (we override the legacy `white-space:nowrap` from
                # looma-play-lesson.css), so this budget translates roughly
                # to 8 wrapped lines at 22px on a 90vw container.
                SLIDE_BODY_BUDGET = 640
                max_theory_slides = max(2, n_slides - 3)

                # Rank sentences by usefulness so that, if we don't have room
                # for everything, we keep the most informative ones (overlap
                # with the chapter's top keywords + earlier-in-source bonus).
                kw_lower = {k.lower() for k in keywords[:8]}

                def _score(idx: int, s: str) -> float:
                    toks = re.findall(r"[A-Za-zÀ-ÿ]+", s.lower())
                    if not toks:
                        return 0.0
                    overlap = sum(1 for t in toks if t in kw_lower)
                    # Prefer sentences earlier in the source; mild penalty on length
                    pos_bonus = 1.0 / (1 + idx * 0.02)
                    len_pen = 1.0 if len(s) <= 160 else 0.85
                    return (overlap + 0.5) * pos_bonus * len_pen

                ranked = sorted(
                    enumerate(sentences),
                    key=lambda p: _score(p[0], p[1]),
                    reverse=True,
                )

                # Greedy pack: walk sentences in their original order, but
                # restricted to the top-ranked subset that can fit in
                # max_theory_slides at SLIDE_BODY_BUDGET each.
                total_budget = SLIDE_BODY_BUDGET * max_theory_slides
                kept_idx: set[int] = set()
                running = 0
                for idx, s in ranked:
                    cost = len(s) + 1
                    if running + cost > total_budget:
                        continue
                    kept_idx.add(idx)
                    running += cost
                kept = [s for i, s in enumerate(sentences) if i in kept_idx]

                theory_slides_sentences: list[list[str]] = []
                if kept:
                    cur: list[str] = []
                    cur_len = 0
                    for s in kept:
                        cost = len(s) + 1
                        if cur and cur_len + cost > SLIDE_BODY_BUDGET:
                            theory_slides_sentences.append(cur)
                            cur, cur_len = [], 0
                            if len(theory_slides_sentences) >= max_theory_slides:
                                break
                        cur.append(s)
                        cur_len += cost
                    if cur and len(theory_slides_sentences) < max_theory_slides:
                        theory_slides_sentences.append(cur)
                elif summary:
                    theory_slides_sentences = [[summary[:SLIDE_BODY_BUDGET]]]

                # Trim summary slide to the same budget (smaller, since it's
                # a single block and we want it skim-readable).
                SUMMARY_BUDGET = 360
                if summary and len(summary) > SUMMARY_BUDGET:
                    cut = summary[:SUMMARY_BUDGET]
                    last_stop = max(cut.rfind('. '), cut.rfind('! '), cut.rfind('? '))
                    if last_stop > 120:
                        summary = cut[: last_stop + 1].strip()
                    else:
                        summary = cut.rstrip() + '…'

                # Plain-text representation, kept on the lesson doc so it can be
                # edited later from the AI page (blank line separates slides).
                theory_text_full = '\n\n'.join(
                    '\n'.join(slide) for slide in theory_slides_sentences
                ).strip()

                def _esc(s: str) -> str:
                    return (s or '').replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')

                def _slide_html(title: str, body, *, title_color='#091f48', body_color='#1a2236',
                                accent='#1f6f3a', subtitle: str | None = None,
                                style: str = 'bullets') -> str:
                    """Render a presentation-style slide.

                    `style`:
                        'bullets'  — body items render as bulleted points (default; mimics
                                     PowerPoint's rule of 5–7 short, parallel lines per slide).
                        'prose'    — paragraphs (used for the title/summary slides).
                        'twocolumn'— first half left, second half right.
                    `body` may be str or list[str].

                    The host `.text-display` style sets `white-space:nowrap` and
                    `overflow:hidden`, which would clip everything; we override
                    those locally so the slide actually breathes.
                    """
                    if isinstance(body, str):
                        items = [p.strip() for p in re.split(r'\n{2,}|(?<=[.!?])\s+(?=[A-ZÀ-Ý])', body) if p.strip()]
                        if not items:
                            items = [body or '']
                    else:
                        items = [str(p).strip() for p in body if str(p).strip()]
                    items = [re.sub(r'\s+', ' ', s) for s in items]

                    wrap_open = (
                        '<div class="ai-lesson-slide" style="white-space:normal !important;'
                        'word-wrap:break-word;overflow-wrap:break-word;'
                        'box-sizing:border-box;width:76vw;max-width:76vw;'
                        'margin:0 auto;'
                        'padding:24px 32px;font-family:\'Segoe UI\',\'Helvetica Neue\',Arial,sans-serif;'
                        'background:linear-gradient(180deg,#fafbfd 0%,#eef2f7 100%);'
                        'border-radius:14px;box-shadow:0 6px 24px rgba(9,31,72,0.10);">'
                    )
                    wrap_close = '</div>'

                    # Header band
                    header = (
                        f'<div style="display:flex;align-items:flex-end;gap:14px;'
                        f'border-bottom:3px solid {accent};padding-bottom:8px;margin-bottom:16px;">'
                        f'<div style="font-size:30px;font-weight:700;color:{title_color};'
                        f'letter-spacing:-0.01em;line-height:1.15;">{_esc(title)}</div>'
                        + (f'<div style="font-size:16px;color:#5a6577;font-weight:500;'
                           f'padding-bottom:4px;">{_esc(subtitle)}</div>' if subtitle else '')
                        + '</div>'
                    )

                    if style == 'prose':
                        body_html = ''.join(
                            f'<p style="font-size:22px;line-height:1.55;color:{body_color};'
                            f'margin:0 0 12px 0;">{_esc(p)}</p>'
                            for p in items
                        )
                        return wrap_open + header + body_html + wrap_close

                    if style == 'twocolumn':
                        mid = (len(items) + 1) // 2
                        left, right = items[:mid], items[mid:]

                        def _ul(lst):
                            lis = ''.join(
                                f'<li style="font-size:20px;line-height:1.5;color:{body_color};'
                                f'margin:0 0 10px 0;">{_esc(s)}</li>'
                                for s in lst
                            )
                            return (
                                f'<ul style="list-style:disc outside;padding-left:22px;margin:0;'
                                f'flex:1 1 0;min-width:0;">{lis}</ul>'
                            )

                        cols = (
                            '<div style="display:flex;gap:32px;align-items:flex-start;">'
                            + _ul(left) + (_ul(right) if right else '') + '</div>'
                        )
                        return wrap_open + header + cols + wrap_close

                    # bullets (default) — short, parallel statements with a coloured marker.
                    # If every line already starts with "1.", "2.", ... we render an
                    # ordered list so the slide looks like a genuine PowerPoint.
                    is_enumerated = bool(items) and all(
                        re.match(r'^\s*\d{1,2}[\.\)]\s+', s) for s in items
                    )

                    def _strip_num(s: str) -> str:
                        return re.sub(r'^\s*\d{1,2}[\.\)]\s+', '', s, count=1)

                    if is_enumerated:
                        lis = ''.join(
                            f'<li style="font-size:22px;line-height:1.55;color:{body_color};'
                            f'margin:0 0 14px 0;padding-left:6px;">{_esc(_strip_num(s))}</li>'
                            for s in items
                        )
                        body_html = (
                            f'<ol style="list-style:decimal outside;padding-left:32px;margin:0;'
                            f'color:{accent};">' + lis + '</ol>'
                        )
                    else:
                        lis = ''.join(
                            f'<li style="font-size:22px;line-height:1.55;color:{body_color};'
                            f'margin:0 0 14px 0;padding-left:6px;">{_esc(s)}</li>'
                            for s in items
                        )
                        body_html = (
                            f'<ul style="list-style-type:square;padding-left:26px;margin:0;'
                            f'color:{accent};">' + lis + '</ul>'
                        )
                    return wrap_open + header + body_html + wrap_close

                chapter_label = f'Chapter {chapter_id}'
                title_text = f'{(subject or "").capitalize()} — {chapter_label}'.strip(' —')
                # Cap the key-terms slide so it never overflows: at most 8
                # terms, and never exceed the slide body budget.
                kw_inline = ''
                if keywords:
                    pick: list[str] = []
                    running_len = 0
                    for k in keywords[:8]:
                        add = (len(k) + 2) if pick else len(k)
                        if running_len + add > 320:
                            break
                        pick.append(k)
                        running_len += add
                    kw_inline = ', '.join(pick)

                inline_slides: list[dict] = []
                # Title slide — prose style (one short framing paragraph)
                inline_slides.append({
                    'ft': 'inline',
                    'html': _slide_html(
                        title_text,
                        'Lesson outline generated from the indexed chapter content.',
                        subtitle='AI-generated', style='prose',
                    ),
                })
                # Learning objectives — derived from the top keywords as parallel bullets
                if keywords:
                    objectives = []
                    for k in keywords[:5]:
                        kw = (k or '').strip()
                        if kw:
                            objectives.append(f"Understand the meaning and use of {kw}")
                    if objectives:
                        inline_slides.append({
                            'ft': 'inline',
                            'html': _slide_html(
                                'Learning objectives', objectives,
                                title_color='#091f48', accent='#1f6f3a',
                                subtitle='By the end of this lesson you will be able to',
                                style='bullets',
                            ),
                        })
                # Key terms slide (two-column for readability when many terms)
                if kw_inline:
                    kw_items = [k.strip() for k in kw_inline.split(',') if k.strip()]
                    inline_slides.append({
                        'ft': 'inline',
                        'html': _slide_html(
                            'Key terms', kw_items, title_color='#1f6f3a', accent='#7a4b00',
                            style=('twocolumn' if len(kw_items) >= 4 else 'bullets'),
                        ),
                    })
                # Theory slides — bulleted points, each item = one short sentence
                for i, body_lines in enumerate(theory_slides_sentences, start=1):
                    inline_slides.append({
                        'ft': 'inline',
                        'is_theory': True,
                        'html': _slide_html(
                            f'Key idea {i}', body_lines or ['(no content)'],
                            title_color='#091f48', accent='#1f6f3a',
                            subtitle=f'Part {i} of {len(theory_slides_sentences)}',
                            style='bullets',
                        ),
                    })
                # Worked-example slides extracted from "Activity x.y" blocks in the chapter PDF
                try:
                    activity_blocks = _extract_activity_blocks(chunks_text, max_blocks=3)
                except Exception:
                    activity_blocks = []
                for blk in activity_blocks:
                    body_text = (blk.get('body') or '').strip()
                    if not body_text:
                        continue
                    body_pts = re.split(r'(?<=[.!?])\s+', body_text)
                    body_pts = [s.strip() for s in body_pts if s.strip()][:5]
                    title_lbl = f"Activity {blk.get('id','')}".strip()
                    if blk.get('title'):
                        title_lbl += f" — {blk['title']}"
                    inline_slides.append({
                        'ft': 'inline',
                        'html': _slide_html(
                            title_lbl, body_pts or [body_text[:240]],
                            title_color='#7a4b00', accent='#b06f00',
                            subtitle='Worked example from the textbook',
                            style='bullets',
                        ),
                    })
                # Summary slide — prose style, single paragraph
                if summary:
                    inline_slides.append({
                        'ft': 'inline',
                        'html': _slide_html(
                            'Summary', summary, title_color='#091f48', accent='#7a4b00',
                            subtitle='What we covered', style='prose',
                        ),
                    })

                # --- Pull videos and images linked to this chapter ---
                url = (os.environ.get('LOOMA_MONGO_URL') or 'mongodb://looma-db:27017').strip()
                db_name = (os.environ.get('LOOMA_MONGO_DB') or 'looma').strip()
                activities_coll_name = (os.environ.get('LOOMA_MONGO_COLLECTION') or 'activities').strip()
                client = MongoClient(url, serverSelectionTimeoutMS=5000)
                db = client[db_name]
                activities = db[activities_coll_name]
                lessons = db['lessons']

                video_fts = ['video', 'mp4', 'm4v', 'mov', 'evi', 'MOV']
                image_fts = ['image', 'jpg', 'jpeg', 'png', 'gif']
                video_docs = list(activities.find(
                    {'ch_id': chapter_id, 'ft': {'$in': video_fts}},
                    {'_id': 1, 'dn': 1, 'ft': 1}
                ).limit(4))
                image_docs = list(activities.find(
                    {'ch_id': chapter_id, 'ft': {'$in': image_fts}},
                    {'_id': 1, 'dn': 1, 'ft': 1}
                ).limit(6))

                # Compose final timeline: title -> key terms -> theory(images interleaved) -> videos -> summary
                timeline: list[dict] = []
                # First: title
                if inline_slides:
                    timeline.append(inline_slides.pop(0))
                # Then key terms (if present, comes next from inline_slides)
                if inline_slides and 'Key terms' in (inline_slides[0].get('html') or ''):
                    timeline.append(inline_slides.pop(0))

                # Reserve summary slide for the end
                summary_slide = None
                if inline_slides and 'Summary' in (inline_slides[-1].get('html') or ''):
                    summary_slide = inline_slides.pop()

                # Interleave theory with images
                images_iter = list(image_docs)
                for idx, theory in enumerate(inline_slides):
                    timeline.append(theory)
                    if images_iter:
                        img = images_iter.pop(0)
                        timeline.append({'collection': 'activities', 'id': str(img['_id'])})
                # Any remaining images, append before videos
                for img in images_iter:
                    timeline.append({'collection': 'activities', 'id': str(img['_id'])})
                # Videos
                for v in video_docs:
                    timeline.append({'collection': 'activities', 'id': str(v['_id'])})
                # Summary at the end
                if summary_slide is not None:
                    timeline.append(summary_slide)

                # --- Overwrite: drop existing AI-generated lesson(s) for this chapter ---
                if overwrite:
                    try:
                        old_stubs = list(activities.find(
                            {'ch_id': chapter_id, 'ft': 'lesson', 'author': 'AI'},
                            {'_id': 1, 'mongoID': 1}
                        ))
                        old_ids = []
                        for stub in old_stubs:
                            mid = stub.get('mongoID')
                            if mid:
                                old_ids.append(mid)
                        if old_ids:
                            try:
                                lessons.delete_many({'_id': {'$in': [ObjectId(i) for i in old_ids if i]}})
                            except Exception:
                                pass
                        activities.delete_many({'ch_id': chapter_id, 'ft': 'lesson', 'author': 'AI'})
                    except Exception:
                        pass

                lesson_dn = f'{chapter_id} — {(subject or "").capitalize()} (AI)'.strip(' —')
                today = time.strftime('%Y.%m.%d')
                lesson_doc = {
                    'dn': lesson_dn,
                    'ft': 'lesson',
                    'author': 'AI',
                    'date': today,
                    'language': 'np' if (language or '').lower() in {'np', 'ne', 'nepali'} else 'en',
                    'subject': subject or None,
                    'grade': grade,
                    'ch_id': [chapter_id],
                    'theory_text': theory_text_full,
                    'data': timeline,
                }
                ins = lessons.insert_one(lesson_doc)
                lesson_id = str(ins.inserted_id)

                # Sibling activities stub so chapter listings ("Lessons (Mongo)") pick it up.
                stub_doc = {
                    'ft': 'lesson',
                    'mongoID': lesson_id,
                    'dn': lesson_dn,
                    'author': 'AI',
                    'date': today,
                    'ch_id': [chapter_id],
                    'subject': subject or None,
                    'grade': grade,
                }
                activities.insert_one(stub_doc)

                slide_count = sum(1 for t in timeline if t.get('ft') == 'inline')
                ref_count = sum(1 for t in timeline if t.get('collection') == 'activities')

                _otel_record('chunks_used', len(chunks_text or []), kind='lesson')
                _otel_record('lesson_slides', float(slide_count),
                             grade=str(grade or ''), subject=str(subject or ''))
                _gen_t.__exit__(None, None, None)
                return self._json(200, {
                    'ok': True,
                    'lesson_id': lesson_id,
                    'dn': lesson_dn,
                    'slide_count': slide_count,
                    'reference_count': ref_count,
                    'video_count': len(video_docs),
                    'image_count': len(image_docs),
                    'web_path': f'looma-play-lesson.php?id={lesson_id}',
                })
            except Exception as exc:
                _gen_t.__exit__(type(exc), exc, None)
                return self._json(500, {'ok': False, 'error': str(exc)})

        if parsed.path == '/update_lesson_theory':
            _otel_record('endpoint_calls', 1, route='/update_lesson_theory', status='start')
            _otel_record('resource_actions', 1, action='update_lesson_theory')
            try:
                lesson_id = (payload.get('lesson_id') or '').strip()
                new_text = (payload.get('theory_text') or '').strip()
                if not lesson_id:
                    return self._json(400, {'ok': False, 'error': 'Missing lesson_id'})
                try:
                    oid = ObjectId(lesson_id)
                except Exception:
                    return self._json(400, {'ok': False, 'error': 'Invalid lesson_id'})

                url = (os.environ.get('LOOMA_MONGO_URL') or 'mongodb://looma-db:27017').strip()
                db_name = (os.environ.get('LOOMA_MONGO_DB') or 'looma').strip()
                client = MongoClient(url, serverSelectionTimeoutMS=5000)
                db = client[db_name]
                lessons = db['lessons']

                lesson = lessons.find_one({'_id': oid})
                if not lesson:
                    return self._json(404, {'ok': False, 'error': 'Lesson not found'})

                # Re-render theory inline slides from the edited plain text.
                # Blank-line separates slides; single newline = explicit line break.
                slides_paragraphs = [p.strip() for p in re.split(r'\n{2,}', new_text) if p.strip()]
                if not slides_paragraphs:
                    slides_paragraphs = ['(no content)']

                def _esc(s):
                    return (s or '').replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')

                def _render_theory_slide(idx, paragraph_text):
                    lines = [_esc(line) for line in paragraph_text.split('\n') if line.strip()]
                    body_html = (
                        '<div style="margin:0 0 14px 0;">'
                        '<span style="font-size:24px;color:#222;line-height:1.55;">'
                        + '<br>'.join(lines)
                        + '</span></div>'
                    )
                    return (
                        '<div class="ai-lesson-slide" style="white-space:normal !important;'
                        'word-wrap:break-word;overflow-wrap:break-word;'
                        'box-sizing:border-box;width:76vw;max-width:76vw;'
                        'margin:0 auto;padding:24px 32px;">'
                        '<div><span style="font-size:34px;font-weight:bold;color:#fff;'
                        'background-color:#444;padding:4px 8px;">'
                        f'&nbsp;Theory ({idx})&nbsp;</span></div>'
                        '<div style="height:14px;"></div>'
                        + body_html
                        + '</div>'
                    )

                new_theory_slides = [
                    {'ft': 'inline', 'is_theory': True,
                     'html': _render_theory_slide(i + 1, p)}
                    for i, p in enumerate(slides_paragraphs)
                ]

                # Rebuild data[]: keep title + key terms at the start, replace
                # ALL existing theory slides with the new ones, keep all
                # non-theory items (image/video refs, summary slide) in place.
                old_data = lesson.get('data') or []
                rebuilt = []
                theory_inserted = False
                # Identify theory slides in old data: marked with is_theory:True
                # OR (legacy fallback) HTML containing "&nbsp;Theory".
                def _is_old_theory(item):
                    if not isinstance(item, dict) or item.get('ft') != 'inline':
                        return False
                    if item.get('is_theory'):
                        return True
                    h = item.get('html') or ''
                    return ('Theory (' in h) or ('&nbsp;Theory' in h)

                for item in old_data:
                    if _is_old_theory(item):
                        if not theory_inserted:
                            rebuilt.extend(new_theory_slides)
                            theory_inserted = True
                        # drop the old theory slide
                        continue
                    rebuilt.append(item)
                if not theory_inserted:
                    # No theory slides existed before — insert after the title
                    # (and key terms, if any) at the very start.
                    head_count = 0
                    for it in rebuilt[:2]:
                        if isinstance(it, dict) and it.get('ft') == 'inline':
                            head_count += 1
                        else:
                            break
                    rebuilt = rebuilt[:head_count] + new_theory_slides + rebuilt[head_count:]

                lessons.update_one(
                    {'_id': oid},
                    {'$set': {
                        'theory_text': new_text,
                        'data': rebuilt,
                        'edited': time.strftime('%Y-%m-%dT%H:%M:%S'),
                    }},
                )

                return self._json(200, {
                    'ok': True,
                    'lesson_id': lesson_id,
                    'theory_slide_count': len(new_theory_slides),
                    'total_items': len(rebuilt),
                })
            except Exception as exc:
                return self._json(500, {'ok': False, 'error': str(exc)})

        try:
            import scripts.generate_assets as gen

            gen_types = payload.get('types')
            if isinstance(gen_types, list) and gen_types:
                gen_types = [str(t).strip().lower() for t in gen_types if str(t).strip()]
            else:
                gen_types = ['quiz']

            overwrite = bool(payload.get('overwrite') or False)

            chunk_ids, chunks_text = gen.get_chunks_for_chapter(conn, chapter_id)
            if not chunks_text:
                # Allow generation even when ingestion hasn't run yet:
                # extract directly from the chapter PDF if present.
                chunk_ids = []
                chunks_text = _extract_chapter_text_from_pdf(
                    chapter_id=chapter_id,
                    grade=int(payload.get('grade')) if payload.get('grade') else None,
                    subject=str(payload.get('subject')) if payload.get('subject') else None,
                    language=str(payload.get('language')) if payload.get('language') else None,
                )
            if not chunks_text:
                return self._json(
                    404,
                    {
                        'error': (
                            'No ingested chunks for chapter_id (and could not extract from chapter PDF). '
                            'Run LOOMA ingestion so zvec+sqlite are populated, or upload/restore the chapter PDF.'
                        )
                    },
                )

            keywords = None
            if any(t in gen_types for t in ['quiz', 'vocab', 'flashcards', 'summary', 'keywords', 'objectives']):
                keywords = gen.compute_keywords(chunks_text, limit=12)

            generated_ids = []
            summary = None
            flashcards = None
            quiz = None
            quiz_id = None
            vocab_practice = None
            vocab_id = None

            if 'summary' in gen_types:
                if overwrite:
                    try:
                        conn.execute(
                            "DELETE FROM generated_content WHERE chapter_id = ? AND content_type = 'chapter_summary'",
                            (chapter_id,),
                        )
                    except Exception:
                        pass

                summary = gen.summarize(
                    chunks_text,
                    sentence_limit=5,
                    keywords=keywords,
                    language=str(payload.get('language')) if payload.get('language') else None,
                )
                # Keep only the first generated sentence (requested UX for Looma AI page).
                try:
                    sents = gen.split_sentences(summary or '')
                    summary = (sents[0] if sents else summary).strip()
                    if summary and summary[-1] not in '.!?…':
                        summary += '.'
                except Exception:
                    summary = (summary or '').strip()
                sum_id = gen.stable_id('gen_sum', chapter_id, 'v1')
                gen.upsert_generated_content(
                    conn,
                    {
                        'id': sum_id,
                        'content_type': 'chapter_summary',
                        'title': f'Summary: {chapter_id}',
                        'body': json.dumps({'summary': summary}, ensure_ascii=False),
                        'chapter_id': chapter_id,
                        'source_chunk_ids': chunk_ids,
                        'generator_model': 'extractive_tfidf',
                        'prompt_version': 'v1',
                        'status': 'generated',
                        'zvec_doc_id': sum_id,
                    },
                )
                generated_ids.append(sum_id)

            if 'keywords' in gen_types:
                if overwrite:
                    try:
                        conn.execute(
                            "DELETE FROM generated_content WHERE chapter_id = ? AND content_type = 'chapter_keywords'",
                            (chapter_id,),
                        )
                    except Exception:
                        pass

                kw_id = gen.stable_id('gen_kw', chapter_id, 'v1')
                gen.upsert_generated_content(
                    conn,
                    {
                        'id': kw_id,
                        'content_type': 'chapter_keywords',
                        'title': f'Keywords: {chapter_id}',
                        'body': json.dumps({'keywords': keywords or []}, ensure_ascii=False),
                        'chapter_id': chapter_id,
                        'source_chunk_ids': chunk_ids,
                        'generator_model': 'tfidf',
                        'prompt_version': 'v1',
                        'status': 'generated',
                        'zvec_doc_id': kw_id,
                    },
                )
                generated_ids.append(kw_id)

            if 'objectives' in gen_types:
                if overwrite:
                    try:
                        conn.execute(
                            "DELETE FROM generated_content WHERE chapter_id = ? AND content_type = 'chapter_objectives'",
                            (chapter_id,),
                        )
                    except Exception:
                        pass

                objectives = gen.generate_objectives(
                    chunks_text, keywords or [],
                    limit=int(payload.get('objectives_count') or 5),
                    language=str(payload.get('language')) if payload.get('language') else None,
                )
                obj_id = gen.stable_id('gen_obj', chapter_id, 'v1')
                gen.upsert_generated_content(
                    conn,
                    {
                        'id': obj_id,
                        'content_type': 'chapter_objectives',
                        'title': f'Objectives: {chapter_id}',
                        'body': json.dumps({'objectives': objectives}, ensure_ascii=False),
                        'chapter_id': chapter_id,
                        'source_chunk_ids': chunk_ids,
                        'generator_model': 'heuristic',
                        'prompt_version': 'v1',
                        'status': 'generated',
                        'zvec_doc_id': obj_id,
                    },
                )
                generated_ids.append(obj_id)

                # Write the chapter's `.objectives` file so the Resources page +
                # /chapter_status can pick it up. Mirrors what /save_summary does
                # for `.summary`. One bullet per line keeps it human-readable.
                try:
                    obj_grade    = int(payload.get('grade')) if payload.get('grade') else None
                    obj_subject  = str(payload.get('subject')) if payload.get('subject') else None
                    obj_language = str(payload.get('language')) if payload.get('language') else None
                    obj_dir = find_chapter_dir(grade=obj_grade, subject=obj_subject, language=obj_language)
                    if obj_dir is not None and objectives:
                        obj_path = obj_dir / f'{chapter_id}.objectives'
                        text = '\n'.join('• ' + o for o in objectives) + '\n'
                        obj_path.write_text(text, encoding='utf-8')
                except Exception:
                    # File-system write is best-effort; SQLite copy is the source of truth.
                    pass

            if 'flashcards' in gen_types:
                flashcards = gen.generate_flashcards(chunks_text, keywords or [], limit=12)
                fc_id = gen.stable_id('gen_fc', chapter_id, 'v1')
                gen.upsert_generated_content(
                    conn,
                    {
                        'id': fc_id,
                        'content_type': 'flashcards',
                        'title': f'Flashcards: {chapter_id}',
                        'body': json.dumps({'flashcards': flashcards}, ensure_ascii=False),
                        'chapter_id': chapter_id,
                        'source_chunk_ids': chunk_ids,
                        'generator_model': 'heuristic',
                        'prompt_version': 'v1',
                        'status': 'generated',
                        'zvec_doc_id': fc_id,
                    },
                )
                generated_ids.append(fc_id)

            if 'quiz' in gen_types:
                # `append=true` keeps the existing quiz and adds N more questions
                # (used by the AI page "Generate More" button). Falls back to a
                # fresh generation if no quiz exists yet.
                append_mode = bool(payload.get('append'))
                existing_quiz = []
                existing_vocab = []
                if append_mode:
                    try:
                        rows = get_generated(conn, chapter_id=chapter_id, content_type='chapter_quiz', limit=1)
                        body = rows[0].get('body') if rows else None
                        if isinstance(body, dict):
                            if isinstance(body.get('questions'), list):
                                existing_quiz = body['questions']
                            if isinstance(body.get('vocab'), list):
                                existing_vocab = body['vocab']
                    except Exception:
                        existing_quiz = []
                        existing_vocab = []
                    if not existing_quiz:
                        # Nothing to extend — fall through to a normal generate.
                        append_mode = False

                if overwrite and not append_mode:
                    try:
                        conn.execute(
                            "DELETE FROM generated_content WHERE chapter_id = ? AND content_type = 'chapter_quiz'",
                            (chapter_id,),
                        )
                        # Only remove previously-generated quiz exercises (don't wipe manual/other exercises).
                        conn.execute(
                            "DELETE FROM exercises WHERE chapter_id = ? AND source_ref IN ('generate_assets_v1', 'chapter_quiz_v2')",
                            (chapter_id,),
                        )
                    except Exception:
                        pass

                # Pull dictionary entries for these keywords up front so we can
                # feed them into the v2 generator (definition questions read
                # much more naturally when the answer is the dictionary blurb).
                try:
                    dict_entries = _lookup_dictionary_entries(keywords or [], chapter_language=str(payload.get('language')) if payload.get('language') else None)
                except Exception:
                    dict_entries = {}

                # Flatten the dictionary entries into {word: {def: best_definition}}
                # so generate_quiz_v2 can pick the cleanest definition per word.
                dict_for_quiz = {}
                for w, entry in (dict_entries or {}).items():
                    if not isinstance(entry, dict):
                        continue
                    best_def = (_best_dictionary_definition(entry) or '').strip()
                    if best_def:
                        dict_for_quiz[w] = {'def': best_def}

                # In append mode we offset the seed by the existing question
                # count so generate_quiz_v2 picks different sentences/keywords
                # to template, and ask for `quiz_questions` extra ones.
                if append_mode:
                    extra = gen.generate_quiz_v2(
                        chunks_text, keywords or [], dict_for_quiz,
                        n_questions=quiz_questions,
                        seed=seed + len(existing_quiz) * 7919,
                    )
                    # Drop near-duplicate prompts vs the existing quiz.
                    seen_prompts = {(q.get('prompt') or '').strip().lower()
                                    for q in existing_quiz if isinstance(q, dict)}
                    fresh = []
                    for q in extra:
                        p = (q.get('prompt') or '').strip().lower()
                        if not p or p in seen_prompts:
                            continue
                        seen_prompts.add(p)
                        fresh.append(q)
                    quiz = list(existing_quiz) + fresh
                else:
                    quiz = gen.generate_quiz_v2(
                        chunks_text, keywords or [], dict_for_quiz,
                        n_questions=quiz_questions, seed=seed,
                    )

                # Ensure every quiz has a consistent "5 words + 5 definitions" vocabulary block.
                # Append mode keeps the original vocab block — no need to regenerate.
                vocab_items = list(existing_vocab) if append_mode else []
                seen_vocab = {(v.get('word') or '').lower() for v in vocab_items if isinstance(v, dict)}

                def _add_vocab_item(word: str, definition: str):
                    w = (word or '').strip()
                    d = (definition or '').strip()
                    if not w:
                        return
                    key = w.lower()
                    if key in seen_vocab:
                        return
                    if not d:
                        d = (gen.best_sentence_for_keyword(chunks_text, w) or '').strip()
                    if not d:
                        d = 'Key term from chapter.'
                    seen_vocab.add(key)
                    vocab_items.append({'word': w, 'def': d})

                for k in (keywords or []):
                    if len(vocab_items) >= 5:
                        break
                    w = str(k).strip()
                    if not w or ' ' in w:
                        continue
                    entry = dict_entries.get(w) or {}
                    _add_vocab_item(w, _best_dictionary_definition(entry) or '')

                if len(vocab_items) < 5:
                    try:
                        all_sents = []
                        for t in chunks_text:
                            all_sents.extend(gen.split_sentences(t))
                        all_sents = [s.strip() for s in all_sents if isinstance(s, str) and s.strip()]
                        fallback_def = all_sents[0] if all_sents else 'Key term from chapter.'
                    except Exception:
                        fallback_def = 'Key term from chapter.'

                    n_pad = 1
                    while len(vocab_items) < 5:
                        _add_vocab_item(f'Key term {n_pad}', fallback_def)
                        n_pad += 1

                quiz_id = gen.stable_id('gen_quiz', chapter_id, 'v1', str(quiz_questions))
                gen.upsert_generated_content(
                    conn,
                    {
                        'id': quiz_id,
                        'content_type': 'chapter_quiz',
                        'title': f'Quiz: {chapter_id}',
                        'body': json.dumps({'questions': quiz, 'vocab': vocab_items[:5]}, ensure_ascii=False),
                        'chapter_id': chapter_id,
                        'source_chunk_ids': chunk_ids,
                        'generator_model': 'heuristic',
                        'prompt_version': 'v1',
                        'status': 'generated',
                        'zvec_doc_id': quiz_id,
                    },
                )
                generated_ids.append(quiz_id)

            if 'vocab' in gen_types:
                if overwrite:
                    try:
                        conn.execute(
                            "DELETE FROM generated_content WHERE chapter_id = ? AND content_type = 'chapter_vocab_practice'",
                            (chapter_id,),
                        )
                    except Exception:
                        pass

                vocab_practice = gen.generate_vocab_practice(chunks_text, keywords or [], n_questions=quiz_questions, seed=seed)
                vocab_id = gen.stable_id('gen_vocab', chapter_id, 'v1', str(quiz_questions))
                gen.upsert_generated_content(
                    conn,
                    {
                        'id': vocab_id,
                        'content_type': 'chapter_vocab_practice',
                        'title': f'Key vocabulary: {chapter_id}',
                        'body': json.dumps({'questions': vocab_practice}, ensure_ascii=False),
                        'chapter_id': chapter_id,
                        'source_chunk_ids': chunk_ids,
                        'generator_model': 'heuristic',
                        'prompt_version': 'v1',
                        'status': 'generated',
                        'zvec_doc_id': vocab_id,
                    },
                )
                generated_ids.append(vocab_id)

                # Mirror the quiz flow: register a Mongo activity stub so the
                # chapter Resources page surfaces a "Key vocabulary" button.
                # mongoID == vocab generated_content.id; the player resolves it
                # back via /vocab_data?chapter_id=...
                try:
                    _url = (os.environ.get('LOOMA_MONGO_URL') or 'mongodb://looma-db:27017').strip()
                    _db_name = (os.environ.get('LOOMA_MONGO_DB') or 'looma').strip()
                    _coll = (os.environ.get('LOOMA_MONGO_COLLECTION') or 'activities').strip()
                    _client = MongoClient(_url, serverSelectionTimeoutMS=4000)
                    _activities = _client[_db_name][_coll]
                    if overwrite:
                        _activities.delete_many({
                            'ch_id': chapter_id,
                            'ft': 'vocab',
                            'author': 'AI',
                        })
                    _today = time.strftime('%Y.%m.%d')
                    _activities.insert_one({
                        'ft': 'vocab',
                        'mongoID': vocab_id,
                        'dn': f'Key vocabulary: {chapter_id}',
                        'author': 'AI',
                        'date': _today,
                        'ch_id': [chapter_id],
                        'subject': str(payload.get('subject')) if payload.get('subject') else None,
                        'grade': int(payload.get('grade')) if payload.get('grade') else None,
                        'language': str(payload.get('language')) if payload.get('language') else None,
                    })
                except Exception:
                    # Mongo unavailable shouldn't break SQLite-side generation.
                    pass

            # Optional embedding indexing (can crash on older CPUs if torch/AVX is unsupported).
            # Keep generation usable even when embeddings are disabled/unavailable.
            enable_embed_index = (os.environ.get('LOOMA_ENABLE_EMBED_INDEXING') or '').strip() in {'1', 'true', 'yes'}
            if enable_embed_index:
                from app.index.zvec_store import open_exercise_bank, open_generated_assets

                exercise_bank = open_exercise_bank()
                generated_assets = open_generated_assets()

                model = self._get_model()
                pairs = []
                if 'keywords' in gen_types:
                    pairs.append((gen.stable_id('gen_kw', chapter_id, 'v1'), ' '.join(keywords or [])))
                if 'summary' in gen_types:
                    pairs.append((gen.stable_id('gen_sum', chapter_id, 'v1'), (summary or '').strip()))
                if 'flashcards' in gen_types:
                    pairs.append((gen.stable_id('gen_fc', chapter_id, 'v1'), ' '.join(c['front'] + ' ' + c['back'] for c in (flashcards or [])[:5])))
                if 'quiz' in gen_types:
                    pairs.append((quiz_id, ' '.join(q.get('prompt', '') for q in (quiz or []))))
                if 'vocab' in gen_types:
                    pairs.append((vocab_id, ' '.join(q.get('prompt', '') for q in (vocab_practice or []))))

                for gen_id, text in pairs:
                    if not text.strip():
                        continue
                    vec = model.encode([text], normalize_embeddings=True)[0].tolist()
                    gen.insert_zvec_doc(generated_assets, gen_id, vec)

            # Exercises (quiz questions)
            if 'quiz' in gen_types and isinstance(quiz, list):
                for i, q in enumerate(quiz, start=1):
                    qtype = q.get('type')
                    prompt = (q.get('prompt') or '').strip()
                    answer = q.get('answer')
                    options = q.get('options', []) if qtype == 'mcq' else []
                    if not prompt or not answer:
                        continue

                    ex_id = gen.stable_id('ex', chapter_id, 'v1', qtype or 'unknown', str(i), prompt)
                    ex_row = {
                        'id': ex_id,
                        'chapter_id': chapter_id,
                        'question_text': prompt,
                        'question_type': qtype,
                        'answer_options': options,
                        'correct_answer': answer,
                        'source_type': 'generated',
                        'source_ref': 'chapter_quiz_v2',
                        'zvec_doc_id': ex_id,
                    }
                    gen.upsert_exercise(conn, ex_row)

                    if enable_embed_index:
                        ex_text = prompt + ('\n' + '\n'.join(options) if options else '')
                        vec = model.encode([ex_text], normalize_embeddings=True)[0].tolist()
                        gen.insert_zvec_doc(exercise_bank, ex_id, vec)

                # Register a Mongo activity stub so the chapters page can
                # surface an "Exercises" button. The stub points at the
                # quiz_html endpoint via mongoID == quiz generated_content.id.
                try:
                    _url = (os.environ.get('LOOMA_MONGO_URL') or 'mongodb://looma-db:27017').strip()
                    _db_name = (os.environ.get('LOOMA_MONGO_DB') or 'looma').strip()
                    _coll = (os.environ.get('LOOMA_MONGO_COLLECTION') or 'activities').strip()
                    _client = MongoClient(_url, serverSelectionTimeoutMS=4000)
                    _activities = _client[_db_name][_coll]
                    if overwrite:
                        _activities.delete_many({
                            'ch_id': chapter_id,
                            'ft': 'exercise',
                            'author': 'AI',
                        })
                    _today = time.strftime('%Y.%m.%d')
                    _activities.insert_one({
                        'ft': 'exercise',
                        'mongoID': quiz_id,
                        'dn': f'AI Exercises: {chapter_id}',
                        'author': 'AI',
                        'date': _today,
                        'ch_id': [chapter_id],
                        'subject': str(payload.get('subject')) if payload.get('subject') else None,
                        'grade': int(payload.get('grade')) if payload.get('grade') else None,
                        'language': str(payload.get('language')) if payload.get('language') else None,
                    })
                except Exception:
                    # Mongo unavailable shouldn't break SQLite-side generation.
                    pass

            published = None
            try:
                if bool(payload.get('publish') or False):
                    published = self.__class__._publish_resources(
                        conn,
                        chapter_id=chapter_id,
                        grade=int(payload.get('grade')) if payload.get('grade') else None,
                        subject=str(payload.get('subject')) if payload.get('subject') else None,
                        language=str(payload.get('language')) if payload.get('language') else None,
                        overwrite=bool(payload.get('overwrite') or False),
                    )
            except Exception as exc:
                published = {'ok': False, 'error': str(exc)}

            conn.commit()
            return self._json(
                200,
                {
                    'ok': True,
                    'chapter_id': chapter_id,
                    'generated_ids': generated_ids,
                    'published': published,
                },
            )

        except Exception as e:
            return self._json(500, {'error': repr(e)})

    def do_GET(self):
        parsed = urlparse(self.path)
        _otel_record('http_inflight', 1, route=parsed.path)
        try:
            return self._do_GET_inner(parsed)
        finally:
            _otel_record('http_inflight', -1, route=parsed.path)

    def _do_GET_inner(self, parsed):
        qs = parse_qs(parsed.query)

        def q1(key, default=None):
            v = qs.get(key)
            return v[0] if v else default

        def qint(key, default=None):
            v = q1(key)
            if v is None or v == '':
                return default
            try:
                return int(v)
            except ValueError:
                return default

        if parsed.path == '/chapter_content':
            _otel_record('endpoint_calls', 1, route='/chapter_content', status='start')
            _otel_record('chapter_status_calls', 1, action='chapter_content')
            chapter_id = (q1('chapter_id') or '').strip()
            if not chapter_id:
                return self._json(400, {'error': 'Missing chapter_id'})

            try:
                url = (os.environ.get('LOOMA_MONGO_URL') or 'mongodb://looma-db:27017').strip()
                db_name = (os.environ.get('LOOMA_MONGO_DB') or 'looma').strip()
                activities_coll_name = (os.environ.get('LOOMA_MONGO_COLLECTION') or 'activities').strip()

                client = MongoClient(url, serverSelectionTimeoutMS=5000)
                db = client[db_name]

                # Activities are linked to chapters via a `ch_id` field (string or array of strings).
                activities = db[activities_coll_name]
                pipeline = [
                    {'$match': {'ch_id': chapter_id}},
                    {'$group': {'_id': '$ft', 'count': {'$sum': 1}}},
                ]
                by_ft = {}
                total = 0
                for row in activities.aggregate(pipeline):
                    ft = row.get('_id') or 'unknown'
                    c = int(row.get('count') or 0)
                    by_ft[str(ft)] = c
                    total += c

                # Teacher aids live in a separate collection.
                has_teacher_guide = False
                try:
                    teacher_guides = db['teacher_guides']
                    has_teacher_guide = teacher_guides.find_one({'ch_id': chapter_id}, projection={'_id': 1}) is not None
                except Exception:
                    has_teacher_guide = False

                return self._json(
                    200,
                    {
                        'chapter_id': chapter_id,
                        'activities': {'total': total, 'by_ft': by_ft},
                        'teacher_guides': {'present': bool(has_teacher_guide)},
                    },
                )
            except Exception as exc:
                return self._json(500, {'error': str(exc)})

        if parsed.path == '/lesson_theory':
            _otel_record('endpoint_calls', 1, route='/lesson_theory', status='start')
            _otel_record('chapter_status_calls', 1, action='lesson_theory')
            lesson_id = (q1('lesson_id') or '').strip()
            if not lesson_id:
                return self._json(400, {'ok': False, 'error': 'Missing lesson_id'})
            try:
                oid = ObjectId(lesson_id)
            except Exception:
                return self._json(400, {'ok': False, 'error': 'Invalid lesson_id'})
            try:
                url = (os.environ.get('LOOMA_MONGO_URL') or 'mongodb://looma-db:27017').strip()
                db_name = (os.environ.get('LOOMA_MONGO_DB') or 'looma').strip()
                client = MongoClient(url, serverSelectionTimeoutMS=5000)
                lesson = client[db_name]['lessons'].find_one({'_id': oid})
                if not lesson:
                    return self._json(404, {'ok': False, 'error': 'Lesson not found'})

                theory_text = (lesson.get('theory_text') or '').strip()
                if not theory_text:
                    # Legacy lessons without theory_text: extract a best-effort
                    # plain-text version from the inline HTML slides marked theory.
                    chunks = []
                    for it in (lesson.get('data') or []):
                        if not isinstance(it, dict) or it.get('ft') != 'inline':
                            continue
                        h = it.get('html') or ''
                        if not (it.get('is_theory') or 'Theory (' in h or '&nbsp;Theory' in h):
                            continue
                        # strip tags, drop the "Theory (n)" header line
                        text = re.sub(r'<br\s*/?>', '\n', h, flags=re.I)
                        text = re.sub(r'</div>|</p>', '\n', text, flags=re.I)
                        text = re.sub(r'<[^>]+>', '', text)
                        text = (text.replace('&nbsp;', ' ')
                                    .replace('&amp;', '&')
                                    .replace('&lt;', '<')
                                    .replace('&gt;', '>'))
                        text = re.sub(r'^\s*Theory\s*\(\d+\)\s*', '', text, flags=re.I).strip()
                        if text:
                            chunks.append(text)
                    theory_text = '\n\n'.join(chunks).strip()

                return self._json(200, {
                    'ok': True,
                    'lesson_id': lesson_id,
                    'dn': lesson.get('dn'),
                    'theory_text': theory_text,
                })
            except Exception as exc:
                return self._json(500, {'ok': False, 'error': str(exc)})

        if parsed.path == '/chapter_status':
            _otel_record('endpoint_calls', 1, route='/chapter_status', status='start')
            _otel_record('chapter_status_calls', 1, action='chapter_status')
            chapter_id = (q1('chapter_id') or '').strip()
            if not chapter_id:
                return self._json(400, {'error': 'Missing chapter_id'})

            conn = self._get_conn()
            grade = qint('grade', None)
            subject = q1('subject', None)
            language = q1('language', None)

            # Quiz presence is DB-based (generated_content), not a chapter file, so compute it even
            # if we can't resolve the chapter directory (still allows "Open" to be shown in UI).
            has_quiz = False
            try:
                quiz_rows = conn.execute(
                    "SELECT id FROM generated_content WHERE chapter_id = ? AND content_type = 'chapter_quiz' LIMIT 1",
                    (chapter_id,),
                ).fetchall()
                has_quiz = bool(quiz_rows)
            except Exception:
                has_quiz = False

            has_vocab = False
            try:
                vocab_rows = conn.execute(
                    "SELECT id FROM generated_content WHERE chapter_id = ? AND content_type = 'chapter_vocab_practice' LIMIT 1",
                    (chapter_id,),
                ).fetchall()
                has_vocab = bool(vocab_rows)
            except Exception:
                has_vocab = False

            out = {
                'chapter_id': chapter_id,
                'grade': grade,
                'subject': subject,
                'language': language,
                'paths': {},
                'web_paths': {},
                'exists': {'quiz': bool(has_quiz), 'vocab': bool(has_vocab)},
                'previews': {},
            }

            # Mongo side (lessons/resources/teacher guides)
            try:
                url = (os.environ.get('LOOMA_MONGO_URL') or 'mongodb://looma-db:27017').strip()
                db_name = (os.environ.get('LOOMA_MONGO_DB') or 'looma').strip()
                activities_coll_name = (os.environ.get('LOOMA_MONGO_COLLECTION') or 'activities').strip()

                client = MongoClient(url, serverSelectionTimeoutMS=5000)
                db = client[db_name]

                activities = db[activities_coll_name]
                pipeline = [
                    {'$match': {'ch_id': chapter_id}},
                    {'$group': {'_id': '$ft', 'count': {'$sum': 1}}},
                ]
                by_ft = {}
                total = 0
                for row in activities.aggregate(pipeline):
                    ft = row.get('_id') or 'unknown'
                    c = int(row.get('count') or 0)
                    by_ft[str(ft)] = c
                    total += c

                out['activities'] = {'total': total, 'by_ft': by_ft}

                # Lesson presence: prefer the most recent AI-generated lesson for this chapter.
                try:
                    lesson_stub = activities.find_one(
                        {'ch_id': chapter_id, 'ft': 'lesson', 'author': 'AI'},
                        projection={'_id': 1, 'mongoID': 1, 'dn': 1, 'date': 1, 'author': 1},
                        sort=[('date', -1)],
                    )
                    if lesson_stub is None:
                        # Fallback: any lesson stub (including ones authored before AI).
                        lesson_stub = activities.find_one(
                            {'ch_id': chapter_id, 'ft': 'lesson'},
                            projection={'_id': 1, 'mongoID': 1, 'dn': 1, 'date': 1, 'author': 1},
                        )
                    if lesson_stub:
                        lesson_mongo_id = lesson_stub.get('mongoID') or str(lesson_stub.get('_id') or '')
                        out['exists']['lesson'] = True
                        out['lesson'] = {
                            'lesson_id': str(lesson_mongo_id) if lesson_mongo_id else None,
                            'dn': lesson_stub.get('dn'),
                            'author': lesson_stub.get('author'),
                            'date': lesson_stub.get('date'),
                        }
                        if lesson_mongo_id:
                            out['web_paths']['lesson'] = f'looma-play-lesson.php?id={lesson_mongo_id}'
                    else:
                        out['exists']['lesson'] = False
                except Exception:
                    out['exists'].setdefault('lesson', False)

                has_teacher_guide = False
                try:
                    teacher_guides = db['teacher_guides']
                    tg_doc = teacher_guides.find_one({'ch_id': chapter_id}, projection={'_id': 0})
                    has_teacher_guide = tg_doc is not None
                except Exception:
                    tg_doc = None
                    has_teacher_guide = False

                tg_link = None
                try:
                    if tg_doc and isinstance(tg_doc, dict):
                        fp = (tg_doc.get('fp') or '').strip()
                        fn = (tg_doc.get('fn') or '').strip()
                        if fp and fn and fp.startswith('../content/'):
                            tg_link = fp + fn
                except Exception:
                    tg_link = None

                out['teacher_guides'] = {'present': bool(has_teacher_guide), 'link': tg_link}
            except Exception as exc:
                out['mongo_error'] = str(exc)

            # Filesystem side (home-visible chapter resources)
            try:
                ch_dir, en_fallback = find_chapter_dir_with_fallback(grade=grade, subject=subject, language=language)
                if ch_dir is not None:
                    summary_path = ch_dir / f'{chapter_id}.summary'
                    keywords_path = ch_dir / f'{chapter_id}.keywords'
                    objectives_path = ch_dir / f'{chapter_id}.objectives'
                    pdf_path = ch_dir / f'{chapter_id}.pdf'

                    # When the requested language is Nepali, fall back to the
                    # English file if the Nepali one is missing — we will
                    # translate it for the preview below. Path is still reported
                    # as the np/ one so the editor button keeps working.
                    en_summary = en_fallback / f'{chapter_id}.summary' if en_fallback else None
                    en_keywords = en_fallback / f'{chapter_id}.keywords' if en_fallback else None
                    en_objectives = en_fallback / f'{chapter_id}.objectives' if en_fallback else None

                    out['paths'] = {
                        'chapter_dir': str(ch_dir),
                        'summary': str(summary_path),
                        'keywords': str(keywords_path),
                        'objectives': str(objectives_path),
                        'pdf': str(pdf_path),
                    }
                    out['web_paths'].update({
                        'summary': looma_web_path_for_file(summary_path),
                        'keywords': looma_web_path_for_file(keywords_path),
                        'objectives': looma_web_path_for_file(objectives_path),
                        'pdf': looma_web_path_for_file(pdf_path),
                    })
                    out['exists'].update(
                        {
                        # Treat the Nepali side as "present" when an English
                        # source exists that we can translate from. Otherwise
                        # the AI page hides the resource entirely.
                        'summary':    summary_path.exists()    or bool(en_summary    and en_summary.exists()),
                        'keywords':   keywords_path.exists()   or bool(en_keywords   and en_keywords.exists()),
                        'objectives': objectives_path.exists() or bool(en_objectives and en_objectives.exists()),
                        'pdf':        pdf_path.exists(),
                        }
                    )

                    if (q1('preview') or '') == '1':
                        is_np_lang = (language or '').strip().lower() in {'np', 'ne', 'nepali'}
                        # Summary
                        if summary_path.exists():
                            sum_text = safe_read_text(summary_path, limit_chars=1400)
                        elif en_summary and en_summary.exists():
                            en_text = safe_read_text(en_summary, limit_chars=1400)
                            sum_text = (translate_text_en_to_np(en_text) if is_np_lang else en_text)
                            out.setdefault('translated', {})['summary'] = True
                        else:
                            sum_text = ''
                        # Keywords
                        if keywords_path.exists():
                            kw_text = safe_read_text(keywords_path, limit_chars=1400)
                        elif en_keywords and en_keywords.exists():
                            en_kw = safe_read_text(en_keywords, limit_chars=1400)
                            kw_text = (translate_text_en_to_np(en_kw) if is_np_lang else en_kw)
                            out.setdefault('translated', {})['keywords'] = True
                        else:
                            kw_text = ''

                        out['previews'] = {
                            'summary':  sum_text,
                            'keywords': kw_text,
                        }

                        try:
                            rows = get_generated(conn, chapter_id=chapter_id, content_type='chapter_vocab_practice', limit=1)
                            if rows:
                                body = rows[0].get('body') or {}
                                questions = body.get('questions') if isinstance(body, dict) else None
                                if not isinstance(questions, list):
                                    questions = []
                                lines = []
                                for i, q in enumerate(questions[:8], start=1):
                                    if not isinstance(q, dict):
                                        continue
                                    prompt = (q.get('prompt') or '').strip()
                                    qtype = (q.get('type') or '').strip()
                                    if not prompt:
                                        continue
                                    if is_np_lang:
                                        prompt = translate_text_en_to_np(prompt)
                                    lines.append(f"Q{i} ({qtype or 'q'}): {prompt}")
                                out['previews']['vocab'] = "\n".join(lines).strip()
                            else:
                                out['previews']['vocab'] = ''
                        except Exception:
                            out.setdefault('previews', {})
                            out['previews']['vocab'] = ''
            except Exception as exc:
                out['fs_error'] = str(exc)

            return self._json(200, out)

        if parsed.path == '/list_exams':
            # Return the list of saved exams matching the optional grade /
            # subject / prefix / language filters. The Resources page calls
            # this to populate its "Exams" section.
            try:
                exams = _list_saved_exams(
                    grade=(q1('grade', '') or ''),
                    subject=(q1('subject', '') or ''),
                    prefix=(q1('prefix', '') or ''),
                    language=(q1('language', '') or ''),
                )
                return self._json(200, {'exams': exams})
            except Exception as exc:
                return self._json(500, {'error': str(exc), 'exams': []})

        if parsed.path == '/generate_exam':
            _otel_record('endpoint_calls', 1, route='/generate_exam', status='start')
            _otel_record('gen_calls', 1, kind='exam')
            try:
                grade    = _parse_grade_value(q1('grade', None))
                subject  = (q1('subject', '') or '').strip()
                language = (q1('language', 'en') or 'en').strip().lower()
                prefix   = (q1('prefix', '') or '').strip()
                # `seed` is supplied by looma-chapters.php so each "Generate
                # Exam" click produces a different question pool. The exam
                # ends up saved with that seed in its metadata, so the same
                # URL would rebuild the same exam (but in practice the user
                # opens saved exams straight from /content/exams/).
                url_seed = (q1('seed', '') or '').strip()[:64]
                per_ch   = qint('per_chapter', 3) or 3
                if per_ch < 1:
                    per_ch = 1
                if per_ch > 10:
                    per_ch = 10

                if not prefix and not (grade and subject):
                    return self._html(400, '<h1>Missing prefix (or grade+subject)</h1>')

                # Localized strings for header / labels.
                is_np = language in {'np', 'ne', 'nepali'}
                T = {
                    'title':    'परीक्षा'        if is_np else 'Exam',
                    'chapter':  'अध्याय'         if is_np else 'Chapter',
                    'no_data':  'यो अध्यायको लागि सामग्री उपलब्ध छैन।' if is_np else 'No content available for this chapter.',
                    'subject':  'विषय'           if is_np else 'Subject',
                    'grade':    'कक्षा'          if is_np else 'Grade',
                    'questions':'प्रश्नहरू'      if is_np else 'Questions',
                }

                url = (os.environ.get('LOOMA_MONGO_URL') or 'mongodb://looma-db:27017').strip()
                db_name = (os.environ.get('LOOMA_MONGO_DB') or 'looma').strip()
                client = MongoClient(url, serverSelectionTimeoutMS=5000)
                db = client[db_name]

                conn = self._get_conn()
                import scripts.generate_assets as gen

                ch_docs = _resolve_exam_chapters(
                    db,
                    conn,
                    prefix=prefix,
                    grade=grade,
                    subject=subject,
                    language=language,
                )
                if not ch_docs:
                    scope = prefix or f'grade={grade or ""}, subject={subject or ""}'
                    return self._html(404, f'<h1>{T["title"]}</h1><p>No chapters found for {scope}</p>')

                def _esc(s):
                    return (
                        str(s)
                        .replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;')
                    )

                sections_html = []
                included = 0
                for ch in ch_docs:
                    ch_id = str(ch.get('_id') or '').strip()
                    if not ch_id:
                        continue
                    if is_np:
                        title = (ch.get('ndn') or ch.get('dn') or ch_id)
                    else:
                        title = (ch.get('dn') or ch.get('ndn') or ch_id)

                    try:
                        _ids, chunks_text = gen.get_chunks_for_chapter(conn, ch_id)
                        if not chunks_text:
                            chunks_text = _extract_chapter_text_from_pdf(
                                chapter_id=ch_id,
                                grade=grade,
                                subject=subject,
                                language=language,
                            )
                    except Exception:
                        chunks_text = []

                    if not chunks_text:
                        chunks_text = [f'{ch_id} {title}']

                    quiz = _build_exam_questions_for_chapter(
                        conn,
                        gen,
                        chapter_id=ch_id,
                        chunks_text=chunks_text,
                        random_seed=url_seed,
                        grade=grade,
                        subject=subject,
                        language=language,
                        per_chapter=per_ch,
                    )

                    items = []
                    for i, q in enumerate(quiz or [], start=1):
                        if not isinstance(q, dict):
                            continue
                        prompt = _esc((q.get('prompt') or '').strip())
                        qtype  = _esc((q.get('type') or '').strip())
                        opts   = q.get('options') if isinstance(q.get('options'), list) else []
                        ans    = (q.get('answer') or '').strip() if isinstance(q.get('answer'), str) else ''
                        src_label = _esc((q.get('source_activity') or '').strip())
                        src_title = _esc((q.get('source_title') or '').strip())
                        # Per-chapter unique radio name — chapter id keeps it scoped across the exam.
                        rname = f"e_{_esc(ch_id)}_{i}"
                        opts_html = ''
                        if opts:
                            opts_html = "<ol type='A' class='opts'>" + ''.join(
                                "<li><label><input type='radio' name='" + rname + "' value='" + _esc(o) + "'> " + _esc(o) + "</label></li>"
                                for o in opts
                            ) + '</ol>'
                        data_extra = (
                            " data-q-index='" + rname + "'" +
                            " data-prompt='" + prompt + "'" +
                            " data-chapter='" + _esc(ch_id) + "'" +
                            (" data-answer='" + _esc(ans) + "'" if (opts and ans) else "")
                        )
                        src_html = ''
                        if src_label:
                            suffix = (' — ' + src_title) if src_title else ''
                            src_html = "<div class='source-tag'>From " + src_label + suffix + "</div>"
                        items.append(
                            "<div class='q'" + data_extra + "><div class='meta'>Q" + str(i)
                            + " (" + qtype + ")</div>" + src_html
                            + "<div class='prompt'>" + prompt + "</div>" + opts_html + "</div>"
                        )

                    if not items:
                        sections_html.append(
                            f"<section class='ch'><h2>{T['chapter']} {_esc(ch_id)} — {_esc(title)}</h2>"
                            f"<p class='empty'>{_esc(T['no_data'])}</p></section>"
                        )
                        continue

                    sections_html.append(
                        f"<section class='ch'>"
                        f"<h2>{T['chapter']} {_esc(ch_id)} — {_esc(title)}</h2>"
                        + ''.join(items)
                        + "</section>"
                    )
                    included += 1

                if included == 0:
                    sections_html.append(f"<p class='empty'>{_esc(T['no_data'])}</p>")

                meta_bits = []
                if grade is not None:
                    meta_bits.append(f"<span><b>{T['grade']}:</b> {_esc(grade)}</span>")
                if subject:
                    meta_bits.append(f"<span><b>{T['subject']}:</b> {_esc(subject.capitalize())}</span>")
                q_token = "<div class='q'"
                total_q = sum(s.count(q_token) for s in sections_html)
                meta_bits.append(f"<span><b>{T['questions']}:</b> {total_q}</span>")
                _otel_record('exam_questions', float(total_q),
                             grade=str(grade or ''), subject=str(subject or ''),
                             prefix=str(prefix or ''))

                html = f"""<!doctype html>
<html lang="{('np' if is_np else 'en')}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{_esc(T['title'])}</title>
<style>
  body {{ font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
         margin: 0; padding: 24px; background: #f6f7fb; color: #15233a; }}
  header {{ background: #091f48; color: #fff; padding: 18px 24px; border-radius: 14px;
           margin: 0 0 18px 0; }}
  header h1 {{ margin: 0 0 8px 0; }}
  header .meta {{ display: flex; gap: 18px; flex-wrap: wrap; opacity: 0.92; font-size: 14px; }}
  section.ch {{ background: #fff; border: 1px solid rgba(0,0,0,0.08); border-radius: 14px;
               padding: 14px 18px; margin: 14px 0; }}
  section.ch h2 {{ margin: 0 0 10px 0; font-size: 18px; color: #091f48; border-bottom: 1px solid #eee; padding-bottom: 6px; }}
  .q {{ border-left: 3px solid #1f6f3a; padding: 8px 12px; margin: 10px 0;
       background: rgba(31,111,58,0.05); border-radius: 0 8px 8px 0; }}
  .meta {{ font-weight: 700; opacity: 0.75; font-size: 12px; margin-bottom: 4px; }}
  .source-tag {{ display:inline-block; font-size:12px; color:#091f48; background:#e8f0ff;
                border-radius:8px; padding:2px 8px; margin: 0 0 6px 0; font-weight:600; }}
  .prompt {{ white-space: pre-wrap; line-height: 1.5; }}
  .empty {{ color: #888; font-style: italic; }}
  ol li, ul li {{ margin: 4px 0; }}
  .opts {{ list-style: lower-alpha; }}
  .q.correct {{ border-left-color: #1f6f3a; background: rgba(31,111,58,0.10); }}
  .q.wrong   {{ border-left-color: #b00020; background: rgba(176,0,32,0.10); }}
  #exam-submit {{ margin: 16px 0; padding: 10px 18px; background: #091f48; color: #fff; border: 0; border-radius: 10px; font-weight: 700; cursor: pointer; }}
  #exam-result {{ display:none; margin: 16px 0; padding: 14px; background: #fff; border-radius: 12px; border: 1px solid rgba(0,0,0,0.12); }}
  #exam-result .score {{ font-size: 26px; font-weight: 700; color: #091f48; }}
  #didyouknow {{ background: #e8f0ff; border-left: 4px solid #091f48; padding: 10px 12px; border-radius: 6px; margin: 10px 0; font-style: italic; }}
  /* Resources-style recommendation cards inside the exam result panel. */
  .reco-grid {{ display:grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap:14px; margin: 8px 0 16px 0; }}
  .reco-card {{ position:relative; display:flex; flex-direction:column; align-items:center; gap:6px; padding:10px;
                border:2px solid #091F48; border-radius:12px; background:#fff; cursor:pointer; color:#091F48;
                font-family:inherit; text-align:center; text-decoration:none; transition: background-color .12s ease, transform .08s ease; }}
  .reco-card:hover {{ background:#fff8d4; transform:translateY(-1px); }}
  .reco-card .reco-thumb {{ width:100%; height:96px; object-fit:contain; border-radius:6px; background:#f3f3f3; }}
  .reco-card .reco-card-label {{ font-weight:700; font-size:.95rem; line-height:1.2; word-break:break-word; }}
  .reco-card .reco-icon {{ position:absolute; top:6px; right:6px; width:26px; height:26px;
                            background:rgba(255,255,255,.85); border-radius:6px; padding:2px;
                            box-shadow:0 1px 3px rgba(0,0,0,.15); }}
  .reco-card .reco-card-topic {{ font-size:.78rem; opacity:.65; font-style:italic; }}
  @media print {{ body {{ background: #fff; }} section.ch {{ break-inside: avoid; }} }}
</style>
</head>
<body>
<header>
  <h1>{_esc(T['title'])}</h1>
  <div class="meta">{''.join(meta_bits)}</div>
</header>
{''.join(sections_html)}
<button id="exam-submit">{'जमा गर्नुहोस्' if is_np else 'Submit exam'}</button>
<div id="exam-result">
  <h2>{'नतिजा' if is_np else 'Result'}</h2>
  <div class="score" id="exam-score-text"></div>
  <div id="exam-recos"></div>
</div>
<script>
(function(){{
  var CTX = {{
    grade: {json.dumps(grade if grade is not None else "")},
    subject: {json.dumps(subject)},
    language: {json.dumps(language)},
    prefix: {json.dumps(prefix)},
  }};
  var btn = document.getElementById('exam-submit');
  if (!btn) return;
  // Same stopword-aware topic extraction used in /quiz_html — see comments there.
  var STOP_E = ('a an the of is are was were be been being to from in on at and or ' +
                'but if then so that this these those it its which who whom whose what when where why how ' +
                'do does did doing done has have had with by for as not no yes your you we they he she him her his their our')
                .split(' ');
  var STOPSET_E = {{}}; STOP_E.forEach(function(s){{ STOPSET_E[s] = 1; }});
  function topicKeyExam(promptText, answerText) {{
    var a = (answerText || '').trim();
    if (a && a.length >= 3 && a.split(/\\s+/).length <= 4) return a;
    var toks = (promptText || '').toLowerCase().replace(/[^a-zA-Zऀ-ॿ\\s]/g, ' ').split(/\\s+/);
    toks = toks.filter(function(t){{ return t.length >= 4 && !STOPSET_E[t]; }});
    if (!toks.length) return (promptText || '').split(/\\s+/).slice(0,4).join(' ');
    toks.sort(function(x, y){{ return y.length - x.length; }});
    return toks[0];
  }}
  btn.addEventListener('click', function(){{
    var qs = document.querySelectorAll('.q[data-answer]');
    var total = qs.length, correct = 0;
    var weakByChapter = {{}};
    qs.forEach(function(el){{
      var ans = (el.getAttribute('data-answer') || '').trim();
      var rname = el.getAttribute('data-q-index');
      var ch = el.getAttribute('data-chapter') || '';
      var picked = el.querySelector('input[name="'+rname+'"]:checked');
      var pickedVal = picked ? picked.value.trim() : '';
      if (pickedVal && pickedVal === ans) {{
        correct++;
        el.classList.add('correct');
      }} else {{
        el.classList.add('wrong');
        var topic = topicKeyExam(el.getAttribute('data-prompt') || '', ans);
        if (topic) (weakByChapter[ch] = weakByChapter[ch] || []).push(topic);
      }}
    }});
    var score = total > 0 ? (correct/total) : 0;
    document.getElementById('exam-score-text').textContent = correct + ' / ' + total + '  (' + Math.round(score*100) + '%)';
    document.getElementById('exam-result').style.display = 'block';

    // Aggregate weak topics across chapters (top 5).
    var allWeak = [];
    Object.keys(weakByChapter).forEach(function(k){{ allWeak = allWeak.concat(weakByChapter[k]); }});
    allWeak = allWeak.slice(0, 5);

    try {{
      parent.postMessage({{
        source: 'looma-telemetry',
        event: 'score',
        payload: {{
          activity: 'exam',
          grade: CTX.grade ? String(CTX.grade) : null,
          subject: CTX.subject || null,
          language: CTX.language || null,
          chapter_id: CTX.prefix || null,
          correct: correct, total: total, score: score,
          weak_topics: allWeak,
        }}
      }}, '*');
    }} catch (e) {{}}

    // Use the worst-performing chapter for the recommendation context.
    var worstCh = null, worstCount = -1;
    Object.keys(weakByChapter).forEach(function(k){{
      if (weakByChapter[k].length > worstCount) {{ worstCh = k; worstCount = weakByChapter[k].length; }}
    }});
    var url = '/recommend_after_score'
            + '?chapter_id=' + encodeURIComponent(worstCh || '')
            + '&subject=' + encodeURIComponent(CTX.subject || '')
            + '&grade=' + encodeURIComponent(CTX.grade || '')
            + '&language=' + encodeURIComponent(CTX.language || '')
            + '&score=' + encodeURIComponent(score.toFixed(4))
            + '&weak_topics=' + encodeURIComponent(allWeak.join(','));
    fetch(url).then(function(r){{ return r.json(); }}).then(function(j){{
      var box = document.getElementById('exam-recos'); box.innerHTML = '';
      if (!j || !j.ok) return;
      function esc(s){{ return String(s||'').replace(/[&<>"']/g, function(c){{ return ({{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}})[c]; }}); }}
      if (j.mastered) {{
        var p = document.createElement('h3');
        p.textContent = 'Great work — you have mastered this exam!';
        p.style.color = '#1f6f3a';
        box.appendChild(p);
        if (j.did_you_know) {{
          var d = document.createElement('div'); d.id = 'didyouknow';
          d.innerHTML = '<b>Did you know?</b> ' + esc(j.did_you_know);
          box.appendChild(d);
        }}
        return;
      }}
      var rec = j.recommendations || {{}};
      // Resources-style cards (thumb + label + type icon) so the exam result
      // panel uses the same visual language as the chapter Resources page.
      var TYPE_ICONS = {{
        video:'/Looma/images/video.png', mp4:'/Looma/images/video.png', m4v:'/Looma/images/video.png',
        mov:'/Looma/images/video.png', evi:'/Looma/images/video.png',
        audio:'/Looma/images/audio.png', mp3:'/Looma/images/audio.png', m4a:'/Looma/images/audio.png',
        image:'/Looma/images/picture.png', jpg:'/Looma/images/picture.png', jpeg:'/Looma/images/picture.png',
        png:'/Looma/images/picture.png', gif:'/Looma/images/picture.png',
        pdf:'/Looma/images/pdf.png', book:'/Looma/images/book.png', textbook:'/Looma/images/book.png',
        chapter:'/Looma/images/book.png', document:'/Looma/images/pdf.png',
        lesson:'/Looma/images/lesson.png', slideshow:'/Looma/images/slideshow.png',
        game:'/Looma/images/games.png', exercise:'/Looma/images/games.png',
        vocab:'/Looma/images/games.png', voc:'/Looma/images/games.png',
        map:'/Looma/images/maps.png', html:'/Looma/images/html.png',
        ep:'/Looma/images/ep.png', epaath:'/Looma/images/ep.png',
        history:'/Looma/images/history.png', text:'/Looma/images/textfile.png'
      }};
      function iconFor(ft) {{
        return TYPE_ICONS[String(ft||'').toLowerCase()] || '/Looma/images/alert.jpg';
      }}
      function stripExt(fn) {{
        if (!fn) return '';
        var i = fn.lastIndexOf('.');
        return i > 0 ? fn.substring(0, i) : fn;
      }}
      function buildRecCard(it) {{
        var ft = String(it.ft||'').toLowerCase();
        var dn = it.dn || it.fn || it.id || '(unnamed)';
        var fp = it.fp || ''; var fn = it.fn || '';
        var card = document.createElement('a');
        card.className = 'reco-card';
        // The exam page lives inside an iframe served by looma-ai (port 8089).
        // Hop out to the parent frame so /video, /pdf etc. land on the
        // looma-web page the user already came from.
        var href;
        if (ft === 'video' || ft === 'mp4' || ft === 'mov' || ft === 'm4v') {{
          href = '/Looma/video?fn=' + encodeURIComponent(fn) +
                 '&fp=' + encodeURIComponent(fp) +
                 '&dn=' + encodeURIComponent(dn);
        }} else if (ft === 'pdf' || ft === 'document' || ft === 'textbook') {{
          href = '/Looma/pdf?fn=' + encodeURIComponent(fn) +
                 '&fp=' + encodeURIComponent(fp);
        }} else if (ft === 'image' || ft === 'jpg' || ft === 'jpeg' || ft === 'png' || ft === 'gif') {{
          href = '/Looma/image?fn=' + encodeURIComponent(fn) +
                 '&fp=' + encodeURIComponent(fp);
        }} else if (ft === 'audio' || ft === 'mp3' || ft === 'm4a') {{
          href = '/Looma/audio?fn=' + encodeURIComponent(fn) +
                 '&fp=' + encodeURIComponent(fp) +
                 '&dn=' + encodeURIComponent(dn);
        }} else if (ft === 'lesson') {{
          href = '/Looma/lesson?id=' + encodeURIComponent(it.id || '');
        }} else if (ft === 'slideshow') {{
          href = '/Looma/slideshow?id=' + encodeURIComponent(it.id || '');
        }} else if (ft === 'map') {{
          href = '/Looma/map?id=' + encodeURIComponent(it.id || '');
        }} else if (ft === 'history') {{
          href = '/Looma/history?id=' + encodeURIComponent(it.id || '');
        }} else {{
          // Fallback: drop the user on the chapter Resources folder so they
          // can find the item there.
          href = '/Looma/activities?ch=' + encodeURIComponent(CTX.prefix || '');
        }}
        card.href = href;
        card.target = '_top';

        var thumbUrl = (fp && fn) ? (fp + stripExt(fn) + '_thumb.jpg') : '';
        var img = document.createElement('img');
        img.alt = ''; img.draggable = false;
        img.className = 'reco-thumb';
        img.src = thumbUrl || iconFor(ft);
        img.addEventListener('error', function () {{
          if (img.src.indexOf('_thumb.jpg') !== -1) img.src = iconFor(ft);
        }});
        card.appendChild(img);

        var label = document.createElement('span');
        label.className = 'reco-card-label';
        label.textContent = dn;
        card.appendChild(label);

        var typeIcon = document.createElement('img');
        typeIcon.className = 'reco-icon';
        typeIcon.src = iconFor(ft);
        typeIcon.alt = ft;
        card.appendChild(typeIcon);

        if (it.matched_topic) {{
          var t = document.createElement('span');
          t.className = 'reco-card-topic';
          t.textContent = 'about: ' + it.matched_topic;
          card.appendChild(t);
        }}
        return card;
      }}
      var any = false;
      [['videos','Videos'],['books','Books'],['files','Files']].forEach(function(g){{
        var arr = rec[g[0]] || []; if (!arr.length) return;
        any = true;
        var h = document.createElement('h3'); h.textContent = g[1]; box.appendChild(h);
        var grid = document.createElement('div'); grid.className = 'reco-grid';
        arr.forEach(function(it){{ grid.appendChild(buildRecCard(it)); }});
        box.appendChild(grid);
      }});
      if (any) {{
        var hdr = document.createElement('p');
        hdr.innerHTML = '<b>Topics to review:</b> ' +
          (Array.isArray(j.weak_topics) ? j.weak_topics.map(esc).join(', ') : '');
        box.insertBefore(hdr, box.firstChild);
      }} else if (j.did_you_know) {{
        var fb = document.createElement('p');
        fb.textContent = "We couldn't find study resources for those topics. Here's something to think about:";
        box.appendChild(fb);
        var d = document.createElement('div'); d.id = 'didyouknow';
        d.innerHTML = '<b>Did you know?</b> ' + esc(j.did_you_know);
        box.appendChild(d);
      }}
    }}).catch(function(){{}});
  }});
}})();
</script>
</body>
</html>
"""
                # Persist the freshly built exam to the shared content volume
                # so it shows up under the chapter Resources → Exams panel.
                # Failures here are non-fatal: even if the save fails we still
                # return the live HTML so the current click still works.
                try:
                    _save_exam_html(
                        html,
                        grade=grade,
                        subject=subject,
                        prefix=prefix,
                        language=language,
                        seed=url_seed,
                        total_q=total_q,
                    )
                except Exception:
                    pass

                return self._html(200, html)
            except Exception as exc:
                return self._html(500, f'<h1>Exam generation failed</h1><pre>{str(exc)}</pre>')

        if parsed.path == '/quiz_html':
          # Catch-all so the iframe NEVER receives an empty response. Any
          # internal error renders a visible page instead of dropping the TCP
          # connection (which Chrome shows as ERR_EMPTY_RESPONSE).
          _otel_record('endpoint_calls', 1, route='/quiz_html', status='start')
          _quiz_t0 = time.time()
          try:
            chapter_id = (q1('chapter_id') or '').strip()
            if not chapter_id:
                return self._html(400, '<h1>Missing chapter_id</h1>')

            conn = self._get_conn()
            rows = get_generated(conn, chapter_id=chapter_id, content_type='chapter_quiz', limit=1)
            quiz = rows[0].get('body') if rows else None
            quiz = quiz or {}
            questions = quiz.get('questions') if isinstance(quiz, dict) else None
            if not isinstance(questions, list):
                questions = []

            # On-demand generation: if no quiz has been pre-generated yet,
            # build one from the chapter content right now instead of returning
            # a 404 (so the "Quiz" button is never broken).
            if not questions:
                try:
                    import scripts.generate_assets as gen
                    g_q = qint('grade', None)
                    s_q = q1('subject', None)
                    l_q = q1('language', None)
                    try:
                        chunk_ids, ondem_chunks = gen.get_chunks_for_chapter(conn, chapter_id)
                    except Exception:
                        chunk_ids, ondem_chunks = [], []
                    if not ondem_chunks:
                        try:
                            ondem_chunks = _extract_chapter_text_from_pdf(
                                chapter_id=chapter_id, grade=g_q, subject=s_q, language=l_q,
                            )
                        except Exception:
                            ondem_chunks = []
                    if ondem_chunks:
                        try:
                            ondem_kw = gen.compute_keywords(ondem_chunks, limit=12)
                        except Exception:
                            ondem_kw = []
                        seed = hash(chapter_id) & 0x7fffffff
                        try:
                            questions = gen.generate_quiz(ondem_chunks, ondem_kw or [], n_questions=8, seed=seed) or []
                        except Exception:
                            questions = []
                except Exception:
                    questions = []
                if not questions:
                    return self._html(
                        200,
                        '<!doctype html><html><body style="font-family:system-ui;padding:24px;">'
                        '<h1>Quiz unavailable</h1>'
                        '<p>This chapter has no indexed content yet. Generate it from the AI page'
                        ' (button "Generate" next to <em>Exercises (Quiz)</em>) or upload its PDF first.</p>'
                        '<p><b>chapter_id:</b> ' + chapter_id.replace('<','&lt;') + '</p>'
                        '</body></html>',
                    )

            # Pull "Activity x.y" worked examples from the chapter PDF and use them
            # as additional question seeds. The textbook authors structure these
            # blocks as canonical exercises, so questions modelled after them feel
            # much more natural than ones derived from raw chunk text.
            try:
                _grade_q = qint('grade', None)
                _subject_q = q1('subject', None)
                _language_q = q1('language', None)
                _, _act_chunks = (lambda: ([], _extract_chapter_text_from_pdf(
                    chapter_id=chapter_id, grade=_grade_q,
                    subject=_subject_q, language=_language_q,
                )))()
                act_blocks = _extract_activity_blocks(_act_chunks, max_blocks=6)
                if act_blocks:
                    import scripts.generate_assets as gen
                    extra_q = []
                    seed = hash(chapter_id) & 0x7fffffff
                    seeds_text = [b['body'] for b in act_blocks if b.get('body')]
                    if seeds_text:
                        try:
                            kws = gen.compute_keywords(seeds_text, limit=12)
                            extra_q = gen.generate_quiz(seeds_text, kws or [], n_questions=min(6, len(act_blocks)), seed=seed) or []
                        except Exception:
                            extra_q = []
                    # Tag each generated question with its source activity heading
                    # so the UI can show "From Activity 1.2".
                    for q, blk in zip(extra_q, act_blocks):
                        if isinstance(q, dict):
                            q['source_activity'] = f"Activity {blk.get('id','')}".strip()
                            if blk.get('title'):
                                q['source_title'] = blk['title']
                    if extra_q:
                        questions = list(questions) + list(extra_q)
            except Exception:
                pass

            # Ensure we show a consistent "5 words + 5 definitions" vocabulary block.
            vocab = []
            seen_words = set()

            def add_vocab(word: str, definition: str):
                w = (word or '').strip()
                d = (definition or '').strip()
                if not w:
                    return
                key = w.lower()
                if key in seen_words:
                    return
                if not d:
                    d = 'Key term from chapter.'
                seen_words.add(key)
                vocab.append((w, d))

            # Prefer stored quiz vocabulary (generated at quiz creation time).
            if isinstance(quiz, dict) and isinstance(quiz.get('vocab'), list):
                for item in quiz.get('vocab'):
                    if len(vocab) >= 5:
                        break
                    if not isinstance(item, dict):
                        continue
                    add_vocab(str(item.get('word') or ''), str(item.get('def') or ''))
            try:
                grade = qint('grade', None)
                subject = q1('subject', None)
                language = q1('language', None)
                ch_dir = find_chapter_dir(grade=grade, subject=subject, language=language)
                if ch_dir is not None:
                    kw_path = ch_dir / f'{chapter_id}.keywords'
                    if kw_path.exists():
                        raw_kw = json.loads(kw_path.read_text(encoding='utf-8') or '[]')
                        if isinstance(raw_kw, list):
                            for item in raw_kw:
                                if len(vocab) >= 5:
                                    break
                                if not isinstance(item, dict):
                                    continue
                                w = (item.get('en') or item.get('np') or '').strip()
                                d = (item.get('def') or '').strip()
                                if w and d:
                                    add_vocab(w, d)
            except Exception:
                vocab = vocab or []

            if len(vocab) < 5:
                try:
                    import scripts.generate_assets as gen

                    grade = qint('grade', None)
                    subject = q1('subject', None)
                    language = q1('language', None)
                    chunk_ids, chunks_text = gen.get_chunks_for_chapter(conn, chapter_id)
                    if not chunks_text:
                        chunks_text = _extract_chapter_text_from_pdf(
                            chapter_id=chapter_id,
                            grade=grade,
                            subject=subject,
                            language=language,
                        )
                    keywords = gen.compute_keywords(chunks_text, limit=18)
                    dict_entries = _lookup_dictionary_entries(keywords, chapter_language=language)

                    for k in keywords:
                        if len(vocab) >= 5:
                            break
                        # Prefer single tokens for vocab display.
                        if ' ' in str(k).strip():
                            continue
                        entry = dict_entries.get(k) or {}
                        d = _best_dictionary_definition(entry) or ''
                        if not d:
                            d = gen.best_sentence_for_keyword(chunks_text, k) or ''
                        add_vocab(str(k), str(d))
                except Exception:
                    pass

            # If we still don't have 5, pad with the best available sentences so the game is fair.
            if len(vocab) < 5:
                try:
                    import scripts.generate_assets as gen

                    grade = qint('grade', None)
                    subject = q1('subject', None)
                    language = q1('language', None)
                    _ids, chunks_text = gen.get_chunks_for_chapter(conn, chapter_id)
                    all_sents = []
                    for t in chunks_text:
                        all_sents.extend(gen.split_sentences(t))
                    all_sents = [s.strip() for s in all_sents if isinstance(s, str) and s.strip()]
                    fallback_def = all_sents[0] if all_sents else 'Key term from chapter.'

                    n = 1
                    while len(vocab) < 5:
                        add_vocab(f'Key term {n}', fallback_def)
                        n += 1
                except Exception:
                    n = 1
                    while len(vocab) < 5:
                        add_vocab(f'Key term {n}', 'Key term from chapter.')
                        n += 1

            vocab = vocab[:5]

            def esc(s: str) -> str:
                return (
                    str(s)
                    .replace('&', '&amp;')
                    .replace('<', '&lt;')
                    .replace('>', '&gt;')
                    .replace('"', '&quot;')
                )

            items = []
            scorable = 0
            _otel_record('quiz_questions', float(len(questions or [])), chapter_id=str(chapter_id))
            for i, q in enumerate(questions, start=1):
                if not isinstance(q, dict):
                    continue
                prompt = esc((q.get('prompt') or '').strip())
                qtype = esc((q.get('type') or '').strip())
                src_label = esc((q.get('source_activity') or '').strip())
                src_title = esc((q.get('source_title') or '').strip())
                options = q.get('options') if isinstance(q.get('options'), list) else []
                answer = (q.get('answer') or '').strip() if isinstance(q.get('answer'), str) else ''
                opts_html = ''
                if options:
                    opts_html = "<ul class='opts'>" + ''.join(
                        "<li><label><input type='radio' name='q" + str(i) + "' value='" + esc(o) + "'> " + esc(o) + "</label></li>"
                        for o in options
                    ) + '</ul>'
                data_attrs = (
                    " data-q-index='" + str(i) + "'" +
                    " data-prompt='" + esc(prompt) + "'" +
                    (" data-answer='" + esc(answer) + "'" if (options and answer) else "")
                )
                if options and answer:
                    scorable += 1
                src_html = ''
                if src_label:
                    suffix = (' — ' + src_title) if src_title else ''
                    src_html = "<div class='source-tag'>From " + src_label + suffix + "</div>"
                items.append(
                    "<div class='q'" + data_attrs + "><div class='meta'>Q" + str(i)
                    + " (" + qtype + ")</div>" + src_html
                    + "<div class='prompt'>" + prompt + "</div>" + opts_html + "</div>"
                )

            vocab_html = ''
            if vocab:
                vocab_html = (
                    "<div class='vocab'><h2>Key words</h2><ul>"
                    + ''.join("<li><b>" + esc(w) + ":</b> " + esc(d) + "</li>" for (w, d) in vocab)
                    + "</ul></div>"
                )

            grade_q = qint('grade', None)
            subject_q = q1('subject', '') or ''
            language_q = q1('language', '') or ''

            html = """
<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Quiz</title>
    <style>
      body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; margin: 16px; }
      .q { border: 1px solid rgba(0,0,0,0.15); border-radius: 12px; padding: 10px 12px; margin: 10px 0; background: rgba(255,255,255,0.85); }
      .q.correct { border-color: #1f6f3a; background: rgba(31,111,58,0.08); }
      .q.wrong   { border-color: #b00020; background: rgba(176,0,32,0.08); }
      .meta { font-weight: 700; opacity: 0.75; margin-bottom: 6px; }
      .source-tag { display:inline-block; font-size:12px; color:#091f48; background:#e8f0ff; border-radius:8px; padding:2px 8px; margin: 0 0 6px 0; font-weight:600; }
      .prompt { white-space: pre-wrap; }
      .vocab { border: 1px solid rgba(0,0,0,0.12); border-radius: 12px; padding: 10px 12px; background: rgba(255,255,255,0.9); margin: 14px 0; }
      .vocab h2 { margin: 0 0 8px 0; font-size: 18px; }
      .opts { list-style: none; padding-left: 4px; }
      .opts li { margin: 4px 0; }
      #submit { margin: 16px 0; padding: 10px 18px; background: #091f48; color: #fff; border: 0; border-radius: 10px; font-weight: 700; cursor: pointer; }
      #result { margin: 16px 0; padding: 14px; border-radius: 12px; background: #fff; border: 1px solid rgba(0,0,0,0.12); display: none; }
      #result h2 { margin: 0 0 8px 0; }
      #result .score { font-size: 26px; font-weight: 700; color: #091f48; }
      #recos { margin: 12px 0; }
      #recos h3 { margin: 12px 0 6px 0; font-size: 16px; }
      #recos ul { padding-left: 18px; }
      #didyouknow { background: #e8f0ff; border-left: 4px solid #091f48; padding: 10px 12px; border-radius: 6px; margin: 10px 0; font-style: italic; }
    </style>
  </head>
  <body>
    <h1>Quiz — """ + esc(chapter_id) + """</h1>
    """ + vocab_html + """
    """ + ("\n".join(items) if items else "<p>(empty quiz)</p>") + """
    """ + ("<button id='submit'>Submit answers</button>" if scorable > 0 else "") + """
    <div id='result'>
      <h2>Result</h2>
      <div><span class='score' id='score-text'></span></div>
      <div id='recos'></div>
    </div>
    <script>
    (function(){
      var CTX = {
        chapter_id: """ + json.dumps(chapter_id) + """,
        grade:      """ + json.dumps(grade_q if grade_q is not None else "") + """,
        subject:    """ + json.dumps(subject_q) + """,
        language:   """ + json.dumps(language_q) + """,
      };
      var btn = document.getElementById('submit');
      if (!btn) return;
      // Stopwords (en + np) we strip when extracting weak-topic keys from the
      // question prompt. Without this, "what is the capital of" becomes the
      // topic key and never matches the chapter keywords.
      var STOP = ('a an the of is are was were be been being to from in on at and or ' +
                  'but if then so that this these those it its which who whom whose what when where why how ' +
                  'do does did doing done has have had with by for as not no yes your you we they he she him her his their our')
                 .split(' ');
      var STOPSET = {}; STOP.forEach(function(s){ STOPSET[s] = 1; });
      function topicKeyFromQuestion(promptText, answerText) {
        // Prefer the answer (usually a domain term: "photosynthesis", "Kathmandu").
        var a = (answerText || '').trim();
        if (a && a.length >= 3 && a.split(/\\s+/).length <= 4) return a;
        // Otherwise pick the longest non-stopword token from the prompt.
        var toks = (promptText || '').toLowerCase().replace(/[^a-zA-Zऀ-ॿ\\s]/g, ' ').split(/\\s+/);
        toks = toks.filter(function(t){ return t.length >= 4 && !STOPSET[t]; });
        if (!toks.length) return (promptText || '').split(/\\s+/).slice(0,4).join(' ');
        toks.sort(function(x, y){ return y.length - x.length; });
        return toks[0];
      }
      btn.addEventListener('click', function(){
        var qs = document.querySelectorAll('.q[data-answer]');
        var total = qs.length, correct = 0, weak = [];
        qs.forEach(function(el){
          var ans = (el.getAttribute('data-answer') || '').trim();
          var idx = el.getAttribute('data-q-index');
          var picked = el.querySelector('input[name="q'+idx+'"]:checked');
          var pickedVal = picked ? picked.value.trim() : '';
          if (pickedVal && pickedVal === ans) {
            correct++;
            el.classList.add('correct');
          } else {
            el.classList.add('wrong');
            var topic = topicKeyFromQuestion(el.getAttribute('data-prompt') || '', ans);
            if (topic) weak.push(topic);
          }
        });
        var score = total > 0 ? (correct / total) : 0;
        document.getElementById('score-text').textContent = correct + ' / ' + total + '  (' + Math.round(score*100) + '%)';
        document.getElementById('result').style.display = 'block';

        // Tell the parent window so server-side telemetry fires.
        try {
          parent.postMessage({
            source: 'looma-telemetry',
            event:  'score',
            payload: {
              activity:    'exercise',
              chapter_id:  CTX.chapter_id,
              grade:       CTX.grade ? String(CTX.grade) : null,
              subject:     CTX.subject || null,
              language:    CTX.language || null,
              correct:     correct,
              total:       total,
              score:       score,
              weak_topics: weak,
            }
          }, '*');
        } catch (e) {}

        // Ask looma-ai for resource recommendations (or 'Did you know?').
        // Pass `score` so the AI can decide mastery from performance, not from
        // whether the resource search came back empty.
        var url = '/recommend_after_score?chapter_id=' + encodeURIComponent(CTX.chapter_id || '')
                + '&subject=' + encodeURIComponent(CTX.subject || '')
                + '&grade='   + encodeURIComponent(CTX.grade || '')
                + '&language='+ encodeURIComponent(CTX.language || '')
                + '&score='   + encodeURIComponent(score.toFixed(4))
                + '&weak_topics=' + encodeURIComponent(weak.slice(0,5).join(','));
        fetch(url).then(function(r){ return r.json(); }).then(function(j){
          var box = document.getElementById('recos');
          box.innerHTML = '';
          if (!j || !j.ok) { box.innerHTML = '<p>(no recommendations)</p>'; return; }
          if (j.mastered) {
            // #7 — student mastered the chapter; show a congratulatory header
            // and reward with a Did-you-know curiosity drawn from the chapter.
            var praise = document.createElement('h3');
            praise.textContent = 'Great work — you have mastered this chapter!';
            praise.style.color = '#1f6f3a';
            box.appendChild(praise);
            if (j.did_you_know) {
              var div = document.createElement('div');
              div.id = 'didyouknow';
              div.innerHTML = '<b>Did you know?</b> ' + escapeHtml(j.did_you_know);
              box.appendChild(div);
            }
            return;
          }
          var rec = j.recommendations || {};
          var groups = [['videos','Videos to watch'], ['books','Books to read'], ['files','Other study materials']];
          var any = false;
          groups.forEach(function(g){
            var arr = rec[g[0]] || [];
            if (!arr.length) return;
            any = true;
            var h = document.createElement('h3'); h.textContent = g[1]; box.appendChild(h);
            var ul = document.createElement('ul');
            arr.forEach(function(it){
              var li = document.createElement('li');
              var name = it.dn || it.fn || it.id || '(unnamed)';
              li.innerHTML = '<b>' + escapeHtml(name) + '</b>'
                + (it.matched_topic ? ' <span style=\"opacity:.7\">— linked to: ' + escapeHtml(it.matched_topic) + '</span>' : '');
              ul.appendChild(li);
            });
            box.appendChild(ul);
          });
          // #6 — not mastered; intro line above any recommendations or fallback.
          if (any) {
            var hdr = document.createElement('p');
            hdr.innerHTML = '<b>Topics to review:</b> ' +
              (Array.isArray(j.weak_topics) ? j.weak_topics.map(escapeHtml).join(', ') : '');
            box.insertBefore(hdr, box.firstChild);
          } else if (j.did_you_know) {
            var fb = document.createElement('p');
            fb.textContent = "We couldn't find study resources for those topics. Here's something to think about:";
            box.appendChild(fb);
            var div = document.createElement('div');
            div.id = 'didyouknow';
            div.innerHTML = '<b>Did you know?</b> ' + escapeHtml(j.did_you_know);
            box.appendChild(div);
          } else {
            box.innerHTML = '<p>(no recommendations available)</p>';
          }
        }).catch(function(){
          document.getElementById('recos').innerHTML = '<p>(could not fetch recommendations)</p>';
        });

        function escapeHtml(s){ return String(s||'').replace(/[&<>\"']/g, function(c){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'})[c]; }); }
      });
    })();
    </script>
  </body>
</html>
"""
            try:
                _otel_record('endpoint_latency_ms', (time.time() - _quiz_t0) * 1000.0,
                             route='/quiz_html', status='ok')
                _otel_record('endpoint_calls', 1, route='/quiz_html', status='ok')
            except Exception:
                pass
            return self._html(200, html)
          except Exception as exc:
            try:
                logger.exception("quiz_html failed: %s", exc)
                _otel_record('endpoint_errors', 1, route='/quiz_html', error=type(exc).__name__)
                _otel_record('endpoint_latency_ms', (time.time() - _quiz_t0) * 1000.0,
                             route='/quiz_html', status='error')
            except Exception:
                pass
            err = (str(exc) or '').replace('<', '&lt;').replace('>', '&gt;')
            return self._html(
                200,
                '<!doctype html><html><body style="font-family:system-ui;padding:24px;">'
                '<h1 style="color:#b00020;">Quiz preview failed</h1>'
                '<p>The AI service hit an internal error while building this quiz.</p>'
                '<pre style="background:#f4f4f4;padding:12px;border-radius:6px;white-space:pre-wrap;">' + err + '</pre>'
                '</body></html>'
            )

        if parsed.path == '/vocab_html':
          _otel_record('endpoint_calls', 1, route='/vocab_html', status='start')
          _vocab_t0 = time.time()
          try:
            chapter_id = (q1('chapter_id') or '').strip()
            if not chapter_id:
                return self._html(400, '<h1>Missing chapter_id</h1>')

            conn = self._get_conn()
            rows = get_generated(conn, chapter_id=chapter_id, content_type='chapter_vocab_practice', limit=1)
            payload = rows[0].get('body') if rows else None
            payload = payload or {}
            questions = payload.get('questions') if isinstance(payload, dict) else None
            if not isinstance(questions, list):
                questions = []

            # Fall back to on-demand generation when nothing has been
            # pre-built — we craft a definition-matching exercise from the
            # chapter's keywords + best sentence per keyword, so the button
            # always returns a usable practice page.
            if not questions:
                try:
                    import scripts.generate_assets as gen
                    g_q = qint('grade', None)
                    s_q = q1('subject', None)
                    l_q = q1('language', None)
                    _ids, vchunks = gen.get_chunks_for_chapter(conn, chapter_id)
                    if not vchunks:
                        vchunks = _extract_chapter_text_from_pdf(
                            chapter_id=chapter_id, grade=g_q, subject=s_q, language=l_q,
                        )
                    if vchunks:
                        kws = gen.compute_keywords(vchunks, limit=10)
                        for k in (kws or [])[:8]:
                            try:
                                d = gen.best_sentence_for_keyword(vchunks, k) or ''
                            except Exception:
                                d = ''
                            if not d:
                                continue
                            questions.append({
                                'type': 'definition',
                                'prompt': f'Which word matches: "{d}"?',
                                'options': list(dict.fromkeys((kws or [])[:6] + [k])),
                                'answer': k,
                            })
                except Exception:
                    questions = []
                if not questions:
                    return self._html(
                        200,
                        '<h1>Key vocabulary unavailable</h1>'
                        '<p>This chapter has no indexed content yet — generate it from the AI page first.</p>',
                    )

            def esc(s):
                return (
                    str(s)
                    .replace('&', '&amp;')
                    .replace('<', '&lt;')
                    .replace('>', '&gt;')
                    .replace('"', '&quot;')
                )

            items = []
            _otel_record('vocab_questions', float(len(questions or [])), chapter_id=str(chapter_id))
            for i, q in enumerate(questions, start=1):
                if not isinstance(q, dict):
                    continue
                prompt = esc((q.get('prompt') or '').strip())
                qtype = esc((q.get('type') or '').strip())
                options = q.get('options') if isinstance(q.get('options'), list) else []
                answer = esc((q.get('answer') or '').strip())
                opts_html = ''
                if options:
                    opts_html = '<ul>' + ''.join('<li>' + esc(o) + '</li>' for o in options) + '</ul>'
                ans_html = ''
                if answer:
                    ans_html = "<details style='margin-top:8px;'><summary>Answer</summary><div style='margin-top:6px;'>" + answer + "</div></details>"
                items.append(
                    "<div class='q'><div class='meta'>Q"
                    + str(i)
                    + " ("
                    + qtype
                    + ")</div><div class='prompt'>"
                    + prompt
                    + "</div>"
                    + opts_html
                    + ans_html
                    + "</div>"
                )

            html = """
<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Key vocabulary</title>
    <style>
      body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; margin: 16px; }
      .q { border: 1px solid rgba(0,0,0,0.15); border-radius: 12px; padding: 10px 12px; margin: 10px 0; background: rgba(255,255,255,0.85); }
      .meta { font-weight: 700; opacity: 0.75; margin-bottom: 6px; }
      .prompt { white-space: pre-wrap; }
    </style>
  </head>
  <body>
    <h1>Key vocabulary — """ + esc(chapter_id) + """</h1>
    """ + ("\n".join(items) if items else "<p>(empty)</p>") + """
  </body>
</html>
"""
            try:
                _otel_record('endpoint_latency_ms', (time.time() - _vocab_t0) * 1000.0,
                             route='/vocab_html', status='ok')
                _otel_record('endpoint_calls', 1, route='/vocab_html', status='ok')
            except Exception:
                pass
            return self._html(200, html)
          except Exception as exc:
            try:
                logger.exception("vocab_html failed: %s", exc)
                _otel_record('endpoint_errors', 1, route='/vocab_html', error=type(exc).__name__)
                _otel_record('endpoint_latency_ms', (time.time() - _vocab_t0) * 1000.0,
                             route='/vocab_html', status='error')
            except Exception:
                pass
            err = (str(exc) or '').replace('<', '&lt;').replace('>', '&gt;')
            return self._html(
                200,
                '<!doctype html><html><body style="font-family:system-ui;padding:24px;">'
                '<h1 style="color:#b00020;">Key vocabulary preview failed</h1>'
                '<p>The AI service hit an internal error while building this vocabulary practice.</p>'
                '<pre style="background:#f4f4f4;padding:12px;border-radius:6px;white-space:pre-wrap;">' + err + '</pre>'
                '</body></html>'
            )

        if parsed.path == '/chat':
            _otel_record('endpoint_calls', 1, route='/chat', status='start')
            _otel_record('chat_calls', 1, route='/chat')
            # Convenience GET wrapper around /rag_query for the conversational
            # UI. Accepts: q | question, history (JSON array of {role,content}),
            # subject, grade, chapter_id, language, engine, mode, topk.
            question = (q1('q') or q1('question') or '').strip()
            if not question:
                return self._json(400, {'ok': False, 'error': 'Missing q or question'})

            history = []
            try:
                raw_h = q1('history') or ''
                if raw_h:
                    parsed_h = json.loads(raw_h)
                    if isinstance(parsed_h, list):
                        history = parsed_h[-10:]
            except Exception:
                history = []

            payload = {
                'question': question,
                'history': history,
                'engine':   q1('engine', 'zvec'),
                'mode':     q1('mode', 'hybrid'),
                'topk':     qint('topk', 6),
                'subject':  q1('subject'),
                'grade':    q1('grade'),
                'chapter_id': q1('chapter_id'),
                'language': q1('language'),
                'include_contexts': True,
            }

            class _Wrap:
                def __init__(self, h): self.h = h
                def __getattr__(self, k): return getattr(self.h, k)

            # Re-enter the POST handler for /rag_query with the synthesised payload.
            inner_self = self
            class _Stub:
                pass
            stub = _Stub()
            stub.path = '/rag_query'

            # Stash the payload on the request so _do_POST_inner can read it.
            self._chat_payload = payload
            try:
                # We can't reuse the rfile (already consumed); instead, monkey-patch
                # a tiny wrapper that returns our payload bytes on read().
                import io as _io
                raw = json.dumps(payload).encode('utf-8')
                orig_rfile = self.rfile
                orig_headers = self.headers
                self.rfile = _io.BytesIO(raw)
                # Re-set Content-Length so the handler reads `len(raw)` bytes.
                try:
                    new_headers = dict(orig_headers.items())
                except Exception:
                    new_headers = {}
                new_headers['Content-Length'] = str(len(raw))
                new_headers['Content-Type']   = 'application/json'
                class _H:
                    def __init__(self, d): self._d = d
                    def get(self, k, default=None): return self._d.get(k, default)
                    def items(self): return self._d.items()
                self.headers = _H(new_headers)
                try:
                    return self._do_POST_inner(urlparse('/rag_query'))
                finally:
                    self.rfile = orig_rfile
                    self.headers = orig_headers
            except Exception as exc:
                return self._json(500, {'ok': False, 'error': str(exc)})

        if parsed.path == '/health':
            _otel_record('endpoint_calls', 1, route='/health', status='start')
            # Keep /health fast: do not run schema/FTS rebuilds here.
            # The docker healthcheck timeout is short (3s), and a one-time FTS rebuild
            # can easily exceed it on large DBs.
            ready_db = True
            counts = {}
            try:
                c = sqlite3.connect(DB_PATH, timeout=0.2)
                c.row_factory = sqlite3.Row
                c.execute('SELECT 1').fetchone()

                include_counts = (q1('counts') == '1')
                if include_counts:
                    counts = {
                        'documents': int(c.execute('SELECT COUNT(*) AS n FROM documents').fetchone()['n']),
                        'chapters': int(c.execute('SELECT COUNT(*) AS n FROM chapters').fetchone()['n']),
                        'chunks': int(c.execute('SELECT COUNT(*) AS n FROM chunks').fetchone()['n']),
                        'generated_content': int(c.execute('SELECT COUNT(*) AS n FROM generated_content').fetchone()['n']),
                        'exercises': int(c.execute('SELECT COUNT(*) AS n FROM exercises').fetchone()['n']),
                    }
                c.close()
            except Exception:
                ready_db = False

            ready_zvec = os.path.exists(COLLECTION_PATH)
            model_loaded = self.__class__._model is not None

            return self._json(
                200,
                {
                    'ok': True,
                    'ready': {'db': ready_db, 'zvec': ready_zvec},
                    'counts': counts,
                    'model': {
                        'name': MODEL_NAME,
                        'device': (os.environ.get('LOOMA_DEVICE') or 'cpu'),
                        'loaded': model_loaded,
                    },
                    'activities_index': {
                        'path': ACTIVITIES_INDEX_PATH,
                        'ready': self.__class__._activities_collection is not None,
                        'doc_count': int(self.__class__._activities_count or 0),
                        'last_error': self.__class__._activities_error,
                    },
                },
            )

        conn = self._get_conn()

        if parsed.path == '/chapters':
            _otel_record('endpoint_calls', 1, route='/chapters', status='start')
            _otel_record('chapter_status_calls', 1, action='chapters')
            return self._json(
                200,
                {
                    'chapters': list_chapters(
                        conn,
                        subject=q1('subject'),
                        grade_level=qint('grade'),
                        language=q1('language'),
                        limit=qint('limit', 100),
                    )
                },
            )

        if parsed.path == '/generated':
            _otel_record('endpoint_calls', 1, route='/generated', status='start')
            _otel_record('chapter_status_calls', 1, action='generated')
            return self._json(
                200,
                {
                    'items': get_generated(
                        conn,
                        chapter_id=q1('chapter_id'),
                        content_type=q1('content_type'),
                        limit=qint('limit', 50),
                    )
                },
            )

        # JSON view of the chapter quiz (used by the standalone exercise player
        # page so it can render one question at a time client-side instead of
        # iframing /quiz_html). Falls back to on-demand generation if nothing
        # has been published yet, mirroring /quiz_html's behaviour.
        if parsed.path == '/quiz_data':
            chapter_id = (q1('chapter_id') or '').strip()
            if not chapter_id:
                return self._json(400, {'ok': False, 'error': 'Missing chapter_id'})
            try:
                rows = get_generated(conn, chapter_id=chapter_id, content_type='chapter_quiz', limit=1)
                body = (rows[0].get('body') if rows else None) or {}
                questions = body.get('questions') if isinstance(body, dict) else None
                vocab     = body.get('vocab')     if isinstance(body, dict) else None
                if not isinstance(questions, list):
                    questions = []
                if not isinstance(vocab, list):
                    vocab = []
                source = 'stored'
                if not questions:
                    source = 'on_demand'
                    grade    = qint('grade', None)
                    subject  = q1('subject', None)
                    language = q1('language', None)
                    n = qint('n', 8) or 8
                    if n < 3:  n = 3
                    if n > 50: n = 50
                    try:
                        import scripts.generate_assets as gen
                        _ids, chunks_text = gen.get_chunks_for_chapter(conn, chapter_id)
                        if not chunks_text:
                            chunks_text = _extract_chapter_text_from_pdf(
                                chapter_id=chapter_id, grade=grade,
                                subject=subject, language=language,
                            )
                        if chunks_text:
                            kws  = gen.compute_keywords(chunks_text, limit=14)
                            seed = hash(chapter_id) & 0x7fffffff
                            try:
                                _de = _lookup_dictionary_entries(kws or [], chapter_language=language)
                                _df = {}
                                for w, e in (_de or {}).items():
                                    if isinstance(e, dict):
                                        bd = (_best_dictionary_definition(e) or '').strip()
                                        if bd:
                                            _df[w] = {'def': bd}
                            except Exception:
                                _df = {}
                            questions = gen.generate_quiz_v2(
                                chunks_text, kws or [], _df,
                                n_questions=n, seed=seed,
                            ) or []
                    except Exception:
                        questions = []
                # Keep only multiple-choice questions with options + answer —
                # the player doesn't render fill-in-the-blank type questions.
                clean = []
                for q in questions:
                    if not isinstance(q, dict):
                        continue
                    prompt = (q.get('prompt') or '').strip()
                    opts   = q.get('options') if isinstance(q.get('options'), list) else []
                    ans    = (q.get('answer') or '').strip() if isinstance(q.get('answer'), str) else ''
                    if not (prompt and opts and ans):
                        continue
                    clean.append({
                        'prompt': prompt,
                        'options': [str(o) for o in opts],
                        'answer': ans,
                        'type': q.get('type') or 'mcq',
                        'source_activity': q.get('source_activity') or '',
                        'source_title':    q.get('source_title') or '',
                    })
                return self._json(200, {
                    'ok': True,
                    'chapter_id': chapter_id,
                    'questions': clean,
                    'vocab': vocab,
                    'source': source,
                    'count': len(clean),
                })
            except Exception as exc:
                return self._json(500, {'ok': False, 'error': str(exc)})

        # Same shape as /quiz_data but for the chapter vocab practice block.
        if parsed.path == '/vocab_data':
            chapter_id = (q1('chapter_id') or '').strip()
            if not chapter_id:
                return self._json(400, {'ok': False, 'error': 'Missing chapter_id'})
            try:
                rows = get_generated(conn, chapter_id=chapter_id, content_type='chapter_vocab_practice', limit=1)
                body = (rows[0].get('body') if rows else None) or {}
                questions = body.get('questions') if isinstance(body, dict) else None
                if not isinstance(questions, list):
                    questions = []
                source = 'stored'
                if not questions:
                    source = 'on_demand'
                    grade    = qint('grade', None)
                    subject  = q1('subject', None)
                    language = q1('language', None)
                    n = qint('n', 8) or 8
                    if n < 3:  n = 3
                    if n > 50: n = 50
                    try:
                        import scripts.generate_assets as gen
                        _ids, chunks_text = gen.get_chunks_for_chapter(conn, chapter_id)
                        if not chunks_text:
                            chunks_text = _extract_chapter_text_from_pdf(
                                chapter_id=chapter_id, grade=grade,
                                subject=subject, language=language,
                            )
                        if chunks_text:
                            kws  = gen.compute_keywords(chunks_text, limit=12)
                            seed = hash(chapter_id + 'v') & 0x7fffffff
                            questions = gen.generate_vocab_practice(
                                chunks_text, kws or [], n_questions=n, seed=seed,
                            ) or []
                    except Exception:
                        questions = []
                clean = []
                for q in questions:
                    if not isinstance(q, dict):
                        continue
                    prompt = (q.get('prompt') or '').strip()
                    opts   = q.get('options') if isinstance(q.get('options'), list) else []
                    ans    = (q.get('answer') or '').strip() if isinstance(q.get('answer'), str) else ''
                    if not (prompt and opts and ans):
                        continue
                    clean.append({
                        'prompt': prompt,
                        'options': [str(o) for o in opts],
                        'answer': ans,
                        'type': q.get('type') or 'mcq',
                    })
                return self._json(200, {
                    'ok': True,
                    'chapter_id': chapter_id,
                    'questions': clean,
                    'source': source,
                    'count': len(clean),
                })
            except Exception as exc:
                return self._json(500, {'ok': False, 'error': str(exc)})

        if parsed.path == '/search':
            query = q1('q', '').strip()
            if not query:
                return self._json(400, {'error': 'Missing q'})

            subject = q1('subject')
            grade = qint('grade')
            chapter_id = q1('chapter_id')
            limit = qint('limit', 20)
            mode = q1('mode', 'hybrid')
            _otel_record('search_calls', 1, mode=mode, subject=str(subject or ''), grade=str(grade or ''))
            _search_timer = _OtelTimer('search_latency_ms', mode=mode, subject=str(subject or ''))
            _search_timer.__enter__()

            if mode not in {'hybrid', 'fts', 'semantic'}:
                return self._json(400, {'error': 'Invalid mode'})

            if mode == 'fts':
                results = lexical_search(conn, query, subject=subject, grade_level=grade, chapter_id=chapter_id, limit=limit)
                hydrated = hydrate_results(conn, [{'id': r['id'], 'hybrid_score': r['score']} for r in results])
                return self._json(200, {'mode': mode, 'results': hydrated})

            try:
                model = self._get_model()
                collection = self._get_collection()
            except Exception as exc:
                # Most common case on older CPUs: embeddings backend can't load (Exit 132 / illegal instruction).
                # Degrade gracefully to FTS so the service remains usable.
                results = lexical_search(conn, query, subject=subject, grade_level=grade, chapter_id=chapter_id, limit=limit)
                hydrated = hydrate_results(conn, [{'id': r['id'], 'hybrid_score': r['score']} for r in results])
                return self._json(
                    200,
                    {
                        'mode': 'fts',
                        'degraded_from': mode,
                        'warning': f'Embeddings unavailable; fell back to FTS ({exc}).',
                        'results': hydrated,
                    },
                )

            if mode == 'semantic':
                results = semantic_search(collection, model, conn, query, subject=subject, grade_level=grade, chapter_id=chapter_id, topk=max(25, limit), limit=limit)
                hydrated = hydrate_results(conn, [{'id': r['id'], 'hybrid_score': r['score']} for r in results])
                return self._json(200, {'mode': mode, 'results': hydrated})

            fts_results = lexical_search(conn, query, subject=subject, grade_level=grade, chapter_id=chapter_id, limit=limit)
            zvec_results = semantic_search(collection, model, conn, query, subject=subject, grade_level=grade, chapter_id=chapter_id, topk=max(25, limit), limit=limit)
            merged = merge_results(fts_results, zvec_results, limit=limit)
            hydrated = hydrate_results(conn, merged)
            _otel_record('search_results', len(hydrated or []), mode=mode)
            _search_timer.__exit__(None, None, None)
            return self._json(200, {'mode': mode, 'results': hydrated})

        if parsed.path == '/search_activities':
            _otel_record('endpoint_calls', 1, route='/search_activities', status='start')
            _otel_record('search_calls', 1, mode='activities')
            query = q1('q', '').strip()
            if not query:
                return self._json(400, {'error': 'Missing q'})

            topk = qint('topk', ACTIVITIES_TOPK_DEFAULT) or ACTIVITIES_TOPK_DEFAULT

            try:
                model = self._get_model()
                collection = self.__class__._get_activities_collection()
                qv = model.encode(query, normalize_embeddings=True).tolist()
                results = collection.query(zvec.VectorQuery('embedding', vector=qv), topk=topk)

                ids_in_order = [get_doc_id(r) for r in results]
                score_by_id = {}
                for rank, doc_id in enumerate(ids_in_order, start=1):
                    score_by_id[doc_id] = 1.0 / rank

                coll = self.__class__._mongo_collection()
                obj_ids = []
                for sid in ids_in_order:
                    try:
                        obj_ids.append(ObjectId(sid))
                    except Exception:
                        continue

                docs_by_id = {}
                if obj_ids:
                    for d in coll.find(
                        {'_id': {'$in': obj_ids}},
                        projection={'dn': 1, 'ft': 1, 'fp': 1, 'fn': 1, 'nfp': 1, 'nfn': 1},
                    ):
                        docs_by_id[str(d.get('_id'))] = d

                out = []
                for sid in ids_in_order:
                    d = docs_by_id.get(sid) or {}
                    fp = d.get('fp')
                    fn = d.get('fn')
                    source_path = (fp + fn) if (fp and fn) else None
                    out.append(
                        {
                            'source_id': sid,
                            'dn': d.get('dn'),
                            'ft': d.get('ft'),
                            'looma_fp': fp,
                            'looma_fn': fn,
                            'source_path': source_path,
                            'score': float(score_by_id.get(sid, 0.0)),
                        }
                    )

                return self._json(200, out)
            except Exception as exc:
                return self._json(500, {'error': str(exc)})

        if parsed.path == '/recommend_after_score':
            _otel_record('endpoint_calls', 1, route='/recommend_after_score', status='start')
            _otel_record('recommend_calls', 1)
            # Returns ranked study resources for the chapter & the topics the
            # student got wrong. Mastery is decided from `score` (0..1), not
            # from whether the resource search returned anything — otherwise a
            # student who failed every question but whose topic keys don't
            # regex-match any Mongo doc would be incorrectly labelled as
            # "mastered" and shown a Did-you-know instead of remediation.
            try:
                chapter_id = (q1('chapter_id') or '').strip()
                subject    = (q1('subject') or '').strip().lower() or None
                language   = (q1('language') or '').strip().lower() or None
                grade      = qint('grade')
                limit      = qint('limit', 8) or 8
                if limit < 1: limit = 1
                if limit > 20: limit = 20
                # Score-based mastery threshold (default: ≥85% counts as mastery).
                try:
                    score_val = float(q1('score') or 'nan')
                except (TypeError, ValueError):
                    score_val = float('nan')
                mastery_cutoff = float(os.environ.get('LOOMA_MASTERY_CUTOFF', '0.85'))
                # weak_topics is comma-separated to keep the GET URL simple.
                wt_raw = (q1('weak_topics') or '').strip()
                weak_topics = [t.strip() for t in wt_raw.split(',') if t.strip()] if wt_raw else []

                FT_BUCKETS = {
                    'videos':  {'video', 'mp4', 'm4v', 'mov', 'evi'},
                    'books':   {'book', 'textbook', 'chapter', 'document'},
                    'files':   {'pdf', 'lesson', 'slideshow', 'text', 'html', 'image', 'audio'},
                }

                results = {'videos': [], 'books': [], 'files': []}
                seen_ids = set()
                used_query = None
                mastered = False

                # Language filter for recommendation cards. The student's
                # session is in `language` (e.g. 'en'); we don't want to push
                # them a Nepali-named resource. Mongo activities use a `lang`
                # field (en | np | both); we accept 'both' for either side.
                lang_norm = (language or '').strip().lower()
                if lang_norm in {'np', 'ne', 'nepali'}:
                    accept_langs = ['np', 'ne', 'both', None]
                elif lang_norm in {'en', 'english'}:
                    accept_langs = ['en', 'both', None]
                else:
                    accept_langs = None  # unknown -> don't filter

                DEVANAGARI = re.compile(r'[ऀ-ॿ]')

                def lang_ok(d):
                    if accept_langs is None:
                        return True
                    a_lang = (d.get('lang') or '').strip().lower() or None
                    if a_lang not in [l.lower() if isinstance(l, str) else l for l in accept_langs]:
                        return False
                    # Last-resort script check on display name — drop a
                    # mis-tagged Devanagari `dn` from an English session.
                    dn = str(d.get('dn') or '')
                    has_dev = bool(DEVANAGARI.search(dn))
                    if lang_norm in {'np', 'ne', 'nepali'}:
                        return True  # any script ok in Nepali session
                    return not has_dev  # English session: drop Devanagari dn

                if weak_topics:
                    # One activity-search per weak topic; merge by ft bucket.
                    coll = self.__class__._mongo_collection()
                    for topic in weak_topics[:5]:
                        used_query = topic
                        regex_q = {'$regex': re.escape(topic), '$options': 'i'}
                        mongo_filter = {
                            '$or': [
                                {'dn':       regex_q},
                                {'keywords': regex_q},
                                {'summary':  regex_q},
                            ],
                        }
                        if chapter_id:
                            mongo_filter['$or'].append({'ch_id': chapter_id})
                        try:
                            cursor = coll.find(
                                mongo_filter,
                                projection={'dn': 1, 'ft': 1, 'fp': 1, 'fn': 1, 'ch_id': 1, 'lang': 1},
                            ).limit(limit * 3)
                            for d in cursor:
                                sid = str(d.get('_id'))
                                if sid in seen_ids:
                                    continue
                                if not lang_ok(d):
                                    continue
                                ft = (d.get('ft') or '').strip().lower()
                                bucket = next(
                                    (b for b, fts in FT_BUCKETS.items() if ft in fts),
                                    'files',
                                )
                                if len(results[bucket]) >= limit:
                                    continue
                                seen_ids.add(sid)
                                results[bucket].append({
                                    'id': sid,
                                    'dn': d.get('dn'),
                                    'ft': ft,
                                    'fp': d.get('fp'),
                                    'fn': d.get('fn'),
                                    'matched_topic': topic,
                                })
                        except Exception:
                            continue

                total = sum(len(v) for v in results.values())
                # True mastery = score above cutoff (or no weak topics reported).
                # The recommendations-empty case is NOT mastery — it just means
                # we couldn't find study resources for those topics.
                if score_val == score_val:  # not NaN
                    mastered = score_val >= mastery_cutoff
                else:
                    mastered = (not weak_topics)
                _otel_record('recommendation_hits', total,
                             chapter_id=str(chapter_id or ''),
                             subject=str(subject or ''),
                             mastered=str(mastered))

                fact = None
                if mastered:
                    # Mastered the chapter — reward with a Did-you-know fact.
                    fact = self._did_you_know_for_chapter(
                        chapter_id=chapter_id, grade=grade,
                        subject=subject, language=language,
                    )
                    return self._json(200, {
                        'ok': True,
                        'mastered': True,
                        'recommendations': results,
                        'did_you_know': fact,
                        'score': (score_val if score_val == score_val else None),
                    })

                # Not mastered — return whatever recommendations we found, plus
                # a Did-you-know fact as a fallback when nothing matched, so the
                # student isn't left with a blank screen.
                if total == 0:
                    fact = self._did_you_know_for_chapter(
                        chapter_id=chapter_id, grade=grade,
                        subject=subject, language=language,
                    )

                return self._json(200, {
                    'ok': True,
                    'mastered': False,
                    'recommendations': results,
                    'weak_topics': weak_topics,
                    'did_you_know': fact,
                    'score': (score_val if score_val == score_val else None),
                })
            except Exception as exc:
                return self._json(500, {'ok': False, 'error': str(exc)})

        if parsed.path == '/did_you_know':
            _otel_record('endpoint_calls', 1, route='/did_you_know', status='start')
            _otel_record('didyouknow_calls', 1)
            try:
                chapter_id = (q1('chapter_id') or '').strip()
                subject    = (q1('subject') or '').strip().lower() or None
                language   = (q1('language') or '').strip().lower() or None
                grade      = qint('grade')
                fact = self._did_you_know_for_chapter(
                    chapter_id=chapter_id, grade=grade,
                    subject=subject, language=language,
                )
                return self._json(200, {'ok': True, 'did_you_know': fact})
            except Exception as exc:
                return self._json(500, {'ok': False, 'error': str(exc)})

        return self._json(404, {'error': 'Not found'})

    @classmethod
    def _did_you_know_for_chapter(cls, *, chapter_id, grade, subject, language):
        """Return a single 'Did you know?' sentence for the chapter, or None.

        The text MUST match the requested language. Earlier versions returned
        whatever sentence the chapter dir held first, which often produced
        Devanagari output for an English-language session because the per-
        chapter folder may have a Nepali summary file even when find_chapter_dir
        was asked for English. We now:
          1. resolve the chapter dir for the requested language explicitly,
          2. drop sentences whose script doesn't match (Latin for en, Devanagari
             for np/ne).
        """
        # Resolve the canonical language token. Fall back to English when the
        # caller didn't tell us — most LOOMA UI runs in English by default.
        lang_norm = (language or '').strip().lower()
        if lang_norm in {'np', 'ne', 'nepali'}:
            want_devanagari = True
        else:
            want_devanagari = False  # 'en', '', anything else -> English

        DEVANAGARI = re.compile(r'[ऀ-ॿ]')

        def script_ok(text: str) -> bool:
            if not text:
                return False
            has_dev = bool(DEVANAGARI.search(text))
            return has_dev if want_devanagari else (not has_dev)

        try:
            # Try the dir for the requested language FIRST — this guarantees
            # we read the right `.summary` when both EN and NP folders exist.
            for lang_try in ([lang_norm] if lang_norm else ['en', 'np', 'ne']):
                ch_dir = find_chapter_dir(grade=grade, subject=subject, language=lang_try or None)
                if ch_dir is None or not chapter_id:
                    continue
                summary_path = ch_dir / f'{chapter_id}.summary'
                if not summary_path.exists():
                    continue
                text = summary_path.read_text(encoding='utf-8', errors='ignore')
                try:
                    import scripts.generate_assets as gen
                    sents = [s.strip() for s in gen.split_sentences(text) if s and s.strip()]
                except Exception:
                    sents = [s.strip() for s in re.split(r'(?<=[.!?])\s+', text) if s.strip()]
                sents = [s for s in sents if 30 <= len(s) <= 240 and script_ok(s)]
                if sents:
                    return random.choice(sents)

            # Last-resort: scan the chunked chapter text. Same script filter so
            # we never hand back Devanagari content to an English session.
            try:
                conn = cls._conn or get_conn()
                import scripts.generate_assets as gen
                _ids, chunks = gen.get_chunks_for_chapter(conn, chapter_id) if chapter_id else ([], [])
                sents = []
                for t in chunks or []:
                    try:
                        sents.extend(gen.split_sentences(t))
                    except Exception:
                        sents.extend(re.split(r'(?<=[.!?])\s+', t or ''))
                sents = [
                    s.strip() for s in sents
                    if isinstance(s, str) and 30 <= len(s.strip()) <= 240 and script_ok(s.strip())
                ]
                if sents:
                    return random.choice(sents)
            except Exception:
                pass
        except Exception:
            pass
        return None


def build_arg_parser():
    p = argparse.ArgumentParser(description='LOOMA AI HTTP server (chapter search + generation)')
    p.add_argument('--host', default='127.0.0.1')
    p.add_argument('--port', type=int, default=8089)
    return p


def main():
    args = build_arg_parser().parse_args()
    server = HTTPServer((args.host, args.port), Handler)
    print(f'LOOMA server listening on http://{args.host}:{args.port}')
    server.serve_forever()


if __name__ == '__main__':
    main()
