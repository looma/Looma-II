# looma-ai

Local indexing + vector search (ZVEC) + generated teaching assets (keywords, summaries, quizzes, flashcards, exams) for LOOMA content.

## Quick start (WSL)

Activate venv:

- `cd ~/looma-ai`
- `source .venv/bin/activate`

## One-time upgrade (older databases)

If you already have a `data/index/looma.db` created before this repo version, the FTS index may need a rebuild.
Run this once (it can take a few minutes for large databases):

- `PYTHONPATH=. python -c "from app.index.sqlite_store import get_conn; get_conn().close(); print('FTS ready')"`

### 1) Ingest LOOMA content

Index directly from the LOOMA content folder on the D: drive (WSL mount):

- `PYTHONPATH=. python scripts/ingest_looma.py --root /mnt/d/Vasco/Career/Projects/Looma/content --max-size-mb 50`

Notes:
- Supported types: PDF/DOCX/PPTX/TXT/MD/HTML + images (OCR).
- PDF pages with low text try OCR via `tesseract` (if installed).
  - If `tesseract` is not installed, scanned/low-text pages are skipped to avoid indexing junk (for example: `00`).

### 2) Generate assets per chapter

Generate keywords + summary + flashcards + end-of-chapter quiz (and optionally a final exam):

- `PYTHONPATH=. python scripts/generate_assets.py --subject math --grade 8 --language en --limit-chapters 5 --quiz-questions 10`
- `PYTHONPATH=. python scripts/generate_assets.py --grade 8 --language en --final-exam --final-exam-questions 40`

Outputs are stored in:
- SQLite: `data/index/looma.db` (tables: `generated_content`, `exercises`)
- ZVEC: `data/zvec/generated_assets`, `data/zvec/exercise_bank`

### 3) Search

CLI hybrid search (SQLite FTS5 + ZVEC):

- `PYTHONPATH=. python scripts/hybrid_search.py 'algebra' --subject math --grade 8 --limit 10`

Run a local HTTP server (for Chromium/Looma integration):

- `PYTHONPATH=. python scripts/looma_server.py --host 127.0.0.1 --port 8089`

Endpoints:
- `GET /health`
- `GET /chapters?subject=&grade=&language=&limit=`
- `GET /search?q=...&mode=hybrid|fts|semantic&subject=&grade=&chapter_id=&limit=`
- `GET /generated?chapter_id=&content_type=&limit=`

## Model cache

The embedding model is `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`.
By default caches go to `data/models`.

If you see Hugging Face rate-limit warnings, set `HF_TOKEN`.
