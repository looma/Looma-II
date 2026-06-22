from sentence_transformers import SentenceTransformer

model = SentenceTransformer("sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
vec = model.encode("A fotossíntese é o processo pelo qual as plantas produzem energia.")
print("Embedding length:", len(vec))
print("First 5 values:", vec[:5])
