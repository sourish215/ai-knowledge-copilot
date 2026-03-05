from fastapi import FastAPI, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from embeddings import generate_embedding
from db import supabase
from llm import stream_llm

from pypdf import PdfReader
import io


class ChatRequest(BaseModel):
    question: str


app = FastAPI()


# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://ai-knowledge-copilot-mu.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------
# TEXT CHUNKING
# ---------------------------

def split_text(text, chunk_size=500, overlap=50):

    chunks = []
    start = 0

    while start < len(text):

        end = start + chunk_size
        chunks.append(text[start:end])

        start += chunk_size - overlap

    return chunks


# ---------------------------
# FILE UPLOAD
# ---------------------------

@app.post("/upload")
async def upload(file: UploadFile):

    content = await file.read()

    # Extract text depending on file type
    if file.filename.endswith(".pdf"):

        reader = PdfReader(io.BytesIO(content))

        text = "\n".join(
            [page.extract_text() or "" for page in reader.pages]
        )

    else:
        text = content.decode()


    if not text.strip():
        return {"error": "No text extracted from file"}

    filename = file.filename


    # Insert document
    doc = supabase.table("documents").insert({
        "name": filename
    }).execute()

    document_id = doc.data[0]["id"]


    # Split text into chunks
    chunks = split_text(text)


    rows = []

    for chunk in chunks:

        embedding = generate_embedding(chunk)

        rows.append({
            "document_id": document_id,
            "content": chunk,
            "embedding": embedding
        })


    # Batch insert embeddings
    supabase.table("document_embeddings").insert(rows).execute()

    return {"status": "indexed"}


# ---------------------------
# VECTOR SEARCH
# ---------------------------

def search_docs(query_embedding):

    result = supabase.rpc(
        "match_documents",
        {
            "query_embedding": query_embedding,
            "match_count": 3
        }
    ).execute()

    return result.data


# ---------------------------
# CHAT ENDPOINT
# ---------------------------

@app.post("/chat")
async def chat(req: ChatRequest):

    question = req.question

    query_embedding = generate_embedding(question)

    docs = search_docs(query_embedding)

    context = "\n".join([doc["content"] for doc in docs])


    prompt = f"""
        You are an AI assistant answering questions based on internal documents.

        Use ONLY the provided context.

        If the answer is not found in the context, say you don't know.

        Context:
        {context}

        Question:
        {question}"""


    return StreamingResponse(
        stream_llm(prompt),
        media_type="text/plain"
    )


# ---------------------------
# LIST DOCUMENTS
# ---------------------------

@app.get("/documents")
def list_documents():

    res = supabase.table("documents") \
        .select("id, name") \
        .order("created_at", desc=True) \
        .execute()

    return res.data