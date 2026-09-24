from __future__ import annotations

import asyncio
import logging

from sqlalchemy.orm import Session

from app.core.config import Settings
from app.core.exceptions import (
    AppError, BadRequestError, ExternalServiceError, NotFoundError, PayloadTooLargeError, PermissionDeniedError,
)
from app.domain import permissions
from app.domain.enums import Operation, Role
from app.models import Document, User
from app.pdf import reader
from app.ports import FileStorage
from app.rag.indexer import DocumentIndexer
from app.rag.interfaces import ChatMemory
from app.repositories.documents import DocumentRepository
from app.services.access_service import AccessService
from app.services.credit_service import CreditService
from app.utils.files import safe_filename
from app.utils.time import utcnow

log = logging.getLogger(__name__)


class DocumentService:
    def __init__(
        self,
        db: Session,
        documents: DocumentRepository,
        access: AccessService,
        credits: CreditService,
        storage: FileStorage,
        indexer: DocumentIndexer,
        memory: ChatMemory,
        settings: Settings,
    ):
        self.db = db
        self.documents = documents
        self.access = access
        self.credits = credits
        self.storage = storage
        self.indexer = indexer
        self.memory = memory
        self.settings = settings

    async def upload(self, user: User, filename: str | None, data: bytes, shared: bool) -> Document:
        member = self.access.membership(user)
        if not permissions.can_upload(Role(member.role) if member else None):
            raise PermissionDeniedError("Viewers can't upload documents")
        if shared and not member:
            raise BadRequestError("Join a team to share documents")
        pages = await self._validate_pdf(data)

        self.credits.check_and_deduct(user, Operation.UPLOAD)
        key = self.storage.new_key()
        document: Document | None = None
        try:
            await self.storage.put(key, data)
            document = self.documents.add(Document(
                filename=safe_filename(filename), file_path=key, upload_date=utcnow(),
                user_id=user.id, team_id=member.team_id if shared and member else None,
            ))
            self.db.commit()
            await self.indexer.index(document.id, pages)
        except Exception as e:
            await self._undo_upload(user, document, key)
            if isinstance(e, AppError):
                raise
            log.exception("Upload failed for %r", filename)
            raise ExternalServiceError("We couldn't process that PDF right now. You were not charged.") from e

        self.db.refresh(document)
        return document

    async def _validate_pdf(self, data: bytes) -> list[str]:
        """Checks size and content (not just the filename) and returns the page texts."""
        if not data:
            raise BadRequestError("The file is empty")
        if len(data) > self.settings.max_upload_bytes:
            raise PayloadTooLargeError(f"File exceeds the {self.settings.max_upload_mb} MB limit")
        if not reader.looks_like_pdf(data):
            raise BadRequestError("Only PDF files are supported")
        try:
            return await asyncio.to_thread(reader.extract_pages, data)
        except Exception as e:
            raise BadRequestError("That file couldn't be read as a PDF") from e

    async def _undo_upload(self, user: User, document: Document | None, key: str) -> None:
        """Leave no half-created document behind and give the credits back."""
        self.db.rollback()
        if document is not None and document.id is not None:
            persisted = self.documents.get(document.id)
            if persisted is not None:
                self.documents.delete(persisted)
                self.db.commit()
        try:
            await self.storage.delete(key)
        except Exception:
            log.warning("Could not remove %s after a failed upload", key)
        self.credits.refund(user, Operation.UPLOAD)

    def list_for(self, user: User) -> list[Document]:
        member = self.access.membership(user)
        return self.documents.list_visible(user.id, member.team_id if member else None)

    async def read_file(self, user: User, document_id: int, edited: bool) -> bytes:
        document, _ = self.access.get_document(user, document_id)
        path = (document.edited_file_path if edited else None) or document.file_path
        try:
            return await self.storage.get(path)
        except (FileNotFoundError, OSError):
            raise NotFoundError("File not found")

    async def delete(self, user: User, document_id: int) -> None:
        document, role = self.access.get_document(user, document_id)
        if not permissions.can_delete_document(role, is_uploader=document.user_id == user.id):
            raise PermissionDeniedError("You don't have permission to delete this document")

        stored = [document.file_path, document.edited_file_path]
        self.documents.delete(document)
        self.db.commit()

        # The document is gone either way; failing to clean up leaves harmless orphans.
        for cleanup in (self.memory.clear(document_id), self.indexer.remove(document_id)):
            try:
                await cleanup
            except Exception:
                log.warning("Cleanup failed for document %s", document_id, exc_info=True)
        for path in stored:
            if self.storage.owns(path):
                try:
                    await self.storage.delete(path)
                except Exception:
                    log.warning("Could not delete stored file %s", path, exc_info=True)
