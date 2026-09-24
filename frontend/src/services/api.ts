import axios from 'axios';
import { PlanId, PlanInfo, CreditTransaction, TeamInfo, PendingInvite, TeamRole, MemberUsage, TeamPrompt, CommentType } from '../types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Endpoints where a 401 means "wrong credentials", not "your session expired".
// Redirecting there would reload the page and wipe the error message.
const AUTH_PATHS = ['/login', '/signup', '/forgot-password', '/reset-password'];

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url: string = error.config?.url ?? '';
    if (error.response?.status === 401 && !AUTH_PATHS.some((p) => url.startsWith(p))) {
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
  avatar?: string;
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
  team_id?: number | null;
  messages?: MessageResponse[];
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
  citations?: string[];
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

export const forgotPassword = async (email: string): Promise<string> => {
  const response = await api.post<{ message: string }>('/forgot-password', { email });
  return response.data.message;
};

export const resetPassword = async (token: string, password: string): Promise<string> => {
  const response = await api.post<{ message: string }>('/reset-password', { token, password });
  return response.data.message;
};

/** Pulls a readable message out of an axios error. */
export const errorMessage = (error: unknown, fallback: string): string => {
  if (!axios.isAxiosError(error)) return fallback;
  if (!error.response) return 'Can’t reach the server. Check your connection and try again.';
  const detail = (error.response.data as { detail?: unknown } | undefined)?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail) && typeof detail[0]?.msg === 'string') return detail[0].msg;
  return fallback;
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

export const uploadPDF = async (file: File, shared = false): Promise<DocumentResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('shared', String(shared));
  const response = await api.post<DocumentResponse>('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const fetchDocuments = async (): Promise<DocumentResponse[]> => {
  const response = await api.get<DocumentResponse[]>('/documents');
  return response.data;
};

// PDFs are private: fetch through the API (auth header included) and use the blob locally.
export const fetchDocumentFile = async (path: string): Promise<Blob> => {
  const response = await api.get<Blob>(path, { responseType: 'blob' });
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

export const exportChat = async (documentId: number, format: 'md' | 'txt' = 'md'): Promise<void> => {
  const response = await api.get(`/documents/${documentId}/export`, {
    params: { format },
    responseType: 'blob',
  });
  const url = URL.createObjectURL(new Blob([response.data]));
  const a = window.document.createElement('a');
  a.href = url;
  a.download = `chat_export.${format}`;
  window.document.body.appendChild(a);
  a.click();
  window.document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// ── teams ──────────────────────────────────────────────────────────────────

export const getMyTeam = async (): Promise<{ team: TeamInfo | null; pending_invites: PendingInvite[] }> =>
  (await api.get('/teams/me')).data;

export const createTeam = async (name: string) => (await api.post('/teams', { name })).data;

export const inviteMember = async (teamId: number, email: string, role: TeamRole) =>
  (await api.post(`/teams/${teamId}/invite`, { email, role })).data;

export const acceptInvite = async (inviteId: number) => api.post(`/teams/invites/${inviteId}/accept`);

export const cancelInvite = async (inviteId: number) => api.delete(`/teams/invites/${inviteId}`);

export const changeMemberRole = async (teamId: number, userId: number, role: TeamRole) =>
  api.patch(`/teams/${teamId}/members/${userId}`, { role });

export const removeMember = async (teamId: number, userId: number) =>
  api.delete(`/teams/${teamId}/members/${userId}`);

export const getTeamUsage = async (teamId: number): Promise<MemberUsage[]> =>
  (await api.get(`/teams/${teamId}/usage`)).data.members;

export const getTeamPrompts = async (teamId: number): Promise<TeamPrompt[]> =>
  (await api.get(`/teams/${teamId}/prompts`)).data;

export const addTeamPrompt = async (teamId: number, title: string, prompt: string, category: string): Promise<TeamPrompt> =>
  (await api.post(`/teams/${teamId}/prompts`, { title, prompt, category })).data;

export const deleteTeamPrompt = async (teamId: number, promptId: number) =>
  api.delete(`/teams/${teamId}/prompts/${promptId}`);

// ── comments ───────────────────────────────────────────────────────────────

export const getComments = async (documentId: number): Promise<CommentType[]> =>
  (await api.get(`/documents/${documentId}/comments`)).data;

export const addComment = async (documentId: number, content: string, page?: number): Promise<CommentType> =>
  (await api.post(`/documents/${documentId}/comments`, { content, page })).data;

export const toggleComment = async (commentId: number): Promise<CommentType> =>
  (await api.patch(`/comments/${commentId}/resolve`)).data;
