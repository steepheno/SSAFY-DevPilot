from fastapi import FastAPI
from app.LLM.llm_router import router as llm_router 
from middleware import setup_middleware
from fastapi.staticfiles import StaticFiles
import logging

logging.basicConfig(level=logging.INFO)

app = FastAPI()

setup_middleware(app)
app.include_router(llm_router)
@app.get("/")
async def root():
    return {'Hello':'World!'}