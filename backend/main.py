from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from embeddings import generate_embedding
from db import supabase
from llm import stream_llm
from pypdf import PdfReader
from pydantic import BaseModel
import io

class ChatRequest(BaseModel):
    question: str

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/upload")
async def upload_doc(file: UploadFile = File(...)):

    content = await file.read()

    if file.filename.endswith(".pdf"):

        reader = PdfReader(io.BytesIO(content))
        text = ""

        for page in reader.pages:
            text += page.extract_text()

    else:
        text = content.decode("utf-8")

    embedding = generate_embedding(text)

    supabase.table("documents").insert({
        "content": text,
        "embedding": embedding
    }).execute()

    return {"message": "Document indexed"}

def search_docs(query_embedding):

    result = supabase.rpc(
        "match_documents",
        {
            "query_embedding": query_embedding,
            "match_count": 3
        }
    ).execute()

    return result.data

@app.post("/chat")
async def chat(req: ChatRequest):

    question = req.question

    query_embedding = generate_embedding(question)

    docs = search_docs(query_embedding)

    context = "\n".join([doc["content"] for doc in docs])

    prompt = f"""
Use the following context to answer the question.

Context:
{context}

Question:
{question}
"""

    return StreamingResponse(
        stream_llm(prompt),
        media_type="text/plain"
    )