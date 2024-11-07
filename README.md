# DocuQuery 📚

## Overview

DocuQuery is an intelligent document query system that allows users to upload PDF documents and ask questions about their content using natural language processing. The application provides an intuitive interface for document management and real-time question-answering capabilities.

## 🚀 Features

### Core Functionality
- **PDF Upload & Management**
  - Upload PDF documents
  - View uploaded document history
  - Automatic text extraction from PDFs
  - Secure document storage

- **Intelligent Question Answering**
  - Natural language question processing
  - Context-aware answer generation
  - Support for follow-up questions
  - Real-time response generation

- **User Interface**
  - Clean, intuitive design
  - Responsive layout
  - Progress indicators for uploads
  - Error handling and feedback

### Technical Features
- RESTful API architecture
- Document metadata management
- Vector-based document indexing
- Efficient text extraction and processing

## 🛠 Tech Stack

### Backend
- **FastAPI**: High-performance web framework for building APIs
- **LangChain**: Framework for developing applications powered by language models
- **SQLite/PostgreSQL**: Database for document metadata storage
- **PyPDF**: PDF processing and text extraction
- **Python 3.9+**: Core programming language

### Frontend
- **React.js**: User interface development
- **Tailwind CSS**: Styling and responsive design
- **Axios**: HTTP client for API requests

### AI/ML
- **OpenAI**: Language model integration
- **FAISS**: Vector storage and similarity search

### Storage
- Local filesystem (development)
- AWS S3 (production) for document storage

## 📋 Prerequisites

- Python 3.9 or higher
- Node.js 14.0 or higher
- OpenAI API key
- SQLite (development) or PostgreSQL (production)

## 🚀 Getting Started

1. Clone the repository
```bash
git clone https://github.com/saurabh13042004/docuquery.git
cd docuquery
```

2. Set up the backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. Configure environment variables
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start the backend server
```bash
uvicorn app.main:app --reload
```

5. Set up the frontend
```bash
cd ../frontend
npm install
npm run dev
```

## 🔧 Configuration

Create a `.env` file in the backend directory with the following variables:

```env
DATABASE_URL=sqlite:///./test.db
OPENAI_API_KEY=your_openai_api_key_here
UPLOAD_DIR=uploads
```

## 📚 API Documentation

### Endpoints

- `POST /upload`: Upload PDF documents
- `POST /ask`: Ask questions about documents
- `GET /documents`: List uploaded documents

For detailed API documentation, visit `/docs` after starting the backend server.

## 🧪 Testing

Run backend tests:
```bash
pytest
```

Run frontend tests:
```bash
npm test
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

