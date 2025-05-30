import React, { createContext, useContext, useState, useEffect } from 'react';
import { DocumentType } from '../types';
import { fetchDocuments, DocumentResponse } from '../services/api';

// Convert backend document format to frontend format
const mapDocumentResponse = (doc: DocumentResponse): DocumentType => {
  return {
    id: doc.id.toString(),
    name: doc.filename,
    size: 0, // We don't have size from the backend
    createdAt: new Date(doc.upload_date).toLocaleDateString(),
    updatedAt: new Date(doc.upload_date).toLocaleDateString(),
    pageCount: 1, // Default page count
    starred: false,
    folder: 'Uploads',
    messages: doc.messages?.map(msg => ({
      id: msg.id.toString(),
      content: msg.content,
      timestamp: msg.timestamp,
      isUser: msg.is_user,
      sourcePdf: doc.filename
    })) || [],
    filePath: doc.file_path // Store the file path for retrieval
  };
};

interface PdfContextType {
  documents: DocumentType[];
  addDocument: (document: DocumentType) => void;
  getDocumentById: (id: string) => DocumentType | undefined;
  updateDocument: (id: string, document: Partial<DocumentType>) => void;
  deleteDocument: (id: string) => void;
  fetchUserDocuments: () => Promise<void>;
  isLoading: boolean;
}

const PdfContext = createContext<PdfContextType | undefined>(undefined);

export const PdfProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [documents, setDocuments] = useState<DocumentType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const fetchUserDocuments = async () => {
    try {
      setIsLoading(true);
      const docs = await fetchDocuments();
      setDocuments(docs.map(mapDocumentResponse));
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load documents when the component mounts
  useEffect(() => {
    fetchUserDocuments();
  }, []);
  
  const addDocument = (document: DocumentType) => {
    setDocuments(prev => [document, ...prev]);
  };
  
  const getDocumentById = (id: string) => {
    return documents.find(doc => doc.id === id);
  };
  
  const updateDocument = (id: string, updatedFields: Partial<DocumentType>) => {
    setDocuments(documents.map(doc => 
      doc.id === id ? { ...doc, ...updatedFields } : doc
    ));
  };
  
  const deleteDocument = (id: string) => {
    setDocuments(documents.filter(doc => doc.id !== id));
  };
  
  return (
    <PdfContext.Provider value={{
      documents,
      addDocument,
      getDocumentById,
      updateDocument,
      deleteDocument,
      fetchUserDocuments,
      isLoading
    }}>
      {children}
    </PdfContext.Provider>
  );
};

export const usePdf = () => {
  const context = useContext(PdfContext);
  if (!context) {
    throw new Error('usePdf must be used within a PdfProvider');
  }
  return context;
};