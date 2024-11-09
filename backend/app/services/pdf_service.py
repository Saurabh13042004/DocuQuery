import os
import fitz  # PyMuPDF
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configure the Gemini API key
genai.configure(api_key=os.environ["GEMINI_API_KEY"])  # Ensure this is set correctly

async def save_pdf(file) -> str:
    """
    Saves the uploaded PDF file to the local filesystem.

    Args:
        file: The uploaded file object.

    Returns:
        str: The file path where the PDF is saved.
    """
    os.makedirs('pdfs', exist_ok=True)
    file_location = f"pdfs/{file.filename}"
    with open(file_location, "wb") as f:
        f.write(await file.read())
    return file_location

async def extract_text_from_pdf(file_path: str) -> str:
    """
    Extracts text from a PDF file.

    Args:
        file_path (str): The path to the PDF file.

    Returns:
        str: The extracted text from the PDF.
    """
    document = fitz.open(file_path)
    text = ""
    for page in document:
        text += page.get_text()
    document.close()
    
    return text

async def answer_question(question: str, pdf_text: str):
    """
    Answers a question based on the provided PDF text using Gemini 1.5 Flash.

    Args:
        question (str): The question to answer.
        pdf_text (str): The context extracted from the PDF.

    Returns:
        str: The answer to the question.
    """
    # Prepare input for the Gemini model
    content = [
        {
            "parts": [
                {"text": pdf_text}  # Pass the extracted PDF text as context
            ]
        }
    ]

    # Generate content using the Gemini model
    response = genai.GenerativeModel("gemini-1.5-flash").generate_content(contents=content)

    # Check if a response was generated and return it
    if response and hasattr(response, 'text'):
        return response.text.strip()
    
    return "I'm sorry, I couldn't find an answer to that question."