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

---
※ OUTPUT FORMAT:
- First, perform **step-by-step reasoning in English**, using ONLY evidence from [Document] and [Chat History]. Do NOT hallucinate.
- Then, write the final answer in **Korean**.
- The Korean answer MUST:
  - Be written in **multiple complete sentences**
  - Explain the concept in a detailed and beginner-friendly way
  - Expand and paraphrase relevant points from the [Document] and [Chat History]
  - Include examples if needed
  - Avoid short or overly summarized responses
---

※ TOPIC RESTRICTION (MUST FOLLOW)
- You MUST answer ONLY questions that are clearly related to Jenkins, CI/CD, pipelines, or developer workflows.
- If the question is about programming concepts not directly related to Jenkins (e.g., JavaScript `map()`), or about celebrities, pop culture, food, or any non-technical topic, you MUST respond with:
  > "저는 Jenkins 및 CICD와 관련된 질문에만 답변할 수 있습니다. 다른 질문을 부탁드립니다."

- Do NOT attempt to answer unrelated questions, even partially. Ignore them completely and respond only with the message above.
---


[Document]
{context}

[User Question]
{question}

[Answer]
"""

prompt = PromptTemplate.from_template(template)
chain = prompt | llm | StrOutputParser()

chat_histories: Dict[str, List[Dict[str, str]]] = {}

def generate_chat_response(session_id: str, question: str) -> str:
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