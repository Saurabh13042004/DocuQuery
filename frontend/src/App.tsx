import { useState, useRef } from "react";
import { uploadPDF, askQuestion } from "@/services/api";
import Header from "./components/Header";
import ChatMessage from "./components/ChatMessage";
import ChatInput from "./components/ChatInput";

export default function App() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [documentId, setDocumentId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<{ question: string; answer: string; loading: boolean }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const uploadResponse = await uploadPDF(file);
      setDocumentId(uploadResponse.id);
      console.log(`Uploaded file: ${file.name} with ID: ${uploadResponse.id}`);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleSendMessage = async () => {
    if (!documentId) {
      alert("Please upload a PDF file before asking questions.");
      return;
    }

    const trimmedMessage = message.trim();
    if (trimmedMessage.split(" ").length < 2) {
      alert("Please enter at least 2 words to ask a question.");
      return;
    }

    console.log(`Sending message: ${message} to document ID: ${documentId}`);
    
    setChatHistory((prev) => [
      ...prev,
      { question: trimmedMessage, answer: "", loading: true }
    ]);

    const apiResponse = await askQuestion(documentId, trimmedMessage);
    
    setChatHistory((prev) => {
      const newHistory = [...prev];
      // Find the last message and update it with the AI response and loading status
      const lastMessageIndex = newHistory.length - 1;
      newHistory[lastMessageIndex] = { 
        question: trimmedMessage, 
        answer: apiResponse.answer, 
        loading: false 
      };
      return newHistory;
    });

    setMessage("");
  };

  return (
    <div className="flex flex-col h-screen">
      <Header fileName={fileName} onUploadClick={handleButtonClick} />
      
      <main className="flex flex-col flex-grow overflow-hidden pt-20 sm:pt-24">
        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 lg:pb-24">
          {chatHistory.map((chat, index) => (
            <div key={index} className="mb-4">
              <ChatMessage isUser={true} message={chat.question} />
              <ChatMessage 
                isUser={false} 
                message={chat.answer || ""} 
                isLoading={chat.loading} // Pass the loading state to each message
              />
            </div>
          ))}
        </div>
        
        <div className="border-t p-4 bg-white fixed bottom-0 left-0 w-full">
          <ChatInput 
            message={message}
            onMessageChange={setMessage}
            onSendMessage={handleSendMessage}
          />
        </div>
        
        <input
          type="file"
          accept=".pdf"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
        />
      </main>
    </div>
  );
}
