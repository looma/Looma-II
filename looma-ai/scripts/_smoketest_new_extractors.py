"""Smoke test for the new ingestor extractors. Run inside the looma-ai container:
   docker exec looma-ai python scripts/_smoketest_new_extractors.py
"""
import sys
from pathlib import Path

_PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

from app.extract.text_extractors import extract_any

CHAPTERS = Path("/looma/content/chapters")
MAPS     = Path("/looma/content/maps")

def first(rootdir: Path, suffix: str):
    return next(rootdir.rglob("*" + suffix), None)

samples = []
for suf in [".lesson", ".plan", ".summary", ".outline", ".quiz",
            ".objectives", ".keywords"]:
    p = first(CHAPTERS, suf)
    if p: samples.append(p)
p = first(MAPS, ".geojson")
if p: samples.append(p)

for p in samples:
    try:
        pages = extract_any(p)
        text = pages[0]["text"] if pages else ""
        preview = text.strip().replace("\n", " ")[:100]
        print(f"  {p.suffix:11s} {p.name:42s} {len(text):6d} chars -> {preview!r}")
    except Exception as e:
        print(f"  {p.suffix:11s} {p.name:42s} ERROR -> {e}")
