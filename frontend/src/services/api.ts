import axios from 'axios';
import { PlanId, PlanInfo, CreditTransaction } from '../types';

const API_URL = 'http://127.0.0.1:8000';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
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

// ── types ──────────────────────────────────────────────────────────────────

export interface User {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
  created_at: string;
  credits: number;
  plan: PlanId;
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
  credits_remaining?: number;
}

export interface PlansResponse {
  plans: Record<PlanId, PlanInfo>;
  current_plan: PlanId;
  credits: number;
  costs: Record<string, number>;
}

// ── auth ───────────────────────────────────────────────────────────────────

export const signup = async (email: string, password: string, name: string): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/signup', { name, email, password });
  localStorage.setItem('token', response.data.access_token);
  localStorage.setItem('user', JSON.stringify(response.data.user));
  return response.data;
};

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/login', { email, password });
  localStorage.setItem('token', response.data.access_token);
  localStorage.setItem('user', JSON.stringify(response.data.user));
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// ── user / credits / plans ─────────────────────────────────────────────────

export const getMe = async (): Promise<User> => {
  const response = await api.get<User>('/me');
  // Keep localStorage in sync
  localStorage.setItem('user', JSON.stringify(response.data));
  return response.data;
};

export const getPlans = async (): Promise<PlansResponse> => {
  const response = await api.get<PlansResponse>('/plans');
  return response.data;
};

export const upgradePlan = async (plan: PlanId): Promise<User> => {
  const response = await api.post<User>('/upgrade-plan', { plan });
  localStorage.setItem('user', JSON.stringify(response.data));
  return response.data;
};

export const getCreditHistory = async (): Promise<CreditTransaction[]> => {
  const response = await api.get<CreditTransaction[]>('/credits/history');
  return response.data;
};

// ── documents ──────────────────────────────────────────────────────────────

export const uploadPDF = async (file: File): Promise<DocumentResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post<DocumentResponse>('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const fetchDocuments = async (): Promise<DocumentResponse[]> => {
  const response = await api.get<DocumentResponse[]>('/documents');
  return response.data;
};

export const deleteDocument = async (documentId: number): Promise<void> => {
  await api.delete(`/documents/${documentId}`);
};

// ── chat ───────────────────────────────────────────────────────────────────

export const askQuestion = async (documentId: number, question: string): Promise<QuestionResponse> => {
  const response = await api.post<QuestionResponse>('/ask', { id: documentId, question });
  return response.data;
};

export const fetchDocumentMessages = async (documentId: number): Promise<MessageResponse[]> => {
  const response = await api.get<MessageResponse[]>(`/documents/${documentId}/messages`);
  return response.data;
};

export const saveMessage = async (documentId: number, content: string, isUser: boolean): Promise<MessageResponse> => {
  const response = await api.post<MessageResponse>(`/documents/${documentId}/messages`, {
    content,
    is_user: isUser,
  });
  return response.data;
};
