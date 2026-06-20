from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from .database import Base
from sqlalchemy.orm import relationship
from datetime import datetime


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime)
    credits = Column(Integer, default=20, nullable=False)
    plan = Column(String, default="free", nullable=False)

    documents = relationship("Document", back_populates="user")
    credit_transactions = relationship("CreditTransaction", back_populates="user")


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    file_path = Column(String)
    edited_file_path = Column(String, nullable=True)
    upload_date = Column(DateTime, default=datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.id"))

    user = relationship("User", back_populates="documents")
    messages = relationship("Message", back_populates="document")


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"))
    content = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)
    is_user = Column(Boolean, default=False)

    document = relationship("Document", back_populates="messages")


class CreditTransaction(Base):
    __tablename__ = "credit_transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Integer, nullable=False)       # negative = spend, positive = add
    reason = Column(String, nullable=False)        # "signup_bonus", "upload", "ask", "edit", "plan_upgrade_starter", …
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="credit_transactions")
