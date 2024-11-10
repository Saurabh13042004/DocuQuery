from sqlalchemy import Column, Integer, String, DateTime
from .database import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    file_path = Column(String)  # Store full path/URL
    upload_date = Column(DateTime)