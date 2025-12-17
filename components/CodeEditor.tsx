"use client";

import { useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import { useAppStore } from "@/store/useAppStore";
import { getLanguageFromPath } from "@/lib/utils";

export function CodeEditor() {
  const { editor, updateFileContent } = useAppStore();
  const activeFile = editor.openFiles.find((f) => f.path === editor.activeFile);

  const handleEditorChange = (value: string | undefined) => {
    if (activeFile && value !== undefined) {
      updateFileContent(activeFile.path, value);
    }
  };

  if (!activeFile) {
    return (
      <div className="flex items-center justify-center h-full bg-[#1e1e1e] text-gray-500">
        <div className="text-center max-w-md">
          <p className="text-lg mb-2">No file open</p>
          <p className="text-sm mb-4">
            Upload a file from the explorer or create a new file to start editing
          </p>
          <p className="text-xs text-gray-600">
            Use the upload button (📤) or new file button (+) in the explorer sidebar
          </p>
        </div>
      </div>
    );
  }

  const language = activeFile.language || getLanguageFromPath(activeFile.path);

  return (
    <div className="h-full bg-[#1e1e1e]">
      <Editor
        height="100%"
        language={language}
        value={activeFile.content}
        onChange={handleEditorChange}
        theme="vs-dark"
        options={{
          minimap: { enabled: true },
          fontSize: 14,
          wordWrap: "on",
          automaticLayout: true,
          scrollBeyondLastLine: false,
          tabSize: 2,
          insertSpaces: true,
        }}
      />
    </div>
  );
}

