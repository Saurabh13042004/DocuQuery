import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Copy, MoreVertical } from 'lucide-react';
import { MessageType } from '../types';

interface ChatMessageProps {
  message: MessageType;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
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
              ? 'bg-indigo-600 text-white' 
              : 'bg-white text-gray-800 border border-gray-200 shadow-sm'
          }`}
        >
          {!message.isUser && message.citations && message.citations.length > 0 && (
            <div className="mb-2 text-xs text-indigo-600 font-medium">
              Sources: Pages {message.citations.join(', ')}
            </div>
          )}
          
          <p className="whitespace-pre-wrap">{message.content}</p>
          
          {message.sourcePdf && (
            <div className="mt-2 text-xs">
              <span className={message.isUser ? 'text-indigo-200' : 'text-gray-500'}>
                From: {message.sourcePdf}
              </span>
            </div>
          )}
        </div>
        
        {!message.isUser && showActions && (
          <div className="absolute -bottom-8 left-0 flex items-center space-x-1">
            <button 
              onClick={() => setFeedback('positive')}
              className={`p-1.5 rounded-full ${
                feedback === 'positive' 
                  ? 'bg-green-100 text-green-600' 
                  : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
              }`}
            >
              <ThumbsUp className="h-3.5 w-3.5" />
            </button>
            <button 
              onClick={() => setFeedback('negative')}
              className={`p-1.5 rounded-full ${
                feedback === 'negative' 
                  ? 'bg-red-100 text-red-600' 
                  : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
              }`}
            >
              <ThumbsDown className="h-3.5 w-3.5" />
            </button>
            <button 
              onClick={handleCopyText}
              className="p-1.5 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
            <button className="p-1.5 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600">
              <MoreVertical className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;