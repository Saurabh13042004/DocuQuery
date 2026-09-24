from __future__ import annotations

import pymupdf as fitz

PDF_MAGIC = b"%PDF-"


def looks_like_pdf(data: bytes) -> bool:
    return PDF_MAGIC in data[:1024]  # the spec allows a little junk before the header


def extract_pages(data: bytes) -> list[str]:
    """Text of each page, in order (1-indexed by position)."""
    doc = fitz.open(stream=data, filetype="pdf")
    try:
        return [page.get_text() for page in doc]
    finally:
        doc.close()


def extract_text(data: bytes) -> str:
    return "".join(extract_pages(data))
