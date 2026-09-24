from types import SimpleNamespace as NS

from app.infrastructure.vectorstore.upstash import (
    SPARSE_DIM, UPSERT_BATCH, UpstashVectorStore, document_filter, sparse_vector,
)
from app.rag.types import VectorRecord


class FakeIndex:
    def __init__(self, hybrid: bool, results=()):
        self.hybrid, self.results = hybrid, list(results)
        self.info_calls, self.upserts, self.queries, self.deletes = 0, [], [], []

    def info(self):
        self.info_calls += 1
        return NS(sparse_index=object() if self.hybrid else None)

    def upsert(self, vectors):
        self.upserts.append(list(vectors))

    def query(self, **kwargs):
        self.queries.append(kwargs)
        return self.results

    def delete(self, **kwargs):
        self.deletes.append(kwargs)


def record(i, doc=7, text="alpha beta"):
    return VectorRecord(id=f"doc_{doc}_chunk_{i}", embedding=[0.1, 0.2], text=text, document_id=doc, chunk_index=i, page=2)


def store(hybrid=True, results=()):
    index = FakeIndex(hybrid, results)
    return UpstashVectorStore("u", "t", index=index), index


def test_sparse_vector_is_deterministic_normalised_and_in_range():
    a, b = sparse_vector("Alpha beta, beta!"), sparse_vector("alpha beta beta")
    assert a.indices and all(0 <= i < SPARSE_DIM for i in a.indices)
    assert sorted(zip(a.indices, a.values)) == sorted(zip(b.indices, b.values))   # same words -> same vector
    assert abs(sum(a.values) - 1.0) < 1e-9                                        # term frequencies sum to 1


def test_sparse_vector_of_text_without_words_is_a_harmless_placeholder():
    v = sparse_vector("!!! ???")
    assert v.indices == [0] and v.values == [0.0]


def test_document_filter_for_one_or_many_documents():
    assert document_filter([5]) == "document_id = 5"
    assert document_filter([1, 2, 3]) == "document_id IN (1, 2, 3)"


async def test_hybrid_index_receives_sparse_vectors_and_metadata():
    s, index = store(hybrid=True)
    await s.upsert([record(0)])
    v = index.upserts[0][0]
    assert v.sparse_vector is not None and v.id == "doc_7_chunk_0"
    assert v.metadata == {"document_id": 7, "chunk_index": 0, "page_number": 2, "text": "alpha beta"}


async def test_dense_only_index_never_receives_sparse_vectors():
    s, index = store(hybrid=False)
    await s.upsert([record(0)])
    await s.query([0.1, 0.2], "alpha", [7], 5)
    assert index.upserts[0][0].sparse_vector is None and index.queries[0]["sparse_vector"] is None


async def test_the_index_type_is_looked_up_only_once():
    s, index = store()
    await s.upsert([record(0)])
    await s.query([0.1], "q", [7], 3)
    assert index.info_calls == 1


async def test_upserts_are_sent_in_batches():
    s, index = store()
    await s.upsert([record(i) for i in range(UPSERT_BATCH * 2 + 1)])
    assert [len(b) for b in index.upserts] == [UPSERT_BATCH, UPSERT_BATCH, 1]


async def test_query_filters_by_document_and_maps_results_skipping_ones_without_text():
    hits = [
        NS(metadata={"text": "hit", "page_number": 3, "document_id": 7, "chunk_index": 1}, score=0.9),
        NS(metadata={"document_id": 7}, score=0.8),     # no text: unusable
        NS(metadata=None, score=0.7),
    ]
    s, index = store(results=hits)
    chunks = await s.query([0.1], "q", [7], 4)
    assert index.queries[0]["filter"] == "document_id = 7" and index.queries[0]["top_k"] == 4
    assert index.queries[0]["include_metadata"] is True
    assert [(c.text, c.page, c.document_id, c.score) for c in chunks] == [("hit", 3, 7, 0.9)]


async def test_delete_uses_the_document_prefix_so_other_documents_are_untouched():
    s, index = store()
    await s.delete_document(1)
    assert index.deletes == [{"prefix": "doc_1_chunk_"}]      # "doc_1_chunk_" cannot match "doc_10_chunk_..."
