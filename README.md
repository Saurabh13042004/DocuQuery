# DocuQuery 📚

## Overview

DocuQuery is an intelligent document query system that allows users to upload PDF documents and ask questions about their content using advanced natural language processing. The application leverages LangChain integrated with Google's Generative AI (Gemini 1.5 Flash) for powerful and efficient question answering. It offers an intuitive interface for document management and real-time, context-aware responses to user queries.


## ✨ Key Features

- 📄 Upload and process PDF documents with ease
- 🔍 Ask questions about document content using natural language
- 🤖 Get AI-powered answers leveraging Gemini 1.5 Flash model
- 💾 Efficient document storage and retrieval (local or cloud-based)

## 🛠 Tech Stack

### Backend
- **FastAPI**: High-performance web framework for building APIs
- **LangChain**: Framework for developing applications powered by language models
- **Google Generative AI**: Integration with Gemini 1.5 Flash model via ChatGoogleGenerativeAI
- **SQLite**: Database for document metadata storage in development
- **SQLite-Cloud**: Database for document metadata storage in production
- **Python 3.12+**: Core programming language

### Frontend
- **React**: User interface development with TypeScript
- **Vite.js**: Build tool and development server
- **Tailwind CSS**: Utility-first CSS framework for styling

### Storage
- **AWS S3**: Cloud storage for PDF documents in production
- **Local filesystem**: For storing PDFs in development

### DevOps
- **Docker**: Containerization for consistent deployment

## 📋 Prerequisites

- Python 3.12 or higher
- Node.js 14.0 or higher
- Gemini AI API key
- AWS account with S3 access
- Docker (for containerized deployment)

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
GEMINI_API_KEY=your_gemini_api_key_here
AWS_ACCESS_KEY=your_aws_access_key
AWS_SECRET_KEY=your_aws_secret_key
AWS_BUCKET_NAME=your_s3_bucket_name
AWS_REGION=your_aws_region
ENVIRONMENT=development  # Use "production" for the production environment
```

After running the backend, update the `API_URL` in `frontend/src/services/api.ts` to match your backend URL.

## 📚 API Documentation

### Endpoints

- `POST /upload`: Upload PDF documents
- `POST /ask`: Ask questions about documents


## 🐳 Docker Deployment

To build and run the application using Docker:

1. Build the Docker image:
```bash
docker build -t docuquery .
```

2. Run the container:
```bash
docker run -p 8000:8000 -e GEMINI_API_KEY=your_key -e AWS_ACCESS_KEY=your_key -e AWS_SECRET_KEY=your_key -e AWS_BUCKET_NAME=your_bucket -e AWS_REGION=your_region docuquery
```



## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

