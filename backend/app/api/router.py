from fastapi import APIRouter

from app.api.routes import account, auth, chat, documents, teams

api_router = APIRouter()
for module in (auth, account, documents, chat, teams):
    api_router.include_router(module.router)
