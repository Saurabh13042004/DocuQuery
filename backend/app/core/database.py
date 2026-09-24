"""SQLAlchemy engine, session factory and schema bootstrap."""
from __future__ import annotations

from typing import Iterator

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import get_settings


class Base(DeclarativeBase):
    pass


_engine: Engine | None = None
_session_factory: sessionmaker[Session] | None = None


def get_engine() -> Engine:
    global _engine
    if _engine is None:
        _engine = create_engine(get_settings().database_url, pool_pre_ping=True)
    return _engine


def get_session_factory() -> sessionmaker[Session]:
    global _session_factory
    if _session_factory is None:
        _session_factory = sessionmaker(autocommit=False, autoflush=False, bind=get_engine())
    return _session_factory


def get_db() -> Iterator[Session]:
    """FastAPI dependency: one session per request."""
    db = get_session_factory()()
    try:
        yield db
    finally:
        db.close()


# Additive, idempotent changes for databases created before a column existed.
_ADDITIVE_MIGRATIONS = (
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS credits INTEGER NOT NULL DEFAULT 20",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS plan VARCHAR NOT NULL DEFAULT 'free'",
    "ALTER TABLE documents ADD COLUMN IF NOT EXISTS team_id INTEGER REFERENCES teams(id)",
)


def init_db(engine: Engine | None = None) -> None:
    """Create missing tables and apply the additive migrations. Safe to run on every start."""
    import app.models  # noqa: F401  (registers every table on Base.metadata)

    engine = engine or get_engine()
    Base.metadata.create_all(bind=engine)
    with engine.connect() as conn:
        for statement in _ADDITIVE_MIGRATIONS:
            try:
                conn.execute(text(statement))
                conn.commit()
            except Exception:
                conn.rollback()  # column exists, or the database has no IF NOT EXISTS (SQLite)
