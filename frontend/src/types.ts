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
  /** ISO timestamp of the upload, for display and sorting. */
  uploadedAt: string;
  /** Shared with the user's team. */
  shared: boolean;
}

export type PlanId = 'free' | 'starter' | 'pro' | 'team';

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

export type TeamRole = 'owner' | 'admin' | 'editor' | 'viewer';

export interface TeamMember {
  user_id: number;
  name: string;
  email: string;
  role: TeamRole;
}

export interface TeamInfo {
  id: number;
  name: string;
  role: TeamRole;
  seats: number;
  members: TeamMember[];
  invites: { id: number; email: string; role: TeamRole }[];
}

export interface PendingInvite {
  id: number;
  team_name: string;
  role: TeamRole;
}

export interface MemberUsage extends TeamMember {
  credits_used: number;
  docs_uploaded: number;
  last_active: string | null;
}

export interface TeamPrompt {
  id: number;
  title: string;
  prompt: string;
  category: string;
}

export interface CommentType {
  id: number;
  user_name: string;
  content: string;
  page: number | null;
  resolved: boolean;
  created_at: string;
}
