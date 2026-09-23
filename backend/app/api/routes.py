from fastapi import APIRouter, BackgroundTasks, UploadFile, File, Form, Depends, HTTPException, Query, status
from fastapi.responses import Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import or_
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import List
import jwt

from .. import models, schemas, database
from ..services import auth_service, pdf_service, vector_service, redis_service, credit_service, team_service, email_service, blob_service

router = APIRouter()
security = HTTPBearer()


# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(database.get_db),
) -> models.User:
    try:
        payload = auth_service.decode_token(credentials.credentials)
        email: str = payload.get("sub")
        if not email:
            raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = auth_service.get_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


# ---------------------------------------------------------------------------
# Auth routes
# ---------------------------------------------------------------------------

@router.post("/signup", response_model=schemas.Token)
async def signup(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = auth_service.create_user(db=db, user=user)
    credit_service.grant_signup_bonus(db, db_user)
    token = auth_service.create_access_token(data={"sub": db_user.email})
    return {"access_token": token, "token_type": "bearer", "user": db_user}


@router.post("/login", response_model=schemas.Token)
async def login(user_credentials: schemas.UserLogin, db: Session = Depends(database.get_db)):
    user = auth_service.authenticate_user(db, user_credentials.email, user_credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = auth_service.create_access_token(data={"sub": user.email})
    return {"access_token": token, "token_type": "bearer", "user": user}


@router.post("/forgot-password", response_model=schemas.MessageOut)
async def forgot_password(
    body: schemas.ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(database.get_db),
):
    # Same response whether or not the account exists, so this can't be used to
    # find out who has an account. Sending happens after the response for the
    # same reason (no timing difference).
    user = auth_service.get_user_by_email(db, body.email.strip())
    if user and user.is_active:
        token = auth_service.create_reset_token(user)
        background_tasks.add_task(
            email_service.send_password_reset_email,
            user.email, user.name, token, auth_service.RESET_TOKEN_EXPIRE_MINUTES,
        )
    return {"message": "If an account exists for that email, a reset link is on its way."}


@router.post("/reset-password", response_model=schemas.MessageOut)
async def reset_password(body: schemas.ResetPasswordRequest, db: Session = Depends(database.get_db)):
    auth_service.reset_password(db, body.token, body.password)
    return {"message": "Password updated. You can sign in with your new password."}


# ---------------------------------------------------------------------------
# User / credits / plans
# ---------------------------------------------------------------------------

@router.get("/me", response_model=schemas.UserResponse)
async def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user


@router.get("/plans")
async def get_plans(current_user: models.User = Depends(get_current_user)):
    return {
        "plans": credit_service.PLANS,
        "current_plan": current_user.plan,
        "credits": current_user.credits,
        "costs": credit_service.COSTS,
    }


@router.post("/upgrade-plan", response_model=schemas.UserResponse)
async def upgrade_plan(
    body: schemas.UpgradePlanRequest,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user),
):
    # NOTE: In production wire Stripe payment before calling this.
    updated_user = credit_service.upgrade_plan(db, current_user, body.plan)
    return updated_user


@router.get("/credits/history", response_model=List[schemas.CreditTransactionResponse])
async def credit_history(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user),
):
    return (
        db.query(models.CreditTransaction)
        .filter(models.CreditTransaction.user_id == current_user.id)
        .order_by(models.CreditTransaction.created_at.desc())
        .limit(50)
        .all()
    )


# ---------------------------------------------------------------------------
# Document routes
# ---------------------------------------------------------------------------

@router.post("/upload", response_model=schemas.DocumentResponse)
async def upload_pdf(
    file: UploadFile = File(...),
    shared: bool = Form(False),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user),
):
    member = team_service.get_membership(db, current_user)
    if member and member.role not in team_service.CAN_EDIT:
        raise HTTPException(status_code=403, detail="Viewers can't upload documents")
    if shared and not member:
        raise HTTPException(status_code=400, detail="Join a team to share documents")

    # Deduct 2 credits before doing any work
    credit_service.check_and_deduct(db, current_user, "upload")

    file_location = await pdf_service.save_pdf(file)

    db_document = models.Document(
        filename=file.filename,
        file_path=file_location,
        upload_date=datetime.now(timezone.utc),
        user_id=current_user.id,
        team_id=member.team_id if shared else None,
    )
    db.add(db_document)
    db.commit()
    db.refresh(db_document)

    pdf_text = await pdf_service.extract_text_from_pdf(file_location)
    pages = await pdf_service.extract_pages(file_location)
    await vector_service.index_document(db_document.id, pdf_text, pages=pages)

    return db_document


@router.get("/documents", response_model=List[schemas.DocumentResponse])
async def get_documents(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user),
):
    member = team_service.get_membership(db, current_user)
    mine = (models.Document.user_id == current_user.id) & models.Document.team_id.is_(None)
    return (
        db.query(models.Document)
        .filter(or_(mine, models.Document.team_id == member.team_id) if member else mine)
        .order_by(models.Document.upload_date.desc())
        .all()
    )


@router.get("/documents/{document_id}/file")
async def get_document_file(
    document_id: int,
    edited: bool = False,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Stream the PDF (or its latest edited version) — storage is private, so access is checked here."""
    document, _ = team_service.get_document(db, current_user, document_id)
    path = (document.edited_file_path if edited else None) or document.file_path
    try:
        data = await pdf_service.read_file(path)
    except (FileNotFoundError, OSError):
        raise HTTPException(status_code=404, detail="File not found")
    return Response(
        content=data,
        media_type="application/pdf",
        headers={"Cache-Control": "private, no-store"},
    )


@router.delete("/documents/{document_id}")
async def delete_document(
    document_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user),
):
    document, role = team_service.get_document(db, current_user, document_id)
    if not team_service.can_delete(document, current_user, role):
        raise HTTPException(status_code=403, detail="You don't have permission to delete this document")

    stored_files = [document.file_path, document.edited_file_path]
    db.query(models.Comment).filter(models.Comment.document_id == document_id).delete()
    db.delete(document)
    db.commit()
    redis_service.clear_history(document_id)
    for path in stored_files:
        if blob_service.is_blob_key(path):
            try:
                await blob_service.delete(path)
            except Exception:
                pass  # the document is gone either way; an orphaned object is harmless
    return {"message": "Document deleted"}


@router.post("/ask")
async def ask_question(
    question_request: schemas.QuestionRequest,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user),
):
    document, role = team_service.get_document(db, current_user, question_request.id)

    # Deduct 1 credit upfront (minimum for any question)
    credit_service.check_and_deduct(db, current_user, "ask")

    current_file_path = document.edited_file_path or document.file_path
    pdf_text = await pdf_service.extract_text_from_pdf(current_file_path)

    result = await pdf_service.process_user_input(
        question_request.question,
        pdf_text,
        current_file_path,
        document,
        db,
        allow_edit=role in team_service.CAN_EDIT,
    )

    # Edits cost 1 extra credit (total 2) on top of the base ask credit
    if result.get("is_edit"):
        try:
            credit_service.check_and_deduct(db, current_user, "edit")
        except HTTPException:
            pass  # If they barely had 1 credit, don't fail the already-completed edit

    # Return remaining credits alongside the answer
    db.refresh(current_user)
    result["credits_remaining"] = current_user.credits
    return result


# ---------------------------------------------------------------------------
# Message routes
# ---------------------------------------------------------------------------

@router.post("/documents/{document_id}/messages", response_model=schemas.Message)
async def add_message(
    document_id: int,
    message: schemas.MessageCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user),
):
    document, role = team_service.get_document(db, current_user, document_id)

    db_message = models.Message(
        document_id=document_id,
        content=message.content,
        is_user=message.is_user,
        timestamp=datetime.now(timezone.utc),
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message


@router.get("/documents/{document_id}/export")
async def export_chat(
    document_id: int,
    format: str = Query(default="md", pattern="^(md|txt)$"),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user),
):
    document, role = team_service.get_document(db, current_user, document_id)

    messages = (
        db.query(models.Message)
        .filter(models.Message.document_id == document_id)
        .order_by(models.Message.timestamp.asc())
        .all()
    )

    exported_at = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    lines = [
        f"# Chat Export — {document.filename}",
        f"Exported: {exported_at}",
        "",
    ]
    for msg in messages:
        role = "**You**" if msg.is_user else "**DocuQuery**"
        ts = msg.timestamp.strftime("%H:%M") if msg.timestamp else ""
        lines.append(f"### {role}  _{ts}_")
        lines.append(msg.content)
        lines.append("")

    content = "\n".join(lines)
    safe_name = document.filename.replace(" ", "_").rstrip(".pdf")
    filename = f"chat_{safe_name}.md" if format == "md" else f"chat_{safe_name}.txt"
    media_type = "text/markdown" if format == "md" else "text/plain"

    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/documents/{document_id}/messages", response_model=List[schemas.Message])
async def get_messages(
    document_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user),
):
    document, role = team_service.get_document(db, current_user, document_id)

    return (
        db.query(models.Message)
        .filter(models.Message.document_id == document_id)
        .order_by(models.Message.timestamp.asc())
        .all()
    )
