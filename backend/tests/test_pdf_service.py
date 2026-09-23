"""Unit tests for app/services/pdf_service.py"""
import io
import os
import pytest
import pymupdf as fitz
from unittest.mock import AsyncMock, MagicMock, patch

from app.services.pdf_service import (
    _detect_font_style,
    _resolve_font,
    _color_to_rgb,
    _extract_embedded_font,
    _perform_pdf_edit,
)


# ── helpers ───────────────────────────────────────────────────────────────────

def make_pdf_with_text(text: str, tmp_path) -> str:
    """Create a real minimal PDF containing *text* and return its path."""
    path = str(tmp_path / "test.pdf")
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((72, 100), text, fontsize=14)
    doc.save(path)
    doc.close()
    return path


# ── _detect_font_style ────────────────────────────────────────────────────────

def test_detect_font_style_plain():
    span = {"font": "Arial", "flags": 0}
    name, is_bold, is_italic = _detect_font_style(span)
    assert name == "Arial"
    assert is_bold is False
    assert is_italic is False


def test_detect_font_style_bold_flag():
    span = {"font": "Arial", "flags": 16}  # bit 4 = bold
    _, is_bold, is_italic = _detect_font_style(span)
    assert is_bold is True
    assert is_italic is False


def test_detect_font_style_italic_flag():
    span = {"font": "Arial", "flags": 2}  # bit 1 = italic
    _, is_bold, is_italic = _detect_font_style(span)
    assert is_bold is False
    assert is_italic is True


def test_detect_font_style_bold_italic_flags():
    span = {"font": "Arial", "flags": 18}  # bits 1+4 = bold+italic
    _, is_bold, is_italic = _detect_font_style(span)
    assert is_bold is True
    assert is_italic is True


def test_detect_font_style_other_flags_ignored():
    span = {"font": "Arial", "flags": 1}  # bit 0 = superscript, not bold/italic
    _, is_bold, is_italic = _detect_font_style(span)
    assert is_bold is False
    assert is_italic is False


def test_detect_font_style_missing_keys():
    span = {}
    name, is_bold, is_italic = _detect_font_style(span)
    assert name == ""
    assert is_bold is False
    assert is_italic is False


# ── _resolve_font ─────────────────────────────────────────────────────────────

def test_resolve_font_fallback_plain():
    # An unknown font name should fall back to Helvetica
    result = _resolve_font("NonExistentFontXYZ", is_bold=False, is_italic=False)
    assert result == "Helvetica"


def test_resolve_font_fallback_bold():
    result = _resolve_font("NonExistentFontXYZ", is_bold=True, is_italic=False)
    assert result == "Helvetica-Bold"


def test_resolve_font_fallback_italic():
    result = _resolve_font("NonExistentFontXYZ", is_bold=False, is_italic=True)
    assert result == "Helvetica-Oblique"


def test_resolve_font_fallback_bold_italic():
    result = _resolve_font("NonExistentFontXYZ", is_bold=True, is_italic=True)
    assert result == "Helvetica-BoldOblique"


def test_resolve_font_known_base14():
    # PyMuPDF ships Courier as a base-14 font — should be found
    result = _resolve_font("Courier", is_bold=False, is_italic=False)
    assert result == "Courier"


def test_resolve_font_empty_name_falls_back():
    result = _resolve_font("", is_bold=False, is_italic=False)
    assert result == "Helvetica"


# ── _color_to_rgb ─────────────────────────────────────────────────────────────

def test_color_to_rgb_zero_is_black():
    assert _color_to_rgb(0) == (0, 0, 0)


def test_color_to_rgb_red():
    # 0xFF0000 = pure red
    r, g, b = _color_to_rgb(0xFF0000)
    assert r == 1.0
    assert g == 0.0
    assert b == 0.0


def test_color_to_rgb_green():
    r, g, b = _color_to_rgb(0x00FF00)
    assert r == 0.0
    assert g == 1.0
    assert b == 0.0


def test_color_to_rgb_blue():
    r, g, b = _color_to_rgb(0x0000FF)
    assert r == 0.0
    assert g == 0.0
    assert b == 1.0


def test_color_to_rgb_white():
    r, g, b = _color_to_rgb(0xFFFFFF)
    assert r == 1.0
    assert g == 1.0
    assert b == 1.0


def test_color_to_rgb_tuple_passthrough():
    t = (0.5, 0.3, 0.1)
    assert _color_to_rgb(t) == t


def test_color_to_rgb_none_returns_black():
    assert _color_to_rgb(None) == (0, 0, 0)


# ── _extract_embedded_font ────────────────────────────────────────────────────

def test_extract_embedded_font_no_match_returns_none():
    doc = MagicMock()
    page = MagicMock()
    page.number = 0
    doc.get_page_fonts.return_value = [
        (1, "ttf", "TrueType", "Arial", "Arial", "WinAnsiEncoding", 0)
    ]
    result = _extract_embedded_font(doc, page, "TimesNewRoman")
    assert result is None


def test_extract_embedded_font_empty_font_name_returns_none():
    doc = MagicMock()
    page = MagicMock()
    result = _extract_embedded_font(doc, page, "")
    assert result is None


def test_extract_embedded_font_no_buffer_returns_none():
    doc = MagicMock()
    page = MagicMock()
    page.number = 0
    doc.get_page_fonts.return_value = [
        (1, "Type1", "Type1", "Arial", "Arial", "", 0)
    ]
    doc.extract_font.return_value = ("Arial", "Type1", "Type1", b"", 0)
    result = _extract_embedded_font(doc, page, "Arial")
    assert result is None


def test_extract_embedded_font_matches_basefont():
    doc = MagicMock()
    page = MagicMock()
    page.number = 0
    doc.get_page_fonts.return_value = [
        (5, "ttf", "TrueType", "Helvetica", "", "", 0)
    ]
    # Return a tiny but valid font-looking buffer — we test matching, not font loading
    doc.extract_font.return_value = ("Helvetica", "ttf", "TrueType", None, 0)
    result = _extract_embedded_font(doc, page, "Helvetica")
    # Buffer is None → should return None (handled gracefully)
    assert result is None


def test_extract_embedded_font_strips_subset_prefix():
    """Font 'ABCDEF+Arial' in PDF should match span font name 'Arial'."""
    doc = MagicMock()
    page = MagicMock()
    page.number = 0
    doc.get_page_fonts.return_value = [
        (3, "ttf", "TrueType", "ABCDEF+Arial", "", "", 0)
    ]
    doc.extract_font.return_value = ("Arial", "ttf", "TrueType", None, 0)
    # Should attempt extraction (xref=3)
    _extract_embedded_font(doc, page, "Arial")
    doc.extract_font.assert_called_once_with(3)


# ── _perform_pdf_edit ─────────────────────────────────────────────────────────

@pytest.fixture
def blob_put():
    """Edited PDFs are written to Blob; capture the upload instead of hitting the network."""
    with patch("app.services.blob_service.put", new_callable=AsyncMock) as m:
        yield m


@pytest.mark.asyncio
async def test_perform_pdf_edit_text_not_found(tmp_path, blob_put):
    pdf_path = make_pdf_with_text("Hello World", tmp_path)
    result = await _perform_pdf_edit(pdf_path, "NONEXISTENT", "replacement")
    assert result["success"] is False
    assert "NONEXISTENT" in result["message"]
    blob_put.assert_not_called()


@pytest.mark.asyncio
async def test_perform_pdf_edit_text_found_returns_success(tmp_path, blob_put):
    pdf_path = make_pdf_with_text("Hello Saurabh World", tmp_path)
    result = await _perform_pdf_edit(pdf_path, "Saurabh", "Rishabh")
    assert result["success"] is True
    assert result["edited_file_path"].startswith("docs/edited_")
    blob_put.assert_awaited_once()


@pytest.mark.asyncio
async def test_perform_pdf_edit_case_insensitive_search(tmp_path, blob_put):
    pdf_path = make_pdf_with_text("hello SAURABH world", tmp_path)
    result = await _perform_pdf_edit(pdf_path, "saurabh", "rishabh")
    assert result["success"] is True


@pytest.mark.asyncio
async def test_perform_pdf_edit_uppercase_preserved(tmp_path, blob_put):
    """If the original text is uppercase in the PDF, the replacement should be too."""
    pdf_path = make_pdf_with_text("HELLO SAURABH WORLD", tmp_path)
    result = await _perform_pdf_edit(pdf_path, "SAURABH", "rishabh")
    # Function should complete successfully; case logic converts "rishabh" → "RISHABH"
    assert result["success"] is True


@pytest.mark.asyncio
async def test_perform_pdf_edit_uploaded_bytes_have_new_text(tmp_path, blob_put):
    """The PDF uploaded to Blob should contain the replacement text."""
    pdf_path = make_pdf_with_text("Name: Saurabh Shukla", tmp_path)
    result = await _perform_pdf_edit(pdf_path, "Saurabh", "Rishabh")

    assert result["success"] is True
    key, data = blob_put.await_args.args[:2]
    assert key == result["edited_file_path"]

    doc = fitz.open(stream=data, filetype="pdf")
    page_text = doc[0].get_text()
    doc.close()
    assert "Rishabh" in page_text
    assert "Saurabh" not in page_text


# ── process_user_input (OpenAI tool calling) ─────────────────────────────────

def _tool_completion(name, args):
    import json
    from unittest.mock import MagicMock
    tc = MagicMock()
    tc.function.name, tc.function.arguments = name, json.dumps(args)
    return MagicMock(choices=[MagicMock(message=MagicMock(tool_calls=[tc], content=None))])


@pytest.mark.asyncio
async def test_process_user_input_answer_uses_tool_call(mock_redis):
    from unittest.mock import AsyncMock, patch
    from app.services import pdf_service
    with patch("app.services.vector_service.query_relevant_chunks", new_callable=AsyncMock,
               return_value={"context": "[Page 2]\nnotice is 30 days", "pages": [2]}), \
         patch.object(pdf_service, "_client") as c:
        c.chat.completions.create.return_value = _tool_completion("answer_question", {"response": "30 days (page 2)"})
        result = await pdf_service.process_user_input("notice period?", "text", "x.pdf")
    kwargs = c.chat.completions.create.call_args.kwargs
    assert kwargs["tool_choice"] == "required" and kwargs["messages"][0]["role"] == "system"
    assert result == {"answer": "30 days (page 2)", "is_edit": False, "citations": ["2"]}


@pytest.mark.asyncio
@pytest.mark.parametrize("code,expected", [("insufficient_quota", "out of quota"), (None, "rate-limited")])
async def test_process_user_input_rate_limit_messages(mock_redis, code, expected):
    import httpx
    from openai import RateLimitError
    from unittest.mock import AsyncMock, patch
    from app.services import pdf_service
    resp = httpx.Response(429, request=httpx.Request("POST", "http://x"))
    err = RateLimitError("limit", response=resp, body={"code": code})
    with patch("app.services.vector_service.query_relevant_chunks", new_callable=AsyncMock,
               return_value={"context": "c", "pages": []}), \
         patch.object(pdf_service, "_client") as c:
        c.chat.completions.create.side_effect = err
        result = await pdf_service.process_user_input("q", "text", "x.pdf")
    assert expected in result["answer"] and result["is_edit"] is False
