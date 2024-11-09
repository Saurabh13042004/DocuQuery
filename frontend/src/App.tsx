import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Upload } from "lucide-react"

export default function Component() {
  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="border-b">
        <div className="container flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground">
              L
            </div>
            <span className="font-semibold">DocuQuery</span>
          </div>
          
          {/* Document name and upload button */}
          <div className="flex items-center gap-4">
            {/* Only show if document is uploaded */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <svg
                className="w-4 h-4"
                fill="none"
                height="24"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                width="24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              demo.pdf
            </div>
            <Button className="gap-2">
              <Upload className="w-4 h-4" />
              Upload PDF
            </Button>
          </div>
        </div>
      </header>

      {/* Chat container */}
      <div className="flex-1 overflow-auto">
        <div className="container max-w-4xl px-4 py-8 space-y-8">
          {/* User message */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center text-sm">
              S
            </div>
            <div className="flex-1">
              <p className="text-sm">explain like im 5</p>
            </div>
          </div>

          {/* AI response */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <div className="w-5 h-5 text-primary">L</div>
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                Our own Large Language Model (LLM) is a type of AI that can learn from data. We have trained it on 7 billion
                parameters which makes it better than other LLMs. We are featured on aiplanet.com and work with leading
                enterprises to help them use AI securely and privately. We have a Generative AI Stack which helps reduce the
                hallucinations in LLMs and allows enterprises to use AI in their applications.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Message input */}
      <div className="border-t p-4">
        <div className="container max-w-4xl">
          <div className="relative">
            <Input
              className="pr-10"
              placeholder="Send a message..."
              type="text"
            />
            <Button
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              variant="ghost"
            >
              <Send className="w-4 h-4" />
              <span className="sr-only">Send message</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}