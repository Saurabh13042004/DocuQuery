export interface MessageType {
    id: string;
    content: string;
    timestamp: string;
    isUser: boolean;
    sourcePdf?: string;
    citations?: string[];
    editedPdfUrl?: string; // Add this field for edited PDF URLs
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
  editedVersion?: string; // Add this to track the latest edited version
}