"""Inspect the SQLite + ZVEC stores after an ingest run."""
import sys
from pathlib import Path
_PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

from app.index.sqlite_store import get_conn

c = get_conn()
total   = c.execute("SELECT COUNT(*) FROM documents").fetchone()[0]
indexed = c.execute("SELECT COUNT(*) FROM documents WHERE ingestion_status='indexed'").fetchone()[0]
print(f"documents total:   {total}")
print(f"documents indexed: {indexed}")
print(f"documents by file_type (top 15):")
for row in c.execute("SELECT file_type, COUNT(*) FROM documents WHERE ingestion_status='indexed' GROUP BY file_type ORDER BY 2 DESC LIMIT 15"):
    print(f"  {row[0]:12s} {row[1]}")
print()
# Counts of the new metadata file types
new = ('summary', 'keywords', 'quiz', 'outline', 'objectives', 'plan', 'lesson', 'geojson')
print("documents indexed for the NEW extensions:")
for ext in new:
    n = c.execute("SELECT COUNT(*) FROM documents WHERE ingestion_status='indexed' AND file_type=?", (ext,)).fetchone()[0]
    print(f"  .{ext:10s} {n}")

# ZVEC collection size
try:
    import zvec
    from app.index.zvec_store import open_curriculum_chunks
    col = open_curriculum_chunks()
    cnt = col.count() if hasattr(col, 'count') else None
    print(f"\nZVEC curriculum_chunks count: {cnt}")
except Exception as e:
    print(f"\nZVEC unavailable: {e}")
