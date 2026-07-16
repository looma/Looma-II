from langchain_huggingface import HuggingFaceEmbeddings
model_name = "sentence-transformers/all-mpnet-base-v2"
model_kwargs = {}
encode_kwargs = {'normalize_embeddings': False}
hf = HuggingFaceEmbeddings(
    model_name=model_name,
    model_kwargs=model_kwargs,
    encode_kwargs=encode_kwargs
)

# search-service (zvec) reads its own model straight from the SAME HF_HOME cache
# (search-service/search_service.py, MODEL_NAME) — a different model from looma-ai's
# above, and not something HuggingFaceEmbeddings baking the first one covers. Both
# must be present for an OFFLINE box: HF_HUB_OFFLINE/TRANSFORMERS_OFFLINE=1 means
# neither service can ever fetch a missing one over the network once installed.
from sentence_transformers import SentenceTransformer
SentenceTransformer("sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
