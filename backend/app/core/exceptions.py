"""Domain errors. Services raise these; the API layer turns them into HTTP responses.

Keeping HTTP out of the services means the same use-cases can be driven from a script, a
background worker or an agent graph without importing FastAPI.
"""
from __future__ import annotations

from typing import Any

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse


class AppError(Exception):
    status_code = 400

    def __init__(self, detail: Any = "Bad request", *, headers: dict[str, str] | None = None):
        super().__init__(detail if isinstance(detail, str) else str(detail))
        self.detail = detail
        self.headers = headers


class BadRequestError(AppError):
    status_code = 400


class UnauthorizedError(AppError):
    status_code = 401

    def __init__(self, detail: Any = "Not authenticated"):
        super().__init__(detail, headers={"WWW-Authenticate": "Bearer"})


class InsufficientCreditsError(AppError):
    status_code = 402


class PermissionDeniedError(AppError):
    status_code = 403


class NotFoundError(AppError):
    status_code = 404


class PayloadTooLargeError(AppError):
    status_code = 413


class UnprocessableError(AppError):
    status_code = 422


class ExternalServiceError(AppError):
    status_code = 502


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def _handle(_: Request, exc: AppError) -> JSONResponse:
        # Same {"detail": ...} envelope FastAPI uses for HTTPException, which the frontend already parses.
        return JSONResponse({"detail": exc.detail}, status_code=exc.status_code, headers=exc.headers)
