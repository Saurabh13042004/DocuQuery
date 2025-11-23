import os
import boto3
import pymupdf as fitz
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage
import re
from datetime import datetime
from pathlib import Path

load_dotenv()


s3_client = boto3.client(
    's3',
    aws_access_key_id=os.environ["AWS_ACCESS_KEY"],
    aws_secret_access_key=os.environ['AWS_SECRET_KEY'],
    region_name=os.environ['AWS_REGION']
)

# Register downloaded fonts with PyMuPDF
def register_custom_fonts():
    """Register custom fonts from fonts directory."""
    try:
        fonts_dir = Path(__file__).parent.parent.parent / "fonts"
        
        font_mappings = {
            'DejaVuSerifCondensed': 'DejaVuSerifCondensed.ttf',
            'DejaVuSerifCondensed-Bold': 'DejaVuSerifCondensed-Bold.ttf',
            'DejaVuSerifCondensed-BoldItalic': 'DejaVuSerifCondensed-BoldItalic.ttf',
            'DejaVuSerifCondensed-Italic': 'DejaVuSerifCondensed-Italic.ttf',
        }
        
        for font_name, file_name in font_mappings.items():
            font_path = fonts_dir / file_name
            if font_path.exists():
                try:
                    fitz.Font(font_name, str(font_path))
                except Exception:
                    pass  # Font already registered or skipped
    except Exception:
        pass  # Skip if fonts directory doesn't exist

# Register fonts on startup
register_custom_fonts()

# Font fallback mapping for better font substitution
FONT_FALLBACK_MAP = {
    'DejaVuSerifCondensed': 'DejaVuSerifCondensed',  # Try to use the same font
    'DejaVuSerifCondensed-Bol': 'DejaVuSerifCondensed-Bold',
    'DejaVuSerifCondensed-BolIta': 'DejaVuSerifCondensed-BoldItalic',
    'DejaVuSerifCondensed-Ita': 'DejaVuSerifCondensed-Italic',
    'ind_hi_1_001': 'Helvetica',
    'XBZar-Bold': 'Helvetica-Bold',
    'Garuda': 'Helvetica',
    'Tlwg': 'Helvetica',
}

def get_best_font_substitute(font_name):
    """Get the best font substitute for unavailable fonts."""
    if not font_name:
        return 'DejaVuSerifCondensed'
    
    # Check direct mapping first
    if font_name in FONT_FALLBACK_MAP:
        return FONT_FALLBACK_MAP[font_name]
    
    # Check if it's a bold variant
    if 'Bold' in font_name or 'bold' in font_name or '-B' in font_name:
        return 'DejaVuSerifCondensed-Bold'
    
    # Check if it's an italic variant
    if 'Italic' in font_name or 'Oblique' in font_name or '-I' in font_name or '-O' in font_name:
        return 'DejaVuSerifCondensed-Italic'
    
    # Check if it's bold-italic
    if ('Bold' in font_name or 'bold' in font_name) and ('Italic' in font_name or 'Oblique' in font_name):
        return 'DejaVuSerifCondensed-BoldItalic'
    
    # Default fallback to DejaVu
    return 'DejaVuSerifCondensed'

llm = ChatGoogleGenerativeAI(
    model="gemini-2.0-flash",
    google_api_key=os.environ["GEMINI_API_KEY"],
)
conversation_history = []
environment = os.environ['ENVIRONMENT']

print(f"PDF Service initialized in {environment} environment.")

async def save_pdf(file) -> str:
    """
    Save a PDF file either locally or to an S3 bucket based on the environment.
    """
    bucket_name = os.environ['AWS_BUCKET_NAME']
    region = os.environ['AWS_REGION']

    if environment == "production":

        file_key = f"pdfs/{file.filename}"
        await file.seek(0)
        
        s3_client.upload_fileobj(file.file, bucket_name, file_key, ExtraArgs={'ContentType': 'application/pdf'})
        file_url = f"https://{bucket_name}.s3.{region}.amazonaws.com/{file_key}"
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

async def process_user_input(question: str, pdf_text: str, file_path: str, document=None, db=None):
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
            # Update the document's edited_file_path in the database
            if document and db:
                document.edited_file_path = result["edited_file_path"]
                db.commit()
            
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
    Edit a PDF based on user instruction while preserving exact font and formatting.
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
        # Use search to find all occurrences with exact positioning
        text_dict = page.get_text("dict")
        
        for block in text_dict.get("blocks", []):
            if block.get("type") != 0:  # 0 = text block
                continue
                
            for line in block.get("lines", []):
                for span in line.get("spans", []):
                    span_text = span.get("text", "")
                    
                    # Check if original text is in this span
                    if original_text not in span_text:
                        continue
                    
                    # Extract complete font information
                    original_font = span.get("font", "Helv")
                    font_size = span.get("size", 12)
                    font_color = span.get("color", 0)
                    bbox = span.get("bbox", (0, 0, 0, 0))
                    
                    # Get best substitute if original font not available
                    best_substitute = get_best_font_substitute(original_font)
                    
                    # Convert color to RGB
                    text_color = font_color
                    if isinstance(text_color, int):
                        if text_color == 0:
                            rgb_color = (0, 0, 0)  # Black
                        else:
                            r = (text_color >> 16) & 0xff
                            g = (text_color >> 8) & 0xff
                            b = text_color & 0xff
                            rgb_color = (r/255, g/255, b/255)
                    else:
                        rgb_color = text_color if text_color else (0, 0, 0)
                    
                    # Clear the old text area with white rectangle
                    page.draw_rect(fitz.Rect(bbox), color=None, fill=(1, 1, 1))
                    
                    # Calculate baseline position for proper vertical alignment
                    baseline_y = bbox[3] - (font_size * 0.2)
                    baseline_point = fitz.Point(bbox[0], baseline_y)
                    
                    # Try to insert text with progressively more fallback options
                    text_inserted = False
                    
                    # Attempt 1: Try with original font from font file (if DejaVu)
                    if original_font == 'DejaVuSerifCondensed':
                        font_file = Path(__file__).parent.parent.parent / "fonts" / "DejaVuSerifCondensed.ttf"
                        if font_file.exists():
                            try:
                                page.insert_text(
                                    baseline_point,
                                    new_text,
                                    fontname="DejaVuSerifCondensed",
                                    fontsize=font_size,
                                    color=rgb_color,
                                    fontfile=str(font_file)  # Use fontfile parameter with path
                                )
                                text_inserted = True
                            except Exception:
                                pass  # Font file approach failed
                    
                    # Attempt 2: Try with original font name (standard)
                    if not text_inserted:
                        try:
                            page.insert_text(
                                baseline_point,
                                new_text,
                                fontname=original_font,
                                fontsize=font_size,
                                color=rgb_color
                            )
                            text_inserted = True
                        except Exception:
                            pass  # Original font not available
                    
                    # Attempt 3: Try with best substitute font
                    if not text_inserted and best_substitute != original_font:
                        try:
                            page.insert_text(
                                baseline_point,
                                new_text,
                                fontname=best_substitute,
                                fontsize=font_size,
                                color=rgb_color
                            )
                            text_inserted = True
                        except Exception:
                            pass  # Substitute also failed
                    
                    # Attempt 4: Try Helvetica directly
                    if not text_inserted and best_substitute != "Helvetica":
                        try:
                            page.insert_text(
                                baseline_point,
                                new_text,
                                fontname="Helvetica",
                                fontsize=font_size,
                                color=rgb_color
                            )
                            text_inserted = True
                        except Exception:
                            pass  # Helvetica also failed
                    
                    # Attempt 5: Use default font
                    if not text_inserted:
                        try:
                            page.insert_text(
                                baseline_point,
                                new_text,
                                fontsize=font_size,
                                color=rgb_color
                            )
                            text_inserted = True
                        except Exception as e:
                            print(f"Warning: Could not insert text with any font method: {e}")
                    
                    if text_inserted:
                        changes_made = True

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
        
        # Upload to S3 (commented out for local development)
        # bucket_name = os.environ['AWS_BUCKET_NAME']
        # file_key = f"pdfs/{new_file_name}"
        # with open(temp_output, 'rb') as f:
        #     s3_client.upload_fileobj(f, bucket_name, file_key, ExtraArgs={'ContentType': 'application/pdf'})
        
        # Clean up temporary files
        os.unlink(local_path)
        os.unlink(temp_output)
        
        # edited_pdf_url = f"https://{bucket_name}.s3.amazonaws.com/{file_key}"
        edited_pdf_url = f"/pdfs/{new_file_name}"
        edited_pdf_path = temp_output
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
        "edited_file_path": edited_pdf_path,
        "changes": f"Changed '{original_text}' to '{new_text}'."
    }
