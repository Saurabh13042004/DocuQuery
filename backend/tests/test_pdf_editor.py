"""Tests for the PDF text-replacement engine (app/services/pdf_editor.py).

All PDFs are generated in-memory, so the tests need no fixtures on disk.
"""
from pathlib import Path

import pymupdf as fitz
import pytest

from app.services import pdf_editor as pe

DEJAVU = Path(__file__).resolve().parent.parent / "fonts" / "DejaVuSerifCondensed.ttf"


# ── helpers ───────────────────────────────────────────────────────────────────

def new_doc(width=400, height=200):
    doc = fitz.open()
    page = doc.new_page(width=width, height=height)
    return doc, page


def reopen(doc):
    return fitz.open("pdf", doc.tobytes())


def edit(doc, old, new):
    report = pe.replace_text(doc, old, new)
    return reopen(doc), report


def spans_of(page):
    return [s for b in page.get_text("dict")["blocks"] if b["type"] == 0
            for l in b["lines"] for s in l["spans"]]


def rect_of(page, text):
    hits = page.search_for(text)
    assert hits, f"{text!r} not found on page"
    return hits[0]


# ── basic replacement ─────────────────────────────────────────────────────────

def test_replaces_text_and_removes_old_from_text_layer():
    doc, page = new_doc()
    page.insert_text((30, 80), "Hello Saurabh World", fontsize=14)
    out, report = edit(doc, "Saurabh", "Rishabh")
    text = out[0].get_text()
    assert report.replacements == 1 and report.pages == [1]
    assert "Rishabh" in text and "World" in text
    assert "Saurabh" not in text          # really removed, not just covered


def test_no_match_reports_zero():
    doc, page = new_doc()
    page.insert_text((30, 80), "Hello World", fontsize=14)
    _, report = edit(doc, "NONEXISTENT", "x")
    assert report.replacements == 0


def test_replaces_every_occurrence_on_every_page():
    doc, page = new_doc()
    page.insert_text((30, 60), "Ann and Ann", fontsize=14)
    page2 = doc.new_page(width=400, height=200)
    page2.insert_text((30, 60), "Ann again", fontsize=14)
    out, report = edit(doc, "Ann", "Bob")
    assert report.replacements == 3 and report.pages == [1, 2]
    assert "Ann" not in out[0].get_text() + out[1].get_text()


def test_style_size_and_colour_are_preserved():
    doc, page = new_doc()
    page.insert_text((30, 80), "Total: 500 USD", fontname="hebo", fontsize=17, color=(0.8, 0.1, 0.2))
    before = [s for s in spans_of(page) if "500" in s["text"]][0]
    out, _ = edit(doc, "500", "9,999")
    new = [s for s in spans_of(out[0]) if "9,999" in s["text"]][0]
    assert new["size"] == pytest.approx(before["size"], abs=0.1)
    assert new["color"] == before["color"]
    assert new["flags"] & 16                    # still bold
    assert "Bold" in new["font"]


def test_background_is_not_covered_by_a_white_box():
    doc, page = new_doc()
    page.draw_rect(page.rect, color=None, fill=(1, 0.9, 0.2))
    page.insert_text((30, 80), "Price: $10 per month", fontsize=16, color=(0, 0, 0))
    out, _ = edit(doc, "$10", "$1,299")
    pix = out[0].get_pixmap()
    whites = sum(1 for x in range(0, pix.width, 2) for y in range(0, pix.height, 2)
                 if pix.pixel(x, y)[:3] == (255, 255, 255))
    assert whites == 0


# ── matching ──────────────────────────────────────────────────────────────────

def test_matches_across_spans_with_different_fonts():
    doc, page = new_doc()
    page.insert_text((30, 80), "Delivered ", fontname="helv", fontsize=12)
    x = 30 + fitz.get_text_length("Delivered ", fontname="helv", fontsize=12)
    page.insert_text((x, 80), "20+ integrations", fontname="hebo", fontsize=12)
    out, report = edit(doc, "Delivered 20+", "Shipped 30+")
    assert report.replacements == 1
    text = out[0].get_text()
    assert "Shipped 30+" in text and "integrations" in text and "Delivered" not in text


def test_matches_text_wrapped_over_two_lines():
    doc, page = new_doc()
    page.insert_text((30, 60), "The quick brown", fontsize=12)
    page.insert_text((30, 76), "fox jumps over", fontsize=12)
    out, report = edit(doc, "brown fox", "red cat")
    assert report.replacements == 1
    text = " ".join(out[0].get_text().split())
    assert "red" in text and "cat" in text and "brown" not in text and "fox" not in text
    assert "jumps over" in text


def test_whole_words_are_preferred_over_partial_matches():
    doc, page = new_doc(width=500)
    page.insert_text((30, 60), "Ann attends the Annual meeting", fontsize=12)
    out, report = edit(doc, "Ann", "Bob")
    text = out[0].get_text(sort=True)
    assert report.replacements == 1 and "Annual" in text and "Bob attends" in text


def test_partial_word_is_used_when_no_whole_word_exists():
    doc, page = new_doc()
    page.insert_text((30, 60), "The Annual meeting", fontsize=12)
    out, report = edit(doc, "Ann", "Ban")
    assert report.replacements == 1 and "Banual" in out[0].get_text(sort=True)


def test_matching_tolerates_case_quotes_nbsp_and_ligatures():
    doc, page = new_doc()
    page.insert_font(fontname="DV", fontfile=str(DEJAVU))       # base-14 can't encode these glyphs
    page.insert_text((30, 60), "Zeotap\u2019s \ufb01nal\u00a0offer", fontname="DV", fontsize=12)
    out, report = edit(doc, "zeotap's final offer", "the deal")
    assert report.replacements == 1
    assert "deal" in out[0].get_text()


def test_case_of_replacement_is_kept_as_given():
    doc, page = new_doc()
    page.insert_text((30, 60), "Software Engineer", fontsize=12)
    out, _ = edit(doc, "Software Engineer", "Senior Quality Engineer")
    assert "Senior Quality Engineer" in out[0].get_text()      # was lower-cased before


def test_all_caps_original_uppercases_lowercase_replacement():
    doc, page = new_doc()
    page.insert_text((30, 60), "HELLO SAURABH WORLD", fontsize=12)
    out, _ = edit(doc, "SAURABH", "rishabh")
    assert "RISHABH" in out[0].get_text()


def test_unchanged_words_keep_their_original_glyphs():
    doc, page = new_doc()
    page.insert_text((30, 60), "Very ", fontname="helv", fontsize=12)
    x = 30 + fitz.get_text_length("Very ", fontname="helv", fontsize=12)
    page.insert_text((x, 60), "bold claim", fontname="hebo", fontsize=12)
    out, _ = edit(doc, "Very bold claim", "Very old claim")
    by_text = {s["text"].strip(): s for s in spans_of(out[0])}
    assert any("claim" in t and "Bold" in s["font"] for t, s in by_text.items())


def test_deleting_text_with_empty_replacement():
    doc, page = new_doc()
    page.insert_text((30, 60), "Keep this DELETE that", fontsize=12)
    out, report = edit(doc, "DELETE ", "")
    assert report.replacements == 1
    text = out[0].get_text()
    assert "DELETE" not in text and "Keep this" in text and "that" in text


# ── fonts ─────────────────────────────────────────────────────────────────────

def _subset_doc(text):
    """A PDF whose only font is a subset containing just the glyphs of ``text``."""
    doc, page = new_doc()
    page.insert_font(fontname="DV", fontfile=str(DEJAVU))
    page.insert_text((30, 80), text, fontname="DV", fontsize=14)
    doc.subset_fonts()
    return doc


def test_subset_font_lacking_glyphs_falls_back_without_mixing_fonts():
    doc = _subset_doc("Hello Wor")
    out, report = edit(doc, "Wor", "Zqxj")           # Z, q, x, j are not in the subset
    spans = [s for s in spans_of(out[0]) if "Zqxj" in s["text"]]
    assert spans and len({s["font"] for s in spans}) == 1
    assert any("can't draw" in w for w in report.warnings)


def test_full_embedded_font_is_reused():
    doc, page = new_doc()
    page.insert_font(fontname="DV", fontfile=str(DEJAVU))
    page.insert_text((30, 80), "Hello World", fontname="DV", fontsize=14)
    out, report = edit(doc, "World", "Zqxj")
    assert report.warnings == []                                # same face, no substitution
    assert "DejaVu" in [s for s in spans_of(out[0]) if "Zqxj" in s["text"]][0]["font"]


def test_subset_without_unicode_cmap_is_never_used_for_new_text():
    """Word/InDesign-style Identity-H subsets have no cmap: has_glyph() is False for everything,
    so new text must go through a real fallback font instead of drawing blanks."""
    doc = _subset_doc("Hello World Hello")
    out, report = edit(doc, "World", "Hello")
    new = [s for s in spans_of(out[0]) if "Hello" in s["text"]]
    assert new and all(s["text"].strip() for s in new)
    assert any("can't draw" in w for w in report.warnings)


def test_non_embedded_unknown_font_uses_family_and_style_matched_base14():
    doc, page = new_doc()
    page.insert_text((30, 60), "Customer: Alice", fontname="hebo", fontsize=14)
    # Rename the font so it looks like an unavailable, non-embedded face.
    for f in doc.get_page_fonts(0):
        doc.xref_set_key(f[0], "BaseFont", "/Calibri-Bold")
    out, report = edit(doc, "Alice", "Bob Ñandú")
    new = [s for s in spans_of(out[0]) if "Bob" in s["text"]][0]
    assert "Bold" in new["font"] and ("Sans" in new["font"] or "Helvetica" in new["font"])   # not serif


def test_fonts_by_name_are_classified_into_families():
    assert pe._font_family("Arial-BoldMT", 4) == "sans"        # name beats a wrong serif flag
    assert pe._font_family("Calibri", 4) == "sans"
    assert pe._font_family("CMR10", 4) == "serif"
    assert pe._font_family("SomethingUnknown", 4) == "serif"   # flags decide when name is unknown
    assert pe._font_family("SomethingUnknown", 0) == "sans"
    assert pe._font_family("Consolas", 0) == "mono"
    assert pe._font_family("X", 8) == "mono"


# ── layout ────────────────────────────────────────────────────────────────────

def test_following_text_shifts_when_replacement_is_longer():
    doc, page = new_doc(width=500)
    page.insert_text((30, 80), "Name: Ann Lee | ID 42", fontsize=14)
    before = rect_of(page, "ID 42").x0
    out, report = edit(doc, "Ann", "Bartholomew")
    after = rect_of(out[0], "ID 42").x0
    assert after > before + 30
    assert report.warnings == []


def test_following_text_shifts_left_when_replacement_is_shorter():
    doc, page = new_doc(width=500)
    page.insert_text((30, 80), "Name: Bartholomew Lee | ID 42", fontsize=14)
    before = rect_of(page, "ID 42").x0
    out, _ = edit(doc, "Bartholomew", "Al")
    assert rect_of(out[0], "ID 42").x0 < before - 30
    assert "Name: Al Lee" in out[0].get_text()


def test_right_aligned_text_keeps_its_right_edge():
    doc, page = new_doc()
    text = "May 2025 - Present"
    w = fitz.get_text_length(text, fontname="helv", fontsize=12)
    page.insert_text((400 - 20 - w, 60), text, fontname="helv", fontsize=12)
    right = rect_of(page, "Present").x1
    out, _ = edit(doc, text, "2024")
    assert rect_of(out[0], "2024").x1 == pytest.approx(right, abs=1.5)


def test_text_that_cannot_fit_is_squeezed_and_reported_not_overlapped():
    doc, page = new_doc(width=300)
    page.insert_text((30, 60), "Left col text", fontname="helv", fontsize=12)
    x = 30 + fitz.get_text_length("Left col text", fontname="helv", fontsize=12) + 20   # a column gap
    page.insert_text((x, 60), "RIGHT", fontname="helv", fontsize=12)   # neighbouring column
    right_x0 = rect_of(page, "RIGHT").x0
    out, report = edit(doc, "col", "columnar")
    assert rect_of(out[0], "RIGHT").x0 == pytest.approx(right_x0, abs=0.5)   # neighbour untouched
    assert report.warnings                                                   # user is told


def test_neighbouring_lines_are_untouched():
    doc, page = new_doc()
    page.insert_text((30, 50), "Line above stays", fontsize=12)
    page.insert_text((30, 64), "change ME here", fontsize=12)
    page.insert_text((30, 78), "Line below stays", fontsize=12)
    out, _ = edit(doc, "ME", "YOU")
    text = out[0].get_text(sort=True)          # edits are appended to the stream: read geometrically
    assert "Line above stays" in text and "Line below stays" in text and "change YOU here" in text


# ── rotation ──────────────────────────────────────────────────────────────────

def test_rotated_page():
    doc, page = new_doc(width=300, height=200)
    page.insert_text((30, 80), "Invoice total: 500 USD", fontsize=14)
    page.set_rotation(90)
    out, report = edit(doc, "500", "1,250")
    assert report.replacements == 1
    assert "1,250" in out[0].get_text() and "500" not in out[0].get_text()


def test_rotated_text_keeps_its_direction():
    doc, page = new_doc(width=300, height=300)
    page.insert_text((100, 200), "Rotated text 42 here", fontsize=14, rotate=90)
    out, report = edit(doc, "42", "1234")
    assert report.replacements == 1
    line = [l for b in out[0].get_text("dict")["blocks"] for l in b["lines"]][0]
    assert line["dir"] == pytest.approx((0.0, -1.0), abs=0.01)
    assert "1234" in out[0].get_text()


# ── helpers ───────────────────────────────────────────────────────────────────

def test_trim_common_keeps_whole_words_only():
    # only the identical trailing word survives ("0+" is not a whole shared word)
    assert pe._trim_common("Delivered 20+ production-grade", "Shipped 30+ production-grade") == (0, 16)
    assert pe._trim_common("Very bold claim", "Very old claim") == (5, 5)
    assert pe._trim_common("Alice", "Alice Johnson") == (0, 0)          # no whole-word overlap
    assert pe._trim_common("A B", "A X B") == (0, 0)                     # never leaves nothing to edit


def test_normalize_strips_soft_hyphen_and_maps_punctuation():
    assert pe._norm("Zeotap’s  ­core Java") == "zeotap's core java"


def test_a_second_edit_can_match_text_produced_by_the_first():
    """Edited text is a separate text object; it must still be found (sequential edits)."""
    doc, page = new_doc(width=500)
    page.insert_text((30, 60), "change ME here", fontsize=12)
    page.insert_text((30, 80), "another line", fontsize=12)
    first, _ = edit(doc, "ME", "YOU")
    second, report = edit(first, "change YOU here", "all done")
    assert report.replacements == 1
    assert "all done" in second[0].get_text() and "YOU" not in second[0].get_text()


def test_following_text_is_never_pushed_off_the_page():
    doc, page = new_doc(width=300)
    page.insert_text((30, 60), "one two three four five six seven", fontname="helv", fontsize=12)
    out, report = edit(doc, "two", "a very very long replacement phrase")
    text = " ".join(out[0].get_text(sort=True).split())
    for word in ("three", "four", "five", "six", "seven"):
        assert word in text                      # nothing is lost beyond the page edge
    assert report.warnings                       # ...and the user is told it is tight


def test_ligature_glyphs_in_shifted_text_stay_intact():
    """The 'fl'/'ffi' ligatures of a shifted tail must not be split into misplaced letters."""
    doc, page = new_doc(width=500)
    page.insert_font(fontname="DV", fontfile=str(DEJAVU))
    page.insert_text((30, 60), "Ann workflows and traffic", fontname="DV", fontsize=12)
    out, _ = edit(doc, "Ann", "Bartholomew")
    words = [w[4] for w in out[0].get_text("words")]
    assert "workflows" in words and "traffic" in words


def test_glyph_groups_treat_phantom_chars_as_part_of_the_ligature():
    def ch(c, x):
        return pe._Char(c, x, 0, x + 5, 10, x, 8, {"size": 10})
    # f | f(phantom) i(phantom) c   -- phantoms share the next real char's origin
    chars = [ch("t", 0), ch("f", 5), ch("f", 14), ch("i", 14), ch("c", 14)]
    assert pe._glyph_groups(chars, [0, 1, 2, 3, 4]) == [[0], [1, 2, 3], [4]]
