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

tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
model = AutoModelForCausalLM.from_pretrained(MODEL_ID, device_map="auto", torch_dtype=torch.bfloat16,  offload_folder="./offload", )


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
당신은 CICD와 Jenkins에 특화된 전문가입니다. 아래 문서를 바탕으로 질문에 정확하게 답변해 주세요.

※ 조건
- 문서에 포함된 정보를 최대한 활용하세요.
- 문서를 그대로 복사하지 말고, 문서 내용을 기반으로 풀어서 설명하세요.
- 답변하는 과정에서, 문서의 문장을 활용해 논리적으로 추론하는 과정을 거치세요.
- CICD나 젠킨스와 관련없는 질문은 '해당 내용은 답변할 수 없습니다'라고 하세요.
- 영어로 생각하는 추론 과정을 거친 후, 반드시 한글로 답변하세요.

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

def generate_answer_NoRAG(question: str) -> str:
    return chain.invoke({"context": '', "question": question})
