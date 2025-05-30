export interface MessageType {
    id: string;
    content: string;
    timestamp: string;
    isUser: boolean;
    sourcePdf?: string;
    citations?: string[];
  }
  
  export interface DocumentType {
  id: string;
  name: string;
  size: number;
  createdAt: string;
  updatedAt: string;
  pageCount: number;
  starred: boolean;
  folder?: string;
  shared?: boolean;
  messages: MessageType[];
  filePath?: string; // Add this to store the backend file path
}