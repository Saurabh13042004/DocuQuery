"""Re-embed every stored document with the current embedding model.

Run once after switching embedding providers or recreating the vector index:

    python -m scripts.reindex_documents
"""
from __future__ import annotations

import asyncio

from sqlalchemy.orm import Session

from app import container
from app.core.database import get_session_factory
from app.models import Document
from app.pdf import reader
from app.ports import FileStorage
from app.rag.indexer import DocumentIndexer


async def reindex_all(db: Session, storage: FileStorage, indexer: DocumentIndexer, log=print) -> tuple[int, int]:
    """Returns (indexed, failed). One bad document never stops the rest."""
    indexed = failed = 0
    for doc in db.query(Document).order_by(Document.id).all():
        try:
            pages = reader.extract_pages(await storage.get(doc.file_path))
            chunks = await indexer.index(doc.id, pages, replace=True)
            log(f"doc {doc.id} ({doc.filename}): {chunks} chunks")
            indexed += 1
        except Exception as e:
            log(f"doc {doc.id} ({doc.filename}): FAILED - {e}")
            failed += 1
    return indexed, failed


def main() -> None:
    indexer = container.build_indexer(container.embedder(), container.vector_store())
    db = get_session_factory()()
    try:
        indexed, failed = asyncio.run(reindex_all(db, container.storage(), indexer))
    finally:
        db.close()
    print(f"\n{indexed} indexed, {failed} failed.")


if __name__ == "__main__":
    main()
