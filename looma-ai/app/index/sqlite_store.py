import json
import sqlite3
from pathlib import Path


DB_PATH = Path("data/index/looma.db")
SCHEMA_PATH = Path(__file__).resolve().parents[2] / "schema.sql"


def _rebuild_chunks_fts(conn: sqlite3.Connection) -> None:
    conn.execute("DROP TABLE IF EXISTS chunks_fts")
    conn.execute(
        """
        CREATE VIRTUAL TABLE chunks_fts USING fts5(
          chunk_id UNINDEXED,
          text,
          chapter_title,
          subject,
          grade_level,
          keywords
        )
        """
    )

    cursor = conn.execute(
        """
        SELECT
          c.id AS chunk_id,
          c.clean_text AS text,
          ch.chapter_title AS chapter_title,
          ch.subject AS subject,
          ch.grade_level AS grade_level,
          c.keywords_json AS keywords_json
        FROM chunks c
        LEFT JOIN chapters ch ON c.chapter_id = ch.id
        """
    )

    batch: list[tuple[str, str, str, str, str, str]] = []
    for row in cursor:
        keywords_json = row["keywords_json"] or "[]"
        try:
            keywords = " ".join(json.loads(keywords_json) or [])
        except Exception:
            keywords = ""

        batch.append(
            (
                row["chunk_id"],
                row["text"] or "",
                row["chapter_title"] or "",
                row["subject"] or "",
                str(row["grade_level"] or ""),
                keywords,
            )
        )

        if len(batch) >= 1000:
            conn.executemany(
                """
                INSERT INTO chunks_fts (chunk_id, text, chapter_title, subject, grade_level, keywords)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                batch,
            )
            batch = []

    if batch:
        conn.executemany(
            """
            INSERT INTO chunks_fts (chunk_id, text, chapter_title, subject, grade_level, keywords)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            batch,
        )


def _ensure_fts(conn: sqlite3.Connection) -> None:
    row = conn.execute(
        "SELECT sql FROM sqlite_master WHERE type='table' AND name='chunks_fts'"
    ).fetchone()
    sql = (row["sql"] if row else "") or ""

    if "content=''" in sql or 'content=\"\"' in sql:
        _rebuild_chunks_fts(conn)
        conn.commit()


def _ensure_schema(conn: sqlite3.Connection):
    conn.execute("PRAGMA foreign_keys = ON;")

    row = conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='documents'"
    ).fetchone()
    if not row:
        DB_PATH.parent.mkdir(parents=True, exist_ok=True)
        schema_sql = SCHEMA_PATH.read_text(encoding="utf-8")
        conn.executescript(schema_sql)
        conn.commit()

    _ensure_fts(conn)


def get_conn():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    _ensure_schema(conn)
    return conn


def upsert_document(conn, doc):
    conn.execute(
        """
        INSERT INTO documents (
            id, source_path, file_name, file_type, file_hash, language, title,
            subject, grade_level, total_pages, ocr_required, ingestion_status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            source_path=excluded.source_path,
            file_name=excluded.file_name,
            file_type=excluded.file_type,
            file_hash=excluded.file_hash,
            language=excluded.language,
            title=excluded.title,
            subject=excluded.subject,
            grade_level=excluded.grade_level,
            total_pages=excluded.total_pages,
            ocr_required=excluded.ocr_required,
            ingestion_status=excluded.ingestion_status,
            updated_at=CURRENT_TIMESTAMP
        """,
        (
            doc["id"],
            doc["source_path"],
            doc["file_name"],
            doc["file_type"],
            doc["file_hash"],
            doc.get("language"),
            doc.get("title"),
            doc.get("subject"),
            doc.get("grade_level"),
            doc.get("total_pages"),
            doc.get("ocr_required", 0),
            doc.get("ingestion_status", "indexed"),
        ),
    )


def replace_chapters(conn, document_id, chapters):
    conn.execute("DELETE FROM chapters WHERE document_id = ?", (document_id,))
    for ch in chapters:
        conn.execute(
            """
            INSERT INTO chapters (
                id, document_id, chapter_number, chapter_title, subject,
                grade_level, page_start, page_end, keywords_json,
                learning_goals_json, sequence_order
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                ch["id"],
                ch["document_id"],
                ch.get("chapter_number"),
                ch["chapter_title"],
                ch.get("subject"),
                ch.get("grade_level"),
                ch.get("page_start"),
                ch.get("page_end"),
                json.dumps(ch.get("keywords", []), ensure_ascii=False),
                json.dumps(ch.get("learning_goals", []), ensure_ascii=False),
                ch.get("sequence_order"),
            ),
        )


def replace_chunks(conn, document_id, chunks):
    conn.execute("DELETE FROM chunks WHERE document_id = ?", (document_id,))
    conn.execute(
        """
        DELETE FROM chunks_fts
        WHERE chunk_id LIKE ?
        """,
        (f"{document_id}_%",),
    )

    for ch in chunks:
        conn.execute(
            """
            INSERT INTO chunks (
                id, document_id, chapter_id, section_title, chunk_index, text,
                clean_text, page_start, page_end, language, content_type,
                difficulty, pedagogical_role, token_count, char_count,
                keywords_json, learning_objectives_json, prerequisites_json,
                related_concepts_json, zvec_doc_id
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                ch["id"],
                ch["document_id"],
                ch["chapter_id"],
                ch.get("section_title"),
                ch["chunk_index"],
                ch["text"],
                ch["clean_text"],
                ch.get("page_start"),
                ch.get("page_end"),
                ch.get("language"),
                ch.get("content_type"),
                ch.get("difficulty"),
                ch.get("pedagogical_role"),
                ch.get("token_count"),
                ch.get("char_count"),
                json.dumps(ch.get("keywords", []), ensure_ascii=False),
                json.dumps(ch.get("learning_objectives", []), ensure_ascii=False),
                json.dumps(ch.get("prerequisites", []), ensure_ascii=False),
                json.dumps(ch.get("related_concepts", []), ensure_ascii=False),
                ch.get("zvec_doc_id"),
            ),
        )

        conn.execute(
            """
            INSERT INTO chunks_fts (chunk_id, text, chapter_title, subject, grade_level, keywords)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                ch["id"],
                ch["clean_text"],
                ch.get("chapter_title", ""),
                ch.get("subject", ""),
                str(ch.get("grade_level", "")),
                " ".join(ch.get("keywords", [])),
            ),
        )


def commit(conn):
    conn.commit()
