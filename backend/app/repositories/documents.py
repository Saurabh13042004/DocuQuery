from sqlalchemy import or_
from sqlalchemy.orm import Session, selectinload

from app.models import Comment, Document, Message


class DocumentRepository:
    def __init__(self, db: Session):
        self.db = db

    def get(self, document_id: int) -> Document | None:
        return self.db.get(Document, document_id)

    def add(self, document: Document) -> Document:
        self.db.add(document)
        self.db.flush()
        return document

    def delete(self, document: Document) -> None:
        self.db.delete(document)  # messages and comments go with it (ORM cascade)

    def list_visible(self, user_id: int, team_id: int | None) -> list[Document]:
        """Personal documents plus, for team members, everything shared with the team."""
        personal = (Document.user_id == user_id) & Document.team_id.is_(None)
        condition = or_(personal, Document.team_id == team_id) if team_id else personal
        return (
            self.db.query(Document)
            .options(selectinload(Document.messages))
            .filter(condition)
            .order_by(Document.upload_date.desc())
            .all()
        )

    def count_shared_by(self, team_id: int, user_id: int) -> int:
        return self.db.query(Document).filter(
            Document.team_id == team_id, Document.user_id == user_id).count()


class MessageRepository:
    def __init__(self, db: Session):
        self.db = db

    def add(self, document_id: int, content: str, is_user: bool) -> Message:
        message = Message(document_id=document_id, content=content, is_user=is_user)
        self.db.add(message)
        self.db.flush()
        return message

    def list_for_document(self, document_id: int) -> list[Message]:
        return (
            self.db.query(Message)
            .filter(Message.document_id == document_id)
            .order_by(Message.timestamp.asc(), Message.id.asc())
            .all()
        )


class CommentRepository:
    def __init__(self, db: Session):
        self.db = db

    def get(self, comment_id: int) -> Comment | None:
        return self.db.get(Comment, comment_id)

    def add(self, comment: Comment) -> Comment:
        self.db.add(comment)
        self.db.flush()
        return comment

    def list_for_document(self, document_id: int) -> list[Comment]:
        return (
            self.db.query(Comment)
            .filter(Comment.document_id == document_id)
            .order_by(Comment.id)
            .all()
        )
