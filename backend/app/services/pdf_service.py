import os
import boto3
import fitz  # PyMuPDF
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables from .env file

load_dotenv()

s3_client = boto3.client(
    's3',
    aws_access_key_id=os.environ["AWS_ACCESS_KEY"],
    aws_secret_access_key=os.environ['AWS_SECRET_KEY'],
    region_name=os.environ['AWS_REGION']
)

# Configure the Gemini API key
genai.configure(api_key=os.environ["GEMINI_API_KEY"])  # Ensure this is set correctly

# Initialize conversation history
conversation_history = []
environment = os.environ['ENVIRONMENT']

async def save_pdf(file) -> str:
    """
    Save a PDF file either locally or to an S3 bucket based on the environment.

    Args:
        file: The PDF file to upload.

    Returns:
        str: The path or URL of the saved file.
    """
    bucket_name = os.environ['AWS_BUCKET_NAME']

    if environment == "production":
        # Save to S3 in production
        file_key = f"pdfs/{file.filename}"
        
        # Ensure that the file-like object is read correctly
        await file.seek(0)  # Resetting the file pointer if necessary
        
        s3_client.upload_fileobj(file.file, bucket_name, file_key, ExtraArgs={'ContentType': 'application/pdf'})

        # Generate the file URL
        file_url = f"https://{bucket_name}.s3.amazonaws.com/{file_key}"
        print(f"File uploaded to S3 at: {file_url}")
        return file_url

    else:
        # Save locally in development
        os.makedirs('pdfs', exist_ok=True)
        file_location = f"pdfs/{file.filename}"
        with open(file_location, "wb") as f:
            f.write(await file.read())
        
        print(f"File saved locally at: {file_location}")
        return file_location

async def extract_text_from_pdf(file_path: str) -> str:
    """
    Extracts text from a PDF file.

    Args:
        file_path (str): The path to the PDF file.

    Returns:
        str: The extracted text from the PDF.
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
        
        # Extract text from temp file
        document = fitz.open(temp.name)
        text = ""
        for page in document:
            text += page.get_text()
        document.close()
        
        # Clean up temp file
        os.unlink(temp.name)
        return text



async def answer_question(question: str, pdf_text: str):
    """
    Answers a question based on the provided PDF text using Gemini 1.5 Flash, considering
    conversation history for context-aware responses.

    Args:
        question (str): The question to answer.
        pdf_text (str): The context extracted from the PDF.

    Returns:
        str: The answer to the question.
    """
    # Update conversation history with the latest question
    conversation_history.append({"role": "user", "content": question})

    # Compile context from previous exchanges (up to 3 latest) and PDF text
    context = " ".join([entry["content"] for entry in conversation_history[-3:]])
    
    # Prepare prompt to make the response conversational and brief
    content = [
        {
            "parts": [
                {"text": f"Here’s the document summary: {pdf_text}. Now, here's the ongoing conversation: {context}. Please provide a brief, chat-style response to the latest question: '{question}'."}
            ]
        }
    ]

    # Generate content using the Gemini model
    response = genai.GenerativeModel("gemini-1.5-flash").generate_content(contents=content)

    # Check if a response was generated and add it to the conversation history
    if response and hasattr(response, 'text'):
        response_text = response.text.strip()
        conversation_history.append({"role": "assistant", "content": response_text})
        return response_text
    
    return "I'm sorry, I couldn't find an answer to that question."
