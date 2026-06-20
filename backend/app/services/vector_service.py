import os
import asyncio
import hashlib
from collections import Counter
from upstash_vector import Index, Vector
from upstash_vector.types import SparseVector
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

_index = Index(
    url=os.environ["UPSTASH_VECTOR_REST_URL"].strip('"'),
    token=os.environ["UPSTASH_VECTOR_REST_TOKEN"].strip('"')
)

_gemini = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

EMBEDDING_MODEL = "gemini-embedding-001"
OUTPUT_DIM = 768        # matches the Upstash vector index dimension
CHUNK_SIZE = 400        # words per chunk
CHUNK_OVERLAP = 50      # word overlap between chunks
TOP_K = 5               # top chunks to retrieve per query
SPARSE_DIM = 50_000     # hash space for sparse term indices


def _chunk_text(text: str) -> list[str]:
    words = text.split()
    chunks = []
    step = CHUNK_SIZE - CHUNK_OVERLAP
    for i in range(0, len(words), step):
        chunk = " ".join(words[i:i + CHUNK_SIZE])
        if chunk.strip():
            chunks.append(chunk)
    return chunks


def _compute_sparse(text: str) -> SparseVector:
    """
    TF-based sparse vector using consistent term hashing.
    Same function used at index and query time so indices always align.
    """
    words = [w.lower() for w in text.split() if w.isalnum()]
    if not words:
        return SparseVector(indices=[0], values=[0.0])

    counts = Counter(words)
    total = len(words)

    seen = {}
    for word, count in counts.items():
        # Hash word to fixed index space — consistent across calls
        idx = int(hashlib.sha256(word.encode()).hexdigest(), 16) % SPARSE_DIM
        tf = count / total
        # Accumulate if hash collision
        seen[idx] = seen.get(idx, 0.0) + tf

    indices = list(seen.keys())
    values = list(seen.values())
    return SparseVector(indices=indices, values=values)


def _embed_batch(texts: list[str]) -> list[list[float]]:
    result = _gemini.models.embed_content(
        model=EMBEDDING_MODEL,
        contents=texts,
        config=types.EmbedContentConfig(output_dimensionality=OUTPUT_DIM)
    )
    return [e.values for e in result.embeddings]


def _embed_single(text: str) -> list[float]:
    return _embed_batch([text])[0]


async def index_document(document_id: int, text: str) -> int:
    """Chunk, embed, compute sparse, and upsert PDF text into the hybrid index."""
    chunks = _chunk_text(text)
    if not chunks:
        return 0

    loop = asyncio.get_event_loop()

    # Batch embed dense vectors
    EMBED_BATCH = 50
    all_embeddings = []
    for i in range(0, len(chunks), EMBED_BATCH):
        batch = chunks[i:i + EMBED_BATCH]
        embeddings = await loop.run_in_executor(None, _embed_batch, batch)
        all_embeddings.extend(embeddings)

    vectors = [
        Vector(
            id=f"doc_{document_id}_chunk_{i}",
            vector=embedding,
            sparse_vector=_compute_sparse(chunk),
            metadata={
                "document_id": document_id,
                "chunk_index": i,
                "text": chunk
            }
        )
        for i, (chunk, embedding) in enumerate(zip(chunks, all_embeddings))
    ]

    # Upsert in batches of 100
    UPSERT_BATCH = 100
    for i in range(0, len(vectors), UPSERT_BATCH):
        await loop.run_in_executor(None, _index.upsert, vectors[i:i + UPSERT_BATCH])

    return len(chunks)


async def query_relevant_chunks(document_id: int, question: str) -> str:
    """Hybrid query: dense semantic + sparse keyword, filtered by document."""
    loop = asyncio.get_event_loop()
    dense = await loop.run_in_executor(None, _embed_single, question)
    sparse = _compute_sparse(question)

    results = await loop.run_in_executor(
        None,
        lambda: _index.query(
            vector=dense,
            sparse_vector=sparse,
            top_k=TOP_K,
            include_metadata=True,
            filter=f"document_id = {document_id}"
        )
    )

    chunks = [
        r.metadata["text"]
        for r in results
        if r.metadata and "text" in r.metadata
    ]
    return "\n\n---\n\n".join(chunks)


async def delete_document(document_id: int, chunk_count: int):
    """Remove all vectors for a document from the index."""
    ids = [f"doc_{document_id}_chunk_{i}" for i in range(chunk_count)]
    if ids:
        loop = asyncio.get_event_loop()
        for i in range(0, len(ids), 100):
            await loop.run_in_executor(None, lambda b=ids[i:i+100]: _index.delete(ids=b))
