from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
from app.core.config import EMBEDDING_ID, MODEL_ID
from langchain.llms import HuggingFacePipeline
from langchain.prompts import PromptTemplate
from langchain.schema.output_parser import StrOutputParser
from app.core.pinecone_client import query_multiple_indexes
from langchain.embeddings import HuggingFaceEmbeddings
import os
import torch
from langsmith import traceable
from typing import List, Dict
from uuid import uuid4
from fastapi import Request

tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
model = AutoModelForCausalLM.from_pretrained(MODEL_ID, device_map="auto", torch_dtype=torch.bfloat16,  offload_folder="./offload", )

generator_pipeline = pipeline(
    "text-generation",
    model=model,
    tokenizer=tokenizer,
    max_new_tokens=512,
    temperature=0.3,
    top_p=0.9,
    repetition_penalty=1.2,
    eos_token_id=tokenizer.eos_token_id,
    pad_token_id=tokenizer.pad_token_id,      
    return_full_text=False       
)

llm = HuggingFacePipeline(pipeline=generator_pipeline)
embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_ID)

template = """
You are an expert in CICD and Jenkins. Please answer the user's question strictly based on the [Document] and prior [Chat History].

---
※ ABSOLUTE RULES (Must Follow Without Exception):
- You MUST use only the information contained in the [Document]. NEVER use your own knowledge or assumptions.
- If the [Document] and [Chat History] do NOT contain sufficient information to answer, reply with:
  > "죄송합니다. 해당 내용을 찾을 수 없습니다."
- The Korean answer MUST
---
※ OUTPUT FORMAT:
- First, perform **step-by-step reasoning in English**, using ONLY evidence from [Document] and [Chat History]. Do NOT hallucinate.
- Then, You MUST write the final answer in **Korean**.
- The Korean answer:
  - Be written in **multiple complete sentences**
  - Explain the concept in a detailed and beginner-friendly way
  - Expand and paraphrase relevant points from the [Document] and [Chat History]
  - Include examples if needed
  - Avoid short or overly summarized responses
- When the user asks a question in Korean, always respond in Korean.
- When responding in Korean, include **sufficient details** and explain concepts in a **beginner-friendly** manner.
- Answers should be written in **complete sentences**, and if necessary, include **examples** to clarify the explanation.
- Even when the question is asked in English, translate the question and provide a **complete and detailed answer in Korean**, ensuring no details are omitted.
- Be careful to avoid **missing sentences** or **incomplete explanations**. Every concept should be explained as **thoroughly** as possible, ensuring the user can clearly understand the response.

---
※ TOPIC RESTRICTION (MUST FOLLOW):
- You MUST only answer questions directly related to **Jenkins**, **CI/CD**, **pipelines**, or **developer workflows**.
- If the [User Question] contains a non-technical or unrelated topic (e.g., JavaScript `map()`, celebrities, food, or any topic not directly related to Jenkins and CI/CD), you MUST reply with:
  > "저는 Jenkins 및 CICD와 관련된 질문에만 답변할 수 있습니다. 다른 질문을 부탁드립니다."
- Ensure that only relevant, technical discussions related to Jenkins and CI/CD remain in the chat history. If unrelated discussions are detected, ensure they are excluded before answering.
---
※ Example:
- 'question': `docker run` 명령어에서 `--rm` 옵션은 무엇을 의미하나요?'
- 'answer' : `--rm` 옵션은 Docker 컨테이너가 종료될 때 자동으로 컨테이너를 제거하도록 지정합니다.'

- 'question': 'docker run 명령어에서 -p 8080:8080 옵션은 무엇을 의미하나요?'
- 'answer' : '-p 8080:8080 옵션은 컨테이너의 8080 포트를 호스트 머신의 8080 포트에 매핑합니다. 이를 통해 호스트 머신에서 8080 포트를 통해 Jenkins에 접근할 수 있습니다.'
---

[Chat History]
{chat_history}

[Document]
{context}

[User Question]
{question}

[Answer]
"""


prompt = PromptTemplate.from_template(template)
chain = prompt | llm | StrOutputParser()

chat_histories: Dict[str, List[Dict[str, str]]] = {}

async def generate_chat_response(session_id: str, question: str) -> str:

    if not question or len(question.strip()) == 0:
        return "질문을 입력해주세요."
    if len(question) > 1000:  # 예시로 500자 제한
        return "질문이 너무 길어요. 1000자 이하로 입력해주세요."

    if question.lower() == "새 대화":
        chat_histories[session_id] = []  # 대화 이력 초기화
        return "대화 내역이 초기화 됐습니다. 새로 질문해주세요!"
        
    history = chat_histories.get(session_id, [])
        
    # RAG 검색
    best_answers = query_multiple_indexes(question, embeddings)
    context = " ".join([doc['metadata']['text'] for doc in best_answers]) if best_answers else ""
    history_str = "\n".join([f"{m['role'].capitalize()}: {m['content']}" for m in history])

    # 응답 생성
    if not context and not history:
        response = "저는 Jenkins 및 CICD와 관련된 질문에만 답변할 수 있습니다. 다른 질문을 부탁드립니다."
    elif not context:
        response = "죄송합니다. 해당 내용을 찾을 수 없습니다."
    else:
        response = chain.invoke({
            "context": context,
            "chat_history": history_str,
            "question": question
        })

    # 히스토리 저장
    history.append({"role": "user", "content": question})
    history.append({"role": "assistant", "content": response})
    chat_histories[session_id] = history

    return response