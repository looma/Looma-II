================================================================================
LOOMA — THE ZVEC STACK, END TO END
================================================================================

Named README-ZVEC.txt rather than README.txt because Looma already has a
README.md at this path and two files called "readme" in one folder is exactly
the kind of ambiguity this document exists to remove.

Everything below was verified against the code and against a live collection on
2026-08-22, not reconstructed from memory. Where a number is quoted it was
measured; where the official documentation is quoted the source is listed at the
bottom.

--------------------------------------------------------------------------------
0. READ THIS FIRST: "ZVEC" MEANS TWO DIFFERENT THINGS IN LOOMA
--------------------------------------------------------------------------------

This is the single biggest source of confusion in the codebase, and it has cost
real debugging hours. There are TWO independent semantic-search systems:

  (A) looma-ai          — USES the zvec library. Powers the AI Assistant,
                          AI Tooling, exam and quiz generation.
                          Store: Docker volume `looma_ai_data` -> /app/data/zvec

  (B) looma-search      — does NOT use zvec AT ALL. Powers the Search page.
                          It is a NumPy float32 matrix plus a JSON sidecar.
                          Store: Docker volume `looma_search_index` ->
                                 /data/search-index

RENAMED 2026-08-22. Everything in (B) used to call itself zvec — `/data/zvec-index`,
`LOOMA_SEARCH_URL_ZVEC`, `looma_zvec_enabled()`, the class `ZvecSearchIndex` —
which was untrue and cost real debugging time, because (A) next door genuinely
does use zvec. The old names are still honoured everywhere so installed boxes
keep working:

  path      /data/search-index        falls back to a sibling `zvec-index`
                                      holding an index (docker AND native)
  flag      LOOMA_SEMANTIC            falls back to LOOMA_ZVEC
  url       LOOMA_SEARCH_URL_SEMANTIC falls back to LOOMA_SEARCH_URL_ZVEC
  php       looma_semantic_enabled()  looma_zvec_enabled() kept as an alias
  class     SemanticSearchIndex       (was ZvecSearchIndex)
  installer search_index_has_docs()   (was zvec_has_docs)
            wait_for_search_index()   (was wait_for_zvec_index)

Nothing WRITES to a legacy path; the next rebuild lands in the new one.

Rule of thumb while reading the code:
  - `import zvec`  -> you are in (A).
  - anything else calling itself zvec -> you are almost certainly in (B).

Sections 1 and 2 are about (A), the real zvec. Section 3 is about (B). Section 4
is the deployment pipeline, which involves (B) only.

--------------------------------------------------------------------------------
1. WHAT ZVEC IS (from the official documentation)
--------------------------------------------------------------------------------

Zvec is an open-source, in-process vector database by Alibaba — an embedded
library, not a server. The usual comparison is "SQLite for vectors": it runs
inside your process and stores each collection as a directory on disk.

Version in use: zvec 0.3.1 (verified inside the looma-ai:latest image).

1.1 The data model
------------------
Zvec organises data hierarchically: collections contain documents, "analogous to
tables and rows in relational databases".

  Collection
    "A collection is a named container for documents — similar to a table in a
    relational database system such as MySQL."
    - Governed by a schema defining scalar fields and vectors, with their types
      and indexing settings.
    - Schema is DYNAMIC: fields and vectors can be added or removed without
      recreating the collection.
    - "Each collection is persisted independently on disk in its own dedicated
      directory."
    - No joins and no cross-collection queries.

  Document — three parts:
    - id      : unique, immutable string identifier
    - vectors : a named set of vector representations
    - fields  : named scalar fields (strings, numbers, booleans, arrays)
    "All fields must conform to their declared types in the schema."

1.2 Data types
--------------
  Scalar : STRING, BOOL, INT32, INT64, UINT32, UINT64, FLOAT, DOUBLE
           plus array variants (ARRAY_STRING, ARRAY_INT32, ...)
  Dense  : VECTOR_FP16, VECTOR_FP32, VECTOR_INT8
  Sparse : SPARSE_VECTOR_FP32, SPARSE_VECTOR_FP16

1.3 Indexes
-----------
  "Every vector field must be indexed using an appropriate vector index to
  enable similarity search." Scalar field indexing is optional. Indexes can be
  declared at creation time or added later with create_index().

  Vector index types: Flat (brute force), HNSW, HNSW-RaBitQ, DiskANN, IVF.
  Metric types include COSINE and IP (inner product).

  Official guidance, and it matters for Looma (see 2.4):
  "Always use the same distance metric that your embedding model was trained
  for."

1.4 Operations
--------------
  insert  — add new documents (fails if the id already exists)
  upsert  — insert or replace by id
  update  — modify specific fields by id
  delete  — by id, or by scalar filter
  query   — vector similarity and/or full-text search, optionally with scalar
            filtering and re-ranking
  fetch   — retrieve full documents by id

  "All write operations are immediately visible for querying — enabling true
  real-time, streaming workloads."

--------------------------------------------------------------------------------
2. HOW LOOMA ACTUALLY MODELS ITS DATA IN ZVEC
--------------------------------------------------------------------------------

2.1 The collections
-------------------
Defined in looma-ai/app/index/zvec_store.py. Four, all with identical shape:

  curriculum_chunks   chunks of ingested curriculum text  <- the important one
  glossary_entries    glossary terms
  exercise_bank       generated exercises
  generated_assets    generated quizzes/exams/vocab

Paths come from looma-ai/app/paths.py (see 2.6). A fifth, activities_index, is
created by looma_server.py on the same pattern.

2.2 The schema, as built
------------------------
  schema = zvec.CollectionSchema(
      name=name,
      vectors=zvec.VectorSchema('embedding', zvec.DataType.VECTOR_FP32, 384),
  )
  zvec.create_and_open(path=path, schema=schema)

Two things are NOT specified, and both matter:
  - no `fields=[...]`      -> the collection has NO scalar fields
  - no `index_param=...`   -> the index falls back to zvec's defaults

2.3 What that produces on disk (measured, not assumed)
------------------------------------------------------
Read from the live `curriculum_chunks` collection in the looma_ai_data volume:

  STATS        : {"doc_count": 346716, "index_completeness": {"embedding": 1.0}}
  VECTOR       : embedding | DataType.VECTOR_FP32 | dim=384
  INDEX PARAM  : {"metric_type": IP, "quantize_type": UNDEFINED}
  SCALAR FIELDS: []   <- empty

2.4 THE LOAD-BEARING INVARIANT NOBODY WROTE DOWN
------------------------------------------------
The default metric came out as IP (inner product), not COSINE. That is correct
here — but only by construction, and only for as long as one rule holds:

  EVERY vector written to or queried against zvec MUST be L2-normalized.

For L2-normalized vectors, inner product is mathematically identical to cosine
similarity. Looma satisfies this today: every single `.encode()` call that feeds
or queries a zvec collection passes `normalize_embeddings=True`. Verified across
looma_server.py (lines 1575, 2386, 2396, 4235, 4264, 6138), ingest_looma.py:440,
hybrid_search.py:64, query_curriculum.py:29 and generate_assets.py (2019, 2054,
2190).

If anyone ever drops that argument, nothing will crash. Ranking will just
quietly get worse, because longer documents will score higher purely by vector
magnitude. Declaring the metric explicitly would remove the trap:

  zvec.VectorSchema('embedding', zvec.DataType.VECTOR_FP32, 384,
                    index_param=zvec.HnswIndexParam(
                        metric_type=zvec.MetricType.COSINE))

Note that changing this on an existing collection means rebuilding it.

2.5 No scalar fields => filtering happens outside zvec
-------------------------------------------------------
Because the collections carry vectors and ids only, zvec cannot filter by
subject, grade or chapter. All metadata lives in SQLite
(looma-ai/app/index/sqlite_store.py, data/index/looma.db) and is joined back by
document id after the vector query.

The consequence is visible in looma_server.py's semantic_search(), which asks
for `topk=max(25, topk)` and then discards whatever does not match the filters.
This is the same failure mode that was fixed on the search-page side in August
2026: filtering AFTER the top-k cut means a narrow filter can return nothing
even when matching content exists.

The clean fix is to declare the filter columns as scalar fields with an inverted
index and let zvec filter natively:

  fields=[zvec.FieldSchema(name='subject',  data_type=zvec.DataType.STRING,
                           index_param=zvec.InvertIndexParam()),
          zvec.FieldSchema(name='grade',    data_type=zvec.DataType.INT32,
                           index_param=zvec.InvertIndexParam()),
          zvec.FieldSchema(name='chapter_id', data_type=zvec.DataType.STRING,
                           index_param=zvec.InvertIndexParam())]

Zvec's schema is dynamic, so fields can be added without recreating the
collection — but existing documents would still need backfilling.

2.6 Where the data lives (and why there were three copies)
-----------------------------------------------------------
Authoritative store: Docker volume `looma_ai_data`, mounted at /app/data.
Measured contents: 3.6 GB — models/, index/looma.db, zvec/{curriculum_chunks,
exercise_bank, generated_assets, activities_index}.

Two decoys existed on disk and are NOT read by anything:
  Looma/looma-ai/data/    ~1.07 GB
  Looma/looma-ai-data/    ~190 MB

Cause: every store used to open a CWD-RELATIVE path ('data/zvec',
'data/index/looma.db'), so which store you got depended on the directory the
process happened to be started from. Fixed 2026-08-21 by looma-ai/app/paths.py,
which anchors every path to the package root instead. Run any script from
anywhere now and it resolves to the same place: /app/data in the container,
looma-ai/data on a dev box.

Caveat before deleting: observability/docker-compose.yml still bind-mounts
../looma-ai-data onto /app/data for `looma-analysis-worker` and
`looma-feedback-labeling` (profile `analysis`). Those services want a different
database (looma_ai.db), have never been started, and are misconfigured anyway
(they mount ../looma-ai onto /app/scripts with working_dir /app/scripts, so
analysis_worker.py resolves to /app/scripts/scripts/). The FILES are safe to
delete; the PATH is still referenced.

Note: keep this store in a Docker named volume, not a bind mount to a Windows or
external-disk folder. SQLite and zvec both do locking and memory-mapped I/O,
which is slow and corruption-prone across a virtualised bind mount. What travels
to another machine is the EXPORT (see section 4), not the live store.

2.7 Crash recovery — learned the hard way
------------------------------------------
After an unclean shutdown (Docker Desktop dying mid-write, for example) a
collection is left with residue. On the next open zvec repairs it:

  WARN segment.cc: ForwardBlock file[.../scalar.2.ipc] already exists
       (possible crash residue); cleaning and overwriting.
  WARN segment.cc: Index file[.../embedding.index.3.proxima] already exists
       (possible crash residue); cleaning and overwriting.

That repair REQUIRES WRITE ACCESS. Opening such a collection with
CollectionOption(read_only=True) fails per document with:

  ERROR id_map.cc: Failed to put [...] into IDMap[...], code[3],
        reason[Not implemented: Not supported operation in read only mode.]

Practical rule: a read-only open is only safe on a cleanly-closed collection.
Let the service open it read-write once after any crash before pointing
read-only consumers at it. (The `.proxima` extension is Alibaba's Proxima ANN
library, which backs zvec's vector index.)

--------------------------------------------------------------------------------
3. THE OTHER STACK: looma-search (NO ZVEC INSIDE)
--------------------------------------------------------------------------------

search-service/search_service.py. Powers the Search page. Understanding this is
necessary because it is what the ODROID deployment actually ships.

  Source of truth : MongoDB collection looma.activities
  Embedding model : sentence-transformers/all-MiniLM-L6-v2 (384-dim)
  Index           : one NumPy float32 matrix (dense.npy) + index_meta.json
  Search          : a single matrix multiply, then a partial top-k sort
  Store           : volume looma_search_index -> /data/search-index

3.1 The 256-token ceiling, and why chunking exists
---------------------------------------------------
all-MiniLM-L6-v2 has max_seq_length = 256 word pieces, roughly 1000 characters.
Measured directly inside the image. Everything past that is discarded by the
encoder.

This was the real ceiling on "search the content". The index used to hold ONE
vector per document, so a 40-page textbook was only ever matchable on its cover
page — and raising the ingester's PDF page limit changed nothing at all, because
the extra text never reached the encoder.

Fix (August 2026): each document is embedded as up to SEARCH_MAX_CHUNKS_PER_DOC
overlapping windows of SEARCH_CHUNK_CHARS characters, each stored as its own row
carrying the SAME Mongo id. search() collapses them back to one hit per document,
keeping the best-scoring window.

  SEARCH_CHUNK_CHARS         default 1000  (matches the model's window)
  SEARCH_CHUNK_OVERLAP       default 100
  SEARCH_MAX_CHUNKS_PER_DOC  default 4     (~3700 characters reachable)

Cost: the index grows, and it is loaded into RAM whole. Most of the corpus
(images, video, audio) is a filename and stays one row, so growth is far below
4x — but measure before raising it for an 8 GB board.

3.2 Filters are pushed down into the index
-------------------------------------------
The Search page's Type and Source checkboxes are hard filters. They used to be
applied by Mongo AFTER the service had returned its 12 globally-best documents,
so ticking "Video" routinely produced zero semantic hits — the global best dozen
are rarely all videos. The service now accepts `ft` and `src` query parameters
and masks scores BEFORE the top-k cut, so you get the k best MATCHING documents.

  GET /search?q=...&topk=60&ft=video&ft=mp4&src=CEHRD

looma-database-utilities.php sends exactly the same list it puts in the Mongo
$in clause, so the two can no longer disagree.

3.3 Index file format
----------------------
  index_meta.json : format, backend, model_name, embedding_dim, count,
                    doc_ids[], doc_dn[], doc_ft[], doc_fp[], doc_fn[],
                    doc_src[], vocab[]
  dense.npy       : the float32 matrix (sbert backend)
  matrix.npz      : sparse matrix (HashingVectorizer fallback backend)

load_index() revalidates format, backend and model_name and REJECTS anything
that does not match, falling back to a full rebuild. A wrong index can therefore
never be served; the worst case is the slow path. `doc_src` is optional and an
index built before it existed still loads (the Source filter is simply not
pushed down for it).

--------------------------------------------------------------------------------
4. THE IMPLEMENTATION PROCESS, START TO FINISH
--------------------------------------------------------------------------------

The governing idea: an ODROID must never ingest or embed anything. Both halves
are done once on a workstation and travel on the disk as artifacts.

  STEP 1  content/ ------------------> MongoDB looma.activities
          (read every file, extract text)          the SLOW half

  STEP 2  MongoDB ------------------> embeddings -> search-index/
          (one matmul per window)                  the OTHER slow half

  STEP 3  export: mongo-dump/dump/  +  search-index/
          both committed next to the repo, i.e. they travel on the disk

  STEP 4  installer on the ODROID drops them into place BEFORE the service
          starts -> the box comes up searching in seconds

4.1 Running it (one command)
-----------------------------
  cd Looma
  export MSYS_NO_PATHCONV=1          # Git Bash on Windows ONLY — see 6.1
  ./deploy/odroid/build-search-artifacts.sh

  Useful knobs:
    LOOMA_SEARCH_MAX_CHUNKS=4        embedding windows per document
    LOOMA_SEARCH_THREADS=$(nproc)    the script raises this; the box stays at 1
    --exclude "W4S W4S2013"          skip the Wikipedia-for-Schools trees
    --content-dir /path/to/content   default is ../content next to the repo

  Expect 3–5 hours for a full content drive (~300k files).

4.2 What each step does
------------------------
  STEP 1 — looma-ai/scripts/ingest_bulk_content_to_mongo.py, run in a throwaway
  container with content/ bind-mounted read-only. Walks every top-level folder,
  extracts text and upserts one activity per file, keyed by a STABLE ObjectId
  derived from md5(namespace + relpath). Idempotent: re-running after a crash
  costs time, never data.

    Handled: .pdf (PyMuPDF), .html/.htm (BeautifulSoup, markup stripped),
             .txt/.md, .vtt (subtitles, cues stripped), images/video/audio
             (filename only — no OCR, deliberately: 193k of the files are
             decorative assets)
    Depth  : --max-pdf-pages 40, --max-pdf-chars 60000
             Reading is the expensive half and only happens HERE, so read deep
             once. Re-embedding deeper later then needs no second pass over the
             drive.
    Rule   : HTML WINS. A PDF with an .html twin in the same folder is skipped,
             and `chapters` is HTML-only, because the app opens the HTML and
             indexing both would put the same chapter in twice.

  STEP 2 — POST /rebuild on looma-search. Reads every Mongo document, builds the
  searchable text, chunks it (3.1) and embeds it. Returns 202 immediately and
  builds in a background thread.

    TRAP: a service that already has an index keeps serving the OLD doc_count
    for the whole build. "doc_count is not zero" does NOT mean it finished. The
    count CHANGING is the only honest completion signal, which is what the
    script waits for.

  STEP 3 — copies dense.npy / matrix.npz / index_meta.json out of the container
  (metadata LAST, since search_service.py keys off it) and runs mongodump.
  Results replace search-index/ and mongo-dump/dump/ in the repo.

  STEP 4 — deploy/odroid/looma-installer.sh:
    install_prebuilt_index_docker() fills the looma_search_index volume BEFORE
    the service ever starts, then zvec_has_docs() confirms and logs
    "search index already loaded: N documents (prebuilt — no ingest, no
    rebuild)". mongorestore --drop loads the database, text included.

4.2b WHAT THE SHIPPED ARTIFACTS ACTUALLY MEASURE (build of 2026-08-22)
----------------------------------------------------------------------
  search-index/   872 MB   dense.npy 842 MB + index_meta.json 72 MB
  mongo-dump/dump 603 MB

  rows in the index   548,364     (4 windows per text-bearing document)
  unique documents    315,175     (unchanged - no document was lost)
  backend             sentence-transformers/all-MiniLM-L6-v2  (NOT the fallback)
  doc_src populated   540,195 of 548,364 rows

  rows by type: html 328,902 | image 200,409 | video 5,903 | pdf 5,678 |
                chapter 1,635 | vtt 1,598 | audio 1,438 | game 770

  Growth from chunking was 1.74x, not 4x, because the large majority of the
  corpus (images, video, audio) is a filename and stays a single row.

  THE NUMBER TO WATCH: dense.npy is loaded into RAM whole, so the search service
  now needs ~850 MB resident where it previously needed ~484 MB. That is fine on
  a 16 GB workstation and is the main thing to re-check on an 8 GB board. If it
  is too much, rebuild with LOOMA_SEARCH_MAX_CHUNKS=2 and re-measure; the first
  query after a cold start also pays the load, which was observed to exceed 30 s
  on the workstation.

4.3 IMPORTANT: the stack is OFF by default on the ODROID
---------------------------------------------------------
  WITH_SEARCH="${WITH_SEARCH:-0}"    # looma-installer.sh

The prebuilt artifacts do NOT make the stack install itself. You must pass
--search (or say yes on the "zvec" row of the interactive menu). It is one
switch for all three features, because all three run on the same stack:

  semantic search + AI Assistant + exam generation

With it off the installer writes LOOMA_ZVEC=0 and includes/looma-features.php
HIDES those buttons entirely, rather than offering a button with no service
behind it. WITH_AI is derived from WITH_SEARCH.

Also required: install FROM the disk carrying the artifacts —
prebuilt_index_dir() reads $SRC_REPO/search-index.

--------------------------------------------------------------------------------
5. CONFIGURATION REFERENCE
--------------------------------------------------------------------------------

looma-ai (the real zvec) — all read by looma-ai/app/paths.py:
  LOOMA_AI_DATA_DIR       base data dir      default <looma-ai>/data
  ZVEC_BASE_PATH          collections dir    default <data>/zvec
  SQLITE_DB_PATH          metadata db        default <data>/index/looma.db
  LOOMA_AI_MODELS_DIR     model cache        default <data>/models
  LOOMA_RAW_PATH          ingest source      default <data>/raw/looma
  A relative value is resolved against the looma-ai folder, never the CWD.

  LOOMA_EMBED_MODEL       default paraphrase-multilingual-MiniLM-L12-v2
  LOOMA_DISABLE_EMBEDDINGS / LOOMA_ENABLE_EMBED_INDEXING
  LOOMA_SOURCE_ROOT       /looma/content in the container
  LOOMA_NLLB              opt-in translation model; OFF by default

looma-search (not zvec):
  MODEL_NAME              must match what the index was built with
  INDEX_DIR               /data/search-index (was /data/zvec-index; the old
                          directory is still read as a fallback — section 0)
  EMBEDDING_DIM           384
  SEARCH_REBUILD_ON_START 0 on a box — never rebuild on boot
  SEARCH_TOPK             floor; callers ask for more
  SEARCH_CHUNK_CHARS / SEARCH_CHUNK_OVERLAP / SEARCH_MAX_CHUNKS_PER_DOC
  SEARCH_VOCAB_SCAN_CHARS 12000 — "did you mean" vocabulary, wider than the
                          embedding budget on purpose
  LOOMA_SEARCH_THREADS    1 on a box; raised by the build script
  LOOMA_USE_SBERT         0 forces the HashingVectorizer fallback

web app:
  LOOMA_SEMANTIC / LOOMA_AI   feature gates (includes/looma-features.php);
                          LOOMA_ZVEC is the legacy name and still works
  LOOMA_SEARCH_URL_SEMANTIC  http://looma-search:46333/search
                          (LOOMA_SEARCH_URL_ZVEC still read as a fallback)
  LOOMA_SEARCH_TIMEOUT    default 20s
  LOOMA_SEARCH_TOPK       default 60

--------------------------------------------------------------------------------
6. OPERATIONS AND TROUBLESHOOTING
--------------------------------------------------------------------------------

6.1 Git Bash on Windows: bind mounts silently mount NOTHING
------------------------------------------------------------
Without MSYS_NO_PATHCONV=1, MSYS rewrites POSIX paths before docker.exe sees
them. `-v /d/.../content:/content:ro` then mounts nothing and the ingest reads an
empty tree — no error, just zero results. Verified:

  without the flag : ls: /content: No such file or directory
  with the flag    : CEHRD  Childrens Stories  Curriculum ...

Always export MSYS_NO_PATHCONV=1 before running the build script from Git Bash.

6.2 The search service silently degrades instead of failing
------------------------------------------------------------
If torch cannot load, search_service.py falls back to HashingVectorizer and logs
a warning. Everything keeps working, but quality collapses and any sbert-built
index is rejected on load. Check the backend, never assume it:

  curl -s http://127.0.0.1:46333/health
  -> "backend":"sbert"  is what you want

6.3 Useful checks
------------------
  curl -s http://127.0.0.1:46333/health          doc_count, unique_docs, backend
  docker logs looma-search
  python looma-ai/scripts/check_zvec.py          which store this env resolves to
  python looma-ai/scripts/init_zvec.py           create missing collections
  python looma-ai/scripts/_check_ingest_status.py

6.4 Long builds die when the machine sleeps
--------------------------------------------
Docker Desktop and its WSL VM are torn down on suspend, taking any running build
with them. A full artifact build is 3–5 hours. Disable sleep for the duration.
Mongo data survives (the ingest is idempotent), so a restart resumes cheaply.

--------------------------------------------------------------------------------
7. KNOWN GAPS
--------------------------------------------------------------------------------

  1. Vector index and metric are left to zvec's defaults. Works today only
     because every vector is L2-normalized (2.4). Declare them explicitly.
  2. No scalar fields in any collection, so zvec cannot filter natively (2.5).
  3. (fixed 2026-08-22) The naming lie in section 0.
  4. Chapter metadata files (.summary 1600, .keywords 1559, .quiz 570) are not
     in the search index. Adding them as activities would produce results
     pointing at files the app cannot open; they should be merged into their
     chapter's document instead.
  5. Deep search is bounded by SEARCH_MAX_CHUNKS_PER_DOC. Genuinely deep
     retrieval over a 300k-document corpus needs a per-chunk id space and an ANN
     index rather than a brute-force matmul.

--------------------------------------------------------------------------------
8. SOURCES
--------------------------------------------------------------------------------

Official zvec documentation (Alibaba):
  https://zvec.org/en/
  https://zvec.org/en/docs/db/concepts/data-modeling/
  https://zvec.org/en/docs/db/data-operations/
  https://zvec.org/en/docs/db/collections/create/
  https://zvec.org/en/docs/db/concepts/vector-index/
  https://github.com/alibaba/zvec

Note: the path zvec.org/en/docs/concepts/datamodeling/ returns 404; the correct
path is /en/docs/db/concepts/data-modeling/.

Looma source of record:
  looma-ai/app/paths.py             where every store lives
  looma-ai/app/index/zvec_store.py  the collection schemas
  search-service/search_service.py  the non-zvec search index
  deploy/odroid/build-search-artifacts.sh
  deploy/odroid/looma-installer.sh
