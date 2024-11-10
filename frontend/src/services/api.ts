import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000'; 

export const uploadPDF = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await axios.post(`${API_URL}/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  console.log(response.data);
  return response.data;
};

export const askQuestion = async (documentId: number, question: string) => {
  console.log(`Sending question: ${question} to document ID: ${documentId}`);
  const response = await axios.post(`${API_URL}/ask`, {
    id: documentId,
    question,
  });
  
  return response.data;
};