from pydantic import BaseModel

class DocumentCreate(BaseModel):
    filename: str

class QuestionRequest(BaseModel):
    question: str
    document_id: int
    
class DocumentResponse(BaseModel):
    id: int
    filename: str

    class Config:
        orm_mode = True