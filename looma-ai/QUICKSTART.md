# Quick Start: Feedback Loop Implementation

## 5-Minute Setup

### 1. Update Docker Compose (Already Done ✓)
- Added `looma-analysis-worker` service
- Added `looma-feedback-labeling` service
- Updated Vector config

### 2. Deploy Stack

```bash
# From Looma project root
cd Looma/observability

# Start services (if not running)
docker-compose up -d

# Verify all healthy
docker-compose ps
# All should show "healthy" or "Up"
```

### 3. Verify Integration

```bash
# Check OpenSearch
curl http://localhost:49200/_cat/health

# Check Vector
curl http://localhost:8686/health

# Check Feedback API
curl http://localhost:48888/health

# Check analysis worker logs
docker logs looma-analysis-worker
```

### 4. Generate Test Data

Send some queries to looma-ai:
```bash
curl -X POST http://localhost:8089/rag_query \
  -H "Content-Type: application/json" \
  -d '{"question": "What is the capital of Nepal?"}'
```

Wait 30 seconds, then check:
```bash
# Verify logs in OpenSearch
curl "http://localhost:49200/looma-logs-*/_count"
# Should show count > 0

# Check logs in Dashboards
# Visit: http://localhost:45601
# Click "Discover" and select "looma-logs-*" index
```

### 5. Extract Training Examples

```bash
# Run analysis cycle
docker exec looma-analysis-worker python analysis_worker.py --mode once

# Check extracted examples
curl http://localhost:48888/feedback/unlabeled?limit=5
```

### 6. Label Examples

```bash
# Get unlabeled examples
EXAMPLES=$(curl -s http://localhost:48888/feedback/unlabeled?limit=5)

# Label one as good
curl -X POST http://localhost:48888/feedback/label \
  -H "Content-Type: application/json" \
  -d '{"db_id": 1, "label": "good"}'

# Check stats
curl http://localhost:48888/feedback/stats
```

### 7. Check Training Readiness

```bash
curl http://localhost:48888/feedback/training-status
# When ready_for_training=true, can trigger model retraining
```

## Architecture Summary

```
Your App → Structured Logs → Vector → OpenSearch → Analysis/Labeling → Retraining
           (JSON via stdout)  (ships)   (indexes)   (HTTP API)       (model)
```

## File Changes Made

### New Files Created:
- `looma-ai/scripts/structured_logger.py` - Structured logging framework
- `looma-ai/scripts/log_analyzer.py` - Log analysis and feedback extraction
- `looma-ai/scripts/model_trainer.py` - Model training pipeline
- `looma-ai/scripts/analysis_worker.py` - Continuous analysis worker
- `looma-ai/scripts/feedback_labeling.py` - Feedback HTTP API
- `looma-ai/scripts/integration_example.py` - Integration examples
- `looma-ai/FEEDBACK_LOOP_GUIDE.md` - Full documentation

### Modified Files:
- `observability/docker-compose.yml` - Added 2 new services
- `observability/vector/vector.toml` - Enhanced JSON parsing and metrics
- `looma-ai/requirements.txt` - Added opensearch-py dependency

## Integration with Your Code

### Step 1: Update looma_server.py

At the top:
```python
from scripts.structured_logger import get_structured_logger, QueryLogger

logger = get_structured_logger(__name__)
```

### Step 2: Wrap Query Handlers

Example with existing handler:
```python
def handle_rag_query(self, question, engine="zvec"):
    request_id = self.get_request_id()
    
    # Add this wrapper
    with QueryLogger(logger, "rag_query", request_id) as query_log:
        # Your existing code
        contexts = self.search(question, engine)
        answer = self.generate_answer(question, contexts)
        
        # Optional: log metadata
        query_log.log_feedback(helpful=True, metadata={
            "engine": engine,
            "num_contexts": len(contexts),
        })
        
        return {"answer": answer}
```

That's it! Now all queries will:
- Emit JSON logs
- Get shipped to OpenSearch
- Be analyzed for patterns
- Be available for feedback labeling
- Enable model improvement

### Step 3: Deploy

```bash
# Rebuild looma-ai
docker-compose up --build -d looma-ai

# Test a query
curl http://localhost:8089/rag_query -d '{"question":"test"}'

# Verify logs appear
curl "http://localhost:49200/looma-logs-*/search" -d '{"query":{"match_all":{}}}'
```

## Monitoring via Web UIs

1. **OpenSearch Dashboards** (Logs & Analysis)
   - http://localhost:45601
   - Discover → Select `looma-logs-*` index
   - View structured logs in real-time

2. **Grafana** (Metrics & Dashboards)
   - http://localhost:43000
   - Username: admin / Password: admin
   - View query performance metrics

3. **Feedback API** (Manual Labeling)
   - http://localhost:48888/feedback/stats
   - http://localhost:48888/feedback/unlabeled
   - http://localhost:48888/feedback/training-status

## Common Commands

```bash
# View latest logs (tail -f)
docker logs -f looma-analysis-worker

# Run analysis immediately
docker exec looma-analysis-worker \
  python analysis_worker.py --mode once

# Get unlabeled examples
curl http://localhost:48888/feedback/unlabeled?limit=10 | jq

# Label batch of examples
curl -X POST http://localhost:48888/feedback/label-batch \
  -H "Content-Type: application/json" \
  -d @- << 'EOF'
{
  "labels": [
    {"db_id": 1, "label": "good"},
    {"db_id": 2, "label": "bad"},
    {"db_id": 3, "label": "good"}
  ]
}
EOF

# Check training readiness
curl http://localhost:48888/feedback/training-status | jq

# Query OpenSearch
curl "http://localhost:49200/looma-logs-*/_search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": {
      "match": {"query_type": "rag_query"}
    }
  }' | jq
```

## Performance Expectations

- **Log overhead**: <1% CPU
- **Analysis cycle**: ~5-10 sec for 24hrs of logs
- **Vector throughput**: 100k logs/sec (headroom)
- **OpenSearch indexing**: <100ms per batch

## Next: Custom Model Training

Once you have labeled examples, create a training script:

```python
from log_analyzer import FeedbackLabeler
from model_trainer import ModelTrainer

# Get labeled examples
labeler = FeedbackLabeler()
examples = labeler.get_labeled_examples()

# Create training run
trainer = ModelTrainer()
run_name = trainer.create_training_run("rag_ranker", examples)
trainer.start_training(run_name)

# Train your model...
metrics = fine_tune_rag_ranker(examples)

# Log results
trainer.complete_training(run_name, metrics, "/app/model_v2.ckpt")
trainer.activate_model("rag_ranker_v2")
```

## Debugging

### Check if logs reach OpenSearch
```bash
curl "http://localhost:49200/looma-logs-*/_count" \
  -H "Content-Type: application/json" \
  -d '{"query":{"match_all":{}}}'
```

### View raw logs
```bash
docker logs looma-ai | head -20
```

### Test Vector directly
```bash
# Vector API status
curl http://localhost:8686/health

# Vector metrics
curl http://localhost:8889/metrics | grep looma_query_total
```

### Check database
```bash
docker exec looma-feedback-labeling \
  sqlite3 /app/data/looma_ai.db \
  "SELECT COUNT(*) FROM training_examples"
```

## Success Indicators

✓ Logs appear in OpenSearch within 30 seconds
✓ Training examples extracted automatically
✓ Feedback API returns unlabeled examples
✓ Model versions can be tracked
✓ Metrics appear in Grafana

## Support & Documentation

- Full guide: `looma-ai/FEEDBACK_LOOP_GUIDE.md`
- Examples: `looma-ai/scripts/integration_example.py`
- API docs: `looma-ai/scripts/feedback_labeling.py` (docstrings)
