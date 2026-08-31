"""Print WHICH zvec store this environment resolves to, and what is in it.

Run it whenever you are not sure a script wrote where you think it did — the
first block is the answer to that question.
"""

import sys
from pathlib import Path

_PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

from app import paths


def main():
    print(paths.describe())
    print()

    if not paths.ZVEC_DIR.exists():
        print(f'no zvec store at {paths.ZVEC_DIR} yet — run scripts/init_zvec.py')
        return

    for p in sorted(paths.ZVEC_DIR.iterdir()):
        if not p.is_dir():
            continue
        size = sum(f.stat().st_size for f in p.rglob('*') if f.is_file())
        print(f'Collection folder: {p}  ({size / 1e6:.1f} MB)')


if __name__ == '__main__':
    main()
