"""
Model Retraining and Fine-tuning Pipeline

Processes labeled training examples to improve model performance.
Integrates with OpenSearch for tracking training runs.
"""

import json
import logging
import sqlite3
from typing import List, Dict, Any, Optional
from datetime import datetime
import hashlib

logger = logging.getLogger(__name__)


class ModelTrainer:
    """Manages model training and retraining with feedback data."""

    def __init__(self, db_path: str = None):
        self.db_path = db_path or "/app/data/looma_ai.db"
        self._ensure_tables()

    def _ensure_tables(self):
        """Ensure training tables exist."""
        conn = sqlite3.connect(self.db_path)
        try:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS training_runs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    run_name TEXT UNIQUE NOT NULL,
                    model_type TEXT NOT NULL,
                    training_examples INTEGER,
                    labeled_good_count INTEGER,
                    labeled_bad_count INTEGER,
                    parameters TEXT,  -- JSON
                    metrics TEXT,  -- JSON
                    status TEXT DEFAULT 'pending',  -- pending, running, completed, failed
                    error_message TEXT,
                    checkpoint_path TEXT,
                    started_at TEXT,
                    completed_at TEXT,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP
                )
                """
            )
            
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS model_versions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    version TEXT UNIQUE NOT NULL,
                    model_type TEXT NOT NULL,
                    training_run_id INTEGER,
                    model_path TEXT,
                    is_active BOOLEAN DEFAULT 0,
                    performance_score REAL,
                    improvement_pct REAL,  -- vs previous version
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(training_run_id) REFERENCES training_runs(id)
                )
                """
            )
            
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS training_metrics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    training_run_id INTEGER NOT NULL,
                    metric_name TEXT NOT NULL,
                    metric_value REAL,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(training_run_id) REFERENCES training_runs(id)
                )
                """
            )
            
            conn.commit()
        finally:
            conn.close()

    def create_training_run(
        self,
        model_type: str,
        training_examples: List[Dict[str, Any]],
        parameters: Dict[str, Any] = None,
    ) -> str:
        """
        Create a new training run.
        
        Args:
            model_type: Type of model to train (e.g., "rag_ranker", "summary_generator")
            training_examples: List of labeled examples
            parameters: Training hyperparameters
        
        Returns:
            run_name for tracking
        """
        # Count examples by label
        good_count = sum(1 for e in training_examples if e.get("label") == "good")
        bad_count = sum(1 for e in training_examples if e.get("label") == "bad")
        
        if good_count < 5:
            logger.warning(f"Not enough good examples ({good_count}) for training run")
            return None
        
        # Generate run name
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        run_name = f"{model_type}_{timestamp}"
        
        conn = sqlite3.connect(self.db_path)
        try:
            conn.execute(
                """
                INSERT INTO training_runs
                (run_name, model_type, training_examples, labeled_good_count, labeled_bad_count, parameters, status)
                VALUES (?, ?, ?, ?, ?, ?, 'pending')
                """,
                (
                    run_name,
                    model_type,
                    len(training_examples),
                    good_count,
                    bad_count,
                    json.dumps(parameters or {}),
                )
            )
            conn.commit()
            logger.info(f"Created training run: {run_name}")
            return run_name
        finally:
            conn.close()

    def start_training(self, run_name: str) -> bool:
        """Mark training as started."""
        conn = sqlite3.connect(self.db_path)
        try:
            conn.execute(
                """
                UPDATE training_runs
                SET status = 'running', started_at = ?
                WHERE run_name = ?
                """,
                (datetime.utcnow().isoformat(), run_name)
            )
            conn.commit()
            return conn.total_changes > 0
        finally:
            conn.close()

    def complete_training(
        self,
        run_name: str,
        metrics: Dict[str, float],
        checkpoint_path: str = None,
    ) -> bool:
        """Mark training as completed and store metrics."""
        conn = sqlite3.connect(self.db_path)
        try:
            # Update run status
            conn.execute(
                """
                UPDATE training_runs
                SET status = 'completed', completed_at = ?, checkpoint_path = ?, metrics = ?
                WHERE run_name = ?
                """,
                (
                    datetime.utcnow().isoformat(),
                    checkpoint_path,
                    json.dumps(metrics),
                    run_name
                )
            )
            
            # Store individual metrics
            run_id = self._get_run_id(conn, run_name)
            if run_id:
                for metric_name, metric_value in metrics.items():
                    conn.execute(
                        """
                        INSERT INTO training_metrics
                        (training_run_id, metric_name, metric_value)
                        VALUES (?, ?, ?)
                        """,
                        (run_id, metric_name, metric_value)
                    )
            
            conn.commit()
            logger.info(f"Completed training run: {run_name}")
            return conn.total_changes > 0
        finally:
            conn.close()

    def fail_training(self, run_name: str, error_message: str) -> bool:
        """Mark training as failed."""
        conn = sqlite3.connect(self.db_path)
        try:
            conn.execute(
                """
                UPDATE training_runs
                SET status = 'failed', error_message = ?, completed_at = ?
                WHERE run_name = ?
                """,
                (error_message, datetime.utcnow().isoformat(), run_name)
            )
            conn.commit()
            logger.error(f"Training run failed: {run_name} - {error_message}")
            return conn.total_changes > 0
        finally:
            conn.close()

    def register_model_version(
        self,
        version: str,
        model_type: str,
        training_run_id: int,
        model_path: str,
        performance_score: float,
        improvement_pct: float = None,
    ) -> bool:
        """Register a new model version."""
        conn = sqlite3.connect(self.db_path)
        try:
            conn.execute(
                """
                INSERT INTO model_versions
                (version, model_type, training_run_id, model_path, performance_score, improvement_pct)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (version, model_type, training_run_id, model_path, performance_score, improvement_pct)
            )
            conn.commit()
            logger.info(f"Registered model version: {version}")
            return conn.total_changes > 0
        finally:
            conn.close()

    def activate_model(self, version: str) -> bool:
        """Activate a specific model version (deactivate others)."""
        conn = sqlite3.connect(self.db_path)
        try:
            # Get model type
            cursor = conn.execute(
                "SELECT model_type FROM model_versions WHERE version = ?",
                (version,)
            )
            row = cursor.fetchone()
            if not row:
                logger.error(f"Model version not found: {version}")
                return False
            
            model_type = row[0]
            
            # Deactivate other versions of the same type
            conn.execute(
                """
                UPDATE model_versions
                SET is_active = 0
                WHERE model_type = ? AND version != ?
                """,
                (model_type, version)
            )
            
            # Activate this version
            conn.execute(
                """
                UPDATE model_versions
                SET is_active = 1
                WHERE version = ?
                """,
                (version,)
            )
            
            conn.commit()
            logger.info(f"Activated model version: {version}")
            return conn.total_changes > 0
        finally:
            conn.close()

    def get_active_model(self, model_type: str) -> Optional[Dict[str, Any]]:
        """Get the currently active model version for a type."""
        conn = sqlite3.connect(self.db_path)
        try:
            cursor = conn.execute(
                """
                SELECT version, model_path, performance_score, created_at
                FROM model_versions
                WHERE model_type = ? AND is_active = 1
                ORDER BY created_at DESC
                LIMIT 1
                """,
                (model_type,)
            )
            row = cursor.fetchone()
            if not row:
                return None
            
            return {
                "version": row[0],
                "path": row[1],
                "performance_score": row[2],
                "created_at": row[3],
            }
        finally:
            conn.close()

    def get_training_status(self, run_name: str) -> Optional[Dict[str, Any]]:
        """Get the status of a training run."""
        conn = sqlite3.connect(self.db_path)
        try:
            cursor = conn.execute(
                """
                SELECT status, training_examples, labeled_good_count, labeled_bad_count, 
                       metrics, started_at, completed_at, error_message
                FROM training_runs
                WHERE run_name = ?
                """,
                (run_name,)
            )
            row = cursor.fetchone()
            if not row:
                return None
            
            return {
                "run_name": run_name,
                "status": row[0],
                "training_examples": row[1],
                "labeled_good": row[2],
                "labeled_bad": row[3],
                "metrics": json.loads(row[4]) if row[4] else {},
                "started_at": row[5],
                "completed_at": row[6],
                "error_message": row[7],
            }
        finally:
            conn.close()

    def get_recent_training_runs(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get recent training runs."""
        conn = sqlite3.connect(self.db_path)
        try:
            cursor = conn.execute(
                """
                SELECT run_name, model_type, status, training_examples, labeled_good_count, 
                       labeled_bad_count, metrics, completed_at
                FROM training_runs
                ORDER BY created_at DESC
                LIMIT ?
                """,
                (limit,)
            )
            
            runs = []
            for row in cursor.fetchall():
                runs.append({
                    "run_name": row[0],
                    "model_type": row[1],
                    "status": row[2],
                    "training_examples": row[3],
                    "labeled_good": row[4],
                    "labeled_bad": row[5],
                    "metrics": json.loads(row[6]) if row[6] else {},
                    "completed_at": row[7],
                })
            
            return runs
        finally:
            conn.close()

    @staticmethod
    def _get_run_id(conn, run_name: str) -> Optional[int]:
        """Get run ID by name."""
        cursor = conn.execute(
            "SELECT id FROM training_runs WHERE run_name = ?",
            (run_name,)
        )
        row = cursor.fetchone()
        return row[0] if row else None
