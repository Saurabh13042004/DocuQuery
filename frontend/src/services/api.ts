import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000'; 


const api = axios.create({
  baseURL: API_URL,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface User {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface DocumentResponse {
  id: number;
  filename: string;
  file_path: string;
  upload_date: string;
}

export interface MessageResponse {
  id: number;
  document_id: number;
  content: string;
  is_user: boolean;
  timestamp: string;
}

export interface QuestionResponse {
  answer: string;
  is_edit?: boolean;
  editedPdfUrl?: string;
  changes?: string;
}

export const signup = async (email: string, password: string, name: string): Promise<AuthResponse> => {
  const response = await api.post('/signup', {
    name,
    email,
    password,
  });
  
  // Store token and user data
  localStorage.setItem('token', response.data.access_token);
  localStorage.setItem('user', JSON.stringify(response.data.user));
  
  return response.data;
};

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await api.post('/login', {
    email,
    password,
  });
  
  // Store token and user data
  localStorage.setItem('token', response.data.access_token);
  localStorage.setItem('user', JSON.stringify(response.data.user));
  
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const uploadPDF = async (file: File): Promise<DocumentResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post<DocumentResponse>('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

export const fetchDocuments = async (): Promise<DocumentResponse[]> => {
  const response = await api.get<DocumentResponse[]>('/documents');
  return response.data;
};

export const askQuestion = async (documentId: number, question: string): Promise<QuestionResponse> => {
  try {
    const response = await api.post<QuestionResponse>('/ask', {
      id: documentId,
      question,
    });
    
    return response.data;
  } catch (error) {
    console.error('API error in askQuestion:', error);
    throw error;
  }
};

export const fetchDocumentMessages = async (documentId: number): Promise<MessageResponse[]> => {
  const response = await api.get<MessageResponse[]>(`/documents/${documentId}/messages`);
  return response.data;
};

export const saveMessage = async (documentId: number, content: string, isUser: boolean): Promise<MessageResponse> => {
  const response = await api.post<MessageResponse>(`/documents/${documentId}/messages`, {
    content,
    is_user: isUser
  });
  return response.data;
};