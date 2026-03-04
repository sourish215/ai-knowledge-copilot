from sentence_transformers import SentenceTransformer

model = SentenceTransformer("BAAI/bge-small-en")

def generate_embedding(text):
    embedding = model.encode(text)
    return embedding.tolist()