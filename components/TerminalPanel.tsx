"use client";

import { useState, useRef, useEffect } from "react";
import { Terminal as TerminalIcon, X } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";

export function TerminalPanel() {
  const { terminalOpen, setTerminalOpen } = useAppStore();
  const [output, setOutput] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (terminalOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [terminalOpen]);

  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const command = input.trim();
    setOutput((prev) => [...prev, `$ ${command}`]);
    setInput("");

    // Simulate command execution (in production, this would run actual commands)
    setTimeout(() => {
      setOutput((prev) => [
        ...prev,
        `Command "${command}" executed (terminal simulation mode)`,
      ]);
    }, 100);
  };

  if (!terminalOpen) return null;

  return (
    <div className="h-64 bg-white border-t border-[#e8eaed] flex flex-col">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#e8eaed] bg-[#f8f9fa]">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-4 h-4 text-[#5f6368]" />
          <span className="text-sm font-medium text-[#202124]">Terminal</span>
        </div>
        <button
          onClick={() => setTerminalOpen(false)}
          className="text-[#5f6368] hover:text-[#202124] hover:bg-[#e8eaed] rounded-lg p-1 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 font-mono text-sm bg-[#1e1e1e]">
        {output.length === 0 && (
          <div className="text-[#5f6368]">
            Terminal simulation mode. Commands are not executed for security.
          </div>
        )}
        {output.map((line, i) => (
          <div key={i} className="text-[#d4d4d4] mb-1">
            {line}
          </div>
        ))}
      </div>

      <form onSubmit={handleCommand} className="px-4 py-2 border-t border-[#e8eaed] bg-white">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter command..."
          className="w-full bg-transparent text-[#202124] focus:outline-none font-mono text-sm"
        />
      </form>
    </div>
  );
}

