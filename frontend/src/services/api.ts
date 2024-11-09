import axios from 'axios';

const API_URL = 'http://localhost:8000';

export const uploadPDF = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await axios.post(`${API_URL}/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const askQuestion = async (documentId: number, question: string) => {
  const response = await axios.post(`${API_URL}/ask`, {
    document_id: documentId,
    question,
  });
  return response.data;
};

export const getDocuments = async () => {
  const response = await axios.get(`${API_URL}/documents`);
  return response.data;
};