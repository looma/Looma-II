import sys
from pathlib import Path

_PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

import os
import zvec
from sentence_transformers import SentenceTransformer

from app import paths

model = SentenceTransformer("sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
vec = model.encode(
    "A fotossíntese é o processo pelo qual as plantas transformam luz em energia."
).tolist()

schema = zvec.CollectionSchema(
    name="curriculum_chunks",
    vectors=zvec.VectorSchema("embedding", zvec.DataType.VECTOR_FP32, 384),
)

path = str(paths.zvec_collection_path("curriculum_chunks"))
paths.ensure_parents()

if os.path.exists(path):
    collection = zvec.open(path=path)
else:
    collection = zvec.create_and_open(path=path, schema=schema)

doc = zvec.Doc(
    id="test_chunk_001",
    vectors={"embedding": vec},
)

collection.insert([doc])
print("Inserted OK")
