from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import Settings, get_settings
from app.core.database import init_db
from app.core.exceptions import register_exception_handlers

LOCAL_ORIGINS = ("http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173")


def cors_origins(settings: Settings) -> list[str]:
    """Local dev origins, FRONTEND_URL and any CORS_ORIGINS."""
    return sorted({*LOCAL_ORIGINS, settings.frontend_url, *settings.cors_origins} - {""})


def create_app(settings: Settings | None = None, *, init_schema: bool = True) -> FastAPI:
    settings = settings or get_settings()

    @asynccontextmanager
    async def lifespan(_: FastAPI):
        if init_schema:
            init_db()
        yield

    app = FastAPI(title="DocuQuery API", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins(settings),
        # Vercel production alias + preview deployments of this project. Override with CORS_ORIGIN_REGEX.
        allow_origin_regex=settings.cors_origin_regex,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    register_exception_handlers(app)

    @app.get("/health", tags=["ops"])
    def health():
        return {"status": "ok"}

    app.include_router(api_router)
    return app


app = create_app()
