import { LLMModel, ModelTier } from "@/types";

/**
 * Model registry with cost and capability information
 * Ordered by cost (free -> low -> high)
 */
export const MODELS: LLMModel[] = [
  // Free tier models
  {
    id: "meta-llama/llama-3.1-70b-instruct:free",
    name: "Llama 3.1 70B (Free)",
    provider: "openrouter",
    tier: "free",
    maxTokens: 8192,
    free: true,
  },
  {
    id: "llama-3.1-8b-instant",
    name: "Llama 3.1 8B Instant",
    provider: "groq",
    tier: "free",
    maxTokens: 8192,
    free: true,
  },
  {
    id: "gemma-7b-it",
    name: "Gemma 7B IT",
    provider: "groq",
    tier: "free",
    maxTokens: 8192,
    free: true,
  },
  // Mid tier models
  {
    id: "llama-3.1-70b-instruct",
    name: "Llama 3.1 70B Instruct",
    provider: "groq",
    tier: "mid",
    maxTokens: 8192,
    costPer1kTokens: 0.0001,
  },
  {
    id: "mixtral-8x7b-32768",
    name: "Mixtral 8x7B",
    provider: "groq",
    tier: "mid",
    maxTokens: 32768,
    costPer1kTokens: 0.0002,
  },
  // High tier models (use sparingly)
  {
    id: "meta-llama/Meta-Llama-3-70B-Instruct",
    name: "Meta Llama 3 70B Instruct",
    provider: "openrouter",
    tier: "high",
    maxTokens: 8192,
    costPer1kTokens: 0.0005,
  },
];

/**
 * Get models by tier
 */
export function getModelsByTier(tier: ModelTier): LLMModel[] {
  return MODELS.filter((m) => m.tier === tier);
}

/**
 * Get default model (always free tier)
 */
export function getDefaultModel(): LLMModel {
  return MODELS.find((m) => m.tier === "free") || MODELS[0];
}

/**
 * Get fallback model chain (free -> mid -> high)
 */
export function getFallbackChain(): LLMModel[] {
  return [
    ...getModelsByTier("free"),
    ...getModelsByTier("mid"),
    ...getModelsByTier("high"),
  ];
}

/**
 * Find model by ID
 */
export function findModel(modelId: string): LLMModel | undefined {
  return MODELS.find((m) => m.id === modelId);
}

