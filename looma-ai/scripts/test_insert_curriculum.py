import os
import zvec
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
vec = model.encode(
    "A fotossíntese é o processo pelo qual as plantas transformam luz em energia."
).tolist()

schema = zvec.CollectionSchema(
    name="curriculum_chunks",
    vectors=zvec.VectorSchema("embedding", zvec.DataType.VECTOR_FP32, 384),
)

path = "data/zvec/curriculum_chunks"

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
