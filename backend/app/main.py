import os

from fastapi import FastAPI
from app.api.routes import router
from app.api.teams import router as teams_router
from app.database import engine, Base
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

app = FastAPI()


def _cors_origins() -> list[str]:
    """Local dev origins + FRONTEND_URL + any comma-separated CORS_ORIGINS."""
    origins = {"http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173"}
    extra = [os.environ.get("FRONTEND_URL", "")] + os.environ.get("CORS_ORIGINS", "").split(",")
    for value in extra:
        value = value.strip().strip('"').rstrip("/")
        if value:
            origins.add(value)
    return sorted(origins)


app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins(),
    # Vercel production alias + preview deployments of this project. Override with CORS_ORIGIN_REGEX.
    allow_origin_regex=os.environ.get("CORS_ORIGIN_REGEX", r"https://docu-query[\w-]*\.vercel\.app"),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.on_event("startup")
async def startup():
    # Create any missing tables (new installs + credit_transactions table)
    Base.metadata.create_all(bind=engine)

    # Safe migration: add credits/plan columns to existing users table if absent
    with engine.connect() as conn:
        for stmt in [
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS credits INTEGER NOT NULL DEFAULT 20",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS plan VARCHAR NOT NULL DEFAULT 'free'",
            "ALTER TABLE documents ADD COLUMN IF NOT EXISTS team_id INTEGER REFERENCES teams(id)",
        ]:
            try:
                conn.execute(text(stmt))
                conn.commit()
            except Exception:
                pass  # column already exists or DB doesn't support IF NOT EXISTS


@app.on_event("shutdown")
async def shutdown():
    pass


app.include_router(router)
app.include_router(teams_router)
