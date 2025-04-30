from fastapi import FastAPI
from middleware import setup_middleware
from fastapi.staticfiles import StaticFiles
import logging

logging.basicConfig(level=logging.INFO)

app = FastAPI()

setup_middleware(app)
app.mount("/static", StaticFiles(directory="."), name="static")
@app.get("/")
async def root():
    return {'Hello':'World!'}