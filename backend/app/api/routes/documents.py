from fastapi import APIRouter, File, Form, Response, UploadFile

from app.api.deps import CurrentUser, DocumentsDep, SettingsDep
from app.schemas.common import MessageOut
from app.schemas.documents import DocumentResponse

router = APIRouter(tags=["documents"])


@router.post("/upload", response_model=DocumentResponse)
async def upload(
    user: CurrentUser, documents: DocumentsDep, settings: SettingsDep,
    file: UploadFile = File(...), shared: bool = Form(False),
):
    # Read one byte past the limit so an oversized upload is rejected without buffering all of it.
    data = await file.read(settings.max_upload_bytes + 1)
    return await documents.upload(user, file.filename, data, shared)


@router.get("/documents", response_model=list[DocumentResponse])
def list_documents(user: CurrentUser, documents: DocumentsDep):
    return documents.list_for(user)


@router.get("/documents/{document_id}/file")
async def get_file(document_id: int, user: CurrentUser, documents: DocumentsDep, edited: bool = False):
    """Storage is private, so the PDF is streamed here after an access check.

    ``edited=true`` returns the latest edited version, or the original if it was never edited.
    """
    data = await documents.read_file(user, document_id, edited)
    return Response(content=data, media_type="application/pdf", headers={"Cache-Control": "private, no-store"})


@router.delete("/documents/{document_id}", response_model=MessageOut)
async def delete_document(document_id: int, user: CurrentUser, documents: DocumentsDep):
    await documents.delete(user, document_id)
    return {"message": "Document deleted"}
