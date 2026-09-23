import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
MODEL = os.environ.get("OPENAI_CHAT_MODEL", "gpt-4o-mini")


async def answer_question(question: str, pdf_text: str):
    prompt = (
        f"You are a helpful assistant. Answer the following question based on the provided document context.\n\n"
        f"Document context:\n{pdf_text}\n\n"
        f"Question: {question}"
    )

    try:
        response = client.chat.completions.create(model=MODEL, messages=[{"role": "user", "content": prompt}])
        return response.choices[0].message.content.strip()
    except Exception as e:
        print("Exception occurred:", str(e))
        return "An error occurred while processing your request."
