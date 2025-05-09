from fastapi import APIRouter

from app.LLM.service.generator import generate_answer
from app.LLM.models.llm_generate_request import QueryRequest

router = APIRouter(prefix="/api/llm")

@router.post("/generate")
def generate_text(request: QueryRequest):
  return {"response": generate_answer(request.question)}