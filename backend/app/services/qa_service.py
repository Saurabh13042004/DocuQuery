from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.vectorstores import FAISS
from langchain.chains.question_answering import load_qa_chain
from langchain.llms import OpenAI
from dotenv import load_dotenv
import os

load_dotenv()

class QAService:
    def __init__(self):
        self.embeddings = OpenAIEmbeddings()
        self.llm = OpenAI(temperature=0)
        self.qa_chain = load_qa_chain(self.llm, chain_type="stuff")

    def create_vector_store(self, text: str):
        return FAISS.from_texts([text], self.embeddings)

    def answer_question(self, vector_store, question: str) -> str:
        docs = vector_store.similarity_search(question)
        return self.qa_chain.run(input_documents=docs, question=question)

qa_service = QAService()