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
    <div className="flex items-center bg-[#2d2d2d] border-b border-gray-700 overflow-x-auto">
      {editor.openFiles.map((file) => {
        const fileName = file.path.split("/").pop() || file.path;
        const isActive = editor.activeFile === file.path;

        return (
          <div
            key={file.path}
            className={cn(
              "flex items-center gap-2 px-4 py-2 cursor-pointer border-r border-gray-700 hover:bg-[#1e1e1e]",
              isActive && "bg-[#1e1e1e]"
            )}
            onClick={() => setActiveFile(file.path)}
          >
            <span className="text-sm text-gray-300 whitespace-nowrap">
              {fileName}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeFile(file.path);
              }}
              className="text-gray-400 hover:text-gray-200 rounded p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

