"""
Feedback Labeling REST API Endpoint

Provides HTTP interface for manual labeling of training examples.
This can be integrated into the main looma_server.py or run as a separate service.
"""

import json
import logging
from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse
import sys
import sqlite3

sys.path.insert(0, '/app/scripts')

from structured_logger import get_structured_logger
from log_analyzer import FeedbackLabeler


logger = get_structured_logger(__name__)


class FeedbackLabelingHandler(BaseHTTPRequestHandler):
    """HTTP handler for feedback labeling operations."""

    def do_GET(self):
        """GET endpoints for viewing data."""
        path = urlparse(self.path).path
        
        if path == "/feedback/unlabeled":
            self._get_unlabeled_examples()
        elif path == "/feedback/training-status":
            self._get_training_status()
        elif path == "/feedback/stats":
            self._get_labeling_stats()
        elif path == "/health":
            self._health_check()
        else:
            self._error(404, f"Unknown endpoint: {path}")

    def do_POST(self):
        """POST endpoints for operations."""
        path = urlparse(self.path).path
        
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length)
        
        try:
            data = json.loads(body) if body else {}
        except json.JSONDecodeError:
            return self._error(400, "Invalid JSON")
        
        if path == "/feedback/label":
            self._label_example(data)
        elif path == "/feedback/label-batch":
            self._label_batch(data)
        else:
            self._error(404, f"Unknown endpoint: {path}")

    def _get_unlabeled_examples(self):
        """GET /feedback/unlabeled - Get examples needing labels."""
        try:
            query_type = self._get_query_param("query_type")
            limit = int(self._get_query_param("limit", "20"))
            
            labeler = FeedbackLabeler()
            examples = labeler.get_unlabeled_examples(limit=limit)
            
            # Filter by query_type if specified
            if query_type:
                examples = [e for e in examples if e["query_type"] == query_type]
            
            response = {
                "status": "success",
                "count": len(examples),
                "examples": examples,
            }
            
            self._send_json(response)
        except Exception as e:
            logger.error(f"Failed to get unlabeled examples: {e}")
            self._error(500, str(e))

    def _label_example(self, data: dict):
        """POST /feedback/label - Label a single example."""
        try:
            db_id = data.get("db_id")
            label = data.get("label")
            
            if not db_id or not label:
                return self._error(400, "Missing db_id or label")
            
            if label not in {"good", "bad", "ambiguous"}:
                return self._error(400, f"Invalid label: {label}")
            
            labeler = FeedbackLabeler()
            success = labeler.label_example(db_id, label)
            
            if success:
                logger.info(f"Labeled example {db_id} as {label}")
                self._send_json({"status": "success", "db_id": db_id, "label": label})
            else:
                self._error(404, f"Example not found: {db_id}")
        
        except Exception as e:
            logger.error(f"Failed to label example: {e}")
            self._error(500, str(e))

    def _label_batch(self, data: dict):
        """POST /feedback/label-batch - Label multiple examples."""
        try:
            labels = data.get("labels", [])
            if not isinstance(labels, list):
                return self._error(400, "labels must be an array")
            
            labeler = FeedbackLabeler()
            results = []
            
            for item in labels:
                db_id = item.get("db_id")
                label = item.get("label")
                
                if not db_id or not label:
                    results.append({"db_id": db_id, "success": False, "error": "missing fields"})
                    continue
                
                if label not in {"good", "bad", "ambiguous"}:
                    results.append({"db_id": db_id, "success": False, "error": "invalid label"})
                    continue
                
                success = labeler.label_example(db_id, label)
                results.append({"db_id": db_id, "success": success, "label": label})
                
                if success:
                    logger.info(f"Labeled example {db_id} as {label}")
            
            self._send_json({
                "status": "success",
                "total": len(labels),
                "results": results,
            })
        
        except Exception as e:
            logger.error(f"Failed to batch label examples: {e}")
            self._error(500, str(e))

    def _get_training_status(self):
        """GET /feedback/training-status - Get training readiness."""
        try:
            labeler = FeedbackLabeler()
            examples = labeler.get_labeled_examples(limit=5000)
            
            # Group by query_type
            by_type = {}
            for example in examples:
                qtype = example.get("query_type", "unknown")
                if qtype not in by_type:
                    by_type[qtype] = {"good": 0, "bad": 0, "ambiguous": 0, "total": 0}
                label = example.get("label", "ambiguous")
                by_type[qtype][label] += 1
                by_type[qtype]["total"] += 1
            
            # Calculate readiness
            readiness = {}
            for qtype, counts in by_type.items():
                good_pct = (counts["good"] / counts["total"] * 100) if counts["total"] > 0 else 0
                readiness[qtype] = {
                    **counts,
                    "good_percentage": good_pct,
                    "ready_for_training": counts["total"] >= 50 and good_pct >= 70,
                }
            
            self._send_json({
                "status": "success",
                "readiness": readiness,
            })
        
        except Exception as e:
            logger.error(f"Failed to get training status: {e}")
            self._error(500, str(e))

    def _get_labeling_stats(self):
        """GET /feedback/stats - Get labeling statistics."""
        try:
            conn = sqlite3.connect("/app/data/looma_ai.db")
            cursor = conn.cursor()
            
            # Get overall stats
            cursor.execute("SELECT COUNT(*) FROM training_examples WHERE labeled = 1")
            total_labeled = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM training_examples WHERE labeled = 0")
            total_unlabeled = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM training_examples")
            total = cursor.fetchone()[0]
            
            # Get stats by label
            cursor.execute(
                "SELECT label, COUNT(*) FROM training_examples WHERE labeled = 1 GROUP BY label"
            )
            by_label = {row[0]: row[1] for row in cursor.fetchall()}
            
            conn.close()
            
            self._send_json({
                "status": "success",
                "total_examples": total,
                "labeled": total_labeled,
                "unlabeled": total_unlabeled,
                "by_label": by_label,
                "completion_percentage": (total_labeled / total * 100) if total > 0 else 0,
            })
        
        except Exception as e:
            logger.error(f"Failed to get labeling stats: {e}")
            self._error(500, str(e))

    def _health_check(self):
        """GET /health - Health check."""
        try:
            conn = sqlite3.connect("/app/data/looma_ai.db")
            conn.execute("SELECT 1")
            conn.close()
            
            self._send_json({"status": "healthy"})
        except Exception as e:
            self._error(503, str(e))

    def _get_query_param(self, name: str, default: str = None) -> str:
        """Extract query parameter."""
        query = urlparse(self.path).query
        params = parse_qs(query)
        value = params.get(name, [default])
        return value[0] if value else default

    def _send_json(self, data: dict, status_code: int = 200):
        """Send JSON response."""
        response = json.dumps(data).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", len(response))
        self.end_headers()
        self.wfile.write(response)

    def _error(self, status_code: int, message: str):
        """Send error response."""
        self._send_json({"status": "error", "message": message}, status_code)

    def log_message(self, format, *args):
        """Override to use structured logger."""
        logger.info(format % args)


# Utility function to integrate into looma_server.py
def add_feedback_endpoints_to_server(server_instance):
    """
    Add feedback labeling endpoints to existing HTTP server.
    
    Usage in looma_server.py:
        from feedback_labeling import add_feedback_endpoints_to_server
        # In your request handler:
        if path.startswith('/feedback/') or path == '/health':
            handler = FeedbackLabelingHandler(request, client_address, server_instance)
    """
    pass


if __name__ == "__main__":
    import argparse
    from http.server import HTTPServer
    
    parser = argparse.ArgumentParser(description="Feedback Labeling API Server")
    parser.add_argument("--port", type=int, default=8888, help="Port to listen on")
    parser.add_argument("--host", default="0.0.0.0", help="Host to bind to")
    
    args = parser.parse_args()
    
    server = HTTPServer((args.host, args.port), FeedbackLabelingHandler)
    logger.info(f"Starting Feedback Labeling API on {args.host}:{args.port}")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        logger.info("Server stopped")
        server.shutdown()
