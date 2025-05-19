from pinecone import Pinecone
from app.core.config import PINECONE_API_KEY, INDEX_NAME

pc = Pinecone(api_key=PINECONE_API_KEY)
index = pc.Index(INDEX_NAME)

# def query_multiple_indexes(query, embedding_model, top_k=3):
#     query_embedding = embedding_model.embed_query(query)
#     results = index.query(vector=query_embedding, top_k=top_k, include_metadata=True)
#     matches = sorted(results["matches"], key=lambda x: x["score"], reverse=True)
#     return matches[:top_k]

def query_multiple_indexes(query, embedding_model, top_k=4):
    best_matches = []
    best_scores = []

    try:
        # Pinecone 인덱스 객체 생성
        index = pc.Index("devpilot")

        # 쿼리 임베딩 생성
        query_embedding = embedding_model.embed_query(query)

        # Pinecone에서 유사한 벡터 검색
        results = index.query(
            vector=query_embedding,
            top_k=top_k,
            include_metadata=True
        )

        # 매칭 결과 추출
        matches = results.get("matches", [])
        if not matches:
            return []

        # 매치와 스코어 분리
        for match in matches:
            best_matches.append(match)
            best_scores.append(match["score"])

        # 점수를 기준으로 내림차순 정렬
        sorted_matches = [
            match for _, match in sorted(zip(best_scores, best_matches), key=lambda x: x[0], reverse=True)
        ]

        # 상위 top_k만 반환
        return sorted_matches[:top_k]

    except Exception as e:
        print(f"[ERROR] Pinecone 쿼리 중 오류 발생: {e}")
        return []