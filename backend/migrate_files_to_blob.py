"""Move documents stored on local disk (pdfs/...) into Upstash Blob.

Older documents keep working without this (they are read from disk), but moving them lets the
backend run without a local pdfs/ folder. Dry run by default:

    python migrate_files_to_blob.py           # show what would move
    python migrate_files_to_blob.py --apply   # upload and update the database
"""
import asyncio
import os
import sys

from app import database, models
from app.services import blob_service


def _is_local(path: str | None) -> bool:
    return bool(path) and not blob_service.is_blob_key(path) and not path.startswith("http")


async def main(apply: bool):
    db = database.SessionLocal()
    moved = missing = 0
    try:
        for doc in db.query(models.Document).order_by(models.Document.id).all():
            for attr, prefix in (("file_path", ""), ("edited_file_path", "edited_")):
                path = getattr(doc, attr)
                if not _is_local(path):
                    continue
                if not os.path.exists(path):
                    print(f"doc {doc.id} {attr}: {path} - file not found on disk, skipped")
                    missing += 1
                    continue
                key = blob_service.new_key(prefix)
                print(f"doc {doc.id} {attr}: {path} -> {key}")
                if apply:
                    with open(path, "rb") as f:
                        await blob_service.put(key, f.read())
                    setattr(doc, attr, key)
                    db.commit()
                moved += 1
    finally:
        db.close()
    print(f"\n{moved} file(s) {'moved' if apply else 'would move'}, {missing} missing on disk."
          + ("" if apply else " Re-run with --apply to do it."))


if __name__ == "__main__":
    asyncio.run(main("--apply" in sys.argv))
