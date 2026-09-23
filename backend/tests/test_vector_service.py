"""Unit tests for app/services/vector_service.py"""
import pytest
from unittest.mock import MagicMock, patch, AsyncMock

from app.services.vector_service import (
    _chunk_text,
    _compute_sparse,
    CHUNK_SIZE,
    CHUNK_OVERLAP,
    SPARSE_DIM,
    TOP_K,
)


# ── _chunk_text ───────────────────────────────────────────────────────────────

def test_chunk_text_empty_returns_empty():
    assert _chunk_text("") == []


def test_chunk_text_whitespace_returns_empty():
    assert _chunk_text("   ") == []


def test_chunk_text_single_chunk_short_text():
    text = "hello world this is a short document"
    chunks = _chunk_text(text)
    assert len(chunks) == 1
    assert chunks[0] == text


def test_chunk_text_produces_multiple_chunks():
    words = ["word"] * (CHUNK_SIZE + CHUNK_OVERLAP + 10)
    text = " ".join(words)
    chunks = _chunk_text(text)
    assert len(chunks) > 1


def test_chunk_text_chunk_size_respected():
    words = ["word"] * (CHUNK_SIZE * 3)
    text = " ".join(words)
    chunks = _chunk_text(text)
    for chunk in chunks:
        assert len(chunk.split()) <= CHUNK_SIZE


def test_chunk_text_overlap_shares_words():
    # Create text slightly larger than one chunk
    words = [f"w{i}" for i in range(CHUNK_SIZE + CHUNK_OVERLAP + 5)]
    text = " ".join(words)
    chunks = _chunk_text(text)
    assert len(chunks) >= 2
    # The end words of chunk[0] should appear at the start of chunk[1]
    end_words = chunks[0].split()[-(CHUNK_OVERLAP):]
    start_words = chunks[1].split()[:CHUNK_OVERLAP]
    assert end_words == start_words


def test_chunk_text_all_content_preserved():
    words = [f"unique{i}" for i in range(CHUNK_SIZE + 10)]
    text = " ".join(words)
    chunks = _chunk_text(text)
    combined = " ".join(chunks)
    for word in words:
        assert word in combined


# ── _compute_sparse ───────────────────────────────────────────────────────────

def test_compute_sparse_empty_text_returns_default():
    sv = _compute_sparse("")
    assert sv.indices == [0]
    assert sv.values == [0.0]


def test_compute_sparse_non_alpha_only_returns_default():
    sv = _compute_sparse("!!! ??? ...")
    assert sv.indices == [0]
    assert sv.values == [0.0]


def test_compute_sparse_returns_sparse_vector():
    from upstash_vector.types import SparseVector
    sv = _compute_sparse("hello world")
    assert isinstance(sv, SparseVector)


def test_compute_sparse_indices_in_valid_range():
    sv = _compute_sparse("the quick brown fox jumps over the lazy dog")
    for idx in sv.indices:
        assert 0 <= idx < SPARSE_DIM


def test_compute_sparse_values_are_positive():
    sv = _compute_sparse("hello world test document")
    for v in sv.values:
        assert v > 0


def test_compute_sparse_consistent_same_text():
    text = "DocuQuery is a PDF assistant"
    sv1 = _compute_sparse(text)
    sv2 = _compute_sparse(text)
    assert sv1.indices == sv2.indices
    assert sv1.values == sv2.values


def test_compute_sparse_different_text_different_result():
    sv1 = _compute_sparse("hello world")
    sv2 = _compute_sparse("completely different sentence")
    assert sv1.indices != sv2.indices


def test_compute_sparse_tf_weights_sum_to_one():
    text = "a b c"  # 3 unique words, each appears once → tf = 1/3 each
    sv = _compute_sparse(text)
    assert abs(sum(sv.values) - 1.0) < 1e-9


def test_compute_sparse_repeated_word_higher_weight():
    sv_single = _compute_sparse("hello world")
    sv_repeated = _compute_sparse("hello hello hello world")
    # "hello" index should have higher weight in repeated version
    hello_idx_single = sv_single.indices[0] if len(sv_single.indices) == 2 else None
    # Just verify repeated text produces a non-trivial sparse vector
    assert len(sv_repeated.indices) >= 1
    assert max(sv_repeated.values) > max(sv_single.values)


# ── index_document and query_relevant_chunks (mocked) ────────────────────────

@pytest.mark.asyncio
async def test_index_document_empty_text_returns_zero(mock_vector_index, mock_vector_openai):
    from app.services.vector_service import index_document
    count = await index_document(1, "")
    assert count == 0
    mock_vector_index.upsert.assert_not_called()


@pytest.mark.asyncio
async def test_index_document_upserts_chunks(mock_vector_index, mock_vector_openai):
    from app.services.vector_service import index_document
    text = " ".join(["word"] * 10)
    count = await index_document(42, text)
    assert count == 1
    mock_vector_index.upsert.assert_called_once()
    vectors = mock_vector_index.upsert.call_args[0][0]
    assert vectors[0].id == "doc_42_chunk_0"
    assert vectors[0].metadata["document_id"] == 42


@pytest.mark.asyncio
async def test_query_relevant_chunks_returns_joined_text(mock_vector_index, mock_vector_openai):
    from app.services.vector_service import query_relevant_chunks

    r1 = MagicMock()
    r1.metadata = {"text": "First chunk", "document_id": 1}
    r2 = MagicMock()
    r2.metadata = {"text": "Second chunk", "document_id": 1}
    mock_vector_index.query.return_value = [r1, r2]

    result = await query_relevant_chunks(1, "What is this about?")
    assert "First chunk" in result
    assert "Second chunk" in result


@pytest.mark.asyncio
async def test_query_relevant_chunks_empty_returns_empty_string(mock_vector_index, mock_vector_openai):
    from app.services.vector_service import query_relevant_chunks
    mock_vector_index.query.return_value = []
    result = await query_relevant_chunks(1, "anything")
    assert result == ""


@pytest.mark.asyncio
async def test_delete_document_calls_index_delete(mock_vector_index):
    from app.services.vector_service import delete_document
    await delete_document(5, 3)
    mock_vector_index.delete.assert_called()
    deleted_ids = mock_vector_index.delete.call_args[1]["ids"]
    assert "doc_5_chunk_0" in deleted_ids
    assert "doc_5_chunk_2" in deleted_ids
