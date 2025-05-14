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
You are an expert in CICD and Jenkins. Please answer the following question based strictly on the provided document.

※ ABSOLUTE RULES (Must Follow Without Exception):
- You MUST use only the information contained in the document. Do NOT generate any information that is not clearly present or directly inferred from the document.
- You MUST NOT hallucinate or guess. If the document or RAG retrieval result does NOT contain relevant information, you MUST answer exactly:
  > "죄송합니다. 해당 내용을 찾을 수 없습니다."
- DO NOT answer from prior knowledge or assumptions. ONLY use what is in the document.
- Then, write the final answer in **Korean**, based on your reasoning.

※ Detailed Answering Guidelines:
- You MUST write a **multi-sentence answer**, not a single sentence. Provide enough explanation to help the user clearly understand.
- Actively utilize and expand on multiple parts of the document when constructing your answer.
- Rephrase the document content in your own words and logically explain the reasoning behind your answer.
- If needed, provide examples or elaborate on specific terms mentioned in the document.
- Keep your explanation **as simple and detailed as possible**, so that even beginners can understand.
- First, perform step-by-step reasoning in English using the document as evidence.


[Document]
{context}

[Question]
{question}

[Answer]
"""

prompt = PromptTemplate.from_template(template)
chain = prompt | llm | StrOutputParser()

def generate_answer(question: str) -> str:
    docs = query_multiple_indexes(query=question, embedding_model=embeddings)
    context = " ".join([doc['metadata']['text'] for doc in docs])
    return chain.invoke({"context": context, "question": question})

# RAG와 성능 비교용 (테스트)
# def generate_answer_NoRAG(question: str) -> str:
#     return chain.invoke({"context": '', "question": question})
