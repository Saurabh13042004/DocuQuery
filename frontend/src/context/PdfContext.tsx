import React, { createContext, useContext, useState, useEffect } from 'react';
import { DocumentType } from '../types';
import { fetchDocuments, deleteDocument as deleteDocumentApi, DocumentResponse } from '../services/api';

// Starring is a client-side preference; remember it across reloads.
const STAR_KEY = 'docuquery:starred';
const readStarred = (): Set<string> => {
  try {
    return new Set(JSON.parse(localStorage.getItem(STAR_KEY) || '[]'));
  } catch {
    return new Set();
  }
};
const writeStarred = (ids: Set<string>) => {
  try {
    localStorage.setItem(STAR_KEY, JSON.stringify([...ids]));
  } catch {
    /* storage unavailable — starring just won't persist */
  }
};

// Convert backend document format to frontend format
const mapDocumentResponse = (doc: DocumentResponse, starred: Set<string>): DocumentType => {
  return {
    id: doc.id.toString(),
    name: doc.filename,
    size: 0, // We don't have size from the backend
    createdAt: new Date(doc.upload_date).toLocaleDateString(),
    updatedAt: new Date(doc.upload_date).toLocaleDateString(),
    pageCount: 1, // Default page count
    starred: starred.has(doc.id.toString()),
    folder: 'Uploads',
    messages: doc.messages?.map(msg => ({
      id: msg.id.toString(),
      content: msg.content,
      timestamp: msg.timestamp,
      isUser: msg.is_user,
      sourcePdf: doc.filename
    })) || [],
    filePath: doc.file_path, // Store the file path for retrieval
    uploadedAt: doc.upload_date,
    shared: doc.team_id != null,
  };
};

interface PdfContextType {
  documents: DocumentType[];
  addDocument: (document: DocumentType) => void;
  getDocumentById: (id: string) => DocumentType | undefined;
  updateDocument: (id: string, document: Partial<DocumentType>) => void;
  /** Deletes on the server, then removes it locally. Resolves false if the server refused. */
  deleteDocument: (id: string) => Promise<boolean>;
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
      const starred = readStarred();
      setDocuments(docs.map((d) => mapDocumentResponse(d, starred)));
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
    if (updatedFields.starred !== undefined) {
      const starred = readStarred();
      if (updatedFields.starred) starred.add(id);
      else starred.delete(id);
      writeStarred(starred);
    }
    setDocuments(prev => prev.map(doc =>
      doc.id === id ? { ...doc, ...updatedFields } : doc
    ));
  };

  const deleteDocument = async (id: string): Promise<boolean> => {
    try {
      await deleteDocumentApi(Number(id));
    } catch (error) {
      console.error('Failed to delete document:', error);
      return false;
    }
    const starred = readStarred();
    if (starred.delete(id)) writeStarred(starred);
    setDocuments(prev => prev.filter(doc => doc.id !== id));
    return true;
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