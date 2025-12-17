"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { FileNode } from "@/types";
import { Folder, File, ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileExplorerProps {
  className?: string;
}

export function FileExplorer({ className }: FileExplorerProps) {
  const { fileTree, setFileTree, selectedPath, setSelectedPath, openFile } =
    useAppStore();
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Load file tree on mount
    fetch("/api/files")
      .then((res) => res.json())
      .then((data) => {
        if (data.tree) {
          setFileTree(data.tree);
        }
      })
      .catch((err) => console.error("Failed to load file tree:", err));
  }, [setFileTree]);

  const toggleExpand = (path: string) => {
    const newExpanded = new Set(expandedPaths);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedPaths(newExpanded);
  };

  const handleFileClick = async (path: string) => {
    setSelectedPath(path);
    try {
      const res = await fetch(`/api/files?path=${encodeURIComponent(path)}`);
      const data = await res.json();
      if (data.content !== undefined) {
        const language = path.split(".").pop()?.toLowerCase();
        openFile(path, data.content, language);
      }
    } catch (err) {
      console.error("Failed to open file:", err);
    }
  };

  const renderNode = (node: FileNode, level: number = 0) => {
    const isExpanded = expandedPaths.has(node.path);
    const isSelected = selectedPath === node.path;

    if (node.type === "directory") {
      return (
        <div key={node.path}>
          <div
            className={cn(
              "flex items-center gap-1 px-2 py-1 cursor-pointer hover:bg-gray-700 rounded",
              isSelected && "bg-gray-700"
            )}
            style={{ paddingLeft: `${level * 16 + 8}px` }}
            onClick={() => toggleExpand(node.path)}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
            <Folder className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-gray-300">{node.name}</span>
          </div>
          {isExpanded && node.children && (
            <div>
              {node.children.map((child) => renderNode(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div
        key={node.path}
        className={cn(
          "flex items-center gap-1 px-2 py-1 cursor-pointer hover:bg-gray-700 rounded",
          isSelected && "bg-gray-700"
        )}
        style={{ paddingLeft: `${level * 16 + 24}px` }}
        onClick={() => handleFileClick(node.path)}
      >
        <File className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-300">{node.name}</span>
      </div>
    );
  };

  return (
    <div className={cn("h-full overflow-y-auto bg-[#252526]", className)}>
      <div className="p-2 border-b border-gray-700">
        <h2 className="text-sm font-semibold text-gray-300">EXPLORER</h2>
      </div>
      <div className="py-2">
        {fileTree ? (
          fileTree.map((node) => renderNode(node))
        ) : (
          <div className="px-4 py-2 text-sm text-gray-500">
            Loading files...
          </div>
        )}
      </div>
    </div>
  );
}

