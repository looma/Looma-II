"""Create the four zvec collections if they are not there yet.

Safe to re-run: an existing collection is opened, never recreated. Where they
land is decided in one place, app/paths.py — run this from anywhere and you get
the same directory.
"""

import sys
from pathlib import Path

_PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

from app import paths
from app.index.zvec_store import (
    open_curriculum_chunks,
    open_exercise_bank,
    open_generated_assets,
    open_glossary_entries,
)

COLLECTIONS = {
    'curriculum_chunks': open_curriculum_chunks,
    'glossary_entries': open_glossary_entries,
    'exercise_bank': open_exercise_bank,
    'generated_assets': open_generated_assets,
}


def main():
    print(paths.describe())
    print()
    paths.ensure_parents()
    for name, opener in COLLECTIONS.items():
        path = paths.zvec_collection_path(name)
        existed = path.exists()
        opener()
        print(f"{'OPENED ' if existed else 'CREATED'} -> {name} @ {path}")


if __name__ == '__main__':
    main()
