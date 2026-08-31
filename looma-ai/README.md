# looma-ai

Local indexing, vector search and generated teaching assets (keywords,
summaries, quizzes, flashcards, exams) for LOOMA content.

**This is the part of Looma that actually uses the [zvec](https://zvec.org/en/)
library.** The Search page does *not* — it is served by `looma-search`, which
calls itself zvec everywhere but contains none. That naming trap, the data model
and the full deployment pipeline are documented in
[`../README-ZVEC.txt`](../README-ZVEC.txt); read section 0 of it before touching
anything named "zvec" elsewhere in the repo.

---

## Where the data lives

One store, decided in exactly one place: [`app/paths.py`](app/paths.py). Every
path is anchored to this package, **never to the current directory**, so a
script writes to the same place no matter where you launch it.

| | resolves to |
|---|---|
| in the container | `/app/data` — the Docker volume `looma_ai_data` (**the real store**) |
| on a dev box | `looma-ai/data/` |

```
data/
  index/looma.db            SQLite: documents, chapters, chunks, FTS5, generated_content
  zvec/curriculum_chunks    zvec collection: one vector per ingested chunk
  zvec/glossary_entries
  zvec/exercise_bank
  zvec/generated_assets
  models/                   HuggingFace cache
```

Override any of it with `LOOMA_AI_DATA_DIR`, `ZVEC_BASE_PATH`, `SQLITE_DB_PATH`,
`LOOMA_AI_MODELS_DIR`, `LOOMA_RAW_PATH` (see [`.env.local`](.env.local) — nothing
loads that file automatically, export the variables or set them in the compose).
A relative value is resolved against this folder, not the CWD.

Not sure which store you are pointed at? Ask:

```bash
python scripts/check_zvec.py     # prints the resolved paths, then what is in them
python scripts/init_zvec.py      # creates any missing collections (safe to re-run)
```

> Keep this store on a Docker named volume, not a bind mount to a Windows or
> external-disk folder — SQLite and zvec both use file locking and mmap, which is
> slow and corruption-prone across a virtualised mount. What travels to another
> machine is the *export* (`mongo-dump/`, `search-index/`), not the live store.

---

## Running it

### Docker (how it actually runs)

`looma-ai` sits behind the `ai` compose profile because it is heavy (torch):

```bash
cd ..                                   # the Looma folder
docker compose --profile ai up -d looma-ai
curl -s http://127.0.0.1:8089/health
```

### Host venv (development)

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python scripts/looma_server.py --host 127.0.0.1 --port 8089
```

Run scripts from this folder; `app/paths.py` handles the rest.

---

## 1) Ingest content

```bash
python scripts/ingest_looma.py --root /looma/content
```

`--root` defaults to `$LOOMA_SOURCE_ROOT` (`/looma/content` in the container).

| flag | default | |
|---|---|---|
| `--max-size-mb` | `300` | `0` disables. The old 50 MB cap silently dropped 24 large PDFs, mostly CDC Nepali teacher guides. |
| `--max-files` | `0` | no limit |
| `--include-images` | off | OCR standalone images. Off deliberately: `content/` holds ~193k mostly decorative images. |
| `--fts-only` | off | SQLite/FTS only, skip embeddings and zvec writes |
| `--force` | off | reprocess files whose hash is already indexed |
| `--embedding-batch-size` | `128` | chunks per zvec batch |

Handles PDF, DOCX, PPTX, TXT, MD, HTML, VTT and the Looma-native chapter
metadata (`.summary`, `.outline`, `.quiz`, `.objectives`, `.plan`, `.lesson`,
`.keywords`, `.geojson`). Low-text PDF pages try OCR via `tesseract`; without it
they are skipped rather than indexed as junk.

Incremental by file hash — re-running only processes what changed.

## 2) Generate assets per chapter

```bash
python scripts/generate_assets.py --subject math --grade 8 --language en \
    --limit-chapters 5 --quiz-questions 10
python scripts/generate_assets.py --grade 8 --language en \
    --final-exam --final-exam-questions 40
```

Writes to SQLite (`generated_content`, `exercises`) and to the
`generated_assets` / `exercise_bank` zvec collections.

## 3) Search

```bash
python scripts/hybrid_search.py 'algebra' --subject math --grade 8 --limit 10
python scripts/check_zvec.py
python scripts/_check_ingest_status.py
```

---

## HTTP API

`GET /health` first — everything else assumes the index is up.

**Content & status**
`/chapters` · `/chapter_status` · `/chapter_content` · `/generated` ·
`/list_exams`

**Search & chat**
`/search` · `/search_activities` · `/rag_query` · `/chat` · `/rag_feedback` ·
`/did_you_know`

**Generation**
`/generate_lesson` · `/generate_exam` · `/generate_teacher_guide` ·
`/quiz_data` · `/quiz_html` · `/vocab_data` · `/vocab_html` ·
`/lesson_theory` · `/recommend_after_score`

**Editing**
`/save_summary` · `/save_keywords` · `/replace_pdf` · `/delete_resource` ·
`/update_lesson_theory` · `/publish_resources` · `/rebuild_activities`

The authoritative list is in the source:

```bash
grep -oE "parsed\.path == '/[a-z_]+'" scripts/looma_server.py | sort -u
```

---

## The assistant answers from LOCAL CONTENT ONLY

`/rag_query` searches this box's index and nothing else. There is no network
path out of this service — the Wikipedia fallback that used to sit behind the
curriculum search was removed, along with the `urllib.request` import, so it
cannot come back by accident. If the local content cannot answer, saying so is
the intended reply.

(The one opt-in exception is `LOOMA_NLLB=1`, which downloads a translation
model. It is off by default and is a model fetch, not an answer source.)

---

## Two rules worth knowing before you change the schema

**1. Every vector must be L2-normalized.** The collections are created without an
explicit `index_param`, so zvec defaults to `metric_type=IP` (inner product).
That is equivalent to cosine similarity *only* for normalized vectors. Every
`.encode()` in this package passes `normalize_embeddings=True` and must keep
doing so — drop it and nothing crashes, ranking just quietly starts favouring
long documents.

**2. The collections have no scalar fields.** Filtering by subject/grade/chapter
happens in SQLite after the vector query, which is why `semantic_search()`
over-fetches. See `../README-ZVEC.txt` §2.5 for how to push it into zvec.

---

## Configuration

| variable | default | |
|---|---|---|
| `LOOMA_EMBED_MODEL` | `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` | 384-dim, must match the collections |
| `LOOMA_DEVICE` | `cpu` | `cpu`, `cuda` or `mps` |
| `LOOMA_DISABLE_EMBEDDINGS` | `0` | `1` degrades to FTS-only (for CPUs where torch traps) |
| `LOOMA_SOURCE_ROOT` | `/looma/content` | ingest source |
| `LOOMA_MONGO_URL` | `mongodb://looma-db:27017` | |
| `LOOMA_OCR_LANGS` | `eng+nep` | tesseract languages |
| `HF_HOME` | `<data>/models/hf` | set `HF_TOKEN` if you hit rate limits |

---

## Troubleshooting

**A collection needs write access to recover.** After an unclean shutdown zvec
repairs the collection on the next open (`possible crash residue; cleaning and
overwriting`). That repair cannot run with
`CollectionOption(read_only=True)` — it fails per document with
`Not supported operation in read only mode`. Open read-write once after a crash
before pointing read-only consumers at it.

**Check what is actually indexed:**

```bash
python scripts/check_zvec.py
python scripts/_check_ingest_status.py
```

**Long ingests die when the machine sleeps** — Docker's WSL VM is torn down on
suspend. The ingest is incremental, so a restart resumes cheaply.
