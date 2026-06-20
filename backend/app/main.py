from fastapi import FastAPI
from app.api.routes import router
from app.database import engine, Base
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("pdfs", exist_ok=True)
app.mount("/pdfs", StaticFiles(directory="pdfs"), name="pdfs")


@app.on_event("startup")
async def startup():
    # Create any missing tables (new installs + credit_transactions table)
    Base.metadata.create_all(bind=engine)

    # Safe migration: add credits/plan columns to existing users table if absent
    with engine.connect() as conn:
        for stmt in [
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS credits INTEGER NOT NULL DEFAULT 20",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS plan VARCHAR NOT NULL DEFAULT 'free'",
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
