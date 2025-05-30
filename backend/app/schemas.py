from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List

class DocumentCreate(BaseModel):
    filename: str
    file_path: str

class QuestionRequest(BaseModel):
    question: str
    id: int
    
class MessageBase(BaseModel):
    content: str
    is_user: bool

class MessageCreate(MessageBase):
    pass

class Message(MessageBase):
    id: int
    document_id: int
    timestamp: datetime
    
    class Config:
        orm_mode = True

# Update DocumentResponse to include messages
class DocumentResponse(BaseModel):
    id: int
    filename: str
    file_path: str
    upload_date: datetime
    messages: List[Message] = []
    
    class Config:
        orm_mode = True

class UserCreate(BaseModel):
    name : str
    email : str
    password : str

class UserLogin(BaseModel):
    email : str
    password : str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    name: str
    email: str
    is_active: bool
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse