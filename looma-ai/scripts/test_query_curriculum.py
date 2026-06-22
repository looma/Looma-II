import zvec
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
q = model.encode("Como é que as plantas produzem energia?").tolist()

collection = zvec.open(path="data/zvec/curriculum_chunks")

results = collection.query(
    zvec.VectorQuery("embedding", vector=q),
    topk=5
)

print(results)
