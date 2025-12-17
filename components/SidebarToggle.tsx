"use client";

import { useAppStore } from "@/store/useAppStore";
import { PanelLeft, PanelRight } from "lucide-react";

export function SidebarToggle() {
  const { sidebarOpen, setSidebarOpen, chatOpen, setChatOpen } = useAppStore();

  return (
    <div className="flex items-center gap-1 border-r border-gray-700 bg-[#252526]">
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="p-2 hover:bg-gray-700 text-gray-400 hover:text-gray-200"
        title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
      >
        <PanelLeft className="w-4 h-4" />
      </button>
      <button
        onClick={() => setChatOpen(!chatOpen)}
        className="p-2 hover:bg-gray-700 text-gray-400 hover:text-gray-200"
        title={chatOpen ? "Hide chat" : "Show chat"}
      >
        <PanelRight className="w-4 h-4" />
      </button>
    </div>
  );
}

