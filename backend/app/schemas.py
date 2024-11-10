from pydantic import BaseModel
from datetime import datetime

class DocumentCreate(BaseModel):
    filename: str
    file_path: str

class QuestionRequest(BaseModel):
    question: str
    id: int
    
class DocumentResponse(BaseModel):
    id: int
    filename: str
    file_path: str
    upload_date: datetime

    class Config:
        orm_mode = True
