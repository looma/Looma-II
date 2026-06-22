"""
Continuous Log Analysis Worker

Runs periodically to analyze logs, extract training examples, and trigger model retraining.
Can be run as a background job or scheduled task.
"""

import argparse
import logging
import time
import sys
from typing import Optional
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, '/app')
sys.path.insert(0, '/app/scripts')

from structured_logger import get_structured_logger, log_model_event
from log_analyzer import LogAnalyzer, FeedbackLabeler
from model_trainer import ModelTrainer


logger = get_structured_logger(__name__)


class AnalysisWorker:
    """Continuous analysis worker for log-based model improvement."""

    def __init__(self, opensearch_client=None, db_path: str = None):
        self.os_client = opensearch_client
        self.db_path = db_path or "/app/data/looma_ai.db"
        self.analyzer = LogAnalyzer(opensearch_client, db_path)
        self.labeler = FeedbackLabeler(db_path)
        self.trainer = ModelTrainer(db_path)

    def run_analysis_cycle(
        self,
        hours_back: int = 24,
        min_confidence: float = 0.8,
    ) -> dict:
        """
        Run a complete analysis cycle:
        1. Analyze logs for patterns
        2. Extract training examples
        3. Store for labeling
        """
        log_model_event(
            logger,
            event_type="analysis_cycle_started",
            model_name="all",
            status="running",
        )

        results = {
            "cycle_started": datetime.utcnow().isoformat(),
            "query_analysis": {},
            "training_examples_extracted": 0,
            "failed_queries": 0,
            "errors": [],
        }

        try:
            # 1. Analyze query patterns
            logger.info("Analyzing query logs...")
            query_stats = self.analyzer.analyze_query_logs(hours_back=hours_back)
            results["query_analysis"] = query_stats
            
            # Store analysis
            self.labeler.store_analysis(query_stats)
            logger.info(f"Analyzed {len(query_stats)} query types")

            # 2. Extract training examples
            logger.info("Extracting training examples...")
            examples = self.analyzer.extract_training_examples(
                hours_back=hours_back,
                min_confidence=min_confidence,
            )
            self.labeler.store_training_examples(examples)
            results["training_examples_extracted"] = len(examples)
            logger.info(f"Extracted {len(examples)} training examples")

            # 3. Analyze failed queries
            logger.info("Analyzing failed queries...")
            failed = self.analyzer.extract_failed_queries(hours_back=hours_back, limit=50)
            results["failed_queries"] = len(failed)
            logger.info(f"Found {len(failed)} failed queries")

            # Identify error patterns
            error_counts = {}
            for query_log in failed:
                error_type = query_log.get("error_type", "unknown")
                error_counts[error_type] = error_counts.get(error_type, 0) + 1
            results["error_patterns"] = error_counts

            log_model_event(
                logger,
                event_type="analysis_cycle_completed",
                model_name="all",
                status="success",
                details=results,
            )

        except Exception as e:
            error_msg = f"Analysis cycle failed: {str(e)}"
            logger.error(error_msg, exc_info=True)
            results["errors"].append(error_msg)
            log_model_event(
                logger,
                event_type="analysis_cycle_failed",
                model_name="all",
                status="error",
                details={"error": str(e)},
            )

        return results

    def check_training_readiness(self, min_examples: int = 50) -> dict:
        """
        Check if we have enough labeled examples to trigger model retraining.
        
        Returns info about training readiness for each model type.
        """
        logger.info("Checking training readiness...")
        
        readiness = {}
        
        try:
            labeled_examples = self.labeler.get_labeled_examples(limit=5000)
            
            # Group by query_type
            by_type = {}
            for example in labeled_examples:
                qtype = example.get("query_type", "unknown")
                if qtype not in by_type:
                    by_type[qtype] = {"good": 0, "bad": 0, "ambiguous": 0}
                label = example.get("label", "ambiguous")
                by_type[qtype][label] += 1
            
            # Determine readiness
            for qtype, counts in by_type.items():
                total = sum(counts.values())
                good_pct = (counts["good"] / total * 100) if total > 0 else 0
                
                readiness[qtype] = {
                    "total_labeled": total,
                    "good": counts["good"],
                    "bad": counts["bad"],
                    "ambiguous": counts["ambiguous"],
                    "good_percentage": good_pct,
                    "ready_for_training": total >= min_examples and good_pct >= 70,
                }
                
                logger.info(
                    f"Training readiness for {qtype}: {total} examples, "
                    f"{good_pct:.1f}% good quality"
                )
            
            return readiness
        
        except Exception as e:
            logger.error(f"Failed to check training readiness: {e}")
            return {}

    def run_continuous(
        self,
        interval_minutes: int = 60,
        max_iterations: Optional[int] = None,
    ):
        """
        Run analysis continuously at regular intervals.
        
        Args:
            interval_minutes: Minutes between analysis cycles
            max_iterations: Stop after N iterations (None = run forever)
        """
        logger.info(f"Starting continuous analysis worker (interval: {interval_minutes}min)")
        
        iteration = 0
        while True:
            iteration += 1
            
            if max_iterations and iteration > max_iterations:
                logger.info(f"Reached max iterations ({max_iterations}), stopping")
                break
            
            logger.info(f"Analysis cycle {iteration} starting...")
            
            # Run analysis
            self.run_analysis_cycle(hours_back=24)
            
            # Check training readiness
            readiness = self.check_training_readiness()
            
            # Log readiness status
            for model_type, status in readiness.items():
                if status["ready_for_training"]:
                    logger.info(
                        f"Model {model_type} is ready for training! "
                        f"({status['total_labeled']} examples)"
                    )
            
            # Wait for next cycle
            logger.info(f"Next analysis cycle in {interval_minutes} minutes")
            time.sleep(interval_minutes * 60)


def main():
    parser = argparse.ArgumentParser(
        description="Continuous log analysis worker for model improvement"
    )
    parser.add_argument(
        "--mode",
        choices=["once", "continuous"],
        default="once",
        help="Run analysis once or continuously",
    )
    parser.add_argument(
        "--interval-minutes",
        type=int,
        default=60,
        help="Minutes between analysis cycles (for continuous mode)",
    )
    parser.add_argument(
        "--hours-back",
        type=int,
        default=24,
        help="Hours of logs to analyze",
    )
    parser.add_argument(
        "--db-path",
        default="/app/data/looma_ai.db",
        help="Path to SQLite database",
    )
    parser.add_argument(
        "--opensearch-url",
        default="http://looma-opensearch:9200",
        help="OpenSearch URL",
    )
    
    args = parser.parse_args()
    
    # Try to initialize OpenSearch client
    os_client = None
    try:
        from opensearchpy import OpenSearch
        os_client = OpenSearch(
            hosts=[args.opensearch_url],
            verify_certs=False,
            use_ssl=False,
        )
        logger.info(f"Connected to OpenSearch at {args.opensearch_url}")
    except Exception as e:
        logger.warning(f"Could not connect to OpenSearch: {e}")
        logger.warning("Analysis will only use local database")
    
    worker = AnalysisWorker(os_client, args.db_path)
    
    if args.mode == "once":
        logger.info("Running single analysis cycle")
        results = worker.run_analysis_cycle(hours_back=args.hours_back)
        print("\n=== Analysis Results ===")
        print(f"Training examples extracted: {results['training_examples_extracted']}")
        print(f"Failed queries found: {results['failed_queries']}")
        if results["query_analysis"]:
            print("\nQuery Type Analysis:")
            for qtype, metrics in results["query_analysis"].items():
                print(
                    f"  {qtype}: success_rate={metrics['success_rate']:.2%}, "
                    f"priority={metrics['priority']:.1f}"
                )
    else:
        worker.run_continuous(
            interval_minutes=args.interval_minutes,
        )


if __name__ == "__main__":
    main()
