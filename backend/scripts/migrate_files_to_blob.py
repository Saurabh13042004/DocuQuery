"""Move documents stored on local disk (pdfs/...) into Upstash Blob.

Older documents keep working without this (they are read from disk), but moving them lets the
backend run without a local pdfs/ folder. Dry run by default:

    python -m scripts.migrate_files_to_blob           # show what would move
    python -m scripts.migrate_files_to_blob --apply   # upload and update the database
"""
from __future__ import annotations

import asyncio
import os
import sys

from sqlalchemy.orm import Session

from app import container
from app.core.database import get_session_factory
from app.models import Document
from app.ports import FileStorage

FIELDS = (("file_path", ""), ("edited_file_path", "edited_"))


def is_local(storage: FileStorage, path: str | None) -> bool:
    return bool(path) and not storage.owns(path) and not path.startswith("http")


async def migrate(db: Session, storage: FileStorage, apply: bool, log=print) -> tuple[int, int]:
    """Returns (moved, missing)."""
    moved = missing = 0
    for doc in db.query(Document).order_by(Document.id).all():
        for attr, prefix in FIELDS:
            path = getattr(doc, attr)
            if not is_local(storage, path):
                continue
            if not os.path.exists(path):
                log(f"doc {doc.id} {attr}: {path} - file not found on disk, skipped")
                missing += 1
                continue
            key = storage.new_key(prefix)
            log(f"doc {doc.id} {attr}: {path} -> {key}")
            if apply:
                with open(path, "rb") as f:
                    await storage.put(key, f.read())
                setattr(doc, attr, key)
                db.commit()
            moved += 1
    return moved, missing


def main(argv: list[str]) -> None:
    apply = "--apply" in argv
    db = get_session_factory()()
    try:
        moved, missing = asyncio.run(migrate(db, container.storage(), apply))
    finally:
        db.close()
    print(f"\n{moved} file(s) {'moved' if apply else 'would move'}, {missing} missing on disk."
          + ("" if apply else " Re-run with --apply to do it."))


if __name__ == "__main__":
    main(sys.argv[1:])
