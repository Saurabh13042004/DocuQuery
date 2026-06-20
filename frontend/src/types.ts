export interface MessageType {
  id: string;
  content: string;
  timestamp: string;
  isUser: boolean;
  sourcePdf?: string;
  citations?: string[];
  editedPdfUrl?: string;
}

export interface DocumentType {
  id: string;
  name: string;
  size: number;
  createdAt: string;
  updatedAt: string;
  pageCount: number;
  starred: boolean;
  folder: string;
  messages: MessageType[];
  filePath: string;
  editedVersion?: string;
}

export type PlanId = 'free' | 'starter' | 'pro';

export interface PlanInfo {
  name: string;
  price_usd: number;
  monthly_credits: number;
  badge_color: string;
  description: string;
  features: string[];
}

export interface CreditTransaction {
  id: number;
  amount: number;
  reason: string;
  created_at: string;
}
