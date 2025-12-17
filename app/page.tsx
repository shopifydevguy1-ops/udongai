"use client";

import { ChatPanel } from "@/components/ChatPanel";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useAppStore } from "@/store/useAppStore";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export default function Home() {
  const { sidebarOpen, setSidebarOpen } = useAppStore();
  const [showFiles, setShowFiles] = useState(false);

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-screen bg-white text-[#202124]">
        {/* Minimal header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#e8eaed] bg-white">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFiles(!showFiles)}
              className="p-2 hover:bg-[#f8f9fa] rounded-lg text-[#5f6368] hover:text-[#202124] transition-colors"
              title="Toggle files"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-medium text-[#202124]">AI Dev Agent</h1>
          </div>
        </div>

        {/* Main content area - Full width chat */}
        <div className="flex flex-1 overflow-hidden relative">
          {/* Optional file sidebar */}
          {showFiles && (
            <div className="w-80 flex-shrink-0 border-r border-[#e8eaed] bg-[#f8f9fa] absolute inset-y-0 left-0 z-10 shadow-lg">
              <FileSidebar onClose={() => setShowFiles(false)} />
            </div>
          )}

          {/* Full-width chat */}
          <div className="flex-1 w-full">
            <ChatPanel />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

// Simple file sidebar component
function FileSidebar({ onClose }: { onClose: () => void }) {
  const { uploadedFiles, removeUploadedFile, openFile, addUploadedFile } = useAppStore();
  const [fileInputRef, setFileInputRef] = useState<HTMLInputElement | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const filePath = (file as any).webkitRelativePath || file.name;
        addUploadedFile(filePath, content);
      };
      reader.readAsText(file);
    });

    if (fileInputRef) {
      (fileInputRef as any).value = "";
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-[#e8eaed] flex items-center justify-between">
        <h2 className="text-sm font-medium text-[#202124]">Files</h2>
        <button
          onClick={onClose}
          className="p-1 hover:bg-[#e8eaed] rounded-lg text-[#5f6368]"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {uploadedFiles.size === 0 ? (
          <div className="text-center text-[#5f6368] py-8">
            <p className="text-sm mb-4">No files uploaded</p>
            <button
              onClick={() => fileInputRef?.click()}
              className="px-4 py-2 bg-[#1a73e8] text-white rounded-lg hover:bg-[#1557b0] transition-colors text-sm"
            >
              Upload Files
            </button>
            <input
              ref={setFileInputRef}
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              // @ts-ignore
              webkitdirectory=""
            />
          </div>
        ) : (
          <div className="space-y-2">
            {Array.from(uploadedFiles.entries()).map(([path, content]) => (
              <div
                key={path}
                className="p-3 bg-white rounded-lg border border-[#e8eaed] hover:border-[#1a73e8] transition-colors cursor-pointer"
                onClick={() => {
                  const language = path.split(".").pop()?.toLowerCase();
                  openFile(path, content, language);
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#202124] font-medium truncate">{path}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeUploadedFile(path);
                    }}
                    className="text-[#5f6368] hover:text-red-600 p-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

