# from sentence_transformers import SentenceTransformer

# model = SentenceTransformer("BAAI/bge-small-en")

# def generate_embedding(text):
#     embedding = model.encode(text)
#     return embedding.tolist()

from dotenv import load_dotenv
import os
import requests

load_dotenv()

HF_TOKEN = os.getenv("HF_TOKEN")

API_URL = "https://router.huggingface.co/hf-inference/models/BAAI/bge-small-en"

headers = {
    "Authorization": f"Bearer {HF_TOKEN}",
    "Content-Type": "application/json"
}

def generate_embedding(text):

    response = requests.post(
        API_URL,
        headers=headers,
        json={"inputs": text}
    )

    data = response.json()

    if isinstance(data, dict) and "error" in data:
        raise Exception(data["error"])
    
    embedding = data

    return embedding