import sqlite3
import zvec
from sentence_transformers import SentenceTransformer

DB_PATH = "data/index/looma.db"
COLLECTION_PATH = "data/zvec/curriculum_chunks"

model = SentenceTransformer("sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
collection = zvec.open(path=COLLECTION_PATH)

def get_doc_id(result):
    if hasattr(result, "id"):
        return result.id
    if isinstance(result, dict) and "id" in result:
        return result["id"]
    raise ValueError(f"Could not extract id from result: {result!r}")

def main():
    query = input("Search: ").strip()
    q = model.encode(query, normalize_embeddings=True).tolist()

    results = collection.query(
        zvec.VectorQuery("embedding", vector=q),
        topk=5
    )

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    print(f"\nResults Found: {len(results)}\n")

    for i, r in enumerate(results, start=1):
        chunk_id = get_doc_id(r)

        row = conn.execute(
            """
            SELECT c.id, c.clean_text, ch.chapter_title,
                   d.file_name, d.subject, d.grade_level, c.page_start
            FROM chunks c
            LEFT JOIN chapters ch ON c.chapter_id = ch.id
            LEFT JOIN documents d ON c.document_id = d.id
            WHERE c.id = ?
            """,
            (chunk_id,)
        ).fetchone()

        if not row:
            print("=" * 80)
            print(f"[{i}] chunk_id={chunk_id} (no SQLite match)")
            print()
            continue

        print("=" * 80)
        print(f"[{i}] File: {row['file_name']} | Subject: {row['subject']} | Grade: {row['grade_level']} | Page: {row['page_start']}")
        print(f"Chapter: {row['chapter_title']}")
        print(row["clean_text"][:600])
        print()

    conn.close()

if __name__ == "__main__":
    main()
