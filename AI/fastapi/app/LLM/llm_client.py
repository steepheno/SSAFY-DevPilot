import requests
from app.core.config import API_URL

API_PATHS = {
    "generate_with_rag": "/api/llm/generations",
}

def build_url(path: str) -> str:
    return f"{API_URL.rstrip('/')}/{path.lstrip('/')}"

def ask_with_rag(question: str):
    url = build_url(API_PATHS["generate_with_rag"])
    return requests.post(url, json={"question": question}).json()
