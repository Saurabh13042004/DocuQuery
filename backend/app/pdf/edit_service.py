from __future__ import annotations

import asyncio
from dataclasses import dataclass, field

import pymupdf as fitz

from app.pdf import editor
from app.ports import FileStorage


@dataclass
class EditOutcome:
    success: bool
    message: str = ""
    edited_key: str | None = None
    replacements: int = 0
    warnings: list[str] = field(default_factory=list)


class PdfEditService:
    """Replace text in a stored PDF and store the result under a new key."""

    def __init__(self, storage: FileStorage):
        self.storage = storage

    async def edit(self, source_path: str, original_text: str, new_text: str) -> EditOutcome:
        data = await self.storage.get(source_path)
        result = await asyncio.to_thread(self._replace, data, original_text, new_text)
        if isinstance(result, EditOutcome):
            return result
        edited_bytes, report = result
        key = self.storage.new_key("edited_")
        await self.storage.put(key, edited_bytes)
        return EditOutcome(
            success=True, edited_key=key, replacements=report.replacements, warnings=list(report.warnings))

    @staticmethod
    def _replace(data: bytes, original: str, new: str):
        doc = fitz.open(stream=data, filetype="pdf")
        try:
            report = editor.replace_text(doc, original, new)
            if not report.replacements:
                return EditOutcome(False, message=f"Could not find '{original}' in the document.")
            return doc.tobytes(), report
        finally:
            doc.close()
