import React from 'react';

interface ChatInputProps {
  message: string;
  onMessageChange: (message: string) => void;
  onSendMessage: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ message, onMessageChange, onSendMessage }) => {
  return (
    <form 
      onSubmit={(e) => { e.preventDefault(); onSendMessage(); }} 
      className="flex flex-wrap gap-3 sm:gap-5 justify-between px-4 sm:px-9 py-3 sm:py-4 text-sm text-gray-500 bg-white rounded-lg border border-solid shadow-lg border-slate-200"
    >
      <label htmlFor="messageInput" className="sr-only">Send a message</label>
      <input
        id="messageInput"
        type="text"
        value={message}
        onChange={(e) => onMessageChange(e.target.value)}
        placeholder="Send a message..."
        className="my-auto bg-transparent border-none outline-none flex-grow min-w-0"
        aria-label="Send a message"
      />
      <button type="submit" aria-label="Send message" className="flex-shrink-0">
        <img loading="lazy" src="https://cdn.builder.io/api/v1/image/assets/TEMP/aff0c22f18e586ba44da2a21a605bb8c5e9ee6866b7efa771ce3d8e96c4a2918?placeholderIfAbsent=true&apiKey=c3b1bc105c9143f1b7f25c77e5c1b16e" alt="" className="object-contain shrink-0 aspect-square w-[18px] sm:w-[22px]" />
      </button>
    </form>
  );
};

export default ChatInput;