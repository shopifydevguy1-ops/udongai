"use client";

import { ChatPanel } from "@/components/ChatPanel";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAppStore } from "@/store/useAppStore";
import { useEffect } from "react";

export default function Home() {
  const { theme, setTheme } = useAppStore();

  useEffect(() => {
    // Initialize theme from localStorage
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark" || savedTheme === "light") {
      setTheme(savedTheme);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(prefersDark ? "dark" : "light");
    }
  }, [setTheme]);

  useEffect(() => {
    // Apply theme class to html element
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-screen bg-white dark:bg-[#0f0f0f] text-[#202124] dark:text-[#e8eaed] transition-colors">
        {/* Minimal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8eaed] dark:border-[#2d2d2d] bg-white dark:bg-[#0f0f0f]">
          <h1 className="text-lg font-medium text-[#202124] dark:text-[#e8eaed]">AI Dev Agent</h1>
          <ThemeToggle />
        </div>

        {/* Full-width chat */}
        <div className="flex-1 w-full overflow-hidden">
          <ChatPanel />
        </div>
      </div>
    </ErrorBoundary>
  );
}

