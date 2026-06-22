"""
Structured logging for Looma AI with OpenSearch/Vector integration.

Logs are emitted as JSON to stdout for Vector to collect and send to OpenSearch.
"""

import json
import logging
import sys
import time
from typing import Any, Dict, Optional
from datetime import datetime


class StructuredFormatter(logging.Formatter):
    """Emit logs as JSON for Vector/OpenSearch."""

    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        # OpenTelemetry logging instrumentation (if enabled) injects these
        # fields into the LogRecord; include them for log/trace correlation.
        if hasattr(record, "otelTraceID"):
            log_data["trace_id"] = record.otelTraceID
        if hasattr(record, "otelSpanID"):
            log_data["span_id"] = record.otelSpanID
        if hasattr(record, "otelTraceSampled"):
            log_data["trace_sampled"] = record.otelTraceSampled

        # Add custom fields if present
        if hasattr(record, "request_id"):
            log_data["request_id"] = record.request_id
        if hasattr(record, "user_id"):
            log_data["user_id"] = record.user_id
        if hasattr(record, "query_type"):
            log_data["query_type"] = record.query_type
        if hasattr(record, "response_time_ms"):
            log_data["response_time_ms"] = record.response_time_ms
        if hasattr(record, "success"):
            log_data["success"] = record.success
        if hasattr(record, "error_type"):
            log_data["error_type"] = record.error_type
        if hasattr(record, "metadata"):
            log_data["metadata"] = record.metadata

        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_data, default=str)


def get_structured_logger(name: str) -> logging.Logger:
    """Get a logger that emits structured JSON logs."""
    logger = logging.getLogger(name)
    
    # Only configure if not already done
    if not logger.handlers:
        logger.setLevel(logging.DEBUG)
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(StructuredFormatter())
        logger.addHandler(handler)
        logger.propagate = False
    
    return logger


class QueryLogger:
    """Context manager for logging query execution with metrics."""

    def __init__(self, logger: logging.Logger, query_type: str, request_id: str = None):
        self.logger = logger
        self.query_type = query_type
        self.request_id = request_id or self._gen_request_id()
        self.start_time = None
        self.response_time_ms = None

    @staticmethod
    def _gen_request_id():
        import uuid
        return str(uuid.uuid4())[:8]

    def __enter__(self):
        self.start_time = time.time()
        self.logger.info(
            f"Query started: {self.query_type}",
            extra={
                "request_id": self.request_id,
                "query_type": self.query_type,
            }
        )
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.response_time_ms = (time.time() - self.start_time) * 1000
        
        if exc_type is not None:
            self.logger.error(
                f"Query failed: {self.query_type}",
                extra={
                    "request_id": self.request_id,
                    "query_type": self.query_type,
                    "response_time_ms": self.response_time_ms,
                    "success": False,
                    "error_type": exc_type.__name__,
                },
                exc_info=(exc_type, exc_val, exc_tb),
            )
        else:
            self.logger.info(
                f"Query completed: {self.query_type}",
                extra={
                    "request_id": self.request_id,
                    "query_type": self.query_type,
                    "response_time_ms": self.response_time_ms,
                    "success": True,
                }
            )

    def log_feedback(self, helpful: bool, metadata: Dict[str, Any] = None):
        """Log user feedback for this query."""
        self.logger.info(
            f"Query feedback received",
            extra={
                "request_id": self.request_id,
                "query_type": self.query_type,
                "success": helpful,
                "metadata": metadata or {},
            }
        )


def log_model_event(
    logger: logging.Logger,
    event_type: str,
    model_name: str,
    status: str,
    details: Dict[str, Any] = None,
):
    """Log model training/inference events."""
    logger.info(
        f"Model event: {event_type}",
        extra={
            "event_type": event_type,
            "model_name": model_name,
            "status": status,
            "metadata": details or {},
        }
    )
