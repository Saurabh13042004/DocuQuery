from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas, database
from ..services import pdf_service
import os

router = APIRouter()

from datetime import datetime

@router.post("/upload/", response_model=schemas.DocumentResponse)
async def upload_pdf(file: UploadFile = File(...), db: Session = Depends(database.get_db)):
    # Save and process the PDF
    file_location = await pdf_service.save_pdf(file)
    
    # Create a new Document record with file path and upload_date
    db_document = models.Document(
        filename=file.filename,
        file_path=file_location,
        upload_date=datetime.utcnow()
    )
    db.add(db_document)
    db.commit()
    db.refresh(db_document)
    
    return db_document


@router.post("/ask/")
async def ask_question(question_request: schemas.QuestionRequest, db: Session = Depends(database.get_db)):
    document = db.query(models.Document).filter(models.Document.id == question_request.id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Use the stored file_path directly
    pdf_text = await pdf_service.extract_text_from_pdf(document.file_path)
    answer = await pdf_service.answer_question(question_request.question, pdf_text)
    
    return {"answer": answer}

