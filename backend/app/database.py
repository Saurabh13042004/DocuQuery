from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.orm import scoped_session
import os
from dotenv import load_dotenv

load_dotenv()


# Get environment and database URL from environment variables
ENVIRONMENT = os.environ["ENVIRONMENT"]
SQLITE_CLOUD_URL = os.environ["SQLITE_CLOUD_URL"]
LOCAL_DATABASE_URL = "sqlite:///./test.db"

DATABASE_URL = SQLITE_CLOUD_URL if ENVIRONMENT == 'production' else LOCAL_DATABASE_URL

# Create engine with the appropriate URL
engine = create_engine(DATABASE_URL)
SessionLocal = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=engine))
Base = declarative_base()

def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()