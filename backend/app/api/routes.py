from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import List
from .. import models, schemas, database
from ..services import pdf_service, auth_service
import os
import jwt
from typing import List

router = APIRouter()
security = HTTPBearer()

from datetime import datetime


@router.post("/signup", response_model=schemas.Token)
async def signup(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    try:
        db_user = auth_service.create_user(db=db, user=user)
        access_token_expires = timedelta(minutes=auth_service.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = auth_service.create_access_token(
            data={"sub": db_user.email}, expires_delta=access_token_expires
        )
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": db_user
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Signup error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/login", response_model=schemas.Token)
async def login(user_credentials: schemas.UserLogin, db: Session = Depends(database.get_db)):
    try:
        user = auth_service.authenticate_user(db, user_credentials.email, user_credentials.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        access_token_expires = timedelta(minutes=auth_service.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = auth_service.create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="Login failed")
    


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(database.get_db)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, auth_service.SECRET_KEY, algorithms=[auth_service.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except jwt.PyJWTError:  # or jwt.JWTError if using python-jose
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except Exception as e:
        print(f"Token validation error: {e}")
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    user = auth_service.get_user_by_email(db, email=email)
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user


@router.post("/upload", response_model=schemas.DocumentResponse)
async def upload_pdf(file: UploadFile = File(...), db: Session = Depends(database.get_db),current_user: models.User = Depends(get_current_user)):
    file_location = await pdf_service.save_pdf(file)

    db_document = models.Document(
        filename=file.filename,
        file_path=file_location,
        upload_date=datetime.utcnow(),
        user_id=current_user.id
    )
    db.add(db_document)
    db.commit()
    db.refresh(db_document)
    
    return db_document


@router.post("/ask")
async def ask_question(
    question_request: schemas.QuestionRequest, 
    db: Session = Depends(database.get_db),  
    current_user: models.User = Depends(get_current_user)
):
    document = db.query(models.Document).filter(
        models.Document.id == question_request.id,
        models.Document.user_id == current_user.id
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
        
    # Use the latest edited file if available, otherwise use original
    current_file_path = document.edited_file_path if document.edited_file_path else document.file_path
    pdf_text = await pdf_service.extract_text_from_pdf(current_file_path)
    
    # Use the process_user_input function instead of answer_question
    # This will handle both questions and edit requests
    result = await pdf_service.process_user_input(
        question_request.question, 
        pdf_text, 
        current_file_path,
        document,
        db
    )
    
    # Return the full result (includes answer, is_edit flag, and editedPdfUrl if applicable)
    return result


@router.get("/documents", response_model=List[schemas.DocumentResponse])
async def get_documents(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    documents = db.query(models.Document).filter(models.Document.user_id == current_user.id).order_by(models.Document.upload_date.desc()).all()
    return documents


@router.post("/documents/{document_id}/messages", response_model=schemas.Message)
async def add_message(
    document_id: int,
    message: schemas.MessageCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Check if document exists and belongs to user
    document = db.query(models.Document).filter(
        models.Document.id == document_id,
        models.Document.user_id == current_user.id
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Create new message
    db_message = models.Message(
        document_id=document_id,
        content=message.content,
        is_user=message.is_user,
        timestamp=datetime.utcnow()
    )
    
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    
    return db_message


@router.get("/documents/{document_id}/messages", response_model=List[schemas.Message])
async def get_messages(
    document_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Check if document exists and belongs to user
    document = db.query(models.Document).filter(
        models.Document.id == document_id,
        models.Document.user_id == current_user.id
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Get messages for document
    messages = db.query(models.Message).filter(
        models.Message.document_id == document_id
    ).order_by(models.Message.timestamp.asc()).all()
    
    return messages

