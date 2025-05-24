import React, { createContext, useContext, useState } from 'react';
import { DocumentType } from '../types';

// Sample document data
const sampleDocuments: DocumentType[] = [
  {
    id: '1',
    name: 'Business Proposal.pdf',
    size: 2.4 * 1024 * 1024,
    createdAt: '2023-09-15',
    updatedAt: '2023-09-20',
    pageCount: 12,
    starred: true,
    folder: 'Work',
    messages: [
      {
        id: '101',
        content: 'What are the main points in this proposal?',
        isUser: true,
        timestamp: '2023-09-20T14:22:00Z',
      },
      {
        id: '102',
        content: 'The main points in this business proposal are:\n\n1. Market opportunity for AI-powered document analysis\n2. Proposed budget of $1.2M for initial development\n3. Timeline of 6 months to MVP\n4. Team structure of 8 engineers and 2 product managers',
        isUser: false,
        timestamp: '2023-09-20T14:22:30Z',
        citations: [2, 5, 8],
      },
    ],
  },
  {
    id: '2',
    name: 'Financial Report Q3.pdf',
    size: 3.7 * 1024 * 1024,
    createdAt: '2023-08-05',
    updatedAt: '2023-08-05',
    pageCount: 24,
    starred: false,
    folder: 'Finance',
    messages: [],
  },
  {
    id: '3',
    name: 'Research Paper.pdf',
    size: 1.2 * 1024 * 1024,
    createdAt: '2023-07-12',
    updatedAt: '2023-07-15',
    pageCount: 18,
    starred: true,
    folder: 'Research',
    messages: [],
  },
];

interface PdfContextType {
  documents: DocumentType[];
  addDocument: (document: DocumentType) => void;
  getDocumentById: (id: string) => DocumentType | undefined;
  updateDocument: (id: string, document: Partial<DocumentType>) => void;
  deleteDocument: (id: string) => void;
}

const PdfContext = createContext<PdfContextType | undefined>(undefined);

export const PdfProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [documents, setDocuments] = useState<DocumentType[]>(sampleDocuments);
  
  const addDocument = (document: DocumentType) => {
    setDocuments([...documents, document]);
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