"use client";

import { useState, useRef, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Send, Loader2, Upload, Paperclip, X } from "lucide-react";
import { cn, getLanguageFromPath } from "@/lib/utils";

export function ChatPanel() {
  const {
    messages,
    addMessage,
    isStreaming,
    setIsStreaming,
    addTokenUsage,
    editor,
  } = useAppStore();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadedFiles, addUploadedFile, removeUploadedFile } = useAppStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getContextFromOpenFiles = () => {
    // Include both open files and uploaded files
    const allFiles = [
      ...editor.openFiles,
      ...Array.from(uploadedFiles.entries()).map(([path, content]) => ({
        path,
        content,
        language: getLanguageFromPath(path),
      })),
    ];

    if (allFiles.length === 0) return "";

    return allFiles
      .map((file) => `File: ${file.path}\n\`\`\`${file.language || file.path.split(".").pop()}\n${file.content}\n\`\`\``)
      .join("\n\n");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const filePath = (file as any).webkitRelativePath || file.name;
        const language = getLanguageFromPath(filePath);
        addUploadedFile(filePath, content);
      };
      reader.readAsText(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userMessage = input.trim();
    setInput("");
    addMessage({ role: "user", content: userMessage });

    setIsStreaming(true);

    try {
      // Build context from open files
      const context = getContextFromOpenFiles();
      const systemMessage = context
        ? `You are an expert AI development assistant. You have access to the following files:\n\n${context}\n\nProvide helpful, accurate code suggestions and explanations.`
        : "You are an expert AI development assistant. Provide helpful, accurate code suggestions and explanations.";

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemMessage },
            { role: "user", content: userMessage },
          ],
          maxTokens: 2048,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to get response");
      }

      const data = await response.json();
      addMessage({
        role: "assistant",
        content: data.content,
        tokenUsage: data.usage,
      });

      if (data.usage) {
        addTokenUsage(data.usage);
      }

      if (data.warning) {
        console.warn(data.warning);
      }
    } catch (error: any) {
      addMessage({
        role: "assistant",
        content: `Error: ${error.message || "Failed to get response. Please try again."}`,
      });
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex-1 overflow-y-auto px-4 py-8">
        {messages.length === 0 && (
          <div className="text-center text-[#5f6368] mt-12">
            <div className="mb-4">
              <svg className="w-16 h-16 mx-auto text-[#1a73e8] opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-[#202124] mb-1">Start a conversation</p>
            <p className="text-xs text-[#5f6368]">The AI can see your open files for context</p>
          </div>
        )}

        <div className="space-y-6 max-w-4xl mx-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-4",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-[#1a73e8] flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-white text-xs font-medium">AI</span>
                </div>
              )}
              <div
                className={cn(
                  "rounded-2xl px-4 py-3 max-w-[85%] shadow-sm",
                  message.role === "user"
                    ? "bg-[#1a73e8] text-white"
                    : "bg-[#f1f3f4] text-[#202124]"
                )}
              >
                <div className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</div>
                {message.tokenUsage && (
                  <div className={cn(
                    "text-xs mt-3 pt-2 border-t",
                    message.role === "user" 
                      ? "border-white/20 text-white/70" 
                      : "border-[#e8eaed] text-[#5f6368]"
                  )}>
                    {message.tokenUsage.totalTokens} tokens • {message.tokenUsage.model}
                  </div>
                )}
              </div>
              {message.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-[#5f6368] flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-white text-xs font-medium">U</span>
                </div>
              )}
            </div>
          ))}

          {isStreaming && (
            <div className="flex items-center gap-4 justify-start">
              <div className="w-8 h-8 rounded-full bg-[#1a73e8] flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-medium">AI</span>
              </div>
              <div className="bg-[#f1f3f4] rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2 text-[#5f6368]">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-[#e8eaed] bg-white">
        <div className="max-w-4xl mx-auto">
          {uploadedFiles.size > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {Array.from(uploadedFiles.keys()).map((path) => (
                <span
                  key={path}
                  className="px-3 py-1 bg-[#f1f3f4] text-[#202124] rounded-full text-xs flex items-center gap-2"
                >
                  {path.split("/").pop()}
                  <button
                    type="button"
                    onClick={() => removeUploadedFile(path)}
                    className="hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-3 items-end">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3 hover:bg-[#f8f9fa] rounded-full text-[#5f6368] hover:text-[#202124] transition-colors"
              title="Upload files"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              // @ts-ignore
              webkitdirectory=""
            />
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question or request code help..."
                className="w-full px-4 py-3 bg-[#f8f9fa] text-[#202124] rounded-full border border-[#e8eaed] focus:outline-none focus:ring-2 focus:ring-[#1a73e8] focus:border-transparent transition-all disabled:opacity-50"
                disabled={isStreaming}
              />
            </div>
            <button
              type="submit"
              disabled={!input.trim() || isStreaming}
              className="px-6 py-3 bg-[#1a73e8] text-white rounded-full hover:bg-[#1557b0] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm transition-all hover:shadow-md"
            >
              {isStreaming ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

