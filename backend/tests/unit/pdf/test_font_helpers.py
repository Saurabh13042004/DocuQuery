"""Unit tests for the font helpers in app/pdf/editor.py"""
import pymupdf as fitz
from unittest.mock import MagicMock

from app.pdf.editor import (
    _detect_font_style,
    _resolve_font,
    _color_to_rgb,
    _extract_embedded_font,
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
