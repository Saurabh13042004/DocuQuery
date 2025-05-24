export interface MessageType {
    id?: string;
    content: string;
    isUser: boolean;
    timestamp?: string;
    citations?: number[];
    sourcePdf?: string;
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
    previewUrl?: string;
  }