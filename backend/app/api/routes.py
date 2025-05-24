from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import timedelta
from .. import models, schemas, database
from ..services import pdf_service, auth_service
import os
import jwt


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
async def ask_question(question_request: schemas.QuestionRequest, db: Session = Depends(database.get_db),  current_user: models.User = Depends(get_current_user)):
    document = db.query(models.Document).filter(models.Document.id == question_request.id,        models.Document.user_id == current_user.id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
        
    pdf_text = await pdf_service.extract_text_from_pdf(document.file_path)
    answer = await pdf_service.answer_question(question_request.question, pdf_text)
    
    return {"answer": answer}

