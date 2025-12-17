"use client";

import { useState, useRef, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getContextFromOpenFiles = () => {
    if (editor.openFiles.length === 0) return "";

    return editor.openFiles
      .map((file) => `File: ${file.path}\n\`\`\`${file.path.split(".").pop()}\n${file.content}\n\`\`\``)
      .join("\n\n");
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
    <div className="flex flex-col h-full bg-[#252526] border-l border-gray-700">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-sm font-semibold text-gray-300">AI Assistant</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <p className="text-sm">Start a conversation with the AI assistant</p>
            <p className="text-xs mt-2">The AI can see your open files for context</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "rounded-lg p-3",
              message.role === "user"
                ? "bg-blue-600 text-white ml-8"
                : "bg-gray-700 text-gray-200 mr-8"
            )}
          >
            <div className="text-sm whitespace-pre-wrap">{message.content}</div>
            {message.tokenUsage && (
              <div className="text-xs mt-2 opacity-70">
                {message.tokenUsage.totalTokens} tokens • {message.tokenUsage.model}
              </div>
            )}
          </div>
        ))}

        {isStreaming && (
          <div className="flex items-center gap-2 text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question or request code help..."
            className="flex-1 px-4 py-2 bg-gray-700 text-gray-200 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
            disabled={isStreaming}
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isStreaming ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

