# Looma AI Feedback Loop & Model Improvement System

## Overview

This system implements a complete feedback loop for continuous AI model improvement:

1. **Structured Logging** - All AI operations emit structured JSON logs
2. **Log Ingestion** - Vector collects logs and ships to OpenSearch
3. **Analysis** - Log Analysis Worker processes logs to extract patterns and training examples
4. **Feedback Labeling** - HTTP API for manual labeling of training examples
5. **Model Retraining** - Automated retraining pipeline triggered by sufficient labeled data
6. **Monitoring** - Grafana dashboards track improvement and performance

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Looma AI Services                        │
├─────────────────────────────────────────────────────────────────┤
│  looma-ai (main)     looma-web (PHP)      looma-db (MongoDB)    │
│  Uses structured_logger.py to emit structured JSON logs         │
└──────────────┬──────────────────┬──────────────────┬────────────┘
               │                  │                  │
               └──────────────────┴──────────────────┘
                        │
                   Docker stdout/stderr
                        │
           ┌────────────▼─────────────┐
           │   Vector (log shipper)   │
           │                          │
           │ - Parse JSON logs        │
           │ - Enrich with metadata   │
           │ - Generate metrics       │
           └────────────┬─────────────┘
                        │
        ┌───────────────┴───────────────┐
        │                               │
        ▼                               ▼
┌───────────────────┐        ┌──────────────────┐
│  OpenSearch       │        │  Prometheus      │
│  (log storage)    │        │  (metrics)       │
└────────┬──────────┘        └──────────┬───────┘
         │                             │
         │       ┌─────────────────────┘
         │       │
         ▼       ▼
┌─────────────────────────────────────────┐
│  Grafana (dashboards)                   │
└─────────────────────────────────────────┘
         ▲
         │
         │ Queries logs/metrics
         │
    ┌────┴─────────────────────────┐
    │                              │
┌───┴──────────────────┐  ┌────────┴──────────────┐
│ Analysis Worker      │  │ Feedback Labeling API│
│                      │  │                       │
│ - Analyze logs       │  │ GET /feedback/*       │
│ - Extract examples   │  │ POST /feedback/label  │
│ - Store in SQLite    │  │ POST /feedback/*-batch│
└──────────┬───────────┘  └───────────┬───────────┘
           │                          │
           └──────────────┬───────────┘
                          │
                  ┌───────▼────────┐
                  │  SQLite DB     │
                  │  looma_ai.db   │
                  │                │
                  │ - analysis     │
                  │ - training_runs│
                  │ - model_versions
                  │ - metrics      │
                  └────────────────┘
```

## Components

### 1. Structured Logger (`structured_logger.py`)

Emits all logs as JSON for easy parsing by Vector:

```python
from structured_logger import get_structured_logger, QueryLogger

logger = get_structured_logger(__name__)

# For query operations
with QueryLogger(logger, "rag_query", request_id="abc123") as query_log:
    result = perform_query()
    query_log.log_feedback(helpful=True, metadata={"grade": 5})

# For manual logging
logger.info(
    "Operation completed",
    extra={
        "request_id": "abc123",
        "query_type": "rag_query",
        "success": True,
        "response_time_ms": 245,
    }
)
```

**JSON Output:**
```json
{
  "timestamp": "2026-04-30T12:34:56.789Z",
  "level": "INFO",
  "logger": "looma_ai.handler",
  "message": "Query completed: rag_query",
  "request_id": "abc123",
  "query_type": "rag_query",
  "response_time_ms": 245,
  "success": true
}
```

### 2. Log Analysis Worker (`analysis_worker.py`)

Runs continuously to analyze OpenSearch logs:

**Capabilities:**
- Analyzes success/failure rates by query type
- Extracts failed queries for investigation
- Identifies high-confidence training examples
- Stores analysis results in SQLite

**Running:**
```bash
# Single analysis cycle
python analysis_worker.py --mode once --hours-back 24

# Continuous mode (every 60 minutes)
python analysis_worker.py --mode continuous --interval-minutes 60
```

### 3. Feedback Labeling API (`feedback_labeling.py`)

HTTP interface for manual example labeling:

**Endpoints:**

```
GET /feedback/unlabeled?limit=20&query_type=rag_query
  Returns examples needing labels

POST /feedback/label
  Body: {"db_id": 123, "label": "good"}  # "good", "bad", or "ambiguous"
  
POST /feedback/label-batch
  Body: {
    "labels": [
      {"db_id": 123, "label": "good"},
      {"db_id": 124, "label": "bad"}
    ]
  }

GET /feedback/training-status
  Returns readiness for model retraining

GET /feedback/stats
  Returns overall labeling statistics

GET /health
  Health check
```

**Usage Example:**
```bash
# Get unlabeled examples
curl http://localhost:48888/feedback/unlabeled?limit=10

# Label an example
curl -X POST http://localhost:48888/feedback/label \
  -H "Content-Type: application/json" \
  -d '{"db_id": 42, "label": "good"}'

# Check training readiness
curl http://localhost:48888/feedback/training-status
```

### 4. Model Trainer (`model_trainer.py`)

Manages model training runs and versions:

**Features:**
- Create training runs with labeled examples
- Track training status and metrics
- Version control for models
- Activate/rollback model versions

**Database Schema:**
- `training_runs` - Training job records
- `model_versions` - Trained model versions
- `training_metrics` - Per-run metrics

### 5. Vector Configuration (`vector.toml`)

Enhanced Vector pipeline:

- **Parses JSON** from structured_logger
- **Enriches logs** with container metadata
- **Generates metrics** from log streams:
  - `looma_query_total` - Total queries by type/status
  - `looma_query_response_time_ms` - Response time gauges
  - `looma_errors_total` - Error counters by type
- **Ships to OpenSearch** for indexing by date

## Integration with looma_server.py

### Step 1: Import Structured Logger

```python
from scripts.structured_logger import get_structured_logger, QueryLogger, log_model_event

logger = get_structured_logger(__name__)
```

### Step 2: Use QueryLogger for Query Operations

```python
class MyQueryHandler(BaseHTTPRequestHandler):
    def _handle_rag_query(self, question, engine="zvec"):
        request_id = self._get_request_id()
        
        with QueryLogger(logger, "rag_query", request_id) as query_log:
            try:
                # Your query logic
                result = self.perform_rag_query(question)
                
                # Log feedback if available
                if user_feedback:
                    query_log.log_feedback(
                        helpful=user_feedback.get("helpful"),
                        metadata={
                            "engine": engine,
                            "question_length": len(question),
                        }
                    )
                
                return result
            except Exception as e:
                raise  # QueryLogger handles error logging
```

### Step 3: Add Feedback Endpoints (Optional)

```python
from scripts.feedback_labeling import FeedbackLabelingHandler

def do_GET(self):
    path = urlparse(self.path).path
    
    # Feedback endpoints
    if path.startswith("/feedback/") or path == "/health":
        return FeedbackLabelingHandler.handle_request(self)
    
    # ... existing handlers
```

## Workflow: From Logs to Improved Model

### Phase 1: Collection (Automatic)

1. Looma AI performs queries, emits structured JSON logs
2. Vector collects container logs, parses JSON, enriches with metadata
3. Vector ships to OpenSearch with date-based indexing
4. Prometheus scrapes Vector metrics for monitoring

### Phase 2: Analysis (Hourly/Daily)

```bash
# Run in analysis_worker container (automatic)
python analysis_worker.py --mode continuous
```

1. Queries OpenSearch for last 24 hours of logs
2. Analyzes success rates by query type
3. Extracts high-confidence examples
4. Stores in SQLite for review

### Phase 3: Labeling (Manual/Semi-Automatic)

```bash
# Via API
curl http://localhost:48888/feedback/unlabeled | jq

# Curator reviews and labels examples
curl -X POST http://localhost:48888/feedback/label-batch \
  -d '{"labels": [...]}' \
```

### Phase 4: Readiness Check

```bash
# Check if we have enough labeled data
curl http://localhost:48888/feedback/training-status
```

Response:
```json
{
  "readiness": {
    "rag_query": {
      "total_labeled": 250,
      "good": 200,
      "good_percentage": 80.0,
      "ready_for_training": true
    }
  }
}
```

### Phase 5: Model Retraining (Triggered When Ready)

```python
from log_analyzer import FeedbackLabeler
from model_trainer import ModelTrainer

labeler = FeedbackLabeler()
trainer = ModelTrainer()

# Get labeled examples
examples = labeler.get_labeled_examples()

# Create training run
run_name = trainer.create_training_run(
    model_type="rag_ranker",
    training_examples=examples,
    parameters={
        "learning_rate": 1e-5,
        "epochs": 5,
    }
)

# Train model (your custom logic)
trainer.start_training(run_name)
# ... training happens ...
metrics = train_model_with_examples(examples)
trainer.complete_training(run_name, metrics, checkpoint_path)

# Activate new model
trainer.activate_model(version="rag_ranker_v2")
```

## Monitoring

### Grafana Dashboards

Create dashboards to track:

1. **Query Performance**
   - Success rates by query type
   - Response time distributions
   - Error rates over time

2. **Training Progress**
   - Labeled examples count
   - Good/bad ratio
   - Training readiness by model type

3. **Model Improvements**
   - Baseline vs new model performance
   - Inference latency changes
   - Error reduction

### OpenSearch Discover

Use OpenSearch Dashboards to:
- Search logs by `request_id` to trace queries
- Filter by `error_type` to find failure patterns
- Analyze `response_time_ms` distributions
- Group by `query_type` for per-operation insights

### Metrics Exposed

Via Vector Prometheus exporter (`http://localhost:8890/metrics`):

```
# Query operations
looma_query_total{query_type="rag_query",success="true"} 1234
looma_query_total{query_type="rag_query",success="false"} 45

# Response times (gauges)
looma_query_response_time_ms{query_type="rag_query"} 245.5

# Errors
looma_errors_total{error_type="timeout",service="looma-ai"} 12
```

## Deployment

### Using Docker Compose

```bash
# Start observability stack (OpenSearch, Vector, Grafana)
cd observability
docker-compose up -d

# Analysis worker and labeling API start automatically
# Or restart if already running:
docker-compose restart looma-analysis-worker looma-feedback-labeling
```

### Logs Directory

Optional: Drop `.log` files in `observability/logs/` for direct file ingestion:
```
observability/logs/
  ├── custom_metrics.log
  ├── training_events.log
  └── ...
```

Vector will ship these to OpenSearch as well.

## Configuration Tuning

### Analysis Worker

```bash
# Adjust in observability/docker-compose.yml
environment:
  ANALYSIS_INTERVAL_MINUTES: "60"    # How often to analyze
  HOURS_BACK: "24"                   # Window for analysis
  MIN_CONFIDENCE: "0.8"              # Min score for extraction
```

### Vector

```toml
# In observability/vector/vector.toml
buffer.max_events = 10000            # Buffer size
batch.timeout = 5s                   # Flush interval
```

### OpenSearch

```yaml
# In docker-compose.yml
OPENSEARCH_JAVA_OPTS: "-Xms2g -Xmx2g"  # Memory limits
http.max_content_length: 512mb          # Max request size
```

## Troubleshooting

### No logs appearing in OpenSearch

1. Check Vector status: `docker logs looma-vector`
2. Verify connectivity: `docker exec looma-vector curl http://looma-opensearch:9200`
3. Check container names in `vector.toml` match actual service names

### Analysis worker not running

```bash
# Check logs
docker logs looma-analysis-worker

# Restart
docker-compose restart looma-analysis-worker

# Test connectivity to OpenSearch
docker exec looma-analysis-worker python -c \
  "from opensearchpy import OpenSearch; os_client = OpenSearch(...)"
```

### Feedback labeling API not responding

```bash
# Check logs
docker logs looma-feedback-labeling

# Test endpoint
curl http://localhost:48888/health
```

## Performance Expectations

- **Logging Overhead**: <1% CPU, <10MB memory per service
- **Vector Throughput**: Up to 100k logs/sec (configurable)
- **OpenSearch Indexing**: <100ms for structured logs
- **Analysis Cycle**: ~5-10 seconds for 24 hours of logs
- **Model Retraining**: Depends on model size (typically 5-30 minutes)

## Security Notes

1. **OpenSearch Dashboards**: No authentication by default (dev mode)
   - Set `DISABLE_SECURITY_DASHBOARDS_PLUGIN: "false"` for production
   
2. **Feedback API**: No auth by default
   - Implement authentication before production deployment

3. **Log Data**: Contains operational data
   - Retention: Adjust OpenSearch index lifecycle policy
   - Privacy: Don't log sensitive user information

## Next Steps

1. **Integrate with looma_server.py**
   - Import `structured_logger`
   - Wrap query handlers in `QueryLogger`
   - Test log output

2. **Deploy Stack**
   - Run `docker-compose up` in observability folder
   - Verify all services healthy

3. **Generate Test Data**
   - Run some queries through the system
   - Verify logs appear in OpenSearch

4. **Start Analysis**
   - Run `python analysis_worker.py --mode once`
   - Review extracted examples

5. **Manual Labeling**
   - Use feedback API to label examples
   - Monitor training readiness

6. **Trigger Retraining**
   - Create training run with labeled examples
   - Fine-tune your model
   - Evaluate improvements

## Support

For issues or questions:
- Check OpenSearch Dashboards for log patterns
- Review Vector metrics for throughput
- Check analysis worker logs for processing errors
- Verify database connectivity in feedback API
