"use client";

import { useState, useEffect, useRef } from "react";
import { useAppStore } from "@/store/useAppStore";
import { FileNode } from "@/types";
import { Folder, File, ChevronRight, ChevronDown, Upload, Plus, FolderUp, X } from "lucide-react";
import { cn, getLanguageFromPath } from "@/lib/utils";

interface FileExplorerProps {
  className?: string;
}

export function FileExplorer({ className }: FileExplorerProps) {
  const {
    fileTree,
    setFileTree,
    selectedPath,
    setSelectedPath,
    openFile,
    uploadedFiles,
    addUploadedFile,
    removeUploadedFile,
  } = useAppStore();
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [showUpload, setShowUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

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
        // Use webkitRelativePath if available (folder upload), otherwise just filename
        const filePath = (file as any).webkitRelativePath || file.name;
        const language = getLanguageFromPath(filePath);
        addUploadedFile(filePath, content);
        openFile(filePath, content, language);
      };
      reader.readAsText(file);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setShowUpload(false);
  };

  const handleFolderUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        // Use webkitRelativePath to preserve folder structure
        const filePath = (file as any).webkitRelativePath || file.name;
        const language = getLanguageFromPath(filePath);
        addUploadedFile(filePath, content);
        // Only auto-open the first file to avoid overwhelming the editor
        if (Array.from(files).indexOf(file) === 0) {
          openFile(filePath, content, language);
        }
      };
      reader.readAsText(file);
    });

    // Reset input
    if (folderInputRef.current) {
      folderInputRef.current.value = "";
    }
  };

  const handleNewFile = () => {
    const fileName = prompt("Enter file name (e.g., example.js):");
    if (fileName) {
      openFile(fileName, "", getLanguageFromPath(fileName));
    }
  };

  const handleRemoveFile = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Remove "${path}" from workspace?`)) {
      removeUploadedFile(path);
    }
  };

  // Build tree from uploaded files
  const buildUploadedTree = (): FileNode[] => {
    const tree: FileNode[] = [];
    const pathMap = new Map<string, FileNode>();

    uploadedFiles.forEach((content, path) => {
      const parts = path.split("/");
      let currentPath = "";
      
      parts.forEach((part, index) => {
        const isLast = index === parts.length - 1;
        const fullPath = currentPath ? `${currentPath}/${part}` : part;
        
        if (!pathMap.has(fullPath)) {
          const node: FileNode = {
            name: part,
            path: fullPath,
            type: isLast ? "file" : "directory",
            children: isLast ? undefined : [],
          };
          pathMap.set(fullPath, node);
          
          if (currentPath) {
            const parent = pathMap.get(currentPath);
            if (parent && parent.children) {
              parent.children.push(node);
            }
          } else {
            tree.push(node);
          }
        }
        
        currentPath = fullPath;
      });
    });

    return tree;
  };

  const renderNode = (node: FileNode, level: number = 0, isUploaded: boolean = false) => {
    const isExpanded = expandedPaths.has(node.path);
    const isSelected = selectedPath === node.path;
    const isUploadedFile = isUploaded && uploadedFiles.has(node.path);

    if (node.type === "directory") {
      return (
        <div key={node.path}>
          <div
            className={cn(
              "flex items-center gap-1 px-2 py-1 cursor-pointer hover:bg-gray-700 rounded group",
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
            <span className="text-sm text-gray-300 flex-1">{node.name}</span>
            {isUploadedFile && (
              <button
                onClick={(e) => handleRemoveFile(node.path, e)}
                className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-gray-600 rounded"
                title="Remove"
              >
                <X className="w-3 h-3 text-gray-400 hover:text-red-400" />
              </button>
            )}
          </div>
          {isExpanded && node.children && (
            <div>
              {node.children.map((child) => renderNode(child, level + 1, isUploaded))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div
        key={node.path}
        className={cn(
          "flex items-center gap-1 px-2 py-1 cursor-pointer hover:bg-gray-700 rounded group",
          isSelected && "bg-gray-700"
        )}
        style={{ paddingLeft: `${level * 16 + 24}px` }}
        onClick={() => {
          if (isUploadedFile && uploadedFiles.has(node.path)) {
            const content = uploadedFiles.get(node.path)!;
            const language = getLanguageFromPath(node.path);
            openFile(node.path, content, language);
          } else {
            handleFileClick(node.path);
          }
        }}
      >
        <File className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-300 flex-1">{node.name}</span>
        {isUploadedFile && (
          <button
            onClick={(e) => handleRemoveFile(node.path, e)}
            className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-gray-600 rounded"
            title="Remove"
          >
            <X className="w-3 h-3 text-gray-400 hover:text-red-400" />
          </button>
        )}
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
              folderInputRef.current?.click();
            }}
            className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-gray-200"
            title="Upload folder"
          >
            <FolderUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              fileInputRef.current?.click();
              setShowUpload(true);
            }}
            className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-gray-200"
            title="Upload files"
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
        accept=".js,.jsx,.ts,.tsx,.py,.html,.css,.json,.md,.txt,.yml,.yaml,.sh,.bash,.go,.rs,.java,.cpp,.c,.php,.rb,.swift,.kt"
      />
      <input
        ref={folderInputRef}
        type="file"
        multiple
        onChange={handleFolderUpload}
        className="hidden"
        // @ts-ignore - webkitdirectory is not in TypeScript types but is supported
        webkitdirectory=""
        directory=""
      />
      <div className="flex-1 overflow-y-auto py-2">
        {(() => {
          const uploadedTree = buildUploadedTree();
          const hasUploadedFiles = uploadedFiles.size > 0;
          const hasServerFiles = fileTree && fileTree.length > 0;
          
          if (hasUploadedFiles || hasServerFiles) {
            return (
              <>
                {hasUploadedFiles && (
                  <div>
                    {uploadedTree.map((node) => renderNode(node, 0, true))}
                  </div>
                )}
                {hasServerFiles && (
                  <div className={hasUploadedFiles ? "mt-4 border-t border-gray-700 pt-2" : ""}>
                    {fileTree!.map((node) => renderNode(node, 0, false))}
                  </div>
                )}
              </>
            );
          }
          
          return (
            <div className="px-4 py-2">
              <div className="text-sm text-gray-500 mb-3">
                No files in workspace
              </div>
              <div className="text-xs text-gray-600 mb-3">
                Upload files or folders, or create new ones to get started
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => folderInputRef.current?.click()}
                  className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded"
                >
                  Upload Folder
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded"
                >
                  Upload Files
                </button>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

