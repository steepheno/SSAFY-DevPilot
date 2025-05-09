from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
from app.core.config import EMBEDDING_ID, MODEL_ID
from langchain.llms import HuggingFacePipeline
from langchain.prompts import PromptTemplate
from langchain.schema.output_parser import StrOutputParser
from app.core.pinecone_client import query_multiple_indexes
from langchain.embeddings import HuggingFaceEmbeddings
import os

tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
model = AutoModelForCausalLM.from_pretrained(MODEL_ID, device_map="auto")
generator_pipeline = pipeline(
    "text-generation",
    model=model,
    tokenizer=tokenizer,
    max_new_tokens=512,
    temperature=0.1,
    top_p=0.9,
    repetition_penalty=1.2,
    eos_token_id=tokenizer.eos_token_id
)

llm = HuggingFacePipeline(pipeline=generator_pipeline)
embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_ID)

template = """
당신은 CICD와 Jenkins에 특화된 전문가입니다. 아래 문서를 바탕으로 질문에 한국어로 간결하고 정확하게 답변해 주세요.

※ 조건
- 답변 외의 문장은 쓰지 마세요.
- CONTEXT의 내용을 복사하지 말고, 필요한 정보만 활용해 풀어서 설명하세요.
- CICD 및 Jenkins 용어는 쉽게 설명하세요.

[문서]
{context}

[질문]
{question}

[답변]
"""
prompt = PromptTemplate.from_template(template)
chain = prompt | llm | StrOutputParser()

# 4. 서비스 함수
def generate_answer(question: str) -> str:
    docs = query_multiple_indexes(query=question, embedding_model=embeddings)
    context = " ".join([doc['metadata']['text'] for doc in docs])
    return chain.invoke({"context": context, "question": question})