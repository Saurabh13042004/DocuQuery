from sqlalchemy import Column, Integer, String, DateTime , Boolean, ForeignKey
from .database import Base
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    file_path = Column(String)
    edited_file_path = Column(String, nullable=True)  # Track latest edited version
    upload_date = Column(DateTime, default=datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    # Relationship
    user = relationship("User", back_populates="documents")
    messages = relationship("Message", back_populates="document")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer,primary_key=True,index=True)
    name = Column(String,index=True)
    email = Column(String,unique=True,index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean,default=True)
    created_at = Column(DateTime)
    documents = relationship("Document", back_populates="user")

class Message(Base):
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"))
    content = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)
    is_user = Column(Boolean, default=False)
    
    # Relationship
    document = relationship("Document", back_populates="messages")
