from pydantic import BaseModel, Field

class QueryRequest(BaseModel):
    question: str = Field(..., min_length=2, max_length=1000, description="LLM에 보낼 질문")

class QueryResponse(BaseModel):
    response: str = Field(..., description="LLM의 응답 텍스트")