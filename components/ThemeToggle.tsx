"use client";

import { Moon, Sun } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

export function ThemeToggle() {
  const { theme, setTheme } = useAppStore();

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 hover:bg-[#f8f9fa] dark:hover:bg-[#2d2d2d] rounded-lg text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#202124] dark:hover:text-[#e8eaed] transition-colors"
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      aria-label="Toggle theme"
    >
      {theme === "light" ? (
        <Moon className="w-5 h-5" />
      ) : (
        <Sun className="w-5 h-5" />
      )}
    </button>
  );
}

