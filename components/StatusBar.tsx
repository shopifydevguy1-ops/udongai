"use client";

import { useAppStore } from "@/store/useAppStore";
import { Terminal } from "lucide-react";

export function StatusBar() {
  const { totalTokens, editor, setTerminalOpen, terminalOpen } = useAppStore();
  const activeFile = editor.openFiles.find((f) => f.path === editor.activeFile);

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-[#f8f9fa] border-t border-[#e8eaed] text-xs">
      <div className="flex items-center gap-4">
        {activeFile && (
          <span className="text-[#5f6368]">{activeFile.path}</span>
        )}
        <span className="text-[#5f6368]">
          Tokens: {totalTokens.toLocaleString()}
        </span>
      </div>
      <button
        onClick={() => setTerminalOpen(!terminalOpen)}
        className="flex items-center gap-1.5 hover:bg-[#e8eaed] px-3 py-1.5 rounded-lg text-[#202124] transition-colors"
      >
        <Terminal className="w-3.5 h-3.5" />
        <span>Terminal</span>
      </button>
    </div>
  );
}

