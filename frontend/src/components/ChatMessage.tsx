import React from 'react';

interface ChatMessageProps {
  isUser: boolean;
  message: string;
  isLoading?: boolean; 
}

const ChatMessage: React.FC<ChatMessageProps> = ({ isUser, message, isLoading }) => {
  return (
    <div className={`flex flex-wrap gap-4 sm:gap-6 mt-4 text-sm sm:text-base tracking-normal leading-7 ${isUser ? 'text-gray-900' : 'text-gray-700'}`}>
      {!isUser ? (
        <img
          loading="lazy"
          src="https://cdn.builder.io/api/v1/image/assets/TEMP/622ea63701faa531f19e169feeba3a1ad23d9e328490882e638f2a4199686cd9?placeholderIfAbsent=true&apiKey=c3b1bc105c9143f1b7f25c77e5c1b16e"
          alt=""
          className="object-contain shrink-0 self-start mt-1.5 w-8 sm:w-10 aspect-square"
        />
      ) : (
        <div className="px-2.5 sm:px-3.5 w-8 h-8 sm:w-10 sm:h-10 text-xl sm:text-2xl tracking-tight text-white whitespace-nowrap bg-indigo-300 rounded-full flex items-center justify-center">
          S
        </div>
      )}
      
      <div className={`flex-1 ${isUser ? 'text-gray-900' : 'text-muted-foreground'}`}>
        {isLoading ? (
          <span className="text-gray-500">Thinking...</span> 
        ) : (
          message 
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
