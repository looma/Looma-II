"""Semantic search for the Search page: the `activities` zvec collection.

Replaces the separate looma-search service (a NumPy matrix plus a second copy of
torch and an English-only model, ~415 MB resident). This collection lives in
looma-ai next to `rag_chunks`, shares its multilingual embedding model (so
Nepali queries work), and pushes the page's Type and Source checkboxes down into
zvec as native filters:

  vector  embedding  FP32[384], HNSW, COSINE, INT8
  fields  sid        Mongo _id of the activity           (one doc has 1..3 rows)
          ft         activity filetype, lowercase       (inverted index)
          src        Source checkbox value, lowercase   (inverted index)

Each activity is embedded as up to MAX_WINDOWS windows: the first carries the
title, keywords and the start of its text; the others continue the text. The
model reads 128 word pieces (~500 characters), so longer windows would be cut.
search() collapses windows back to one hit per activity.
"""

from __future__ import annotations

import re

from app.paths import zvec_collection_path

NAME = 'activities'
EMBED_DIM = 384
WINDOW_CHARS = 500
MAX_WINDOWS = 3

TITLE_KEYS = ('dn', 'ndn', 'title', 'name', 'nfn')
KEYWORD_KEYS = ('key1', 'key2', 'key3', 'key4', 'keywords', 'subject', 'area', 'author')
TEXT_KEYS = ('text', 'description', 'body', 'content', 'caption', 'captions', 'summary')

_SAFE = re.compile(r"^[\w .\-]{1,80}$", re.UNICODE)


def path() -> str:
    return str(zvec_collection_path(NAME))


def _strings(v) -> list[str]:
    if isinstance(v, str):
        t = re.sub(r'<[^>]+>', ' ', v)
        t = re.sub(r'\s+', ' ', t).strip()
        return [t] if t else []
    if isinstance(v, list):
        out = []
        for x in v:
            out.extend(_strings(x))
        return out
    return []


def windows_for(doc: dict) -> list[str]:
    head = []
    for k in TITLE_KEYS + KEYWORD_KEYS:
        head.extend(_strings(doc.get(k)))
    head = ' '.join(dict.fromkeys(head))
    body = ' '.join(dict.fromkeys(s for k in TEXT_KEYS for s in _strings(doc.get(k))))
    if not head and not body:
        return []
    first = (head + ' . ' + body)[:WINDOW_CHARS] if body else head[:WINDOW_CHARS]
    out = [first]
    rest = body[max(0, WINDOW_CHARS - len(head) - 3):]
    while rest and len(out) < MAX_WINDOWS:
        piece = rest[:WINDOW_CHARS]
        if len(piece) < 80:
            break
        out.append(piece)
        rest = rest[WINDOW_CHARS - 50:]
    return out


def _schema(zvec):
    inv = zvec.InvertIndexParam
    return zvec.CollectionSchema(
        name=NAME,
        fields=[
            zvec.FieldSchema('sid', zvec.DataType.STRING),
            zvec.FieldSchema('ft', zvec.DataType.STRING, nullable=True, index_param=inv()),
            zvec.FieldSchema('src', zvec.DataType.STRING, nullable=True, index_param=inv()),
        ],
        vectors=zvec.VectorSchema(
            'embedding', zvec.DataType.VECTOR_FP32, EMBED_DIM,
            index_param=zvec.HnswIndexParam(
                metric_type=zvec.MetricType.COSINE, quantize_type=zvec.QuantizeType.INT8,
                m=16, ef_construction=128,
            ),
        ),
    )


def create(target_path: str):
    import os
    import zvec

    os.makedirs(os.path.dirname(target_path), exist_ok=True)
    return zvec.create_and_open(path=target_path, schema=_schema(zvec))


def open_collection():
    import zvec

    return zvec.open(path=path(), option=zvec.CollectionOption(read_only=False, enable_mmap=True))


def _in(field: str, values) -> str | None:
    vals = sorted({str(v).strip().lower() for v in (values or []) if v and _SAFE.match(str(v).strip())})
    if not vals:
        return None
    return f"{field} IN (" + ','.join("'" + v + "'" for v in vals) + ')'


def search(collection, qvec, *, topk=60, fts=None, srcs=None, ef=128) -> list[dict]:
    """Best window per activity, filtered natively. score = cosine similarity."""
    import zvec

    filt = ' AND '.join(f for f in (_in('ft', fts), _in('src', srcs)) if f) or None
    k = min(max(topk * MAX_WINDOWS, topk), 1000)
    res = collection.query(
        zvec.VectorQuery('embedding', vector=list(qvec), param=zvec.HnswQueryParam(ef=max(ef, k))),
        topk=k, filter=filt,
    )
    out, seen = [], set()
    for d in res:
        f = d.fields or {}
        sid = f.get('sid') or d.id.split('#', 1)[0]
        if sid in seen:
            continue
        seen.add(sid)
        out.append({'source_id': sid, 'ft': f.get('ft'), 'src': f.get('src'),
                    'score': 1.0 - float(d.score if d.score is not None else 1.0)})
        if len(out) >= topk:
            break
    return out


def build(mongo_coll, model, target: str, *, log=print) -> int:
    """Embed every Mongo activity into a new collection at `target`.
    Returns the number of vectors. The caller swaps `target` into place."""
    import shutil
    import time
    import zvec

    shutil.rmtree(target, ignore_errors=True)
    vecs = create(target)
    ids, texts, fields = [], [], []
    count, t0 = 0, time.time()

    def flush():
        nonlocal count
        embs = model.encode(texts, normalize_embeddings=True, batch_size=32)
        vecs.insert([zvec.Doc(id=i, vectors={'embedding': e.tolist()}, fields=f)
                     for i, e, f in zip(ids, embs, fields)])
        count += len(ids)
        ids.clear(); texts.clear(); fields.clear()
        log(f'[activities] {count} vectors, {count / max(time.time() - t0, 1e-6):.1f}/s')

    # Materialise first: a Mongo cursor left idle while the CPU embeds for an
    # hour times out server-side.
    docs = list(mongo_coll.find({}, projection={k: 1 for k in ('ft', 'src') + TITLE_KEYS + KEYWORD_KEYS + TEXT_KEYS}))
    for d in docs:
        sid = str(d.get('_id'))
        f = {'sid': sid}
        if d.get('ft'):
            f['ft'] = str(d['ft']).strip().lower()[:80]
        if d.get('src'):
            f['src'] = str(d['src']).strip().lower()[:80]
        for k, w in enumerate(windows_for(d)):
            ids.append(f'{sid}#{k}')
            texts.append(w)
            fields.append(f)
        if len(ids) >= 256:
            flush()
    if ids:
        flush()
    vecs.flush()
    vecs.optimize()
    del vecs
    return count
