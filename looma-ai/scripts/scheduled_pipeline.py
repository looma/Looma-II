#!/usr/bin/env python3
"""
Scheduled Model Improvement Pipeline

Automated workflow that:
1. Analyzes logs from OpenSearch
2. Extracts training examples
3. Tracks training readiness
4. Triggers model retraining when ready
5. Logs all events for monitoring

Run this as a scheduled task (e.g., via cron or docker-compose)
"""

import argparse
import json
import logging
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional

sys.path.insert(0, '/app/scripts')

from structured_logger import get_structured_logger, log_model_event
from log_analyzer import LogAnalyzer, FeedbackLabeler
from model_trainer import ModelTrainer


logger = get_structured_logger(__name__)


class ModelImprovementPipeline:
    """Automated pipeline for continuous model improvement."""

    def __init__(
        self,
        opensearch_url: str = "http://looma-opensearch:9200",
        db_path: str = "/app/data/looma_ai.db",
        config_path: Optional[str] = None,
    ):
        self.opensearch_url = opensearch_url
        self.db_path = db_path
        
        # Initialize components
        try:
            from opensearchpy import OpenSearch
            self.os_client = OpenSearch(
                hosts=[opensearch_url],
                verify_certs=False,
                use_ssl=False,
            )
        except Exception as e:
            logger.warning(f"Could not connect to OpenSearch: {e}")
            self.os_client = None
        
        self.analyzer = LogAnalyzer(self.os_client, db_path)
        self.labeler = FeedbackLabeler(db_path)
        self.trainer = ModelTrainer(db_path)
        
        # Load configuration
        self.config = self._load_config(config_path)
        
        logger.info("Model Improvement Pipeline initialized")

    def _load_config(self, config_path: Optional[str]) -> Dict[str, Any]:
        """Load configuration from JSON file."""
        default_config = {
            "analysis": {
                "hours_back": 24,
                "min_confidence": 0.8,
                "enabled": True,
            },
            "feedback": {
                "min_examples_for_training": 50,
                "good_percentage_threshold": 70.0,
                "enabled": True,
            },
            "retraining": {
                "enabled": True,
                "model_types": ["rag_ranker", "summary_generator"],
            },
            "notifications": {
                "log_level": "INFO",
                "send_alerts": False,
            },
        }
        
        if config_path:
            try:
                with open(config_path, 'r') as f:
                    user_config = json.load(f)
                    # Merge with defaults
                    default_config.update(user_config)
                    logger.info(f"Loaded config from {config_path}")
            except Exception as e:
                logger.warning(f"Could not load config {config_path}: {e}")
        
        return default_config

    def run_analysis_phase(self) -> Dict[str, Any]:
        """Phase 1: Analyze logs and extract training examples."""
        if not self.config["analysis"]["enabled"]:
            logger.info("Analysis phase disabled in config")
            return {}
        
        logger.info("=== PHASE 1: LOG ANALYSIS ===")
        
        try:
            # Analyze query patterns
            logger.info("Analyzing query patterns...")
            query_stats = self.analyzer.analyze_query_logs(
                hours_back=self.config["analysis"]["hours_back"]
            )
            
            logger.info(f"Analyzed {len(query_stats)} query types")
            for qtype, stats in query_stats.items():
                logger.info(
                    f"  {qtype}: success_rate={stats['success_rate']:.1%}, "
                    f"priority={stats['priority']:.1f}, "
                    f"count={stats['doc_count']}"
                )
            
            # Extract training examples
            logger.info("Extracting training examples...")
            examples = self.analyzer.extract_training_examples(
                hours_back=self.config["analysis"]["hours_back"],
                min_confidence=self.config["analysis"]["min_confidence"],
            )
            
            logger.info(f"Extracted {len(examples)} training examples")
            self.labeler.store_analysis(query_stats)
            self.labeler.store_training_examples(examples)
            
            # Analyze failed queries
            logger.info("Analyzing failed queries...")
            failed_queries = self.analyzer.extract_failed_queries(limit=100)
            error_patterns = {}
            for query_log in failed_queries:
                error_type = query_log.get("error_type", "unknown")
                error_patterns[error_type] = error_patterns.get(error_type, 0) + 1
            
            logger.info(f"Found error patterns: {error_patterns}")
            
            return {
                "phase": "analysis",
                "query_types_analyzed": len(query_stats),
                "training_examples_extracted": len(examples),
                "failed_queries": len(failed_queries),
                "error_patterns": error_patterns,
                "timestamp": datetime.utcnow().isoformat(),
            }
        
        except Exception as e:
            logger.error(f"Analysis phase failed: {e}", exc_info=True)
            return {"phase": "analysis", "error": str(e)}

    def run_feedback_phase(self) -> Dict[str, Any]:
        """Phase 2: Check feedback/labeling status."""
        if not self.config["feedback"]["enabled"]:
            logger.info("Feedback phase disabled in config")
            return {}
        
        logger.info("=== PHASE 2: FEEDBACK STATUS ===")
        
        try:
            readiness = self.trainer.get_recent_training_runs(limit=5)
            
            labeled_examples = self.labeler.get_labeled_examples()
            
            # Group by query type
            by_type = {}
            for example in labeled_examples:
                qtype = example.get("query_type", "unknown")
                if qtype not in by_type:
                    by_type[qtype] = {"good": 0, "bad": 0, "ambiguous": 0}
                label = example.get("label", "ambiguous")
                by_type[qtype][label] += 1
            
            # Determine readiness
            ready_models = []
            for qtype, counts in by_type.items():
                total = sum(counts.values())
                good_pct = (counts["good"] / total * 100) if total > 0 else 0
                is_ready = (
                    total >= self.config["feedback"]["min_examples_for_training"] and
                    good_pct >= self.config["feedback"]["good_percentage_threshold"]
                )
                
                status = {
                    "model_type": qtype,
                    "total_labeled": total,
                    "good": counts["good"],
                    "bad": counts["bad"],
                    "good_percentage": good_pct,
                    "ready_for_training": is_ready,
                }
                
                logger.info(
                    f"  {qtype}: {total} labeled, {good_pct:.1f}% good, "
                    f"ready={'YES' if is_ready else 'NO'}"
                )
                
                if is_ready:
                    ready_models.append(status)
            
            return {
                "phase": "feedback",
                "by_type": by_type,
                "ready_for_training": ready_models,
                "timestamp": datetime.utcnow().isoformat(),
            }
        
        except Exception as e:
            logger.error(f"Feedback phase failed: {e}", exc_info=True)
            return {"phase": "feedback", "error": str(e)}

    def run_retraining_phase(self, readiness_status: Dict[str, Any]) -> Dict[str, Any]:
        """Phase 3: Trigger model retraining if ready."""
        if not self.config["retraining"]["enabled"]:
            logger.info("Retraining phase disabled in config")
            return {}
        
        logger.info("=== PHASE 3: MODEL RETRAINING ===")
        
        results = {
            "phase": "retraining",
            "training_runs": [],
            "timestamp": datetime.utcnow().isoformat(),
        }
        
        try:
            ready_models = readiness_status.get("ready_for_training", [])
            
            if not ready_models:
                logger.info("No models ready for retraining")
                return results
            
            for model_status in ready_models:
                model_type = model_status["model_type"]
                
                if model_type not in self.config["retraining"]["model_types"]:
                    logger.info(f"Skipping {model_type} (not in configured model types)")
                    continue
                
                logger.info(f"Creating training run for {model_type}...")
                
                # Get labeled examples
                labeled_examples = self.labeler.get_labeled_examples()
                model_examples = [e for e in labeled_examples if e["query_type"] == model_type]
                
                # Create training run
                run_name = self.trainer.create_training_run(
                    model_type=model_type,
                    training_examples=model_examples,
                    parameters={
                        "analysis_date": datetime.utcnow().isoformat(),
                        "examples_count": len(model_examples),
                    }
                )
                
                if run_name:
                    logger.info(f"Created training run: {run_name}")
                    
                    log_model_event(
                        logger,
                        event_type="retraining_triggered",
                        model_name=model_type,
                        status="pending",
                        details={
                            "run_name": run_name,
                            "examples": len(model_examples),
                        }
                    )
                    
                    results["training_runs"].append({
                        "model_type": model_type,
                        "run_name": run_name,
                        "examples": len(model_examples),
                        "status": "pending",
                    })
            
            return results
        
        except Exception as e:
            logger.error(f"Retraining phase failed: {e}", exc_info=True)
            results["error"] = str(e)
            return results

    def run_complete_pipeline(self) -> Dict[str, Any]:
        """Run complete improvement pipeline."""
        logger.info("Starting Model Improvement Pipeline")
        pipeline_start = time.time()
        
        results = {
            "pipeline_start": datetime.utcnow().isoformat(),
            "phases": {},
        }
        
        try:
            # Phase 1: Analysis
            analysis_result = self.run_analysis_phase()
            results["phases"]["analysis"] = analysis_result
            
            # Phase 2: Feedback
            feedback_result = self.run_feedback_phase()
            results["phases"]["feedback"] = feedback_result
            
            # Phase 3: Retraining
            retraining_result = self.run_retraining_phase(feedback_result)
            results["phases"]["retraining"] = retraining_result
            
            pipeline_end = time.time()
            results["pipeline_duration_seconds"] = pipeline_end - pipeline_start
            results["pipeline_status"] = "success"
            
            logger.info(f"Pipeline completed in {pipeline_end - pipeline_start:.1f}s")
            
        except Exception as e:
            logger.error(f"Pipeline failed: {e}", exc_info=True)
            results["pipeline_status"] = "failed"
            results["error"] = str(e)
        
        # Log final status
        log_model_event(
            logger,
            event_type="pipeline_completed",
            model_name="all",
            status=results["pipeline_status"],
            details=results,
        )
        
        return results


def main():
    parser = argparse.ArgumentParser(
        description="Model Improvement Pipeline - Analyzes logs, extracts examples, triggers retraining"
    )
    parser.add_argument(
        "--opensearch-url",
        default="http://looma-opensearch:9200",
        help="OpenSearch URL",
    )
    parser.add_argument(
        "--db-path",
        default="/app/data/looma_ai.db",
        help="SQLite database path",
    )
    parser.add_argument(
        "--config",
        help="Configuration JSON file",
    )
    parser.add_argument(
        "--output",
        help="Save results to JSON file",
    )
    
    args = parser.parse_args()
    
    pipeline = ModelImprovementPipeline(
        opensearch_url=args.opensearch_url,
        db_path=args.db_path,
        config_path=args.config,
    )
    
    results = pipeline.run_complete_pipeline()
    
    # Output results
    output = json.dumps(results, indent=2, default=str)
    print(output)
    
    if args.output:
        with open(args.output, 'w') as f:
            f.write(output)
        logger.info(f"Results saved to {args.output}")
    
    # Exit with appropriate code
    sys.exit(0 if results["pipeline_status"] == "success" else 1)


if __name__ == "__main__":
    main()
