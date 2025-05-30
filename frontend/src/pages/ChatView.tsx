import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Send, ChevronDown, Edit, Download, Share2, Bookmark, Maximize, X } from 'lucide-react';
import { usePdf } from '../context/PdfContext';
import ChatMessage from '../components/ChatMessage';
import PdfViewer from '../components/PdfViewer';
import { askQuestion, saveMessage, fetchDocumentMessages } from '../services/api';
import { MessageType } from '../types';

const ChatView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getDocumentById, updateDocument } = usePdf();
  const document = getDocumentById(id || '');
  
  const [message, setMessage] = useState('');
  const [showPdfViewer, setShowPdfViewer] = useState(true);
  const [fullScreenPdf, setFullScreenPdf] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<MessageType[]>(document?.messages || []);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Load messages when document is opened
  useEffect(() => {
    const loadMessages = async () => {
      if (document) {
        try {
          // Only fetch if we don't already have messages loaded
          if (!document.messages || document.messages.length === 0) {
            const messageResponses = await fetchDocumentMessages(parseInt(document.id));
            
            // Map response to MessageType
            const loadedMessages: MessageType[] = messageResponses.map(msg => ({
              id: msg.id.toString(),
              content: msg.content,
              timestamp: msg.timestamp,
              isUser: msg.is_user,
              sourcePdf: document.name
            }));
            
            setMessages(loadedMessages);
            updateDocument(document.id, { messages: loadedMessages });
          }
        } catch (error) {
          console.error('Failed to load message history:', error);
        }
      }
    };
    
    loadMessages();
  }, [document?.id]);
  
  const handleSendMessage = async () => {
    if (!message.trim() || !document || isLoading) return;
    
    // Create user message
    const userMessage: MessageType = {
      id: Date.now().toString(),
      content: message,
      timestamp: new Date().toISOString(),
      isUser: true,
      sourcePdf: document.name
    };
    
    // Add user message to chat
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    
    // Clear input and show loading state
    setMessage('');
    setIsLoading(true);
    
    try {
      // Save user message to backend
      await saveMessage(parseInt(document.id), userMessage.content, true);
      
      // Call API to get answer
      const response = await askQuestion(parseInt(document.id), message);
      
      // Create AI response message
      const aiMessage: MessageType = {
        id: (Date.now() + 1).toString(),
        content: response.answer,
        timestamp: new Date().toISOString(),
        isUser: false,
        sourcePdf: document.name
      };
      
      // Save AI message to backend
      await saveMessage(parseInt(document.id), aiMessage.content, false);
      
      // Add AI message to chat
      const finalMessages = [...updatedMessages, aiMessage];
      setMessages(finalMessages);
      
      // Update document with messages
      updateDocument(document.id, { messages: finalMessages });
      
    } catch (error) {
      console.error('Error getting answer:', error);
      
      // Add error message
      const errorMessage: MessageType = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I couldn't process your question. Please try again.",
        timestamp: new Date().toISOString(),
        isUser: false,
        sourcePdf: document.name
      };
      
      // Save error message to backend
      await saveMessage(parseInt(document.id), errorMessage.content, false);
      
      setMessages([...updatedMessages, errorMessage]);
      updateDocument(document.id, { messages: [...updatedMessages, errorMessage] });
      
    } finally {
      setIsLoading(false);
      
      // Focus input after sending
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Sync messages with document
  useEffect(() => {
    if (document?.messages) {
      setMessages(document.messages);
    }
  }, [document?.id]);
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);
  
  if (!document) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Document not found</p>
      </div>
    );
  }
  
  return (
    <div className="flex h-full">
      {/* PDF Viewer Panel */}
      {showPdfViewer && (
        <div className={`bg-white border-r border-gray-200 ${fullScreenPdf ? 'fixed inset-0 z-50' : 'w-1/3'}`}>
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="font-medium text-gray-900 truncate">{document.name}</h2>
            <div className="flex items-center space-x-1">
              <button 
                onClick={() => setFullScreenPdf(!fullScreenPdf)} 
                className="p-1.5 text-gray-500 rounded-full hover:bg-gray-100"
              >
                <Maximize className="h-4 w-4" />
              </button>
              <button 
                onClick={() => setShowPdfViewer(false)} 
                className="p-1.5 text-gray-500 rounded-full hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-auto">
              <PdfViewer document={document} />
            </div>
            
            <div className="p-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex space-x-1">
                  <button className="p-1.5 text-gray-500 rounded-full hover:bg-gray-100">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button className="p-1.5 text-gray-500 rounded-full hover:bg-gray-100">
                    <Download className="h-4 w-4" />
                  </button>
                  <button className="p-1.5 text-gray-500 rounded-full hover:bg-gray-100">
                    <Share2 className="h-4 w-4" />
                  </button>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Page 1 of {document.pageCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Chat Panel */}
      <div className={`flex flex-col ${showPdfViewer && !fullScreenPdf ? 'w-2/3' : 'w-full'}`}>
        {/* Chat header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center">
            {!showPdfViewer && (
              <button 
                onClick={() => setShowPdfViewer(true)}
                className="p-1.5 mr-2 text-gray-500 rounded-full hover:bg-gray-100"
              >
                <ChevronDown className="h-5 w-5" />
              </button>
            )}
            <h2 className="font-medium text-gray-900">{document.name}</h2>
          </div>
          
          <button className="p-1.5 text-gray-500 rounded-full hover:bg-gray-100">
            <Bookmark className="h-5 w-5" />
          </button>
        </div>
        
        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          <div className="max-w-3xl mx-auto">
            {messages && messages.length > 0 ? (
              messages.map((msg, index) => (
                <ChatMessage key={index} message={msg} />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                  <Send className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Start the conversation</h3>
                <p className="text-gray-500 text-center max-w-md mb-6">
                  Ask questions about the document or request specific information from any page.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-lg">
                  {['What is this document about?', 'Summarize the key points', 'Find information about...', 'Explain the concept of...'].map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => setMessage(suggestion)}
                      className="py-2 px-4 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {isLoading && (
              <div className="flex items-center p-4 bg-white rounded-lg shadow-sm mb-4">
                <div className="mr-3">
                  <div className="animate-pulse flex space-x-1">
                    <div className="h-2 w-2 bg-indigo-400 rounded-full"></div>
                    <div className="h-2 w-2 bg-indigo-400 rounded-full"></div>
                    <div className="h-2 w-2 bg-indigo-400 rounded-full"></div>
                  </div>
                </div>
                <p className="text-gray-500">DocuQuery is thinking...</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
        
        {/* Chat input */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end bg-white border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition">
              <textarea
                ref={inputRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question about this document..."
                className="flex-1 py-3 px-4 text-sm bg-transparent border-0 focus:ring-0 focus:outline-none resize-none max-h-32"
                rows={1}
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || message.trim() === ''}
                className={`p-3 mr-1 mb-1 rounded-full focus:outline-none ${
                  isLoading || message.trim() === ''
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-indigo-600 hover:bg-indigo-50'
                }`}
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500 text-center">
              DocuQuery may produce inaccurate information about people, places, or facts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatView;