import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
MODEL = "gemini-2.5-flash"


async def answer_question(question: str, pdf_text: str):
    prompt = (
        f"You are a helpful assistant. Answer the following question based on the provided document context.\n\n"
        f"Document context:\n{pdf_text}\n\n"
        f"Question: {question}"
    )

    try:
        response = client.models.generate_content(model=MODEL, contents=prompt)
        return response.text.strip()
    except Exception as e:
        print("Exception occurred:", str(e))
        return "An error occurred while processing your request."
