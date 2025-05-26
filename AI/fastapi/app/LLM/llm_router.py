from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from app.LLM.service.session_manger import get_or_create_session_id
from app.LLM.schemas.llm_schema import QueryRequest, QueryResponse
from app.LLM.service.generator import generate_chat_response

router = APIRouter(prefix="/api/llm")

@router.post("/generations", response_model=QueryResponse)
async def generate_text(request: Request, request_data: QueryRequest):
    session_id, is_new_session = get_or_create_session_id(request)
    response = await generate_chat_response(session_id, request_data.question)

    json_response = JSONResponse(content={"response": response})
    if is_new_session:
        json_response.set_cookie(
            key="session_id",
            value=session_id,
            httponly=True,
            secure=False,
            samesite="Lax"
        )
    return json_response

# RAG와 성능 비교용 (테스트)
# @router.post("/generations/not")
# def generate_text_noRAG(request: QueryRequest):
#   return {"response": generate_answer_NoRAG(request.question)}

