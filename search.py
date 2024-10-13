from langchain_community.embeddings import HuggingFaceEmbeddings
from qdrant_client import QdrantClient, models
import sys
import json

# This is copied from loomaai/appai/common/query.py
def query(q: str, qdrant: QdrantClient):
    model_name = "sentence-transformers/all-mpnet-base-v2"
    model_kwargs = {}
    encode_kwargs = {'normalize_embeddings': False}
    hf = HuggingFaceEmbeddings(
        model_name=model_name,
        model_kwargs=model_kwargs,
        encode_kwargs=encode_kwargs
    )

    docs = qdrant.search(collection_name="activities", query_vector=hf.embed_query(q), limit=24)
    return docs

result = query(sys.argv[1], QdrantClient(url='http://host.docker.internal:46333'))
print(json.dumps([{**e.payload, 'score': e.score} for e in result]))
