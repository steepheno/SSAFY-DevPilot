from fastapi import APIRouter

from app.LLM.schemas.llm_schema import QueryRequest, QueryResponse
from app.LLM.service.generator import generate_answer

router = APIRouter(prefix="/api/llm")

@router.post("/generations", response_model=QueryResponse)
def generate_text(request: QueryRequest):
    return {"response": generate_answer(request.question)}

# RAG와 성능 비교용 (테스트)
# @router.post("/generations/not")
# def generate_text_noRAG(request: QueryRequest):
#   return {"response": generate_answer_NoRAG(request.question)}

