from pydantic import BaseModel, Field

from pydantic import BaseModel, Field
from typing import List, Literal

# 🧩 1. 메시지 단위 정의
class Message(BaseModel):
    role: Literal["user", "assistant"] = Field(..., description="발화 주체: user 또는 assistant")
    content: str = Field(..., description="대화 내용")

# 📥 2. 요청 스키마
class QueryRequest(BaseModel):
    question: str = Field(..., min_length=2, max_length=1000, description="LLM에 보낼 질문")
    chat_history: List[Message] = Field(default_factory=list, description="이전 대화 내역")

# 📤 3. 응답 스키마
class QueryResponse(BaseModel):
    response: str = Field(..., description="LLM의 응답 텍스트")
    updated_chat_history: List[Message] = Field(..., description="업데이트된 대화 이력")
