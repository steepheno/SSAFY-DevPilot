from pinecone import Pinecone
from app.core.config import PINECONE_API_KEY, INDEX_NAME

pc = Pinecone(api_key=PINECONE_API_KEY)
index = pc.Index(INDEX_NAME)

def query_multiple_indexes(query, embedding_model, top_k=3):
    query_embedding = embedding_model.embed_query(query)
    results = index.query(vector=query_embedding, top_k=top_k, include_metadata=True)
    matches = sorted(results["matches"], key=lambda x: x["score"], reverse=True)
    return matches[:top_k]
