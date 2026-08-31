"""Where looma-ai keeps its data. One answer, used everywhere.

There used to be two of these on a dev disk — `Looma/looma-ai/data/` and
`Looma/looma-ai-data/` — holding two different `looma.db` files and two sets of
zvec collections. Nothing chose between them; the split was an accident of how
the paths were written.

Every store in this package used to open a CWD-RELATIVE path: `data/zvec`,
`data/index/looma.db`, `data/models`. So the store you got depended entirely on
where the process was started:

  * in the container, CWD is /app, so `data/` is /app/data — the `looma_ai_data`
    named volume the main compose mounts, which is the real one;
  * running a script by hand from `looma-ai/`, `data/` is `looma-ai/data/`.

`Looma/looma-ai-data/` is a third thing and NOT ours: observability/docker-compose.yml
bind-mounts it onto /app/data for `looma-analysis-worker` and
`looma-feedback-labeling` (profile `analysis`). Those keep a different database
(`looma_ai.db`, feedback/training labels) and never import this module. The zvec
and sqlite leftovers sitting in there today came from running THESE stores with a
CWD-relative path, which is the bug below; they are not the analysis services'
data and nothing reads them.

Anchoring to this file instead of to the CWD collapses both to one path per
environment, and it lands on the right one in both: `app/` sits at /app/app in
the container (so the base is /app/data, the volume) and at looma-ai/app on a
dev box (so the base is looma-ai/data). A stray `looma-ai-data/` can no longer
be created by starting a script from somewhere new.

The env vars below are the same names `looma-ai/.env.local` documents; they were
dead until this module started reading them. Set them to move a store somewhere
else — an external disk, say — without touching code.
"""

from __future__ import annotations

import os
from pathlib import Path

# looma-ai/ on a dev box, /app inside the container.
PACKAGE_ROOT = Path(__file__).resolve().parents[1]


def _from_env(var: str, default: Path) -> Path:
    raw = (os.environ.get(var) or '').strip()
    if not raw:
        return default
    p = Path(raw).expanduser()
    # A relative override is relative to the package root, never to the CWD —
    # that CWD dependence is the whole bug this module exists to kill.
    return p if p.is_absolute() else (PACKAGE_ROOT / p)


DATA_DIR = _from_env('LOOMA_AI_DATA_DIR', PACKAGE_ROOT / 'data')
ZVEC_DIR = _from_env('ZVEC_BASE_PATH', DATA_DIR / 'zvec')
SQLITE_DB_PATH = _from_env('SQLITE_DB_PATH', DATA_DIR / 'index' / 'looma.db')
MODELS_DIR = _from_env('LOOMA_AI_MODELS_DIR', DATA_DIR / 'models')
RAW_DIR = _from_env('LOOMA_RAW_PATH', DATA_DIR / 'raw' / 'looma')


def zvec_collection_path(name: str) -> Path:
    """Path of one zvec collection (`curriculum_chunks`, `glossary_entries`, ...)."""
    return ZVEC_DIR / name


def ensure_parents() -> None:
    """Create the directories the stores write into. Cheap and idempotent."""
    ZVEC_DIR.mkdir(parents=True, exist_ok=True)
    SQLITE_DB_PATH.parent.mkdir(parents=True, exist_ok=True)


def describe() -> str:
    """One line per store — what `scripts/check_zvec.py` prints."""
    return '\n'.join(
        [
            f'package root : {PACKAGE_ROOT}',
            f'data dir     : {DATA_DIR}',
            f'zvec         : {ZVEC_DIR}',
            f'sqlite       : {SQLITE_DB_PATH}',
            f'models       : {MODELS_DIR}',
        ]
    )
