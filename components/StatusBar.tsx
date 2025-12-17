"use client";

import { useAppStore } from "@/store/useAppStore";
import { Terminal } from "lucide-react";

export function StatusBar() {
  const { totalTokens, editor, setTerminalOpen, terminalOpen } = useAppStore();
  const activeFile = editor.openFiles.find((f) => f.path === editor.activeFile);

  return (
    <div className="flex items-center justify-between px-4 py-1 bg-[#007acc] text-white text-xs">
      <div className="flex items-center gap-4">
        {activeFile && (
          <span className="text-gray-200">{activeFile.path}</span>
        )}
        <span className="text-gray-300">
          Tokens: {totalTokens.toLocaleString()}
        </span>
      </div>
      <button
        onClick={() => setTerminalOpen(!terminalOpen)}
        className="flex items-center gap-1 hover:bg-blue-600 px-2 py-1 rounded"
      >
        <Terminal className="w-3 h-3" />
        <span>Terminal</span>
      </button>
    </div>
  );
}

