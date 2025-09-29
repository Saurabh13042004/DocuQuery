import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Send, Download, Share2, Maximize, X, ChevronDown, Edit, Bookmark } from 'lucide-react';
import { usePdf } from '../context/PdfContext';
import ChatMessage from '../components/ChatMessage';
import PdfViewer from '../components/PdfViewer';
import { askQuestion, saveMessage, fetchDocumentMessages } from '../services/api';
import { MessageType } from '../types';
import { Button } from '@/components/ui/button';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import '../styles/scroll.css';
import '../styles/chat-responsive.css';

const ChatView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getDocumentById, updateDocument } = usePdf();
  const document = getDocumentById(id || '');
  
  const [message, setMessage] = useState('');
  const [showPdfViewer, setShowPdfViewer] = useState(true);
  const [fullScreenPdf, setFullScreenPdf] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<MessageType[]>(document?.messages || []);
  const [currentPdfUrl, setCurrentPdfUrl] = useState<string | undefined>(undefined);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Handle key press for input
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };
  
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
      
      // If this is an edit response, add the edited PDF URL
      if (response.is_edit && response.editedPdfUrl) {
        aiMessage.editedPdfUrl = response.editedPdfUrl;
        
        // Automatically show the edited PDF
        setCurrentPdfUrl(response.editedPdfUrl);
        // Make sure PDF viewer is visible
        setShowPdfViewer(true);
      }
      
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
  
  const handleViewEditedPdf = (url: string) => {
    setCurrentPdfUrl(url);
    setShowPdfViewer(true);
  };
  
  const handleDownloadPdf = () => {
    if (!document) return;
    
    // Get the current PDF URL (either edited or original)
    const pdfToDownload = currentPdfUrl || document.filePath;
    
    // Create the full URL
    const baseUrl = 'http://127.0.0.1:8000';
    const downloadUrl = pdfToDownload?.startsWith('http') 
      ? pdfToDownload 
      : `${baseUrl}${pdfToDownload}`;
    
    // Create a temporary anchor element and trigger download
    const a = window.document.createElement('a');
    a.href = downloadUrl;
    a.download = currentPdfUrl 
      ? `edited_${document.name}` 
      : document.name;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
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
        <Card className="w-full max-w-sm mx-4">
          <CardContent className="pt-6 text-center">
            <div className="p-3 bg-muted rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
              <svg className="h-6 w-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-foreground mb-2">Document Not Found</h3>
            <p className="text-sm text-muted-foreground">The requested document could not be located.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="h-screen bg-background overflow-hidden chat-container">
      {showPdfViewer && !fullScreenPdf ? (
        <ResizablePanelGroup direction="horizontal" className="h-full layout-transition">
          {/* PDF Viewer Panel */}
          <ResizablePanel defaultSize={45} minSize={30} maxSize={70} className="pdf-panel">
            <div className="bg-background border-r flex flex-col h-full">
              {/* PDF Header */}
              <div className="p-4 border-b bg-background shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <svg className="h-4 w-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="font-semibold text-foreground text-sm">
                        {currentPdfUrl ? `Edited: ${document.name}` : document.name}
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        {document.pageCount} pages • PDF Document
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFullScreenPdf(!fullScreenPdf)}
                      className="h-8 w-8 p-0 btn-hover focus-ring"
                    >
                      <Maximize className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPdfViewer(false)}
                      className="h-8 w-8 p-0 btn-hover focus-ring"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* PDF Content */}
              <div className="flex-1 bg-muted/30 overflow-hidden">
                <ScrollArea className="h-full custom-scrollbar">
                  <PdfViewer document={document} customPdfUrl={currentPdfUrl} />
                </ScrollArea>
              </div>
              
              {/* PDF Actions */}
              <div className="p-3 border-t bg-background shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleDownloadPdf}
                      className="h-8 w-8 p-0"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Page 1 of {document.pageCount}
                  </span>
                </div>
              </div>
            </div>
          </ResizablePanel>
          
          <ResizableHandle withHandle className="resizable-handle" />
          
          {/* Chat Panel */}
          <ResizablePanel defaultSize={55} minSize={30} className="chat-panel">
            <div className="flex flex-col h-full">
            {/* Chat Header */}
            <header className="bg-background border-b p-4 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <svg className="h-4 w-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <div>
                      <h1 className="font-semibold text-foreground text-sm">
                        Document Chat
                      </h1>
                      <p className="text-xs text-muted-foreground">
                        {document.name}
                      </p>
                    </div>
                  </div>
                </div>
                
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Bookmark className="h-4 w-4" />
                </Button>
              </div>
            </header>
        
          {/* Chat Messages */}
          <div className="flex-1 bg-muted/10 overflow-hidden">
            <ScrollArea className="h-full custom-scrollbar message-container">
              <div className="p-6">
                <div className="max-w-4xl mx-auto space-y-6">
                {messages && messages.length > 0 ? (
                  messages.map((msg, index) => (
                    <ChatMessage 
                      key={index} 
                      message={msg} 
                      onViewEditedPdf={handleViewEditedPdf}
                    />
                  ))
                ) : (
                  <div className="flex items-center justify-center min-h-[50vh]">
                    <Card className="w-full max-w-md border-dashed">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="p-3 bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                        <Send className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-semibold text-foreground mb-2">
                        Start your conversation
                      </h3>
                      <p className="text-sm text-muted-foreground mb-6">
                        Ask questions and get intelligent answers from your document.
                      </p>
                      <div className="grid gap-2">
                        {['What is this document about?', 'Summarize the key points', 'Find information about...', 'Explain the concept of...'].map((suggestion, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            onClick={() => setMessage(suggestion)}
                            className="justify-start text-xs h-auto py-2"
                          >
                            {suggestion}
                          </Button>
                        ))}
                      </div>
                    </div>
                    </CardContent>
                  </Card>
                  </div>
                )}
                
                {isLoading && (
                  <Card className="bg-background shadow-sm max-w-xs">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-primary rounded-full bounce-smooth"></div>
                          <div className="w-2 h-2 bg-primary rounded-full bounce-smooth" style={{ animationDelay: '0.2s' }}></div>
                          <div className="w-2 h-2 bg-primary rounded-full bounce-smooth" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                        <span className="text-sm text-muted-foreground">DocuQuery is analyzing...</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                <div ref={messagesEndRef} />
                </div>
              </div>
            </ScrollArea>
          </div>
          
          {/* Chat Input */}
          <div className="bg-background border-t p-4 shrink-0">
            <div className="max-w-4xl mx-auto">
              <div className="relative">
                <Input
                  ref={inputRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a question about this document..."
                  className="pr-12 h-12"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={isLoading || message.trim() === ''}
                  size="sm"
                  className="absolute right-2 top-2 h-8 w-8 p-0 btn-hover focus-ring"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground text-center">
                DocuQuery may produce inaccurate information about people, places, or facts.
              </p>
            </div>
          </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        !showPdfViewer && (
          <div className="flex flex-col h-full">
            {/* Chat Header */}
            <header className="bg-background border-b p-4 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPdfViewer(true)}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <svg className="h-4 w-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <div>
                      <h1 className="font-semibold text-foreground text-sm">
                        Document Chat
                      </h1>
                      <p className="text-xs text-muted-foreground">
                        {document.name}
                      </p>
                    </div>
                  </div>
                </div>
                
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Bookmark className="h-4 w-4" />
                </Button>
              </div>
            </header>

            {/* Chat Messages */}
            <div className="flex-1 bg-muted/10 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-6">
                  <div className="max-w-4xl mx-auto space-y-6">
                    {messages && messages.length > 0 ? (
                      messages.map((msg, index) => (
                        <ChatMessage 
                          key={index} 
                          message={msg} 
                          onViewEditedPdf={handleViewEditedPdf}
                        />
                      ))
                    ) : (
                      <div className="flex items-center justify-center min-h-[60vh]">
                        <Card className="w-full max-w-md border-dashed">
                          <CardContent className="pt-6">
                            <div className="text-center">
                              <div className="p-3 bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                                <Send className="h-6 w-6 text-primary" />
                              </div>
                              <h3 className="font-semibold text-foreground mb-2">
                                Start your conversation
                              </h3>
                              <p className="text-sm text-muted-foreground mb-6">
                                Ask questions and get intelligent answers from your document.
                              </p>
                              <div className="grid gap-2">
                                {['What is this document about?', 'Summarize the key points', 'Find information about...', 'Explain the concept of...'].map((suggestion, index) => (
                                  <Button
                                    key={index}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setMessage(suggestion)}
                                    className="justify-start text-xs h-auto py-2"
                                  >
                                    {suggestion}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                    
                    {isLoading && (
                      <Card className="bg-background shadow-sm max-w-xs">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="flex gap-1">
                              <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                            <span className="text-sm text-muted-foreground">DocuQuery is analyzing...</span>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>
                </div>
              </ScrollArea>
            </div>

            {/* Chat Input */}
            <div className="bg-background border-t p-4 shrink-0">
              <div className="max-w-4xl mx-auto">
                <div className="relative">
                  <Input
                    ref={inputRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask a question about this document..."
                    className="pr-12 h-12"
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={isLoading || message.trim() === ''}
                    size="sm"
                    className="absolute right-2 top-2 h-8 w-8 p-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground text-center">
                  DocuQuery may produce inaccurate information about people, places, or facts.
                </p>
              </div>
            </div>
          </div>
        )
      )}

      {/* Fullscreen PDF Overlay */}
      {fullScreenPdf && (
        <div className="fixed inset-0 bg-background z-50 flex flex-col">
          <div className="p-4 border-b bg-background flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <svg className="h-4 w-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="font-semibold text-foreground">
                {(document as any)?.name || 'Document'}
              </h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFullScreenPdf(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full custom-scrollbar">
              <PdfViewer document={document} customPdfUrl={currentPdfUrl} />
            </ScrollArea>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatView;