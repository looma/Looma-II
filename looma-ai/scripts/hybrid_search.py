import argparse
import sqlite3


import sys
from pathlib import Path

_PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))
import zvec

from app.embed.model import load_model


DB_PATH = 'data/index/looma.db'
COLLECTION_PATH = 'data/zvec/curriculum_chunks'


def get_doc_id(result):
    if hasattr(result, 'id'):
        return result.id
    if isinstance(result, dict) and 'id' in result:
        return result['id']
    raise ValueError(f'Could not extract id from result: {result!r}')


def lexical_search(conn, query, *, subject=None, grade_level=None, chapter_id=None, limit=10):
    sql = """
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
    """

    rows = conn.execute(
        sql,
        (
            query,
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


def semantic_search(collection, model, query, *, subject=None, grade_level=None, chapter_id=None, topk=25, limit=10, conn=None):
    q = model.encode(query, normalize_embeddings=True).tolist()
    results = collection.query(zvec.VectorQuery('embedding', vector=q), topk=topk)

    out = []
    for rank, r in enumerate(results, start=1):
        doc_id = get_doc_id(r)

        if subject is not None or grade_level is not None or chapter_id is not None:
            if conn is None:
                continue
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

        out.append({'id': doc_id, 'score': 1.0 / rank, 'source': 'zvec'})
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
                d.file_name,
                d.source_path,
                d.subject,
                d.grade_level
            FROM chunks c
            LEFT JOIN chapters ch ON c.chapter_id = ch.id
            LEFT JOIN documents d ON c.document_id = d.id
            WHERE c.id = ?
            """,
            (item['id'],),
        ).fetchone()

        if row:
            out.append(
                {
                    'id': row['id'],
                    'text': row['clean_text'],
                    'page_start': row['page_start'],
                    'chapter_id': row['chapter_id'],
                    'chapter_title': row['chapter_title'],
                    'file_name': row['file_name'],
                    'source_path': row['source_path'],
                    'subject': row['subject'],
                    'grade_level': row['grade_level'],
                    'hybrid_score': item['hybrid_score'],
                }
            )
    return out


def build_arg_parser():
    p = argparse.ArgumentParser(description='Hybrid search (SQLite FTS + ZVEC)')
    p.add_argument('query', nargs='?', help='Query text. If omitted, asks interactively.')
    p.add_argument('--limit', type=int, default=10)
    p.add_argument('--subject', default=None)
    p.add_argument('--grade', type=int, default=None)
    p.add_argument('--chapter-id', default=None)
    p.add_argument('--topk', type=int, default=25)
    return p


def main():
    args = build_arg_parser().parse_args()

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    model = load_model()
    collection = zvec.open(path=COLLECTION_PATH)

    query = args.query
    if not query:
        query = input('Hybrid Search: ').strip()

    fts_results = lexical_search(
        conn,
        query,
        subject=args.subject,
        grade_level=args.grade,
        chapter_id=args.chapter_id,
        limit=args.limit,
    )
    zvec_results = semantic_search(
        collection,
        model,
        query,
        subject=args.subject,
        grade_level=args.grade,
        chapter_id=args.chapter_id,
        topk=max(args.topk, args.limit),
        limit=args.limit,
        conn=conn,
    )
    merged = merge_results(fts_results, zvec_results, limit=args.limit)
    final_results = hydrate_results(conn, merged)

    print(f'\nFTS Results: {len(fts_results)}')
    print(f'Zvec Results: {len(zvec_results)}')
    print(f'Hybrid Results: {len(final_results)}\n')

    for i, r in enumerate(final_results, start=1):
        print('=' * 90)
        print(f"[{i}] score={r['hybrid_score']:.4f}")
        print(f"File: {r['file_name']}")
        print(f"Subject: {r['subject']} | Grade: {r['grade_level']} | Page: {r['page_start']}")
        print(f"Chapter: {r['chapter_title']} ({r['chapter_id']})")
        print(r['text'][:700])
        print()

    conn.close()


if __name__ == '__main__':
    main()