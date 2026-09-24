import pytest

from app.pdf import reader
from app.pdf.edit_service import PdfEditService
from tests.fakes import InMemoryStorage
from tests.helpers import make_pdf


def test_extract_pages_returns_one_string_per_page_in_order():
    pages = reader.extract_pages(make_pdf("first page", "second page"))
    assert len(pages) == 2 and "first" in pages[0] and "second" in pages[1]


def test_extract_text_concatenates_pages():
    assert "first" in reader.extract_text(make_pdf("first", "second")) and "second" in reader.extract_text(make_pdf("first", "second"))


@pytest.mark.parametrize("data,expected", [
    (make_pdf("x"), True), (b"%PDF-1.7\n...", True), (b"\n\n%PDF-1.4", True),
    (b"<html>not a pdf</html>", False), (b"", False), (b"PK\x03\x04 zip file", False),
])
def test_looks_like_pdf(data, expected):
    assert reader.looks_like_pdf(data) is expected


def test_unreadable_pdf_bytes_raise():
    with pytest.raises(Exception):
        reader.extract_pages(b"%PDF-1.4 but actually garbage")


async def test_edit_service_stores_the_edited_pdf_under_a_new_key_and_keeps_the_original():
    storage = InMemoryStorage()
    key = storage.new_key()
    original = make_pdf("Name: Saurabh Shukla")
    await storage.put(key, original)

    outcome = await PdfEditService(storage).edit(key, "Saurabh", "Rishabh")

    assert outcome.success and outcome.replacements >= 1
    assert outcome.edited_key != key and outcome.edited_key.startswith("docs/edited_")
    assert storage.files[key] == original                          # the original is never modified
    edited_text = reader.extract_text(storage.files[outcome.edited_key])
    assert "Rishabh" in edited_text and "Saurabh" not in edited_text


async def test_edit_service_reports_text_it_cannot_find_and_stores_nothing():
    storage = InMemoryStorage()
    key = storage.new_key()
    await storage.put(key, make_pdf("Hello World"))
    outcome = await PdfEditService(storage).edit(key, "NONEXISTENT", "x")
    assert not outcome.success and "NONEXISTENT" in outcome.message
    assert list(storage.files) == [key]


async def test_edit_service_propagates_a_missing_source_file():
    with pytest.raises(FileNotFoundError):
        await PdfEditService(InMemoryStorage()).edit("docs/missing.pdf", "a", "b")
