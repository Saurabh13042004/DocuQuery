import os
import requests
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get the OpenAI API key from the environment variable
API_KEY = os.getenv('OPENAI_API_KEY')
API_URL = 'https://api.openai.com/v1/chat/completions'

async def answer_question(question: str, pdf_text: str):
    # Prepare the messages for the OpenAI API
    messages = [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": f"Context: {pdf_text}\n\nQuestion: {question}"}
    ]

    # Set up the headers for the API request
    headers = {
        'Authorization': f'Bearer {API_KEY}',
        'Content-Type': 'application/json',
    }

    # Prepare the data payload for the API request
    data = {
        "model": "gpt-3.5-turbo",
        "messages": messages,
        "max_tokens": 150,  # Adjust as needed for longer responses
        "temperature": 0.7,  # Adjust for creativity; lower values are more deterministic
    }

    try:
        # Make the API request
        response = requests.post(API_URL, headers=headers, json=data)

        # Check if the response was successful
        if response.status_code == 200:
            answer = response.json()['choices'][0]['message']['content']
            return answer.strip()
        else:
            print("Error:", response.status_code, response.text)
            return "Sorry, I couldn't process your request."
    
    except Exception as e:
        print("Exception occurred:", str(e))
        return "An error occurred while processing your request."