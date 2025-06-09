import os
import boto3
import pymupdf as fitz
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage
import re
from datetime import datetime

load_dotenv()


# s3_client = boto3.client(
#     's3',
#     aws_access_key_id=os.environ["AWS_ACCESS_KEY"],
#     aws_secret_access_key=os.environ['AWS_SECRET_KEY'],
#     region_name=os.environ['AWS_REGION']
# )

llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash",
    google_api_key=os.environ["GEMINI_API_KEY"],
)
conversation_history = []
environment = os.environ['ENVIRONMENT']

async def save_pdf(file) -> str:
    """
    Save a PDF file either locally or to an S3 bucket based on the environment.
    """
    bucket_name = os.environ['AWS_BUCKET_NAME']

    if environment == "production":

        file_key = f"pdfs/{file.filename}"
        await file.seek(0)
        
        s3_client.upload_fileobj(file.file, bucket_name, file_key, ExtraArgs={'ContentType': 'application/pdf'})
        file_url = f"https://{bucket_name}.s3.amazonaws.com/{file_key}"
        print(f"File uploaded to S3 at: {file_url}")
        return file_url

    else:
        os.makedirs('pdfs', exist_ok=True)
        file_location = f"pdfs/{file.filename}"
        with open(file_location, "wb") as f:
            f.write(await file.read())
        
        print(f"File saved locally at: {file_location}")
        return file_location

async def extract_text_from_pdf(file_path: str) -> str:
    """
    Extracts text from a PDF file.
    """
    if environment == "development":
        document = fitz.open(file_path)
        text = ""
        for page in document:
            text += page.get_text()
        document.close()
        return text
    else:
        import tempfile
        import requests
        
        temp = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
        response = requests.get(file_path)
        temp.write(response.content)
        temp.close()
        
        document = fitz.open(temp.name)
        text = ""
        for page in document:
            text += page.get_text()
        document.close()
        
        os.unlink(temp.name)
        return text

async def answer_question(question: str, pdf_text: str):
    """
    Answers a question based on the provided PDF text using ChatGoogleGenerativeAI.
    """
    conversation_history.append({"role": "user", "content": question})

    context = " ".join([entry["content"] for entry in conversation_history[-3:]])
    message = HumanMessage(
        content=[
            {
                "type": "text",
                "text": f"Here’s the document summary: {pdf_text}. Now, here's the ongoing conversation: {context}. Please provide a brief, chat-style response to the latest question: '{question}'."
            }
        ]
    )

    response = llm.invoke([message])

    if response and hasattr(response, 'content'):
        response_text = response.content.strip()
        conversation_history.append({"role": "assistant", "content": response_text})
        return response_text
    
    return "I'm sorry, I couldn't find an answer to that question."

async def process_user_input(question: str, pdf_text: str, file_path: str):
    """
    Process user input - either answer a question or edit the PDF based on instruction.
    """
    # Check if this is likely an edit request
    edit_patterns = [
        r"change\s+(.+?)\s+to\s+(.+)",
        r"edit\s+(.+?)\s+to\s+(.+)",
        r"replace\s+(.+?)\s+with\s+(.+)",
        r"update\s+(.+?)\s+to\s+(.+)",
        r"modify\s+(.+?)\s+to\s+(.+)"
    ]
    
    is_edit_request = False
    for pattern in edit_patterns:
        if re.search(pattern, question, re.IGNORECASE):
            is_edit_request = True
            break
    
    # If not clearly an edit request, let's ask the AI to determine intent
    if not is_edit_request:
        intent_prompt = f"Determine if this message is asking to edit/change a PDF document or just asking a question: '{question}'. Answer only with 'EDIT' or 'QUESTION'."
        message = HumanMessage(content=intent_prompt)
        intent_response = llm.invoke([message])
        intent_text = intent_response.content.strip().upper()
        
        is_edit_request = "EDIT" in intent_text
    
    # If it's an edit request, process it as such
    if is_edit_request:
        result = await edit_pdf(file_path, question)
        
        if result["success"]:
            response_text = f"I've edited the PDF as requested. {result['changes']} You can download the updated version."
            return {
                "answer": response_text,
                "is_edit": True,
                "editedPdfUrl": result["editedPdfUrl"]
            }
        else:
            return {
                "answer": f"I couldn't make that edit: {result['message']}. Could you be more specific?",
                "is_edit": False
            }
    
    # If it's a question, answer it normally
    answer = await answer_question(question, pdf_text)
    return {
        "answer": answer,
        "is_edit": False
    }

async def edit_pdf(file_path: str, instruction: str):
    """
    Edit a PDF based on user instruction while preserving text formatting.
    Returns information about the edited PDF.
    """
    # Handle S3 paths in production
    if environment == "production" and file_path.startswith("http"):
        import tempfile
        import requests
        
        temp = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
        response = requests.get(file_path)
        temp.write(response.content)
        temp.close()
        local_path = temp.name
    else:
        local_path = file_path

    # Open the PDF
    doc = fitz.open(local_path)
    
    # Extract text to analyze what needs to be changed
    full_text = ""
    for page in doc:
        full_text += page.get_text()
    
    # Use AI to understand the edit instruction and identify what to change
    prompt = f"""
    I need to edit a PDF document based on this instruction: "{instruction}"
    
    Here's the text content of the PDF:
    {full_text[:2000]}
    
    Please identify:
    1. What text needs to be changed (exact original text)
    2. What it should be changed to (exact new text)
    
    Return your response in this format:
    Original: [original text]
    New: [new text]
    """
    
    message = HumanMessage(content=prompt)
    response = llm.invoke([message])
    
    # Parse the AI response
    response_text = response.content.strip()
    
    # Extract original and new text using regex
    original_match = re.search(r"Original: (.*?)(?:\n|$)", response_text)
    new_match = re.search(r"New: (.*?)(?:\n|$)", response_text)
    
    if not original_match or not new_match:
        if environment == "production" and file_path.startswith("http"):
            os.unlink(local_path)
        return {"success": False, "message": "Could not identify what to change"}
    
    original_text = original_match.group(1).strip()
    new_text = new_match.group(1).strip()
    
    # Perform the edit on the PDF with formatting preservation
    changes_made = False
    
    for page_num, page in enumerate(doc):
        # Get spans which contain formatting information
        spans = page.get_text("dict")["blocks"]
        
        for block in spans:
            if "lines" in block:
                for line in block["lines"]:
                    for span in line["spans"]:
                        # Check if this span contains our target text
                        if original_text in span["text"]:
                            # We found the text to replace
                            
                            # Store the formatting information
                            font_name = span["font"]
                            font_size = span["size"]
                            font_color = span["color"]
                            flags = span["flags"]  # Contains bold/italic info

                            # Get the rectangle coordinates for this text
                            rect = fitz.Rect(span["bbox"])

                            # Redact the original text
                            page.add_redact_annot(rect)
                            page.apply_redactions()

                            # Convert color to the format expected by PyMuPDF
                            if isinstance(font_color, int):
                                r = (font_color >> 16) & 0xff
                                g = (font_color >> 8) & 0xff
                                b = font_color & 0xff
                                color = (r/255, g/255, b/255)
                            else:
                                color = font_color

                            # Determine font based on flags
                            if flags & 16:  # Bold flag (2^4)
                                font_name = "Helvetica-Bold"
                            elif flags & 2:  # Italic flag (2^1)
                                font_name = "Helvetica-Oblique"
                            else:
                                font_name = "Helvetica"

                            # Calculate baseline position for proper vertical alignment
                            # Use the bottom-left corner of the bounding box
                            # Add 1 point to position at the baseline
                            baseline_point = fitz.Point(rect.x0, rect.y1 - 1)
                            
                            print(f"Inserting text at baseline position ({baseline_point.x}, {baseline_point.y})")
                            
                            try:
                                # Insert the text at the baseline position
                                page.insert_text(
                                    baseline_point,
                                    new_text,
                                    fontname=font_name,
                                    fontsize=font_size,
                                    color=color,
                                    render_mode=0  # Normal rendering
                                )
                                changes_made = True
                            except Exception as e:
                                print(f"Error inserting text: {e}")
                                # Fallback to textbox insertion
                                try:
                                    page.insert_textbox(
                                        rect,
                                        new_text,
                                        fontname=font_name,
                                        fontsize=font_size,
                                        color=color,
                                        render_mode=0,
                                        align=0
                                    )
                                    changes_made = True
                                except Exception as e2:
                                    print(f"Textbox insertion also failed: {e2}")

    if not changes_made:
        if environment == "production" and file_path.startswith("http"):
            os.unlink(local_path)
        return {"success": False, "message": "Could not find the text to replace"}
    
    # Save the edited PDF with a new name
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    file_name = os.path.basename(file_path) if not file_path.startswith("http") else file_path.split("/")[-1]
    new_file_name = f"edited_{timestamp}_{file_name}"
    
    if environment == "production":
        # Save locally first
        temp_output = f"/tmp/{new_file_name}"
        doc.save(temp_output)
        doc.close()
        
        # Upload to S3
        bucket_name = os.environ['AWS_BUCKET_NAME']
        file_key = f"pdfs/{new_file_name}"
        
        with open(temp_output, 'rb') as f:
            s3_client.upload_fileobj(f, bucket_name, file_key, ExtraArgs={'ContentType': 'application/pdf'})
        
        # Clean up temporary files
        os.unlink(local_path)
        os.unlink(temp_output)
        
        edited_pdf_url = f"https://{bucket_name}.s3.amazonaws.com/{file_key}"
    else:
        # Save locally
        os.makedirs('pdfs', exist_ok=True)
        edited_pdf_path = f"pdfs/{new_file_name}"
        doc.save(edited_pdf_path)
        doc.close()
        edited_pdf_url = f"/pdfs/{new_file_name}"
    
    # Return the path to the new file and a description of changes
    return {
        "success": True, 
        "editedPdfUrl": edited_pdf_url,
        "changes": f"Changed '{original_text}' to '{new_text}'."
    }
