from __future__ import annotations

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError
from app.models import Comment, User
from app.repositories.documents import CommentRepository
from app.services.access_service import AccessService
from app.utils.time import utcnow


class CommentService:
    def __init__(self, db: Session, comments: CommentRepository, access: AccessService):
        self.db = db
        self.comments = comments
        self.access = access

    def list_for(self, user: User, document_id: int) -> list[Comment]:
        self.access.get_document(user, document_id)
        return self.comments.list_for_document(document_id)

    def add(self, user: User, document_id: int, content: str, page: int | None) -> Comment:
        self.access.get_document(user, document_id)
        comment = self.comments.add(Comment(
            document_id=document_id, user_id=user.id, content=content, page=page, created_at=utcnow()))
        self.db.commit()
        self.db.refresh(comment)
        return comment

    def toggle_resolved(self, user: User, comment_id: int) -> Comment:
        comment = self.comments.get(comment_id)
        if not comment:
            raise NotFoundError("Comment not found")
        self.access.get_document(user, comment.document_id)
        comment.resolved = not comment.resolved
        self.db.commit()
        return comment
