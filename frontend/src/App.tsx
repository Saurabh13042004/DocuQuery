import { useState, useRef } from "react";
import { uploadPDF, askQuestion } from "@/services/api";
import Header from "./components/Header";
import ChatMessage from "./components/ChatMessage";
import ChatInput from "./components/ChatInput";
import DarkModeToggle from "./components/DarkModeTogggle";

export default function App() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [documentId, setDocumentId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<{ question: string; answer: string; loading: boolean }[]>([]);
  const [uploading, setUploading] = useState<boolean>(false); 
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setUploading(true);  

      const uploadResponse = await uploadPDF(file);
      setDocumentId(uploadResponse.id);
      console.log(`Uploaded file: ${file.name} with ID: ${uploadResponse.id}`);

      setUploading(false);  
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
    <div className="container mx-auto p-4">
      <div className="flex justify-end mb-4">
        <DarkModeToggle />
      </div>
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">DocuQuery</h1>
        
        <div className="mb-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept=".pdf"
          />
          <button 
            onClick={handleButtonClick}
            className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md"
            disabled={uploading}
          >
            {uploading ? "Uploading..." : "Upload PDF"}
          </button>
          {fileName && <p className="mt-2">Uploaded: {fileName}</p>}
        </div>
      </div>
      
      <div className="border dark:border-gray-700 rounded-lg p-4 mb-4 h-96 overflow-y-auto">
        {chatHistory.map((chat, index) => (
          <div key={index} className="mb-4">
            <div className="font-semibold">You: {chat.question}</div>
            <div className="pl-4 mt-1">
              {chat.loading ? "Loading..." : `DocuQuery: ${chat.answer}`}
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask a question about your document..."
          className="flex-1 p-2 border dark:border-gray-700 dark:bg-gray-800 rounded-md"
        />
        <button
          onClick={handleSendMessage}
          className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md"
        >
          Send
        </button>
      </div>
    </div>
  );
}
