from sqlalchemy import Column, Integer, String, DateTime , Boolean
from .database import Base
from sqlalchemy.ext.declarative import declarative_base

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    file_path = Column(String)
    upload_date = Column(DateTime)
    user_id = Column(Integer,index=True)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer,primary_key=True,index=True)
    name = Column(String,index=True)
    email = Column(String,unique=True,index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean,default=True)
    created_at = Column(DateTime)