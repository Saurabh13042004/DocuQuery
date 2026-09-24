from datetime import datetime, timezone
from types import SimpleNamespace as NS

import pytest

from app.utils.chat_export import render_chat_export
from app.utils.files import safe_filename


@pytest.mark.parametrize("raw,expected", [
    ("report.pdf", "report.pdf"),
    ("../../etc/passwd", "passwd"),
    ("C:\\Users\\me\\cv (final).pdf", "cv (final).pdf"),
    ("na<me>|?.pdf", "na_me_.pdf"),
    ("   ", "document.pdf"),
    (None, "document.pdf"),
    ("x" * 300 + ".pdf", ("x" * 300 + ".pdf")[:150]),
])
def test_safe_filename(raw, expected):
    assert safe_filename(raw) == expected


def _messages():
    stamp = datetime(2026, 1, 2, 9, 30)
    return [NS(content="Q?", is_user=True, timestamp=stamp), NS(content="A.", is_user=False, timestamp=None)]


def test_chat_export_markdown():
    out = render_chat_export("My Report.pdf", _messages(), "md", datetime(2026, 3, 4, 5, 6, tzinfo=timezone.utc))
    assert out.filename == "chat_My_Report.md" and out.media_type == "text/markdown"
    assert "# Chat Export — My Report.pdf" in out.content and "Exported: 2026-03-04 05:06 UTC" in out.content
    assert "### **You**  _09:30_" in out.content and "### **DocuQuery**" in out.content


def test_chat_export_text_and_stem_only_loses_the_pdf_suffix():
    out = render_chat_export("leaf.pdf", [], "txt", datetime.now(timezone.utc))
    assert out.filename == "chat_leaf.txt" and out.media_type == "text/plain"  # rstrip(".pdf") used to give "lea"
