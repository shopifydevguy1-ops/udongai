"use client";

import { ChatPanel } from "@/components/ChatPanel";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function Home() {
  return (
    <ErrorBoundary>
      <div className="flex flex-col h-screen bg-white text-[#202124]">
        {/* Minimal header */}
        <div className="flex items-center px-6 py-4 border-b border-[#e8eaed] bg-white">
          <h1 className="text-lg font-medium text-[#202124]">AI Dev Agent</h1>
        </div>

        {/* Full-width chat */}
        <div className="flex-1 w-full overflow-hidden">
          <ChatPanel />
        </div>
      </div>
    </ErrorBoundary>
  );
}

