import sys
from pathlib import Path

_PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

import zvec
from sentence_transformers import SentenceTransformer

from app import paths

model = SentenceTransformer("sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
q = model.encode("Como é que as plantas produzem energia?").tolist()

collection = zvec.open(path=str(paths.zvec_collection_path("curriculum_chunks")))

results = collection.query(
    zvec.VectorQuery("embedding", vector=q),
    topk=5
)

print(results)
