// Core types for the AI Dev Agent

export type LLMProvider = "groq" | "openrouter" | "huggingface";

export type ModelTier = "free" | "mid" | "high";

export interface LLMModel {
  id: string;
  name: string;
  provider: LLMProvider;
  tier: ModelTier;
  maxTokens: number;
  costPer1kTokens?: number;
  free?: boolean;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  model: string;
  provider: LLMProvider;
}

export interface LLMRequest {
  messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }>;
  maxTokens?: number;
  temperature?: number;
  model?: string;
  provider?: LLMProvider;
}

export interface LLMResponse {
  content: string;
  usage: TokenUsage;
  model: string;
  provider: LLMProvider;
  truncated?: boolean;
}

export interface FileNode {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileNode[];
}

export interface EditorState {
  openFiles: Array<{
    path: string;
    content: string;
    language?: string;
  }>;
  activeFile?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  tokenUsage?: TokenUsage;
  images?: string[]; // Base64 encoded images
  generatedMedia?: GeneratedMedia[]; // Generated images/videos
}

export type MediaFormat = "png" | "jpg" | "gif" | "webp" | "mp4" | "glb" | "gltf";

export interface GeneratedMedia {
  url: string;
  format: MediaFormat;
  prompt: string;
  type: "image" | "video" | "3d";
}

