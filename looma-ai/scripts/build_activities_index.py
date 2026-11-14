"""Build the Search page's `activities` zvec collection from Mongo, outside the
server (see app/index/activities_store.py).

    docker run --rm --network host -v looma_ai_data:/app/data looma-ai:latest \
      python scripts/build_activities_index.py

Uses all cores but one, builds beside the live collection and swaps it in when
complete. Restart looma-ai afterwards (it holds the old collection open).
POST /rebuild_activities does the same inside the server, on fewer threads.
"""

from __future__ import annotations

import os
import shutil
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from pymongo import MongoClient  # noqa: E402

from app.embed.model import load_model  # noqa: E402
from app.index import activities_store  # noqa: E402


def main() -> int:
    import torch

    torch.set_num_threads(max(1, (os.cpu_count() or 2) - 1))
    url = os.environ.get('LOOMA_MONGO_URL') or 'mongodb://127.0.0.1:27017'
    coll = MongoClient(url)[os.environ.get('LOOMA_MONGO_DB') or 'looma'][
        os.environ.get('LOOMA_MONGO_COLLECTION') or 'activities']
    final = activities_store.path()
    target = final + '.next'
    t0 = time.time()
    n = activities_store.build(coll, load_model(), target, log=lambda m: print(m, flush=True))
    if os.path.exists(final):
        shutil.rmtree(final)
    os.rename(target, final)
    print(f'[activities] ready: {n} vectors in {time.time() - t0:.0f}s -> {final}', flush=True)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
