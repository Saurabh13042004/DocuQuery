from datetime import datetime
from typing import Annotated, Literal

from pydantic import BaseModel, Field, StringConstraints

from app.schemas.common import ORMModel

Question = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=4000)]


class MessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=50_000)
    is_user: bool


class MessageResponse(ORMModel):
    id: int
    document_id: int
    content: str
    is_user: bool
    timestamp: datetime


class DocumentResponse(ORMModel):
    id: int
    filename: str
    file_path: str
    upload_date: datetime
    team_id: int | None = None
    messages: list[MessageResponse] = []


class QuestionRequest(BaseModel):
    question: Question
    id: int = Field(gt=0)


class AskResponse(BaseModel):
    answer: str
    is_edit: bool = False
    editedPdfUrl: str | None = None
    citations: list[str] | None = None
    credits_remaining: int


ExportFormat = Literal["md", "txt"]
