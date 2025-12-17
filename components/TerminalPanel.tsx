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
    <div className="h-64 bg-[#1e1e1e] border-t border-gray-700 flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-semibold text-gray-300">Terminal</span>
        </div>
        <button
          onClick={() => setTerminalOpen(false)}
          className="text-gray-400 hover:text-gray-200"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 font-mono text-sm">
        {output.length === 0 && (
          <div className="text-gray-500">
            Terminal simulation mode. Commands are not executed for security.
          </div>
        )}
        {output.map((line, i) => (
          <div key={i} className="text-gray-300 mb-1">
            {line}
          </div>
        ))}
      </div>

      <form onSubmit={handleCommand} className="px-4 py-2 border-t border-gray-700">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter command..."
          className="w-full bg-transparent text-gray-300 focus:outline-none font-mono text-sm"
        />
      </form>
    </div>
  );
}

