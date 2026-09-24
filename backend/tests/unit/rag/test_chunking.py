import pytest

from app.rag.chunking import TextChunker


def words(n, prefix="w"):
    return " ".join(f"{prefix}{i}" for i in range(n))


def test_short_text_is_a_single_chunk():
    assert TextChunker().chunk_text("just a few words") == ["just a few words"]


def test_empty_and_whitespace_text_produce_no_chunks():
    assert TextChunker().chunk_text("") == [] and TextChunker().chunk_text("   \n ") == []


def test_chunks_are_size_limited_and_overlap():
    chunks = TextChunker(size=10, overlap=3).chunk_text(words(25))
    assert all(len(c.split()) <= 10 for c in chunks)
    assert chunks[0].split()[-3:] == chunks[1].split()[:3]      # the overlap carries context across the cut
    assert " ".join(chunks[0].split()[:1] + chunks[-1].split()[-1:]) == "w0 w24"  # nothing dropped at either end


def test_pages_are_chunked_separately_with_page_numbers_and_running_index():
    chunks = TextChunker(size=5, overlap=1).chunk_pages([words(7, "a"), "", words(3, "c")])
    assert [(c.page, c.index) for c in chunks] == [(1, 0), (1, 1), (3, 2)]
    assert all(c.text.split()[0][0] == ("a" if c.page == 1 else "c") for c in chunks)  # no text bleeds across pages


@pytest.mark.parametrize("size,overlap", [(0, 0), (5, 5), (5, 6), (5, -1)])
def test_invalid_window_is_rejected(size, overlap):
    with pytest.raises(ValueError):
        TextChunker(size=size, overlap=overlap)
