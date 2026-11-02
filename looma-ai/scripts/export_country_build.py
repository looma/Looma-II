"""Build a slim, per-country SQLite + ZVEC store from the master index, for
one box's install: everything tagged for that country's curriculum, plus
every universal/supplementary document (country IS NULL — OpenStax,
Wikipedia, Khan, ...). This is the mechanism step 3 of the country/curriculum
plan needs: an Odroid never has to carry the whole global index, only the
slice that applies to the school it's going into.

Usage:
    python3 scripts/export_country_build.py --country Nepal --out /path/to/box-build

Produces <out>/index/looma.db and <out>/zvec/curriculum_chunks, in the same
shape app.paths/app.index expect — point LOOMA_AI_DATA_ROOT (or whatever env
var a box's deployment uses) at <out> and the assistant serves only that
slice.
"""
import argparse
import sqlite3
import sys
from pathlib import Path

_PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

from app.paths import SQLITE_DB_PATH, zvec_collection_path  # noqa: E402
from app.index.zvec_store import open_or_create_collection  # noqa: E402


def build_arg_parser():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--country', required=True,
                    help='Country whose tagged documents to include, plus every '
                         'universal (country IS NULL) document.')
    p.add_argument('--out', required=True, type=Path,
                    help='Output directory for the box-specific store.')
    p.add_argument('--source-db', type=Path, default=SQLITE_DB_PATH,
                    help='Master SQLite DB to read from (default: this box\'s own).')
    p.add_argument('--source-zvec', type=Path, default=zvec_collection_path('curriculum_chunks'),
                    help='Master ZVEC collection to read vectors from.')
    p.add_argument('--fetch-batch-size', type=int, default=1000)
    return p


def main():
    args = build_arg_parser().parse_args()

    src = sqlite3.connect(str(args.source_db))
    src.row_factory = sqlite3.Row

    doc_ids = [r['id'] for r in src.execute(
        "SELECT id FROM documents WHERE country = ? OR country IS NULL", (args.country,)
    )]
    if not doc_ids:
        raise SystemExit(f'No documents found for country={args.country!r} (and no universal '
                          f'documents either — is the country column populated?)')

    placeholders = ','.join('?' * len(doc_ids))
    chapters = src.execute(
        f'SELECT * FROM chapters WHERE document_id IN ({placeholders})', doc_ids
    ).fetchall()
    chunks = src.execute(
        f'SELECT * FROM chunks WHERE document_id IN ({placeholders})', doc_ids
    ).fetchall()
    documents = src.execute(
        f'SELECT * FROM documents WHERE id IN ({placeholders})', doc_ids
    ).fetchall()

    print(f'country={args.country}: {len(documents)} documents, {len(chapters)} chapters, '
          f'{len(chunks)} chunks', flush=True)

    out_db_path = args.out / 'index' / 'looma.db'
    out_db_path.parent.mkdir(parents=True, exist_ok=True)
    if out_db_path.exists():
        out_db_path.unlink()

    dst = sqlite3.connect(str(out_db_path))
    dst.executescript((_PROJECT_ROOT / 'schema.sql').read_text(encoding='utf-8'))

    def copy_rows(table, rows):
        if not rows:
            return
        cols = rows[0].keys()
        placeholders = ','.join('?' * len(cols))
        dst.executemany(
            f'INSERT INTO {table} ({",".join(cols)}) VALUES ({placeholders})',
            [tuple(r[c] for c in cols) for r in rows],
        )

    copy_rows('documents', documents)
    copy_rows('chapters', chapters)
    copy_rows('chunks', chunks)
    dst.commit()

    # curriculum_chunks is a fresh collection at the output path — never the
    # live master collection, so no lock contention with a running server.
    out_zvec_path = args.out / 'zvec' / 'curriculum_chunks'
    out_zvec_path.parent.mkdir(parents=True, exist_ok=True)
    dst_col = open_or_create_collection(out_zvec_path, 'curriculum_chunks')
    # read_only: lets this run safely against the live master collection
    # while looma_server.py has it open too (see zvec_store.py).
    src_col = open_or_create_collection(args.source_zvec, 'curriculum_chunks', read_only=True)

    chunk_ids = [r['zvec_doc_id'] for r in chunks if r['zvec_doc_id']]
    copied = missing = 0
    for i in range(0, len(chunk_ids), args.fetch_batch_size):
        batch = chunk_ids[i:i + args.fetch_batch_size]
        found = src_col.fetch(batch)
        docs = list(found.values())
        if docs:
            dst_col.insert(docs)
            copied += len(docs)
        missing += len(batch) - len(found)
        if (i // args.fetch_batch_size) % 50 == 0:
            print(f'...{copied} vectors copied', flush=True)

    print(f'DONE: {copied} vectors copied, {missing} missing from source ZVEC', flush=True)
    print(f'Box build ready at {args.out}', flush=True)


if __name__ == '__main__':
    main()
