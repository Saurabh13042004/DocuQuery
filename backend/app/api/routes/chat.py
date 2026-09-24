from fastapi import APIRouter, Query, Response

from app.api.deps import ChatDep, CurrentUser
from app.schemas.documents import AskResponse, ExportFormat, MessageCreate, MessageResponse, QuestionRequest

router = APIRouter(tags=["chat"])


@router.post("/ask", response_model=AskResponse, response_model_exclude_none=True)
async def ask(body: QuestionRequest, user: CurrentUser, chat: ChatDep):
    result = await chat.ask(user, body.id, body.question)
    return AskResponse(
        answer=result.answer, is_edit=result.is_edit, editedPdfUrl=result.edited_pdf_url,
        citations=result.citations, credits_remaining=result.credits_remaining,
    )


@router.post("/documents/{document_id}/messages", response_model=MessageResponse)
def add_message(document_id: int, body: MessageCreate, user: CurrentUser, chat: ChatDep):
    return chat.add_message(user, document_id, body.content, body.is_user)


@router.get("/documents/{document_id}/messages", response_model=list[MessageResponse])
def list_messages(document_id: int, user: CurrentUser, chat: ChatDep):
    return chat.list_messages(user, document_id)


@router.get("/documents/{document_id}/export")
def export_chat(
    document_id: int, user: CurrentUser, chat: ChatDep, format: ExportFormat = Query(default="md"),
):
    export = chat.export(user, document_id, format)
    return Response(
        content=export.content, media_type=export.media_type,
        headers={"Content-Disposition": f'attachment; filename="{export.filename}"'},
    )
