"use client";

import { useAppStore } from "@/store/useAppStore";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function TabBar() {
  const { editor, setActiveFile, closeFile } = useAppStore();

  if (editor.openFiles.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center bg-white border-b border-[#e8eaed] overflow-x-auto">
      {editor.openFiles.map((file) => {
        const fileName = file.path.split("/").pop() || file.path;
        const isActive = editor.activeFile === file.path;

        return (
          <div
            key={file.path}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 cursor-pointer border-r border-[#e8eaed] hover:bg-[#f8f9fa] transition-colors",
              isActive && "bg-[#f8f9fa] border-b-2 border-b-[#1a73e8]"
            )}
            onClick={() => setActiveFile(file.path)}
          >
            <span className="text-sm text-[#202124] whitespace-nowrap font-medium">
              {fileName}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeFile(file.path);
              }}
              className="text-[#5f6368] hover:text-[#202124] hover:bg-[#e8eaed] rounded-full p-0.5 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

