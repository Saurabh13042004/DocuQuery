from app.rag.types import CONTEXT_SEPARATOR, Retrieval, RetrievedChunk


def chunk(text, page):
    return RetrievedChunk(text=text, page=page, document_id=1, chunk_index=0)


def test_context_tags_each_chunk_with_its_page_so_the_model_can_cite():
    r = Retrieval([chunk("alpha", 2), chunk("beta", 5)])
    assert r.context == f"[Page 2]\nalpha{CONTEXT_SEPARATOR}[Page 5]\nbeta"


def test_chunks_without_a_page_are_left_untagged():
    assert Retrieval([chunk("plain", 0)]).context == "plain"


def test_pages_are_unique_sorted_and_skip_unknown():
    assert Retrieval([chunk("a", 5), chunk("b", 2), chunk("c", 5), chunk("d", 0)]).pages == [2, 5]


def test_empty_retrieval():
    assert Retrieval().context == "" and Retrieval().pages == []
