"""Remove documents from the assistant's index: SQLite (documents, chapters,
chunks, chunks_fts) and the rag_chunks zvec collection.

Use it when content files are deleted from content/, so the assistant stops
citing pages that no longer exist.

    python scripts/prune_documents.py --paths-json deleted.json [--apply]
    python scripts/prune_documents.py --missing [--apply]

--paths-json  JSON list of paths relative to content/ (e.g. "W4S/wp/g/X.htm")
--missing     every document whose source file is no longer on disk

The looma-ai server holds rag_chunks open, so stop it first (the zvec LOCK):
    docker stop looma-ai && docker run --rm -v looma_ai_data:/app/data \\
      -v /var/www/html/content:/looma/content looma-ai:latest \\
      python scripts/prune_documents.py --missing --apply
"""

from __future__ import annotations

import argparse
import json
import os
import sqlite3
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.index import rag_store  # noqa: E402
from app.paths import SQLITE_DB_PATH  # noqa: E402

CONTENT_ROOT = os.environ.get('LOOMA_SOURCE_ROOT') or '/looma/content'


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument('--paths-json')
    g.add_argument('--missing', action='store_true')
    ap.add_argument('--apply', action='store_true', help='without it, only report')
    args = ap.parse_args()

    conn = sqlite3.connect(str(SQLITE_DB_PATH))
    if args.paths_json:
        rels = json.load(open(args.paths_json, encoding='utf-8'))
        wanted = {os.path.join(CONTENT_ROOT, r) for r in rels}
        docs = [(i, p) for i, p in conn.execute('SELECT id, source_path FROM documents') if p in wanted]
    else:
        docs = [(i, p) for i, p in conn.execute('SELECT id, source_path FROM documents') if p and not os.path.exists(p)]

    doc_ids = [d[0] for d in docs]
    chunk_ids: list[str] = []
    for i in range(0, len(doc_ids), 500):
        part = doc_ids[i:i + 500]
        chunk_ids += [r[0] for r in conn.execute(
            f"SELECT id FROM chunks WHERE document_id IN ({','.join('?' * len(part))})", part)]
    print(f'documents: {len(doc_ids)}  chunks: {len(chunk_ids)}')
    if not args.apply:
        print('dry run; add --apply')
        return 0

    if os.path.exists(rag_store.path()):
        coll = rag_store.open_collection()
        for i in range(0, len(chunk_ids), 1000):
            coll.delete(chunk_ids[i:i + 1000])
        coll.flush()
        print(f'rag_chunks after: {coll.stats}')

    for i in range(0, len(chunk_ids), 500):
        part = chunk_ids[i:i + 500]
        q = ','.join('?' * len(part))
        conn.execute(f'DELETE FROM chunks_fts WHERE chunk_id IN ({q})', part)
        conn.execute(f'DELETE FROM chunks WHERE id IN ({q})', part)
    for i in range(0, len(doc_ids), 500):
        part = doc_ids[i:i + 500]
        q = ','.join('?' * len(part))
        conn.execute(f'DELETE FROM chapters WHERE document_id IN ({q})', part)
        conn.execute(f'DELETE FROM documents WHERE id IN ({q})', part)
    conn.commit()
    print('sqlite pruned')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
