import axios from 'axios';

const API_URL = 'https://docuquery.onrender.com'; // Update with your actual backend URL

export const uploadPDF = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await axios.post(`${API_URL}/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  console.log(response.data);
  return response.data; // Ensure this returns necessary data like document ID
};

export const askQuestion = async (documentId: number, question: string) => {
  console.log(`Sending question: ${question} to document ID: ${documentId}`);
  const response = await axios.post(`${API_URL}/ask`, {
    id: documentId,
    question,
  });
  
  return response.data; // Ensure this returns an object containing 'answer'
};