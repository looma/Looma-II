from flask import Flask, request, jsonify

app = Flask(__name__)

from langchain_huggingface import HuggingFaceEmbeddings
from qdrant_client import QdrantClient, models

model_name = "sentence-transformers/all-mpnet-base-v2"
model_kwargs = {}
encode_kwargs = {'normalize_embeddings': False}
hf = HuggingFaceEmbeddings(
    model_name=model_name,
    model_kwargs=model_kwargs,
    encode_kwargs=encode_kwargs
)


# This is copied from loomaai/appai/common/query.py
def query(q: str, qdrant: QdrantClient):
    embeddings = hf.embed_query(q)


    similar_docs = qdrant.query_points(
        collection_name="activities",
        prefetch=[
            # models.Prefetch(
            #     query=embeddings,
            #     using="text-title",
            #     limit=12,
            #     # filter=models.Filter(
            #     #     must_not=[
            #     #         models.FieldCondition(key="ft",
            #     #                               match=models.MatchValue(
            #     #                                   value="chapter")),
            #     #     ]
            #     # )
            # ),
            models.Prefetch(
                query=embeddings,  # <-- dense vector
                using="text-body",
                limit=12,
                # filter=models.Filter(
                #     must_not=[
                #         models.FieldCondition(key="ft",
                #                               match=models.MatchValue(
                #                                   value="chapter")),
                #     ]
                # )
            ),
        ],
        query=models.FusionQuery(fusion=models.Fusion.RRF),
        with_payload=True,
    )
    return similar_docs

@app.route('/search', methods=['GET'])
def search():
    search_term = request.args.get('q')
    if not search_term:
        return jsonify({"error": "Missing search query"}), 400

    try:
        results = query(search_term, QdrantClient(url='http://host.docker.internal:46333'))
        return jsonify([{**(e.payload), 'score': e.score} for e in results.points])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
