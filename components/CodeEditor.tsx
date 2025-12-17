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
      <div className="flex items-center justify-center h-full bg-white text-[#5f6368]">
        <div className="text-center max-w-md">
          <div className="mb-4">
            <svg className="w-16 h-16 mx-auto text-[#1a73e8] opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-lg font-medium text-[#202124] mb-2">No file open</p>
          <p className="text-sm text-[#5f6368] mb-4">
            Upload a file from the explorer or create a new file to start editing
          </p>
          <p className="text-xs text-[#5f6368]">
            Use the upload button (📤) or new file button (+) in the explorer sidebar
          </p>
        </div>
      </div>
    );
  }

  const language = activeFile.language || getLanguageFromPath(activeFile.path);

  return (
    <div className="h-full bg-white">
      <Editor
        height="100%"
        language={language}
        value={activeFile.content}
        onChange={handleEditorChange}
        theme="vs"
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

