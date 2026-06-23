import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Copy, MoreVertical, FileText } from 'lucide-react';
import { MessageType } from '../types';

interface ChatMessageProps {
  message: MessageType;
  onViewEditedPdf?: (url: string) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onViewEditedPdf }) => {
  const [showActions, setShowActions] = useState(false);
  const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(null);
  
  const handleCopyText = () => {
    navigator.clipboard.writeText(message.content);
    // You might want to add a toast notification here
  };
  
  return (
    <div
      className={`mb-6 ${message.isUser ? 'flex justify-end' : ''}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className={`relative max-w-3xl ${message.isUser ? 'ml-auto' : 'mr-auto'}`}>
        <div
          className={`p-4 rounded-lg ${
            message.isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-card text-card-foreground border border-border shadow-sm'
          }`}
        >
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>

          {/* Edited PDF link */}
          {!message.isUser && message.editedPdfUrl && (
            <div className="mt-3 pt-2 border-t border-border">
              <button
                onClick={() => onViewEditedPdf && onViewEditedPdf(message.editedPdfUrl!)}
                className="inline-flex items-center text-sm text-primary hover:opacity-80 font-medium"
              >
                <FileText className="h-4 w-4 mr-1" />
                View edited PDF
              </button>
            </div>
          )}

          {/* Page citations */}
          {!message.isUser && message.citations && message.citations.length > 0 && (
            <div className="mt-2 flex items-center gap-1 flex-wrap">
              <span className="text-[11px] text-muted-foreground">Source:</span>
              {message.citations.map((p) => (
                <span
                  key={p}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium"
                >
                  pg {p}
                </span>
              ))}
            </div>
          )}
        </div>

        {!message.isUser && showActions && (
          <div className="absolute -bottom-7 left-0 flex items-center space-x-1">
            <button
              onClick={() => setFeedback('positive')}
              className={`p-1.5 rounded-full transition-colors ${
                feedback === 'positive'
                  ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <ThumbsUp className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setFeedback('negative')}
              className={`p-1.5 rounded-full transition-colors ${
                feedback === 'negative'
                  ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <ThumbsDown className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleCopyText}
              className="p-1.5 rounded-full text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;