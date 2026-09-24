from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.utils.time import utcnow


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utcnow)
    credits = Column(Integer, default=20, nullable=False)
    plan = Column(String, default="free", nullable=False)

    documents = relationship("Document", back_populates="user")
    credit_transactions = relationship("CreditTransaction", back_populates="user")


class CreditTransaction(Base):
    __tablename__ = "credit_transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Integer, nullable=False)  # negative = spend, positive = add
    reason = Column(String, nullable=False)   # "signup_bonus", "ask", "plan_upgrade_starter", ...
    created_at = Column(DateTime, default=utcnow)

    user = relationship("User", back_populates="credit_transactions")
