from fastapi import APIRouter

from app.LLM.service.generator import chat_with_vllm_stream, generate_answer
from app.LLM.models.llm_generate_request import QueryRequest

router = APIRouter(prefix="/api/llm")

@router.post("/generations")
def generate_text(request: QueryRequest):
  return {"response": generate_answer(request.question)}

