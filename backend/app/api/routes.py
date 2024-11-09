from fastapi import APIRouter, UploadFile, File, Depends
from sqlalchemy.orm import Session
from .. import models, schemas, database
from ..services import pdf_service 

router = APIRouter()

@router.post("/upload/")
async def upload_pdf(file: UploadFile = File(...), db: Session = Depends(database.get_db)):
    file_location = await pdf_service.save_pdf(file)  # Call save_pdf from pdf_service directly
    pdf_text = await pdf_service.extract_text_from_pdf(file_location)

    db_document = models.Document(filename=file.filename)  # Add additional fields as necessary.
    db.add(db_document)
    db.commit()
    
    return {"filename": file.filename}

@router.post("/ask/")
async def ask_question(question_request: schemas.QuestionRequest, db: Session = Depends(database.get_db)):
    document_id = question_request.document_id
    question = question_request.question
    
    # Fetch the PDF text based on document_id (you need to implement this logic)
    db_document = db.query(models.Document).filter(models.Document.id == document_id).first()
    
    if not db_document:
        raise HTTPException(status_code=404, detail="Document not found.")
    
    # Assuming you have stored PDF text somewhere or can extract it again
    pdf_text = await pdf_service.extract_text_from_pdf(f"pdfs/{db_document.filename}")

    answer = await pdf_service.answer_question(question, pdf_text)
    
    return {"answer": answer}