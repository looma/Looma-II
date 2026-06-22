"""
Example Integration of Structured Logging into looma_server.py

This file demonstrates how to add structured logging to existing query handlers.
Copy and adapt these patterns to looma_server.py to enable the feedback loop.
"""

import sys
sys.path.insert(0, '/app/scripts')

from structured_logger import get_structured_logger, QueryLogger, log_model_event
import json

# ============================================================================
# BASIC SETUP
# ============================================================================

# At the top of looma_server.py, add:
logger = get_structured_logger(__name__)


# ============================================================================
# PATTERN 1: Simple Query Handler with Logging
# ============================================================================

def example_rag_query_handler(question: str, engine: str = "zvec"):
    """
    Example: Add logging to a RAG query handler
    """
    request_id = f"req_{hash(question)}_{id(object())}".replace('-', '_')
    
    # Wrap query in QueryLogger context manager
    with QueryLogger(logger, "rag_query", request_id) as query_log:
        # Your existing query logic
        print(f"Processing question: {question}")
        
        # Simulate query execution
        try:
            # ... your RAG query code ...
            contexts = ["Context 1", "Context 2"]
            answer = "Generated answer based on contexts"
            response_time = 245  # milliseconds
            
            # Optional: log user feedback if available
            # query_log.log_feedback(
            #     helpful=True,  # or False
            #     metadata={
            #         "engine": engine,
            #         "contexts_count": len(contexts),
            #         "answer_length": len(answer),
            #     }
            # )
            
            return {
                "answer": answer,
                "contexts": contexts,
                "request_id": request_id,
            }
        
        except Exception as e:
            # QueryLogger automatically logs the exception
            raise


# ============================================================================
# PATTERN 2: HTTP Handler Integration
# ============================================================================

class ExampleQueryHandler:
    """
    Example: Integrate logging into an existing HTTP query handler
    """
    
    def __init__(self):
        self.logger = get_structured_logger(self.__class__.__name__)
    
    def do_POST_rag_query(self):
        """
        Example POST handler for /rag_query endpoint
        """
        # Parse request
        request_id = self._extract_request_header("X-Request-ID") or self._gen_request_id()
        question = self._parse_json_body().get("question")
        engine = self._parse_json_body().get("engine", "zvec")
        
        # Use QueryLogger for structured logging
        with QueryLogger(self.logger, "rag_query", request_id) as query_log:
            try:
                # Your existing query logic
                contexts = self._search_contexts(question, engine)
                answer = self._generate_answer(question, contexts)
                
                # Log metadata about the operation
                # (stored in OpenSearch for analysis)
                query_log.log_feedback(
                    helpful=True,  # Will be set based on actual user feedback
                    metadata={
                        "engine": engine,
                        "contexts_count": len(contexts),
                        "answer_length": len(answer),
                    }
                )
                
                # Return response
                self._send_json({
                    "request_id": request_id,
                    "answer": answer,
                    "contexts": contexts,
                })
            
            except ValueError as e:
                self.logger.error(f"Invalid input: {e}", extra={
                    "request_id": request_id,
                    "query_type": "rag_query",
                    "error_type": "ValueError",
                })
                raise
            except Exception as e:
                # QueryLogger catches and logs the exception
                raise
    
    def do_POST_summary_generation(self):
        """
        Example: Summary generation with structured logging
        """
        request_id = self._gen_request_id()
        chapter_id = self._parse_json_body().get("chapter_id")
        
        with QueryLogger(self.logger, "summary_generation", request_id) as query_log:
            try:
                summary = self._generate_chapter_summary(chapter_id)
                
                query_log.log_feedback(
                    helpful=True,
                    metadata={
                        "chapter_id": chapter_id,
                        "summary_length": len(summary),
                    }
                )
                
                self._send_json({"summary": summary, "request_id": request_id})
            except Exception:
                raise
    
    # Helper methods (implement as needed)
    def _extract_request_header(self, name: str) -> str:
        return None
    
    def _gen_request_id(self) -> str:
        import uuid
        return str(uuid.uuid4())[:8]
    
    def _parse_json_body(self) -> dict:
        return {}
    
    def _search_contexts(self, question: str, engine: str) -> list:
        return []
    
    def _generate_answer(self, question: str, contexts: list) -> str:
        return ""
    
    def _generate_chapter_summary(self, chapter_id: str) -> str:
        return ""
    
    def _send_json(self, data: dict):
        pass


# ============================================================================
# PATTERN 3: Model Event Logging
# ============================================================================

def log_model_inference(model_name: str, operation: str, success: bool, metrics: dict = None):
    """
    Example: Log model inference events for monitoring
    """
    log_model_event(
        logger,
        event_type="inference",
        model_name=model_name,
        status="success" if success else "failed",
        details={
            "operation": operation,
            "metrics": metrics or {},
        }
    )


def log_model_training_event(model_name: str, phase: str, status: str, details: dict = None):
    """
    Example: Log model training events
    """
    log_model_event(
        logger,
        event_type="training",
        model_name=model_name,
        status=status,
        details={
            "phase": phase,
            **(details or {}),
        }
    )


# ============================================================================
# PATTERN 4: Error Tracking and Analysis
# ============================================================================

def handle_failed_operation(operation_type: str, error: Exception, context: dict = None):
    """
    Example: Track failed operations for later analysis
    """
    logger.error(
        f"Operation failed: {operation_type}",
        extra={
            "operation_type": operation_type,
            "error_type": type(error).__name__,
            "error_message": str(error),
            "context": context or {},
            "success": False,
        },
        exc_info=(type(error), error, error.__traceback__),
    )


# ============================================================================
# PATTERN 5: Performance Monitoring
# ============================================================================

def log_performance_metric(metric_name: str, value: float, operation: str, tags: dict = None):
    """
    Example: Log performance metrics for analysis
    """
    logger.info(
        f"Performance metric: {metric_name}",
        extra={
            "metric_name": metric_name,
            "metric_value": value,
            "operation": operation,
            "metadata": tags or {},
        }
    )


# ============================================================================
# INTEGRATION CHECKLIST
# ============================================================================

"""
To integrate this into looma_server.py:

1. Add import at the top:
   from scripts.structured_logger import get_structured_logger, QueryLogger, log_model_event
   logger = get_structured_logger(__name__)

2. For each query handler, wrap with QueryLogger:
   ✓ /rag_query
   ✓ /summary_generation
   ✓ /chapter_generation
   ✓ /keyword_extraction
   ✓ Any other inference endpoint

3. For error cases, use logger.error() with extra fields:
   - error_type: specific error classification
   - query_type: which operation failed
   - context: relevant operation data

4. For feedback collection, add an optional endpoint:
   POST /feedback
   Body: {
       "request_id": "abc123",
       "helpful": true/false,
       "feedback_text": "optional user comment"
   }
   
   Then call: query_log.log_feedback(helpful, metadata)

5. Test the integration:
   - Run a few queries
   - Check OpenSearch for logs: http://localhost:45601
   - Verify logs contain request_id, query_type, success, response_time_ms

6. Once working, analysis worker will automatically:
   - Extract training examples
   - Make them available for labeling via feedback API
   - Track model improvement opportunities

Example: How to add logging to existing endpoint

BEFORE:
    def handle_rag_query(self, question, engine):
        contexts = search(question, engine)
        answer = generate_answer(question, contexts)
        return {"answer": answer, "contexts": contexts}

AFTER:
    def handle_rag_query(self, question, engine):
        request_id = self.extract_or_generate_request_id()
        with QueryLogger(logger, "rag_query", request_id) as qlog:
            contexts = search(question, engine)
            answer = generate_answer(question, contexts)
            # Optional: log extra metadata
            qlog.log_feedback(helpful=True, metadata={"engine": engine})
            return {"answer": answer, "contexts": contexts, "request_id": request_id}

That's it! Now all these operations will:
- Emit structured JSON to stdout
- Get collected by Vector
- Shipped to OpenSearch
- Analyzed by analysis_worker
- Available for labeling and model retraining
"""
