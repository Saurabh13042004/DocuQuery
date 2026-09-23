"""Re-embed every stored document with the current embedding model.

Run once after switching embedding providers (e.g. Gemini -> OpenAI): old vectors
live in the same Upstash index and use the same ids (doc_<id>_chunk_<n>), so
re-indexing overwrites them in place.

    python reindex_documents.py
"""
import asyncio

from app import database, models
from app.services import pdf_service, vector_service


async def main():
    db = database.SessionLocal()
    try:
        for doc in db.query(models.Document).order_by(models.Document.id).all():
            try:
                text = await pdf_service.extract_text_from_pdf(doc.file_path)
                pages = await pdf_service.extract_pages(doc.file_path)
                n = await vector_service.index_document(doc.id, text, pages=pages)
                print(f"doc {doc.id} ({doc.filename}): {n} chunks")
            except Exception as e:  # keep going; report and move on
                print(f"doc {doc.id} ({doc.filename}): FAILED - {e}")
    finally:
        db.close()


if __name__ == "__main__":
    asyncio.run(main())
