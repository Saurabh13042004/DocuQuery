from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas
from ..services.pdf_service import save_uploaded_file, extract_text_from_pdf
from ..services.qa_service import qa_service

router = APIRouter()

@router.post("/upload", response_model=schemas.Document)
def upload_pdf(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    file_path = save_uploaded_file(file)
    
    db_document = models.Document(filename=file.filename, file_path=file_path)
    db.add(db_document)
    db.commit()
    db.refresh(db_document)
    
    return db_document

@router.post("/ask", response_model=dict)
def ask_question(question_request: schemas.QuestionRequest, db: Session = Depends(get_db)):
    document = db.query(models.Document).filter(models.Document.id == question_request.document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    text = extract_text_from_pdf(document.file_path)
    vector_store = qa_service.create_vector_store(text)
    answer = qa_service.answer_question(vector_store, question_request.question)
    
    return {"answer": answer}