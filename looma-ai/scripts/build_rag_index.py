"""Build the `rag_chunks` zvec collection (see app/index/rag_store.py).

Reuses the vectors already stored in the old `curriculum_chunks` collection, so
nothing is re-embedded: on the ODROID re-embedding 1.1 M chunks would take days.
Chunks that are missing from the old collection are embedded on the fly.

    python scripts/build_rag_index.py --old /app/data/zvec/curriculum_chunks.copy

Writes to <zvec>/rag_chunks.build, optimises (builds the HNSW graph), then
swaps it into place as <zvec>/rag_chunks. The previous rag_chunks, if any, is
removed only after the new one is complete.
"""

from __future__ import annotations

import argparse
import os
import shutil
import sqlite3
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import zvec  # noqa: E402

from app.index import rag_store  # noqa: E402
from app.paths import SQLITE_DB_PATH  # noqa: E402

BATCH = 500


def _vec(doc):
    v = (doc.vectors or {}).get('embedding') if doc is not None else None
    if v is None:
        return None
    return [float(x) for x in v]


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--old', required=True, help='old curriculum_chunks collection to copy vectors from')
    ap.add_argument('--limit', type=int, default=0, help='stop after N chunks (testing)')
    args = ap.parse_args()

    final = rag_store.path()
    build = final + '.build'
    shutil.rmtree(build, ignore_errors=True)

    old = zvec.open(path=args.old, option=zvec.CollectionOption(read_only=False, enable_mmap=True))
    new = rag_store.create(build)

    conn = sqlite3.connect(str(SQLITE_DB_PATH))
    conn.row_factory = sqlite3.Row
    rows = conn.execute(
        """
        SELECT k.id, k.clean_text, k.language AS klang,
               d.source_path, d.file_type, d.subject, d.grade_level, d.language AS dlang
        FROM chunks k JOIN documents d ON d.id = k.document_id
        """
    )

    model = None
    t0 = time.time()
    seen = kept = encoded = 0
    pending: list = []

    def flush(batch):
        nonlocal model, encoded
        got = old.fetch([r['id'] for r in batch])
        docs = []
        missing = []
        for r in batch:
            v = _vec(got.get(r['id']))
            if v is None:
                missing.append(r)
                continue
            docs.append((r, v))
        if missing:
            if model is None:
                from app.embed.model import load_model
                model = load_model()
            vs = model.encode([m['clean_text'] for m in missing], normalize_embeddings=True, batch_size=32)
            docs.extend((m, [float(x) for x in v]) for m, v in zip(missing, vs))
            encoded += len(missing)
        zdocs = []
        for r, v in docs:
            lang = (r['klang'] or r['dlang'] or None)
            lang = {'np': 'ne', 'nep': 'ne', 'nepali': 'ne', 'english': 'en'}.get(lang, lang)
            lang = lang or rag_store.lang_of_text(r['clean_text'])
            fields = {'tier': rag_store.tier_for(r['source_path'])}
            if r['grade_level'] is not None:
                fields['grade'] = int(r['grade_level'])
            if r['subject']:
                fields['subject'] = str(r['subject'])
            if lang:
                fields['lang'] = str(lang)
            zdocs.append(zvec.Doc(id=r['id'], vectors={'embedding': v}, fields=fields))
        if zdocs:
            new.insert(zdocs)
        return len(zdocs)

    for r in rows:
        seen += 1
        if not rag_store.is_indexable(r['source_path'], r['file_type'], r['clean_text']):
            continue
        pending.append(r)
        if len(pending) >= BATCH:
            kept += flush(pending)
            pending = []
            if kept % 20000 < BATCH:
                rate = kept / max(time.time() - t0, 1e-6)
                print(f'[build] seen={seen} kept={kept} encoded={encoded} {rate:.0f}/s', flush=True)
        if args.limit and kept >= args.limit:
            break
    if pending:
        kept += flush(pending)

    new.flush()
    print(f'[build] inserted {kept} of {seen} chunks ({encoded} re-embedded) in {time.time() - t0:.0f}s; optimising...', flush=True)
    t1 = time.time()
    new.optimize()
    print(f'[build] optimise done in {time.time() - t1:.0f}s: {new.stats}', flush=True)
    del new
    del old

    if os.path.exists(final):
        shutil.rmtree(final)
    os.rename(build, final)
    print(f'[build] ready: {final}', flush=True)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
