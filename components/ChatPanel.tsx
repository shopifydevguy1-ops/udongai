"use client";

import { useState, useRef, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Send, Loader2, Upload, Paperclip, X, Image as ImageIcon } from "lucide-react";
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
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const { uploadedFiles, addUploadedFile, removeUploadedFile } = useAppStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle paste events for screenshots
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf("image") !== -1) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const base64 = event.target?.result as string;
              setPendingImages((prev) => [...prev, base64]);
            };
            reader.readAsDataURL(file);
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64 = event.target?.result as string;
          setPendingImages((prev) => [...prev, base64]);
        };
        reader.readAsDataURL(file);
      }
    });

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  // Detect if user wants to generate media
  const detectMediaGeneration = (text: string): { generate: boolean; format: string; prompt: string } | null => {
    const lowerText = text.toLowerCase();
    
    // Check for explicit generation requests
    const generationPatterns = [
      { pattern: /generate\s+(?:a|an|the)?\s*(gif|webp|mp4|3d|image|picture|video|model)/i, format: "auto" },
      { pattern: /create\s+(?:a|an|the)?\s*(gif|webp|mp4|3d|image|picture|video|model)/i, format: "auto" },
      { pattern: /make\s+(?:a|an|the)?\s*(gif|webp|mp4|3d|image|picture|video|model)/i, format: "auto" },
      { pattern: /draw\s+(?:a|an|the)?/i, format: "png" },
      { pattern: /show\s+me\s+(?:a|an|the)?/i, format: "png" },
    ];

    for (const { pattern, format } of generationPatterns) {
      if (pattern.test(text)) {
        const match = text.match(pattern);
        let detectedFormat = format;
        
        // Extract format from match
        if (match && match[1]) {
          const formatMap: Record<string, string> = {
            gif: "gif",
            webp: "webp",
            mp4: "mp4",
            video: "mp4",
            "3d": "glb",
            model: "glb",
            image: "png",
            picture: "png",
          };
          detectedFormat = formatMap[match[1].toLowerCase()] || "png";
        }

        // Extract prompt (remove generation keywords)
        const prompt = text
          .replace(/^(generate|create|make|draw|show me)\s+(?:a|an|the)?\s*(gif|webp|mp4|3d|image|picture|video|model)?\s*/i, "")
          .trim();

        if (prompt) {
          return { generate: true, format: detectedFormat, prompt };
        }
      }
    }

    // Check for format-specific keywords
    if (lowerText.includes(" as gif") || lowerText.includes(" gif format")) {
      const prompt = text.replace(/\s+as\s+gif|\s+gif\s+format/gi, "").trim();
      if (prompt) return { generate: true, format: "gif", prompt };
    }
    if (lowerText.includes(" as webp") || lowerText.includes(" webp format")) {
      const prompt = text.replace(/\s+as\s+webp|\s+webp\s+format/gi, "").trim();
      if (prompt) return { generate: true, format: "webp", prompt };
    }
    if (lowerText.includes(" as mp4") || lowerText.includes(" mp4 format") || lowerText.includes(" as video")) {
      const prompt = text.replace(/\s+as\s+mp4|\s+mp4\s+format|\s+as\s+video/gi, "").trim();
      if (prompt) return { generate: true, format: "mp4", prompt };
    }
    if (lowerText.includes(" as 3d") || lowerText.includes(" 3d model") || lowerText.includes(" as glb")) {
      const prompt = text.replace(/\s+as\s+3d|\s+3d\s+model|\s+as\s+glb/gi, "").trim();
      if (prompt) return { generate: true, format: "glb", prompt };
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && pendingImages.length === 0 || isStreaming) return;

    const userMessage = input.trim() || (pendingImages.length > 0 ? "[Image attached]" : "");
    const images = [...pendingImages];
    setInput("");
    setPendingImages([]);
    addMessage({ role: "user", content: userMessage, images });

    setIsStreaming(true);

    try {
      // Check if user wants to generate media
      const mediaRequest = detectMediaGeneration(userMessage);
      
      if (mediaRequest && mediaRequest.generate) {
        // Generate media
        const generateResponse = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: mediaRequest.prompt,
            format: mediaRequest.format,
            size: "1024x1024",
          }),
        });

        if (!generateResponse.ok) {
          const error = await generateResponse.json();
          throw new Error(error.error || "Failed to generate media");
        }

        const generatedData = await generateResponse.json();
        
        addMessage({
          role: "assistant",
          content: `I've generated a ${generatedData.type} for you: "${mediaRequest.prompt}"`,
          generatedMedia: [generatedData],
        });

        setIsStreaming(false);
        return;
      }

      // Regular chat flow
      // Build context from open files
      const context = getContextFromOpenFiles();
      let systemMessage = context
        ? `You are an expert AI development assistant. You have access to the following files:\n\n${context}\n\nProvide helpful, accurate code suggestions and explanations.`
        : "You are an expert AI development assistant. Provide helpful, accurate code suggestions and explanations.";

      // Add image context if images are present
      if (images.length > 0) {
        systemMessage += `\n\nThe user has attached ${images.length} image(s). Please analyze the images and provide relevant assistance.`;
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemMessage },
            { role: "user", content: userMessage, images },
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
            <p className="text-xs text-[#5f6368] mt-2">💡 Tip: Paste screenshots with Ctrl+V / Cmd+V</p>
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
                {message.images && message.images.length > 0 && (
                  <div className="mb-3 space-y-2">
                    {message.images.map((img, idx) => (
                      <div key={idx} className="rounded-lg overflow-hidden max-w-md">
                        <img
                          src={img}
                          alt={`Attached image ${idx + 1}`}
                          className="max-w-full h-auto rounded-lg"
                        />
                      </div>
                    ))}
                  </div>
                )}
                {message.generatedMedia && message.generatedMedia.length > 0 && (
                  <div className="mb-3 space-y-3">
                    {message.generatedMedia.map((media, idx) => (
                      <div key={idx} className="rounded-lg overflow-hidden">
                        {media.type === "image" && (
                          <img
                            src={media.url}
                            alt={media.prompt}
                            className="max-w-full h-auto rounded-lg border border-[#e8eaed]"
                          />
                        )}
                        {media.type === "video" && (
                          <video
                            src={media.url}
                            controls
                            className="max-w-full h-auto rounded-lg border border-[#e8eaed]"
                          >
                            Your browser does not support the video tag.
                          </video>
                        )}
                        {media.type === "3d" && (
                          <div className="p-4 bg-[#f8f9fa] rounded-lg border border-[#e8eaed]">
                            <p className="text-xs text-[#5f6368] mb-2">3D Model: {media.prompt}</p>
                            <a
                              href={media.url}
                              download={`${media.prompt}.${media.format}`}
                              className="text-sm text-[#1a73e8] hover:underline"
                            >
                              Download {media.format.toUpperCase()} model
                            </a>
                          </div>
                        )}
                        <p className="text-xs text-[#5f6368] mt-2 italic">Format: {media.format.toUpperCase()}</p>
                      </div>
                    ))}
                  </div>
                )}
                {message.content && (
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</div>
                )}
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
          {(uploadedFiles.size > 0 || pendingImages.length > 0) && (
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
              {pendingImages.map((img, idx) => (
                <span
                  key={`img-${idx}`}
                  className="px-3 py-1 bg-[#e3f2fd] text-[#1a73e8] rounded-full text-xs flex items-center gap-2"
                >
                  <ImageIcon className="w-3 h-3" />
                  Screenshot {idx + 1}
                  <button
                    type="button"
                    onClick={() => setPendingImages((prev) => prev.filter((_, i) => i !== idx))}
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
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="p-3 hover:bg-[#f8f9fa] rounded-full text-[#5f6368] hover:text-[#202124] transition-colors"
              title="Upload image or paste screenshot (Ctrl+V / Cmd+V)"
            >
              <ImageIcon className="w-5 h-5" />
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
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question, paste a screenshot (Ctrl+V), or request code help..."
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

