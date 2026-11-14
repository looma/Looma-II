"""The RAG chunk index: one zvec collection, `rag_chunks`.

Replaces `curriculum_chunks`, which was a vector-only collection with zvec's
defaults: a brute-force (flat) index, inner-product metric, FP32, no scalar
fields. On the ODROID-C4 that meant every question scanned 1.15 M x 384 FP32
vectors (1.8 GB) that do not fit in free RAM, ~15 s per query, and every
subject/grade filter had to be applied in Python after the top-k cut.

`rag_chunks` declares everything explicitly:

  vector  embedding  FP32[384], HNSW, COSINE, INT8-quantised
                     (cosine is what the multilingual MiniLM was trained for,
                     so ranking no longer depends on every caller remembering
                     normalize_embeddings=True)
  fields  tier       textbook | teacher | reference | wiki   (inverted index)
          grade      1..12 or null                            (inverted index)
          subject    math | science | ... or null             (inverted index)
          lang       en | ne or null                          (inverted index)

so filters run INSIDE zvec, before the top-k cut.

NOTE: with COSINE, zvec returns a DISTANCE (0 = identical, 2 = opposite), not a
similarity. `search()` converts it to similarity = 1 - distance so callers keep
"higher is better".
"""

from __future__ import annotations

import os
import re

from app.paths import zvec_collection_path

NAME = 'rag_chunks'
EMBED_DIM = 384
TIERS = ('textbook', 'teacher', 'reference', 'wiki')

# Files whose chunks hurt answers more than they help: quiz/keyword sidecars put
# exercise questions and bare word lists into answers; the glossary PDF is a
# word list; geojson is map data.
EXCLUDED_FILE_TYPES = {'quiz', 'keywords', 'geojson', 'objectives', 'outline'}

# Text that looma-ai itself wrote back into the content folder (chapter
# summaries, lesson plans, teacher guides from /generate_*), plus file reports
# and encyclopedia index pages. An LLM wrote the generated files, so they are
# never evidence for an answer: a mistake in them would be repeated as fact.
GENERATED_FILE_TYPES = {'summary', 'plan'}
GENERATED_SUFFIXES = ('.summary', '.plan', '.teacher_guide.txt')
NOT_EVIDENCE_PATH_PARTS = ('/_reports/', '/wp/index/')


def is_evidence(source_path: str, file_type: str | None = None) -> bool:
    """May this document be quoted or used to answer a question?"""
    sp = source_path or ''
    if (file_type or '').lower() in GENERATED_FILE_TYPES or sp.lower().endswith(GENERATED_SUFFIXES):
        return False
    return not any(p in sp for p in NOT_EVIDENCE_PATH_PARTS)
EXCLUDED_PATH_PARTS = ('/dictionaries/',)
MIN_CHUNK_CHARS = 80


def path() -> str:
    return str(zvec_collection_path(NAME))


def tier_for(source_path: str | None) -> str:
    """Which shelf a chunk comes from. Textbooks are preferred when answering."""
    p = (source_path or '').replace('\\', '/')
    rel = p.split('/content/', 1)[-1]
    top = rel.split('/', 1)[0]
    if top in ('chapters', 'Supplementary Textbooks', 'Curriculum', 'CEHRD'):
        return 'textbook'
    if top == 'Teacher Tools':
        return 'teacher'
    if top.startswith('W4S'):
        return 'wiki'
    return 'reference'


def lang_of_text(text: str | None) -> str | None:
    """'ne' or 'en' from the script of the text, for chunks whose document
    carries no language tag (teacher guides, reference)."""
    t = re.sub(r'[\s\d\W_]+', '', (text or '')[:400])
    if not t:
        return None
    dev = sum('\u0900' <= c <= '\u097f' for c in t) / len(t)
    if dev > 0.5:
        return 'ne'
    if sum(c.isascii() for c in t) / len(t) > 0.8:
        return 'en'
    return None


def is_indexable(source_path: str | None, file_type: str | None, text: str | None) -> bool:
    if (file_type or '').lower() in EXCLUDED_FILE_TYPES:
        return False
    p = source_path or ''
    if any(part in p for part in EXCLUDED_PATH_PARTS):
        return False
    return len((text or '').strip()) >= MIN_CHUNK_CHARS


def _schema(zvec):
    inv = zvec.InvertIndexParam
    return zvec.CollectionSchema(
        name=NAME,
        fields=[
            zvec.FieldSchema('tier', zvec.DataType.STRING, index_param=inv()),
            zvec.FieldSchema('grade', zvec.DataType.INT32, nullable=True, index_param=inv()),
            zvec.FieldSchema('subject', zvec.DataType.STRING, nullable=True, index_param=inv()),
            zvec.FieldSchema('lang', zvec.DataType.STRING, nullable=True, index_param=inv()),
        ],
        vectors=zvec.VectorSchema(
            'embedding',
            zvec.DataType.VECTOR_FP32,
            EMBED_DIM,
            index_param=zvec.HnswIndexParam(
                metric_type=zvec.MetricType.COSINE,
                quantize_type=zvec.QuantizeType.INT8,
                m=16,
                ef_construction=128,
            ),
        ),
    )


def create(target_path: str):
    import zvec

    os.makedirs(os.path.dirname(target_path), exist_ok=True)
    return zvec.create_and_open(path=target_path, schema=_schema(zvec))


# The handle the server opened. A zvec collection can be opened by only one
# handle at a time (LOCK file), so in-process readers such as the telemetry
# gauges in scripts/otel_bootstrap.py reuse this one instead of opening their own.
LIVE: dict = {'collection': None}


def open_collection(read_only: bool = False):
    import zvec

    coll = zvec.open(path=path(), option=zvec.CollectionOption(read_only=read_only, enable_mmap=True))
    LIVE['collection'] = coll
    return coll


_SAFE = re.compile(r'^[A-Za-z0-9_\-]+$')


def build_filter(*, tiers=None, grade=None, subject=None, lang=None) -> str | None:
    """zvec filter expression. Values are whitelisted, never interpolated raw."""
    parts = []
    if tiers:
        ts = [t for t in tiers if t in TIERS]
        if ts:
            parts.append('tier IN (' + ','.join(f"'{t}'" for t in ts) + ')')
    if grade is not None:
        try:
            parts.append(f'grade = {int(grade)}')
        except (TypeError, ValueError):
            pass
    if subject and _SAFE.match(str(subject)):
        parts.append(f"subject = '{subject}'")
    if lang and _SAFE.match(str(lang)):
        # Untagged chunks (most reference/wiki text) stay eligible.
        parts.append(f"(lang = '{lang}' OR lang is null)")
    return ' AND '.join(parts) or None


def search(collection, qvec, *, topk=20, ef=96, **filters) -> list[dict]:
    """HNSW query with native filtering. Returns [{id, score, tier, grade, ...}],
    score = cosine similarity (higher is better)."""
    import zvec

    res = collection.query(
        zvec.VectorQuery('embedding', vector=list(qvec), param=zvec.HnswQueryParam(ef=max(ef, topk))),
        topk=topk,
        filter=build_filter(**filters),
    )
    out = []
    for d in res:
        f = d.fields or {}
        dist = float(d.score) if d.score is not None else 1.0
        out.append({'id': d.id, 'score': 1.0 - dist, **f})
    return out
