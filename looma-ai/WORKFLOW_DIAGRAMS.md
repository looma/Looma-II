# Visual Workflow Diagrams

## 1. Complete System Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         LOOMA AI FEEDBACK LOOP SYSTEM                       │
└─────────────────────────────────────────────────────────────────────────────┘

PHASE 1: DATA COLLECTION
────────────────────────

    Query Request
         │
         ▼
    ┌─────────────────────────┐
    │  looma-ai (Python)      │
    │  looma-web (PHP)        │
    │  Uses structured_logger │
    └──────────┬──────────────┘
               │
               │ JSON log via stdout
               │ {timestamp, level, message, request_id, query_type,
               │  success, response_time_ms, error_type, ...}
               │
               ▼
    ┌─────────────────────────┐
    │   Docker Container      │
    │   (stdout/stderr)       │
    └──────────┬──────────────┘
               │
               │ Mount: /var/run/docker.sock
               │
               ▼
    ┌─────────────────────────┐
    │   Vector Log Shipper    │
    │   - Parse JSON          │
    │   - Enrich metadata     │
    │   - Generate metrics    │
    └──────────┬──────────────┘
               │
        ┌──────┴──────┐
        │             │
        ▼             ▼
    OpenSearch    Prometheus
    (Indexing)    (Metrics)

PHASE 2: ANALYSIS
─────────────────

    ┌────────────────────────────┐
    │  Analysis Worker           │
    │  (runs every 60 minutes)   │
    └──────────┬─────────────────┘
               │
               ▼ Query: Last 24 hours
    ┌────────────────────────────┐
    │  OpenSearch                │
    │  looma-logs-2026-04-30    │
    └──────────┬─────────────────┘
               │
    ┌──────────┴──────────┐
    ▼                     ▼
Analysis Results    Extract Examples
- Success rates     - High confidence (>80%)
- Error patterns    - Feature + label pairs
- Query volumes     - Metadata (grade, subject, etc.)
    │                     │
    ▼                     ▼
    SQLite Database
    ┌──────────────────────────────────┐
    │ log_analysis table              │
    │ - query_type, success_rate, ... │
    │                                  │
    │ training_examples table          │
    │ - request_id, example_data, ... │
    └──────────────────────────────────┘

PHASE 3: LABELING
──────────────────

    GET /feedback/unlabeled?limit=20
           │
           ▼ HTTP
    ┌──────────────────────────────┐
    │  Feedback Labeling API       │
    │  (port 48888)                │
    └──────────┬───────────────────┘
               │
               ▼ Query SQLite
    ┌──────────────────────────────┐
    │  Returns:                    │
    │  {                           │
    │    "db_id": 123,             │
    │    "request_id": "abc123",   │
    │    "query_type": "rag_query",│
    │    "data": {...example...},  │
    │    "confidence": 0.95        │
    │  }                           │
    └──────────┬───────────────────┘
               │
               ▼ Human Review
    ┌──────────────────────────────┐
    │  Curator Reviews             │
    │  "Is this good/bad/unclear?" │
    └──────────┬───────────────────┘
               │
        POST /feedback/label
        {"db_id": 123, "label": "good"}
               │
               ▼
    ┌──────────────────────────────┐
    │  SQLite: Update label = "good"│
    └──────────────────────────────┘

PHASE 4: READINESS CHECK
─────────────────────────

    GET /feedback/training-status
           │
           ▼
    Check SQLite:
    - Count good labels: 200
    - Count total: 250
    - Percentage: 80%
    - Min threshold: 70%
           │
           ▼
    Response:
    {
      "ready_for_training": true,
      "good": 200,
      "total": 250,
      "good_percentage": 80.0
    }

PHASE 5: MODEL RETRAINING
──────────────────────────

    scheduled_pipeline.py runs
           │
           ├─→ Analysis Phase
           │   └─→ Analyze 24h logs
           │
           ├─→ Feedback Phase
           │   └─→ Check readiness
           │       └─→ If ready_for_training=true → continue
           │
           ├─→ Retraining Phase
           │   ├─→ Get labeled examples from SQLite
           │   ├─→ Create training run
           │   │   └─→ trainer.create_training_run()
           │   │       └─→ training_runs table
           │   │
           │   └─→ Fine-tune model
           │       ├─→ trainer.start_training()
           │       ├─→ [Your custom training code]
           │       └─→ trainer.complete_training()
           │           └─→ training_runs + training_metrics tables
           │
           └─→ Model Activation
               ├─→ trainer.register_model_version()
               └─→ trainer.activate_model()
                   └─→ model_versions table
                       └─→ is_active = 1
                           └─→ looma-ai loads new model

PHASE 6: MONITORING
────────────────────

    Grafana Dashboards
    ├─→ Query Performance
    │   ├─→ Success rate trends
    │   ├─→ Response times
    │   └─→ Error rates by type
    │
    ├─→ Labeling Progress
    │   ├─→ Labeled examples count
    │   ├─→ Good/bad ratio
    │   └─→ Models ready for training
    │
    └─→ Model Improvements
        ├─→ Baseline vs new model
        ├─→ Inference latency
        └─→ Error reduction %
```

## 2. Detailed Query Lifecycle

```
USER QUERY
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│ looma-ai receives question                              │
│ generate_request_id = "xyz789"                          │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────┐
│ with QueryLogger(logger, "rag_query", "xyz789"):       │
│     start_time = now()                                 │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────┐
│ Perform RAG Query                                      │
│ - Search contexts                                      │
│ - Generate answer                                      │
│ - response_time_ms = (now() - start_time) * 1000      │
└──────────────┬──────────────────────────────────────────┘
               │
               ├─ Success path:
               │  │
               │  ▼
               │  logger.info("Query completed: rag_query", extra={
               │      "request_id": "xyz789",
               │      "query_type": "rag_query",
               │      "response_time_ms": 245,
               │      "success": True,
               │  })
               │
               └─ Error path:
                  │
                  ▼
                  logger.error("Query failed", extra={
                      "request_id": "xyz789",
                      "query_type": "rag_query",
                      "error_type": "timeout",
                      "success": False,
                  }, exc_info=...)

               │
               ▼
┌─────────────────────────────────────────────────────────┐
│ JSON Log Emitted to stdout:                             │
│ {                                                       │
│   "timestamp": "2026-04-30T12:34:56.789Z",             │
│   "level": "INFO",                                     │
│   "logger": "looma_ai.handler",                        │
│   "message": "Query completed: rag_query",             │
│   "request_id": "xyz789",                              │
│   "query_type": "rag_query",                           │
│   "response_time_ms": 245,                             │
│   "success": true                                      │
│ }                                                       │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────┐
│ Docker stdout → Vector                                 │
│ (1 second latency)                                     │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────┐
│ Vector Processing:                                     │
│ 1. Parse JSON ✓                                        │
│ 2. Add container_name: "looma-ai" ✓                    │
│ 3. Add timestamp ✓                                     │
│ 4. Generate metrics ✓                                  │
│    - looma_query_total{query_type="rag_query"} +1     │
│    - looma_query_response_time_ms = 245               │
└──────────────┬──────────────────────────────────────────┘
               │
        ┌──────┴──────┐
        │             │
        ▼             ▼
┌────────────────┐ ┌─────────────┐
│ OpenSearch     │ │ Prometheus  │
│                │ │             │
│ POST /_bulk    │ │ Scrape      │
│ Index:         │ │ :8890       │
│ looma-logs-    │ │             │
│ 2026-04-30    │ │ Metrics:    │
│                │ │ - query_*   │
│ Doc:           │ │ - errors_*  │
│ {              │ │             │
│   request_id:  │ │             │
│   xyz789,      │ │             │
│   query_type:  │ │             │
│   rag_query,   │ │             │
│   ...          │ │             │
│ }              │ │             │
└────────┬───────┘ └──────┬──────┘
         │                │
         ▼                ▼
┌──────────────────────────────┐
│ OpenSearch Dashboards        │
│ View logs by request_id      │
│                              │
│ Find "xyz789":               │
│ - See full query details     │
│ - Timeline of operations     │
└──────────────────────────────┘

         ▼

┌──────────────────────────────┐
│ Grafana Dashboards           │
│ View metrics:                │
│ - Query rate per type        │
│ - Success rate trend         │
│ - Response time histogram    │
└──────────────────────────────┘

         ▼

┌──────────────────────────────┐
│ Analysis Worker (1h later)   │
│ Queries:                     │
│ - Last 24h rag_query ops     │
│ - Success: 1234/1250 (98.7%)│
│ - Avg time: 312ms            │
│ - Extract high-conf examples │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│ SQLite training_examples     │
│ INSERT new example           │
│ request_id: xyz789           │
│ query_type: rag_query        │
│ example_data: {...}          │
│ confidence: 0.98             │
│ labeled: 0                   │
└──────────────────────────────┘

         ▼

┌──────────────────────────────┐
│ Feedback API                 │
│ GET /feedback/unlabeled      │
│ Shows: example from xyz789   │
│ Curator reviews & labels it  │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│ SQLite training_examples     │
│ UPDATE                       │
│ request_id: xyz789           │
│ labeled: 1                   │
│ label: "good"                │
└──────────────────────────────┘
```

## 3. Model Retraining Pipeline

```
SCHEDULED TRIGGER (Daily or when ready)
│
▼
┌─────────────────────────────────────────┐
│ scheduled_pipeline.py                   │
│ config: pipeline_config.json            │
└──────────────┬──────────────────────────┘
               │
        ┌──────┴──────┬──────────┐
        │             │          │
        ▼             ▼          ▼
    PHASE 1      PHASE 2    PHASE 3
    ANALYSIS     FEEDBACK   RETRAINING

┌──────────────────────────────────────────────────┐
│ PHASE 1: ANALYSIS                                │
│                                                  │
│ 1. Query OpenSearch (last 24h)                  │
│    ├─ rag_query: success_rate=98.7%             │
│    ├─ summary: success_rate=92.1%               │
│    └─ chapters: success_rate=88.3%              │
│                                                  │
│ 2. Extract training examples                    │
│    ├─ Found: 342 high-confidence examples       │
│    ├─ confidence threshold: 0.8                 │
│    └─ Store in SQLite                           │
│                                                  │
│ 3. Analyze errors                               │
│    ├─ timeout: 12 errors                        │
│    ├─ out_of_memory: 3 errors                   │
│    └─ inference_error: 5 errors                 │
│                                                  │
│ Result: {phase: "analysis", status: "success"}  │
└──────────────┬───────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────┐
│ PHASE 2: FEEDBACK STATUS                         │
│                                                  │
│ Query SQLite labeled examples:                  │
│                                                  │
│ rag_query:                                       │
│   ├─ total_labeled: 150                         │
│   ├─ good: 120 (80%)                            │
│   ├─ bad: 20                                    │
│   └─ ready_for_training: ✓ YES                  │
│                                                  │
│ summary:                                         │
│   ├─ total_labeled: 45                          │
│   ├─ good: 32 (71%)                             │
│   └─ ready_for_training: ✗ NO (need 50 min)    │
│                                                  │
│ chapters:                                        │
│   ├─ total_labeled: 0                           │
│   └─ ready_for_training: ✗ NO                   │
│                                                  │
│ Result: [rag_query model is ready]              │
└──────────────┬───────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────┐
│ PHASE 3: RETRAINING (for ready models)           │
│                                                  │
│ For each ready model (rag_query):                │
│                                                  │
│ 1. Create training run                          │
│    └─ trainer.create_training_run(              │
│         model_type="rag_query",                 │
│         examples=120,                           │
│         parameters={...}                        │
│       )                                          │
│    └─ run_name = "rag_query_20260430_124500"    │
│                                                  │
│ 2. Mark as running                              │
│    └─ UPDATE training_runs SET status='running' │
│                                                  │
│ 3. Your custom training code                    │
│    ├─ Load labeled examples                     │
│    ├─ Fine-tune your model                      │
│    ├─ Evaluate on hold-out set                  │
│    └─ Save checkpoint                           │
│                                                  │
│ 4. Complete training                            │
│    └─ trainer.complete_training(                │
│         run_name,                               │
│         metrics={                               │
│           "accuracy": 0.94,                     │
│           "f1_score": 0.92,                     │
│           "improvement": 0.05                   │
│         },                                      │
│         checkpoint_path="/model_v2.ckpt"        │
│       )                                          │
│                                                  │
│ 5. Register model version                       │
│    └─ trainer.register_model_version(           │
│         version="rag_query_v2",                 │
│         model_type="rag_query",                 │
│         performance_score=0.94,                 │
│         improvement_pct=5.0                     │
│       )                                          │
│                                                  │
│ 6. Activate new model                           │
│    └─ trainer.activate_model("rag_query_v2")    │
│       └─ UPDATE model_versions SET is_active=1  │
│       └─ looma-ai reloads on next restart       │
│                                                  │
│ Result: {training_runs: [{model, run, status}]} │
└──────────────┬───────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────┐
│ PIPELINE COMPLETE                                │
│                                                  │
│ Results logged:                                 │
│ {                                               │
│   "pipeline_status": "success",                 │
│   "duration_seconds": 23.4,                     │
│   "phases": {                                   │
│     "analysis": {...},                          │
│     "feedback": {...},                          │
│     "retraining": {                             │
│       "training_runs": [                        │
│         {                                       │
│           "model_type": "rag_query",            │
│           "run_name": "...",                    │
│           "status": "completed",                │
│           "improvement": "5%"                   │
│         }                                       │
│       ]                                         │
│     }                                           │
│   }                                             │
│ }                                               │
│                                                  │
│ Logged to OpenSearch for monitoring              │
└──────────────────────────────────────────────────┘
```

## 4. Data Flow Diagram

```
┌─────────────┐
│ User Query  │
└──────┬──────┘
       │
       ▼
┌────────────────────┐
│ Looma AI Service   │ ◄─────┬──────┐ Gets active model
│ (looma-ai)         │       │      │ from model_versions
└────────┬───────────┘       │      │
         │                   │      │
         │ Emit JSON log     │      │
         │ (structured_      │      │
         │  logger.py)       │      │
         │                   │      │
         ▼                   │      │
┌────────────────────────┐   │      │
│ Docker stdout/stderr   │   │      │
└────────┬───────────────┘   │      │
         │                   │      │
         ▼ Collect via       │      │
┌──────────────────────┐    │      │
│ Vector (log shipper) │    │      │
│ - Parse JSON         │    │      │
│ - Enrich             │    │      │
│ - Generate metrics   │    │      │
└──┬─────────────────┬─┘    │      │
   │                 │      │      │
   ▼                 ▼      │      │
OpenSearch      Prometheus  │      │
(Indexed)       (Metrics)   │      │
   ▲                ▲       │      │
   │                │       │      │
   │ Query 24h      │ Scrape│      │
   │ logs           │ :8890 │      │
   │                │       │      │
┌──┴────────────────┴───┐   │      │
│ Analysis Worker       │   │      │
│ - Analyze patterns    │   │      │
│ - Extract examples    │   │      │
│ - Check readiness     │   │      │
└──┬────────────────┬───┘   │      │
   │                │       │      │
   ▼                ▼       │      │
SQLite Database          Grafana   │
(Local Analysis)         (Monitor) │
   │                              │
   │ Get labeled examples         │
   │                              │
   ▼                              │
Scheduled Pipeline              │
- Aggregate metrics             │
- Trigger retraining            │
  when ready                     │
   │                              │
   ├─ Create training run         │
   ├─ Fine-tune model             │
   ├─ Evaluate results            │
   ├─ Register model version      │
   └─ Activate new version ────────┼────►  looma-ai
                                   │       loads model v2
                                   │
                                   ▼
                          Improved Model
                          Performance
```

These diagrams show the complete system from query to model improvement!
