"use client";

import { useState, useEffect, useRef } from "react";
import { useAppStore } from "@/store/useAppStore";
import { FileNode } from "@/types";
import { Folder, File, ChevronRight, ChevronDown, Upload, Plus } from "lucide-react";
import { cn, getLanguageFromPath } from "@/lib/utils";

interface FileExplorerProps {
  className?: string;
}

export function FileExplorer({ className }: FileExplorerProps) {
  const { fileTree, setFileTree, selectedPath, setSelectedPath, openFile } =
    useAppStore();
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [showUpload, setShowUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const fileName = file.name;
        const language = getLanguageFromPath(fileName);
        openFile(fileName, content, language);
      };
      reader.readAsText(file);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setShowUpload(false);
  };

  const handleNewFile = () => {
    const fileName = prompt("Enter file name (e.g., example.js):");
    if (fileName) {
      openFile(fileName, "", getLanguageFromPath(fileName));
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
    <div className={cn("h-full overflow-y-auto bg-[#252526] flex flex-col", className)}>
      <div className="p-2 border-b border-gray-700 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-300">EXPLORER</h2>
        <div className="flex gap-1">
          <button
            onClick={handleNewFile}
            className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-gray-200"
            title="New file"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              fileInputRef.current?.click();
              setShowUpload(true);
            }}
            className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-gray-200"
            title="Upload file"
          >
            <Upload className="w-4 h-4" />
          </button>
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileUpload}
        className="hidden"
        accept=".js,.jsx,.ts,.tsx,.py,.html,.css,.json,.md,.txt"
      />
      <div className="flex-1 overflow-y-auto py-2">
        {fileTree && fileTree.length > 0 ? (
          fileTree.map((node) => renderNode(node))
        ) : (
          <div className="px-4 py-2">
            <div className="text-sm text-gray-500 mb-3">
              No files in workspace
            </div>
            <div className="text-xs text-gray-600 mb-2">
              Upload files or create new ones to get started
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded"
            >
              Upload Files
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

