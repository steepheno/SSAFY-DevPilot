from dotenv import load_dotenv
import os

load_dotenv()

PINECONE_API_KEY = os.getenv("PINECOIN_KEY")
INDEX_NAME = os.getenv("PINECONE_INDEX")
MODEL_ID = os.getenv("MODEL_ID")
EMBEDDING_ID = os.getenv("EMBEDDING_ID")
API_URL = os.getenv("API_URL")