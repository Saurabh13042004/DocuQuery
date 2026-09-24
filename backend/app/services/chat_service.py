from __future__ import annotations

import logging
import time
from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.core.exceptions import InsufficientCreditsError
from app.domain import permissions
from app.domain.enums import Operation
from app.models import Message, User
from app.pdf import reader
from app.ports import FileStorage
from app.rag.assistant import DocumentAssistant
from app.rag.tools import ToolContext
from app.repositories.documents import MessageRepository
from app.services.access_service import AccessService
from app.services.credit_service import CreditService
from app.utils.chat_export import ChatExport, render_chat_export
from app.utils.time import utcnow

log = logging.getLogger(__name__)


@dataclass
class AskResult:
    answer: str
    is_edit: bool
    credits_remaining: int
    edited_pdf_url: str | None = None
    citations: list[str] | None = None


class ChatService:
    def __init__(
        self,
        db: Session,
        access: AccessService,
        credits: CreditService,
        messages: MessageRepository,
        assistant: DocumentAssistant,
        storage: FileStorage,
    ):
        self.db = db
        self.access = access
        self.credits = credits
        self.messages = messages
        self.assistant = assistant
        self.storage = storage

    async def ask(self, user: User, document_id: int, question: str) -> AskResult:
        document, role = self.access.get_document(user, document_id)
        self.credits.check_and_deduct(user, Operation.ASK)

        path = document.edited_file_path or document.file_path
        ctx = ToolContext(document_id=document.id, file_path=path, allow_edit=permissions.can_edit_pdf(role))
        try:
            reply = await self.assistant.reply(question, ctx, fallback_context=lambda: self._document_text(path))
        except Exception:
            self.credits.refund(user, Operation.ASK)
            raise
        if reply.failed:  # the AI provider was down or limited: don't charge for an apology
            self.credits.refund(user, Operation.ASK)

        edited_url = None
        if reply.is_edit and reply.edited_file_key:
            await self._save_edit(document, reply.edited_file_key)
            edited_url = f"/documents/{document.id}/file?edited=true&v={int(time.time())}"
            try:  # an edit costs one extra credit on top of the question
                self.credits.check_and_deduct(user, Operation.EDIT)
            except InsufficientCreditsError:
                pass  # they barely had enough for the question; don't fail an edit that already happened

        self.db.refresh(user)
        return AskResult(
            answer=reply.answer, is_edit=reply.is_edit, credits_remaining=user.credits,
            edited_pdf_url=edited_url, citations=reply.citations,
        )

    async def _save_edit(self, document, new_key: str) -> None:
        previous = document.edited_file_path
        document.edited_file_path = new_key
        self.db.commit()
        if self.storage.owns(previous):  # the previous edited copy is superseded
            try:
                await self.storage.delete(previous)
            except Exception:
                log.warning("Could not delete superseded file %s", previous, exc_info=True)

    async def _document_text(self, path: str) -> str:
        return reader.extract_text(await self.storage.get(path))

    # -- chat history ------------------------------------------------------------
    def add_message(self, user: User, document_id: int, content: str, is_user: bool) -> Message:
        self.access.get_document(user, document_id)
        message = self.messages.add(document_id, content, is_user)
        message.timestamp = utcnow()
        self.db.commit()
        self.db.refresh(message)
        return message

    def list_messages(self, user: User, document_id: int) -> list[Message]:
        self.access.get_document(user, document_id)
        return self.messages.list_for_document(document_id)

    def export(self, user: User, document_id: int, fmt: str) -> ChatExport:
        document, _ = self.access.get_document(user, document_id)
        return render_chat_export(
            document.filename, self.messages.list_for_document(document_id), fmt, utcnow())
