from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import List
import jwt

from .. import models, schemas, database
from ..services import auth_service, pdf_service, vector_service, redis_service, credit_service

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
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user),
):
    # Deduct 2 credits before doing any work
    credit_service.check_and_deduct(db, current_user, "upload")

    file_location = await pdf_service.save_pdf(file)

    db_document = models.Document(
        filename=file.filename,
        file_path=file_location,
        upload_date=datetime.now(timezone.utc),
        user_id=current_user.id,
    )
    db.add(db_document)
    db.commit()
    db.refresh(db_document)

    pdf_text = await pdf_service.extract_text_from_pdf(file_location)
    await vector_service.index_document(db_document.id, pdf_text)

    return db_document


@router.get("/documents", response_model=List[schemas.DocumentResponse])
async def get_documents(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user),
):
    return (
        db.query(models.Document)
        .filter(models.Document.user_id == current_user.id)
        .order_by(models.Document.upload_date.desc())
        .all()
    )


@router.delete("/documents/{document_id}")
async def delete_document(
    document_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user),
):
    document = db.query(models.Document).filter(
        models.Document.id == document_id,
        models.Document.user_id == current_user.id,
    ).first()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    db.delete(document)
    db.commit()
    redis_service.clear_history(document_id)
    return {"message": "Document deleted"}


@router.post("/ask")
async def ask_question(
    question_request: schemas.QuestionRequest,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user),
):
    document = db.query(models.Document).filter(
        models.Document.id == question_request.id,
        models.Document.user_id == current_user.id,
    ).first()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

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
    document = db.query(models.Document).filter(
        models.Document.id == document_id,
        models.Document.user_id == current_user.id,
    ).first()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

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


@router.get("/documents/{document_id}/messages", response_model=List[schemas.Message])
async def get_messages(
    document_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user),
):
    document = db.query(models.Document).filter(
        models.Document.id == document_id,
        models.Document.user_id == current_user.id,
    ).first()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    return (
        db.query(models.Message)
        .filter(models.Message.document_id == document_id)
        .order_by(models.Message.timestamp.asc())
        .all()
    )
