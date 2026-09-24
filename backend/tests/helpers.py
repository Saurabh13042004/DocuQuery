from __future__ import annotations

import itertools

import pymupdf as fitz

_counter = itertools.count(1)


def make_pdf(*pages: str) -> bytes:
    """A real PDF with one page per string."""
    doc = fitz.open()
    for text in pages or ("Hello world",):
        doc.new_page().insert_text((72, 100), text, fontsize=14)
    data = doc.tobytes()
    doc.close()
    return data


def unique_email(prefix: str = "user") -> str:
    return f"{prefix}{next(_counter)}@example.com"
