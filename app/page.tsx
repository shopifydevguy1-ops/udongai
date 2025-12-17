"use client";

import { FileExplorer } from "@/components/FileExplorer";
import { CodeEditor } from "@/components/CodeEditor";
import { ChatPanel } from "@/components/ChatPanel";
import { TabBar } from "@/components/TabBar";
import { StatusBar } from "@/components/StatusBar";
import { TerminalPanel } from "@/components/TerminalPanel";
import { SidebarToggle } from "@/components/SidebarToggle";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useAppStore } from "@/store/useAppStore";

export default function Home() {
  const { sidebarOpen, chatOpen, terminalOpen } = useAppStore();

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-screen bg-white text-[#202124]">
        {/* Main content area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar toggle */}
          <SidebarToggle />

          {/* Sidebar */}
          {sidebarOpen && (
            <div className="w-64 flex-shrink-0 border-r border-[#e8eaed] bg-[#f8f9fa]">
              <FileExplorer />
            </div>
          )}

          {/* Editor area */}
          <div className="flex-1 flex flex-col min-w-0 bg-white">
            <TabBar />
            <div className="flex-1 overflow-hidden">
              <CodeEditor />
            </div>
            {terminalOpen && <TerminalPanel />}
          </div>

          {/* Chat panel */}
          {chatOpen && (
            <div className="w-96 flex-shrink-0 border-l border-[#e8eaed] bg-white">
              <ChatPanel />
            </div>
          )}
        </div>

        {/* Status bar */}
        <StatusBar />
      </div>
    </ErrorBoundary>
  );
}

