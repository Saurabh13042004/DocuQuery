import os
import asyncio
import hashlib
from collections import Counter
from upstash_vector import Index, Vector
from upstash_vector.types import SparseVector
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

_index = Index(
    url=os.environ["UPSTASH_VECTOR_REST_URL"].strip('"'),
    token=os.environ["UPSTASH_VECTOR_REST_TOKEN"].strip('"')
)

_openai = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

EMBEDDING_MODEL = os.environ.get("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
OUTPUT_DIM = 768        # matches the Upstash vector index dimension (text-embedding-3 can shorten its output)
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
    result = _openai.embeddings.create(model=EMBEDDING_MODEL, input=texts, dimensions=OUTPUT_DIM)
    return [d.embedding for d in result.data]


def _embed_single(text: str) -> list[float]:
    return _embed_batch([text])[0]


async def index_document(document_id: int, text: str, pages: list[str] | None = None) -> int:
    """Chunk, embed, and upsert into the hybrid index.

    If *pages* is provided (one string per PDF page), chunks are created
    per page so each vector carries an accurate page_number in its metadata.
    Otherwise the full *text* is chunked without page attribution.
    """
    if pages:
        # Build (chunk_text, page_number) pairs chunked within each page
        chunk_pairs: list[tuple[str, int]] = []
        for page_num, page_text in enumerate(pages, start=1):
            for chunk in _chunk_text(page_text):
                chunk_pairs.append((chunk, page_num))
    else:
        chunk_pairs = [(chunk, 0) for chunk in _chunk_text(text)]

    if not chunk_pairs:
        return 0

    loop = asyncio.get_event_loop()
    chunks_only = [c for c, _ in chunk_pairs]

    EMBED_BATCH = 50
    all_embeddings: list[list[float]] = []
    for i in range(0, len(chunks_only), EMBED_BATCH):
        embeddings = await loop.run_in_executor(None, _embed_batch, chunks_only[i:i + EMBED_BATCH])
        all_embeddings.extend(embeddings)

    vectors = [
        Vector(
            id=f"doc_{document_id}_chunk_{i}",
            vector=embedding,
            sparse_vector=_compute_sparse(chunk),
            metadata={
                "document_id": document_id,
                "chunk_index": i,
                "page_number": page_num,
                "text": chunk,
            }
        )
        for i, ((chunk, page_num), embedding) in enumerate(zip(chunk_pairs, all_embeddings))
    ]

    UPSERT_BATCH = 100
    for i in range(0, len(vectors), UPSERT_BATCH):
        await loop.run_in_executor(None, _index.upsert, vectors[i:i + UPSERT_BATCH])

    return len(vectors)


async def query_relevant_chunks(document_id: int, question: str) -> dict:
    """Hybrid query returning context text and source page numbers.

    Returns {"context": str, "pages": list[int]}.
    Context has [Page N] prefixes so the LLM can cite them naturally.
    """
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

    parts: list[str] = []
    pages: list[int] = []
    for r in results:
        if not (r.metadata and "text" in r.metadata):
            continue
        page_num = r.metadata.get("page_number", 0)
        text = r.metadata["text"]
        if page_num:
            parts.append(f"[Page {page_num}]\n{text}")
            if page_num not in pages:
                pages.append(page_num)
        else:
            parts.append(text)

    return {"context": "\n\n---\n\n".join(parts), "pages": sorted(pages)}


async def delete_document(document_id: int, chunk_count: int):
    """Remove all vectors for a document from the index."""
    ids = [f"doc_{document_id}_chunk_{i}" for i in range(chunk_count)]
    if ids:
        loop = asyncio.get_event_loop()
        for i in range(0, len(ids), 100):
            await loop.run_in_executor(None, lambda b=ids[i:i+100]: _index.delete(ids=b))
