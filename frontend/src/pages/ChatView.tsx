import React, { useState, useRef, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft, ArrowUp, Download, FileDown, FileText, Maximize2, MessageCircle, MessageSquare, PanelLeftClose,
  PanelLeftOpen, Sparkles, X,
} from 'lucide-react';
import { usePdf } from '../context/PdfContext';
import { useAuth } from '../context/AuthContext';
import ChatMessage from '../components/ChatMessage';
import PdfViewer from '../components/PdfViewer';
import CommentsPanel from '../components/CommentsPanel';
import { EmptyState } from '../components/app/ui';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { askQuestion, saveMessage, fetchDocumentMessages, fetchDocumentFile, exportChat, getTeamPrompts } from '../services/api';
import { MessageType, TeamPrompt } from '../types';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { cn } from '@/lib/utils';
import '../styles/scroll.css';

const PROMPT_TEMPLATES = [
  { label: 'Summarize', prompt: 'Summarize this document in 5 bullet points' },
  { label: 'Key dates', prompt: 'List all dates and deadlines mentioned in this document' },
  { label: 'Action items', prompt: 'What are the key action items or next steps in this document?' },
  { label: 'Explain simply', prompt: 'Explain this document in simple, plain language' },
  { label: 'Key risks', prompt: 'What are the key risks or concerns in this document?' },
  { label: 'Main parties', prompt: 'Who are the main parties involved and what are their roles?' },
];

const ChatView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getDocumentById, updateDocument } = usePdf();
  const { refreshUser, team } = useAuth();
  const navigate = useNavigate();
  const document = getDocumentById(id || '');

  const [message, setMessage] = useState('');
  const [showPdfViewer, setShowPdfViewer] = useState(true);
  const [mobilePane, setMobilePane] = useState<'chat' | 'doc'>('chat');
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [fullScreenPdf, setFullScreenPdf] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<MessageType[]>(document?.messages || []);
  const [currentPdfUrl, setCurrentPdfUrl] = useState<string | undefined>(undefined);
  const [isExporting, setIsExporting] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [openComments, setOpenComments] = useState(0);
  const [teamPrompts, setTeamPrompts] = useState<TeamPrompt[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Shared team prompts show up next to the built-in templates
  useEffect(() => {
    if (team) getTeamPrompts(team.id).then(setTeamPrompts).catch(() => {});
  }, [team?.id]);

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
        sourcePdf: document.name,
        citations: response.citations && response.citations.length > 0 ? response.citations : undefined,
      };
      
      // If this is an edit response, add the edited PDF URL
      if (response.is_edit && response.editedPdfUrl) {
        aiMessage.editedPdfUrl = response.editedPdfUrl;
        
        // Automatically show the edited PDF
        setCurrentPdfUrl(response.editedPdfUrl);
        // Make sure PDF viewer is visible
        setShowPdfViewer(true);
        setMobilePane('doc');
      }
      
      // Save AI message to backend
      await saveMessage(parseInt(document.id), aiMessage.content, false);
      
      // Add AI message to chat
      const finalMessages = [...updatedMessages, aiMessage];
      setMessages(finalMessages);
      
      // Update document with messages
      updateDocument(document.id, { messages: finalMessages });
      
      // Refresh sidebar credit counter after every AI operation
      refreshUser().catch(() => {});

    } catch (error) {
      console.error('Error getting answer:', error);

      // 402 = insufficient credits
      const res = axios.isAxiosError(error) ? error.response : undefined;
      const is402 = res?.status === 402;
      const detail = res?.data?.detail;
      const errorText = is402
        ? `Not enough credits. ${typeof detail === 'object' ? detail.message : detail} Go to Plans to top up.`
        : "Sorry, I couldn't process your question. Please try again.";

      const errorMessage: MessageType = {
        id: (Date.now() + 1).toString(),
        content: errorText,
        timestamp: new Date().toISOString(),
        isUser: false,
        sourcePdf: document.name,
      };

      await saveMessage(parseInt(document.id), errorMessage.content, false);
      setMessages([...updatedMessages, errorMessage]);
      updateDocument(document.id, { messages: [...updatedMessages, errorMessage] });

      if (is402) {
        // Small delay so the user reads the message before redirect
        setTimeout(() => navigate('/app/plans'), 2500);
      }
      
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
    setMobilePane('doc');
  };

  const handleExport = async () => {
    if (!document || isExporting) return;
    setIsExporting(true);
    try {
      await exportChat(parseInt(document.id), 'md');
    } catch (e) {
      console.error('Export failed', e);
    } finally {
      setIsExporting(false);
    }
  };
  
  const handleDownloadPdf = async () => {
    if (!document) return;

    try {
      // Files are private: fetch the current version (edited or original) with auth, then save it
      const blob = await fetchDocumentFile(currentPdfUrl || `/documents/${document.id}/file?edited=true`);
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = currentPdfUrl ? `edited_${document.name}` : document.name;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Download failed', e);
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
    // Nothing to follow in the empty state; scrolling would push its heading out of view.
    if (messages.length > 0) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);
  
  if (!document) {
    return (
      <div className="grid h-full place-items-center p-6">
        <EmptyState
          icon={<FileText className="h-6 w-6" />}
          title="Document not found"
          description="It may have been deleted, or it belongs to another account."
          action={
            <Button asChild>
              <Link to="/app">Back to dashboard</Link>
            </Button>
          }
          className="w-full max-w-md"
        />
      </div>
    );
  }

  const displayName = document.name.replace(/\.pdf$/i, '');
  const suggestions = [...PROMPT_TEMPLATES, ...teamPrompts.map((p) => ({ label: p.title, prompt: p.prompt }))];

  /* ---------------- Panes ---------------- */

  const pdfPane = (
    <div className="flex h-full min-h-0 flex-col bg-card">
      <div className="flex h-12 shrink-0 items-center justify-between gap-2 border-b px-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-accent text-primary">
            <FileText className="h-4 w-4" />
          </span>
          <span className="truncate text-[13px] font-bold">{currentPdfUrl ? `Edited · ${displayName}` : displayName}</span>
          {currentPdfUrl && (
            <span className="hidden shrink-0 rounded-full bg-success/15 px-2 py-0.5 font-mono text-[10px] text-[#1f7a5a] sm:inline">
              EDITED
            </span>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleDownloadPdf} aria-label="Download PDF">
            <Download className="h-4 w-4" />
          </Button>
          {isDesktop && (
            <>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setFullScreenPdf(true)} aria-label="Full screen">
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowPdfViewer(false)} aria-label="Hide document">
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
      <div className="min-h-0 flex-1 bg-[#eef3fa]">
        <ScrollArea className="custom-scrollbar h-full">
          <PdfViewer document={document} customPdfUrl={currentPdfUrl} />
        </ScrollArea>
      </div>
    </div>
  );

  const chatPane = (
    <div className="flex h-full min-h-0 flex-col bg-background">
      {showComments && <CommentsPanel documentId={parseInt(document.id)} onCount={setOpenComments} />}

      <div className="min-h-0 flex-1">
        <ScrollArea className="custom-scrollbar h-full">
          <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6 sm:px-6">
            {messages && messages.length > 0 ? (
              messages.map((msg, index) => (
                <ChatMessage key={msg.id ?? index} message={msg} onViewEditedPdf={handleViewEditedPdf} />
              ))
            ) : (
              <div className="flex min-h-[46vh] flex-col items-center justify-center text-center animate-rise">
                <div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-accent text-primary">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-extrabold tracking-[-0.05em]">Ask this document anything.</h2>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                  Get answers stamped to the exact page, or tell it what to change — like “change the name from John to
                  Adam”.
                </p>
                <div className="mt-7 grid w-full max-w-xl grid-cols-2 gap-2">
                  {suggestions.map((t) => (
                    <button
                      key={t.label}
                      type="button"
                      onClick={() => {
                        setMessage(t.prompt);
                        inputRef.current?.focus();
                      }}
                      className="group rounded-xl border bg-card px-4 py-3 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_10px_30px_rgba(49,93,151,0.08)]"
                    >
                      <span className="block text-[13px] font-bold group-hover:text-primary">{t.label}</span>
                      <span className="mt-0.5 line-clamp-1 hidden text-xs text-muted-foreground sm:block">{t.prompt}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isLoading && (
              <div className="flex animate-rise gap-3" role="status" aria-live="polite">
                <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary text-[13px] font-extrabold text-primary-foreground">
                  D
                </span>
                <div className="flex items-center gap-3 rounded-2xl rounded-tl-md border bg-card px-4 py-3">
                  <span className="flex gap-1" aria-hidden>
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </span>
                  <span className="font-mono text-[11px] text-muted-foreground">Reading the document…</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Composer */}
      <div className="shrink-0 border-t bg-card/90 px-4 pb-3 pt-3 backdrop-blur sm:px-6">
        <div className="mx-auto max-w-3xl">
          {messages.length > 0 && (
            <div className="-mx-1 mb-2.5 flex gap-1.5 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {suggestions.slice(0, 4).map((t) => (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => {
                    setMessage(t.prompt);
                    inputRef.current?.focus();
                  }}
                  className="shrink-0 rounded-full border bg-card px-3 py-1 text-xs font-bold text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
          <div className="relative">
            <input
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question, or tell it what to change…"
              aria-label="Message"
              disabled={isLoading}
              className="h-12 w-full rounded-xl border border-input bg-card pl-4 pr-14 text-base transition-all placeholder:text-muted-foreground/70 hover:border-primary/40 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10 disabled:opacity-60 sm:text-sm"
            />
            <button
              type="button"
              onClick={handleSendMessage}
              disabled={isLoading || message.trim() === ''}
              aria-label="Send message"
              className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground transition-all hover:bg-[#1d4ed8] active:scale-95 disabled:bg-[#c8dafa] disabled:opacity-100"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-center font-mono text-[10px] text-muted-foreground">
            Answers can be wrong — check the cited page before you act on them.
          </p>
        </div>
      </div>
    </div>
  );

  /* ---------------- Layout ---------------- */

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-card px-2 sm:px-4">
        <Button asChild variant="ghost" size="icon" className="h-9 w-9" aria-label="Back to dashboard">
          <Link to="/app">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-bold leading-tight tracking-normal">{displayName}</h1>
          <p className="kicker truncate">
            Document chat{messages.length > 0 ? ` · ${messages.length} message${messages.length === 1 ? '' : 's'}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-0.5">
          {isDesktop && !showPdfViewer && (
            <Button variant="ghost" size="sm" onClick={() => setShowPdfViewer(true)} className="gap-1.5">
              <PanelLeftOpen className="h-4 w-4" /> Document
            </Button>
          )}
          {isDesktop && showPdfViewer && (
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setShowPdfViewer(false)} aria-label="Hide document">
              <PanelLeftClose className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments((v) => !v)}
            aria-pressed={showComments}
            className={cn('gap-1.5 px-2.5', showComments && 'bg-accent text-primary')}
          >
            <MessageCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Comments</span>
            {openComments > 0 && (
              <span className="rounded-full bg-primary px-1.5 font-mono text-[10px] font-medium text-primary-foreground">
                {openComments}
              </span>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExport}
            disabled={isExporting || messages.length === 0}
            className="gap-1.5 px-2.5"
            aria-label="Export chat as Markdown"
          >
            <FileDown className="h-4 w-4" />
            <span className="hidden sm:inline">{isExporting ? 'Exporting…' : 'Export'}</span>
          </Button>
        </div>
      </header>

      {/* Mobile / tablet: switch between chat and document */}
      {!isDesktop && (
        <div role="tablist" aria-label="View" className="flex shrink-0 gap-1 border-b bg-card p-2">
          {(
            [
              ['chat', MessageSquare, 'Chat'],
              ['doc', FileText, 'Document'],
            ] as const
          ).map(([key, Icon, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={mobilePane === key}
              onClick={() => setMobilePane(key)}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-[9px] py-2 text-[13px] font-bold transition-colors',
                mobilePane === key ? 'bg-accent text-primary' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>
      )}

      <div className="min-h-0 flex-1">
        {isDesktop ? (
          showPdfViewer ? (
            <ResizablePanelGroup direction="horizontal" className="h-full">
              <ResizablePanel defaultSize={45} minSize={28} maxSize={70}>
                {pdfPane}
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={55} minSize={30}>
                {chatPane}
              </ResizablePanel>
            </ResizablePanelGroup>
          ) : (
            chatPane
          )
        ) : mobilePane === 'doc' ? (
          pdfPane
        ) : (
          chatPane
        )}
      </div>

      {/* Fullscreen PDF overlay */}
      {fullScreenPdf && (
        <div className="fixed inset-0 z-[70] flex flex-col bg-background" role="dialog" aria-modal="true" aria-label={displayName}>
          <div className="flex h-14 shrink-0 items-center justify-between border-b bg-card px-4">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent text-primary">
                <FileText className="h-4 w-4" />
              </span>
              <h2 className="truncate text-sm font-bold tracking-normal">{displayName}</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setFullScreenPdf(false)} aria-label="Exit full screen">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="min-h-0 flex-1 bg-[#eef3fa]">
            <ScrollArea className="custom-scrollbar h-full">
              <PdfViewer document={document} customPdfUrl={currentPdfUrl} />
            </ScrollArea>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatView;
