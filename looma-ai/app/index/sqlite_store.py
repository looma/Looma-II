import json
import sqlite3
from pathlib import Path

from app.paths import SQLITE_DB_PATH


# Anchored to the package root by app.paths, not to the CWD -- see the note
# there about the two rival data directories this used to produce.
DB_PATH = SQLITE_DB_PATH
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
    # Default (rollback-journal) mode fsyncs and recreates the journal file
    # on every commit — with one commit per ingested file, that turned a
    # bulk ingest (hundreds/thousands of files) into one multi-second disk
    # round-trip per file. WAL defers/batches those fsyncs (readers aren't
    # blocked by the writer either), which is the standard fix and is at
    # least as crash-safe as the default for this single-writer workload.
    # NORMAL sync is WAL's recommended pairing — still fsyncs at WAL
    # checkpoints, just not after every single transaction.
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA synchronous = NORMAL;")

    row = conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='documents'"
    ).fetchone()
    if not row:
        DB_PATH.parent.mkdir(parents=True, exist_ok=True)
        schema_sql = SCHEMA_PATH.read_text(encoding="utf-8")
        conn.executescript(schema_sql)
        conn.commit()
    else:
        # schema.sql's CREATE TABLE IF NOT EXISTS never touches a table that
        # already exists, so a column added there needs its own migration
        # for every box whose documents table predates it.
        cols = {r["name"] for r in conn.execute("PRAGMA table_info(documents)")}
        if "country" not in cols:
            conn.execute("ALTER TABLE documents ADD COLUMN country TEXT")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_documents_country ON documents(country)")
            conn.commit()
        # Added later than the tables themselves -- without these, any query
        # joining chapters/chunks back to documents (the country catalog,
        # the per-country export, _resolve_exam_chapters's SQLite fallback)
        # does a full scan of chunks on every call; at a few million rows
        # that is minutes, not milliseconds. CREATE INDEX IF NOT EXISTS is a
        # no-op on a box that already has them.
        conn.execute("CREATE INDEX IF NOT EXISTS idx_chapters_document_id ON chapters(document_id)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON chunks(document_id)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_chunks_chapter_id ON chunks(chapter_id)")
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
            subject, grade_level, country, total_pages, ocr_required, ingestion_status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            source_path=excluded.source_path,
            file_name=excluded.file_name,
            file_type=excluded.file_type,
            file_hash=excluded.file_hash,
            language=excluded.language,
            title=excluded.title,
            subject=excluded.subject,
            grade_level=excluded.grade_level,
            country=excluded.country,
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
            doc.get("country"),
            doc.get("total_pages"),
            doc.get("ocr_required", 0),
            doc.get("ingestion_status", "indexed"),
        ),
    )


def replace_chapters(conn, document_id, chapters):
    # chunks.chapter_id is a foreign key into chapters, so on a re-ingest
    # (--force) the old chunks must go before their chapters can be deleted,
    # or this trips a FOREIGN KEY constraint failure. replace_chunks() is
    # called later with the new chunk rows (which reference the chapters
    # inserted below), so this delete is safe to run standalone here.
    conn.execute("DELETE FROM chunks WHERE document_id = ?", (document_id,))
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
