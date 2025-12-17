import { create } from "zustand";
import { EditorState, ChatMessage, FileNode, TokenUsage } from "@/types";

interface AppState {
  // Editor state
  editor: EditorState;
  openFile: (path: string, content: string, language?: string) => void;
  closeFile: (path: string) => void;
  setActiveFile: (path: string) => void;
  updateFileContent: (path: string, content: string) => void;

  // File explorer
  fileTree: FileNode[] | null;
  setFileTree: (tree: FileNode[]) => void;
  selectedPath: string | null;
  setSelectedPath: (path: string | null) => void;
  uploadedFiles: Map<string, string>; // path -> content
  addUploadedFile: (path: string, content: string) => void;
  removeUploadedFile: (path: string) => void;

  // Chat
  messages: ChatMessage[];
  addMessage: (message: Omit<ChatMessage, "id" | "timestamp">) => void;
  clearMessages: () => void;
  isStreaming: boolean;
  setIsStreaming: (streaming: boolean) => void;

  // UI state
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  chatOpen: boolean;
  setChatOpen: (open: boolean) => void;
  terminalOpen: boolean;
  setTerminalOpen: (open: boolean) => void;
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;

  // Token usage
  totalTokens: number;
  addTokenUsage: (usage: TokenUsage) => void;
  resetTokenUsage: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Editor
  editor: {
    openFiles: [],
    activeFile: undefined,
  },
  openFile: (path, content, language) =>
    set((state) => {
      const existingIndex = state.editor.openFiles.findIndex((f) => f.path === path);
      if (existingIndex >= 0) {
        return {
          editor: {
            ...state.editor,
            activeFile: path,
            openFiles: state.editor.openFiles.map((f, i) =>
              i === existingIndex ? { ...f, content } : f
            ),
          },
        };
      }
      return {
        editor: {
          ...state.editor,
          activeFile: path,
          openFiles: [...state.editor.openFiles, { path, content, language }],
        },
      };
    }),
  closeFile: (path) =>
    set((state) => {
      const files = state.editor.openFiles.filter((f) => f.path !== path);
      const activeFile =
        state.editor.activeFile === path
          ? files.length > 0
            ? files[files.length - 1].path
            : undefined
          : state.editor.activeFile;
      return {
        editor: {
          ...state.editor,
          openFiles: files,
          activeFile,
        },
      };
    }),
  setActiveFile: (path) =>
    set((state) => ({
      editor: { ...state.editor, activeFile: path },
    })),
  updateFileContent: (path, content) =>
    set((state) => ({
      editor: {
        ...state.editor,
        openFiles: state.editor.openFiles.map((f) =>
          f.path === path ? { ...f, content } : f
        ),
      },
    })),

  // File explorer
  fileTree: null,
  setFileTree: (tree) => set({ fileTree: tree }),
  selectedPath: null,
  setSelectedPath: (path) => set({ selectedPath: path }),
  uploadedFiles: new Map(),
  addUploadedFile: (path, content) =>
    set((state) => {
      const newMap = new Map(state.uploadedFiles);
      newMap.set(path, content);
      return { uploadedFiles: newMap };
    }),
  removeUploadedFile: (path) =>
    set((state) => {
      const newMap = new Map(state.uploadedFiles);
      newMap.delete(path);
      // Also close the file if it's open
      const files = state.editor.openFiles.filter((f) => f.path !== path);
      const activeFile =
        state.editor.activeFile === path
          ? files.length > 0
            ? files[files.length - 1].path
            : undefined
          : state.editor.activeFile;
      return {
        uploadedFiles: newMap,
        editor: {
          ...state.editor,
          openFiles: files,
          activeFile,
        },
      };
    }),

  // Chat
  messages: [],
  addMessage: (message) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          ...message,
          id: Date.now().toString(),
          timestamp: new Date(),
        },
      ],
    })),
  clearMessages: () => set({ messages: [] }),
  isStreaming: false,
  setIsStreaming: (streaming) => set({ isStreaming: streaming }),

  // UI
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  chatOpen: true,
  setChatOpen: (open) => set({ chatOpen: open }),
  terminalOpen: false,
  setTerminalOpen: (open) => set({ terminalOpen: open }),
  theme: "dark",
  setTheme: (theme) => set({ theme }),

  // Token usage
  totalTokens: 0,
  addTokenUsage: (usage) =>
    set((state) => ({
      totalTokens: state.totalTokens + usage.totalTokens,
    })),
  resetTokenUsage: () => set({ totalTokens: 0 }),
}));

