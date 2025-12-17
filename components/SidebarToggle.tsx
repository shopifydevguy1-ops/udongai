"use client";

import { useAppStore } from "@/store/useAppStore";
import { PanelLeft, PanelRight } from "lucide-react";

export function SidebarToggle() {
  const { sidebarOpen, setSidebarOpen, chatOpen, setChatOpen } = useAppStore();

  return (
    <div className="flex flex-col items-center gap-1 border-r border-[#e8eaed] bg-[#f8f9fa] py-2">
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="p-2 hover:bg-[#e8eaed] text-[#5f6368] hover:text-[#202124] rounded-lg transition-colors"
        title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
      >
        <PanelLeft className="w-4 h-4" />
      </button>
      <button
        onClick={() => setChatOpen(!chatOpen)}
        className="p-2 hover:bg-[#e8eaed] text-[#5f6368] hover:text-[#202124] rounded-lg transition-colors"
        title={chatOpen ? "Hide chat" : "Show chat"}
      >
        <PanelRight className="w-4 h-4" />
      </button>
    </div>
  );
}

