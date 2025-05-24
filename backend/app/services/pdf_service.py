import os
import boto3
import pymupdf as fitz
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage

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
