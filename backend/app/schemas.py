from pydantic import BaseModel
from datetime import datetime

class DocumentBase(BaseModel):
    filename: str

class DocumentCreate(DocumentBase):
    pass

class Document(DocumentBase):
    id: int
    upload_date: datetime
    file_path: str

    class Config:
        orm_mode = True

class QuestionRequest(BaseModel):
    document_id: int
    question: str