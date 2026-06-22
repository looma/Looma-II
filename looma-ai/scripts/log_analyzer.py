"""
Log Analysis and Feedback Extraction Pipeline

Processes OpenSearch logs to:
1. Identify patterns of success and failure
2. Extract high-quality training examples
3. Generate feedback for model retraining
"""

import json
import logging
from typing import List, Dict, Any, Tuple
from datetime import datetime, timedelta
from collections import defaultdict
import sqlite3

logger = logging.getLogger(__name__)


class LogAnalyzer:
    """Analyzes logs from OpenSearch to extract training feedback."""

    def __init__(self, opensearch_client, db_path: str = None):
        self.os_client = opensearch_client
        self.db_path = db_path or "/app/data/looma_ai.db"

    def analyze_query_logs(
        self,
        hours_back: int = 24,
        min_samples: int = 10,
    ) -> Dict[str, Any]:
        """
        Analyze query logs from the past N hours.
        
        Returns patterns of success/failure by query type.
        """
        search_body = {
            "query": {
                "range": {
                    "timestamp": {
                        "gte": f"now-{hours_back}h"
                    }
                }
            },
            "aggs": {
                "by_query_type": {
                    "terms": {
                        "field": "query_type.keyword",
                        "size": 100,
                    },
                    "aggs": {
                        "success_rate": {
                            "avg": {
                                "field": "success"
                            }
                        },
                        "avg_response_time": {
                            "avg": {
                                "field": "response_time_ms"
                            }
                        },
                        "error_types": {
                            "terms": {
                                "field": "error_type.keyword",
                                "size": 10
                            }
                        }
                    }
                }
            },
            "size": 0
        }

        try:
            response = self.os_client.search(index="looma-logs-*", body=search_body)
            
            results = {}
            for bucket in response["aggregations"]["by_query_type"]["buckets"]:
                query_type = bucket["key"]
                doc_count = bucket["doc_count"]
                
                if doc_count < min_samples:
                    continue
                
                success_rate = bucket["success_rate"]["value"] or 0
                avg_response_time = bucket["avg_response_time"]["value"] or 0
                
                results[query_type] = {
                    "doc_count": doc_count,
                    "success_rate": success_rate,
                    "avg_response_time_ms": avg_response_time,
                    "error_types": [
                        (e["key"], e["doc_count"])
                        for e in bucket["error_types"]["buckets"]
                    ],
                    "priority": self._calculate_priority(success_rate, doc_count),
                }
            
            return results
        except Exception as e:
            logger.error(f"Failed to analyze query logs: {e}")
            return {}

    def extract_failed_queries(
        self,
        hours_back: int = 24,
        limit: int = 100,
    ) -> List[Dict[str, Any]]:
        """Extract recent failed queries for analysis."""
        search_body = {
            "query": {
                "bool": {
                    "must": [
                        {"match": {"success": False}},
                        {"range": {"timestamp": {"gte": f"now-{hours_back}h"}}}
                    ]
                }
            },
            "sort": [{"timestamp": {"order": "desc"}}],
            "size": limit
        }

        try:
            response = self.os_client.search(index="looma-logs-*", body=search_body)
            return [hit["_source"] for hit in response["hits"]["hits"]]
        except Exception as e:
            logger.error(f"Failed to extract failed queries: {e}")
            return []

    def extract_training_examples(
        self,
        hours_back: int = 24,
        min_confidence: float = 0.8,
    ) -> List[Dict[str, Any]]:
        """
        Extract high-confidence training examples from successful queries.
        
        Returns structured examples with:
        - query/question
        - context
        - answer
        - confidence score
        - metadata (grade, subject, language, etc.)
        """
        search_body = {
            "query": {
                "bool": {
                    "must": [
                        {"match": {"success": True}},
                        {"range": {"response_time_ms": {"lte": 2000}}},  # Quick responses
                        {"range": {"timestamp": {"gte": f"now-{hours_back}h"}}}
                    ]
                }
            },
            "sort": [{"response_time_ms": {"order": "asc"}}],
            "size": 1000
        }

        try:
            response = self.os_client.search(index="looma-logs-*", body=search_body)
            
            examples = []
            for hit in response["hits"]["hits"]:
                doc = hit["_source"]
                
                # Only include logs with complete metadata
                if not all(k in doc for k in ["message", "query_type", "request_id"]):
                    continue
                
                example = {
                    "request_id": doc["request_id"],
                    "query_type": doc["query_type"],
                    "message": doc["message"],
                    "response_time_ms": doc.get("response_time_ms", 0),
                    "metadata": doc.get("metadata", {}),
                    "confidence": min(1.0, 1.0 - (doc.get("response_time_ms", 0) / 5000)),
                }
                
                if example["confidence"] >= min_confidence:
                    examples.append(example)
            
            return examples
        except Exception as e:
            logger.error(f"Failed to extract training examples: {e}")
            return []

    @staticmethod
    def _calculate_priority(success_rate: float, doc_count: int) -> float:
        """Calculate priority for model improvement based on metrics."""
        # Lower success rate = higher priority
        # Higher volume = higher priority
        success_priority = (1.0 - success_rate) * 100
        volume_priority = min(doc_count / 1000.0, 1.0) * 50
        return success_priority + volume_priority


class FeedbackLabeler:
    """Generates and stores feedback labels from log analysis."""

    def __init__(self, db_path: str = None):
        self.db_path = db_path or "/app/data/looma_ai.db"
        self._ensure_tables()

    def _ensure_tables(self):
        """Ensure feedback tables exist."""
        conn = sqlite3.connect(self.db_path)
        try:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS log_analysis (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    analysis_date TEXT NOT NULL,
                    query_type TEXT NOT NULL,
                    success_rate REAL,
                    doc_count INTEGER,
                    priority REAL,
                    avg_response_time_ms REAL,
                    error_summary TEXT,  -- JSON
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP
                )
                """
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS training_examples (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    request_id TEXT UNIQUE,
                    query_type TEXT,
                    extracted_from_logs BOOLEAN DEFAULT 1,
                    example_data TEXT NOT NULL,  -- JSON
                    confidence REAL,
                    labeled BOOLEAN DEFAULT 0,
                    label TEXT,  -- "good", "bad", "ambiguous"
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP
                )
                """
            )
            conn.commit()
        finally:
            conn.close()

    def store_analysis(
        self,
        analysis_results: Dict[str, Any],
    ) -> int:
        """Store analysis results for future reference."""
        conn = sqlite3.connect(self.db_path)
        try:
            for query_type, metrics in analysis_results.items():
                conn.execute(
                    """
                    INSERT INTO log_analysis 
                    (analysis_date, query_type, success_rate, doc_count, priority, avg_response_time_ms, error_summary)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        datetime.utcnow().isoformat(),
                        query_type,
                        metrics.get("success_rate", 0),
                        metrics.get("doc_count", 0),
                        metrics.get("priority", 0),
                        metrics.get("avg_response_time_ms", 0),
                        json.dumps(metrics.get("error_types", [])),
                    )
                )
            conn.commit()
            return conn.total_changes
        finally:
            conn.close()

    def store_training_examples(
        self,
        examples: List[Dict[str, Any]],
    ) -> int:
        """Store extracted examples for model training."""
        conn = sqlite3.connect(self.db_path)
        try:
            for example in examples:
                try:
                    conn.execute(
                        """
                        INSERT OR IGNORE INTO training_examples
                        (request_id, query_type, example_data, confidence)
                        VALUES (?, ?, ?, ?)
                        """,
                        (
                            example.get("request_id"),
                            example.get("query_type"),
                            json.dumps(example),
                            example.get("confidence", 0.0),
                        )
                    )
                except sqlite3.IntegrityError:
                    pass  # Duplicate request_id
            
            conn.commit()
            return conn.total_changes
        finally:
            conn.close()

    def get_unlabeled_examples(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Get examples that need human labeling."""
        conn = sqlite3.connect(self.db_path)
        try:
            cursor = conn.execute(
                """
                SELECT id, request_id, query_type, example_data, confidence
                FROM training_examples
                WHERE labeled = 0 AND confidence >= 0.8
                ORDER BY confidence DESC
                LIMIT ?
                """,
                (limit,)
            )
            
            examples = []
            for row in cursor.fetchall():
                examples.append({
                    "db_id": row[0],
                    "request_id": row[1],
                    "query_type": row[2],
                    "data": json.loads(row[3]),
                    "confidence": row[4],
                })
            
            return examples
        finally:
            conn.close()

    def label_example(self, db_id: int, label: str) -> bool:
        """Store a human label for an example."""
        if label not in {"good", "bad", "ambiguous"}:
            logger.warning(f"Invalid label: {label}")
            return False
        
        conn = sqlite3.connect(self.db_path)
        try:
            conn.execute(
                """
                UPDATE training_examples
                SET labeled = 1, label = ?
                WHERE id = ?
                """,
                (label, db_id)
            )
            conn.commit()
            return conn.total_changes > 0
        finally:
            conn.close()

    def get_labeled_examples(self, limit: int = 1000) -> List[Dict[str, Any]]:
        """Get all labeled examples for training."""
        conn = sqlite3.connect(self.db_path)
        try:
            cursor = conn.execute(
                """
                SELECT request_id, query_type, example_data, label
                FROM training_examples
                WHERE labeled = 1
                ORDER BY created_at DESC
                LIMIT ?
                """,
                (limit,)
            )
            
            examples = []
            for row in cursor.fetchall():
                examples.append({
                    "request_id": row[0],
                    "query_type": row[1],
                    "data": json.loads(row[2]),
                    "label": row[3],
                })
            
            return examples
        finally:
            conn.close()
