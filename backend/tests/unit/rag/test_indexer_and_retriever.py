import pytest

from app.rag.chunking import TextChunker
from app.rag.indexer import DocumentIndexer, chunk_id
from app.rag.retriever import VectorRetriever
from tests.fakes import FakeEmbedder, InMemoryVectorStore

PAGES = [
    "The notice period is thirty days for all employees.",
    "Salary is paid monthly by bank transfer on the last working day.",
    "Termination requires written notice signed by both parties.",
]


@pytest.fixture
def parts():
    embedder, store = FakeEmbedder(), InMemoryVectorStore()
    return embedder, store, DocumentIndexer(embedder, store, TextChunker(size=50, overlap=5), embed_batch=2)


async def test_index_stores_one_record_per_chunk_with_page_metadata(parts):
    _, store, indexer = parts
    assert await indexer.index(7, PAGES) == 3
    records = sorted(store.for_document(7), key=lambda r: r.chunk_index)
    assert [r.id for r in records] == [chunk_id(7, i) for i in range(3)] == ["doc_7_chunk_0", "doc_7_chunk_1", "doc_7_chunk_2"]
    assert [r.page for r in records] == [1, 2, 3] and records[0].text == PAGES[0]


async def test_embeddings_are_requested_in_batches(parts):
    embedder, _, indexer = parts
    await indexer.index(1, PAGES)
    assert [len(call) for call in embedder.calls] == [2, 1]


async def test_a_document_with_no_text_indexes_nothing_and_calls_nothing(parts):
    embedder, store, indexer = parts
    assert await indexer.index(1, ["", "   "]) == 0
    assert embedder.calls == [] and store.records == {}


async def test_replace_clears_stale_chunks_when_a_document_shrinks(parts):
    _, store, indexer = parts
    await indexer.index(1, PAGES)
    await indexer.index(1, PAGES[:1], replace=True)
    assert len(store.for_document(1)) == 1


async def test_remove_only_touches_that_document(parts):
    _, store, indexer = parts
    await indexer.index(1, PAGES)
    await indexer.index(2, PAGES)
    await indexer.remove(1)
    assert store.for_document(1) == [] and len(store.for_document(2)) == 3


async def test_retriever_finds_the_relevant_page_and_scopes_to_the_document(parts):
    embedder, store, indexer = parts
    await indexer.index(1, PAGES)
    await indexer.index(2, ["Completely unrelated notice period text belonging to another document."])
    retrieval = await VectorRetriever(embedder, store, top_k=1).retrieve("what is the notice period", [1])
    assert retrieval.pages == [1] and "thirty days" in retrieval.context
    assert all(c.document_id == 1 for c in retrieval.chunks)


async def test_retriever_respects_top_k_and_returns_nothing_for_unindexed_documents(parts):
    embedder, store, indexer = parts
    await indexer.index(1, PAGES)
    assert len((await VectorRetriever(embedder, store, top_k=2).retrieve("notice salary termination", [1])).chunks) <= 2
    assert (await VectorRetriever(embedder, store).retrieve("anything", [99])).chunks == []
