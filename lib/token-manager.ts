import { TokenUsage, LLMRequest, LLMModel } from "@/types";
import { getDefaultModel, getFallbackChain, getModelsByTier } from "./models";

/**
 * Token usage limits and safety thresholds
 */
export const TOKEN_LIMITS = {
  // Hard cap per request
  MAX_TOKENS_PER_REQUEST: 4096,
  // Warning threshold
  WARNING_THRESHOLD: 3072,
  // Safe default
  SAFE_DEFAULT: 2048,
} as const;

/**
 * Token usage tracker
 */
export class TokenManager {
  private static instance: TokenManager;
  private sessionUsage: TokenUsage[] = [];

  private constructor() {}

  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  /**
   * Track token usage for a request
   */
  trackUsage(usage: TokenUsage): void {
    this.sessionUsage.push(usage);
  }

  /**
   * Get total tokens used in this session
   */
  getTotalUsage(): number {
    return this.sessionUsage.reduce((sum, u) => sum + u.totalTokens, 0);
  }

  /**
   * Clear session usage
   */
  clearSession(): void {
    this.sessionUsage = [];
  }

  /**
   * Estimate token count for a string (rough approximation)
   */
  estimateTokens(text: string): number {
    // Rough estimate: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  /**
   * Check if request is within safe limits
   */
  isRequestSafe(request: LLMRequest, contextLength: number = 0): {
    safe: boolean;
    recommendedMaxTokens: number;
    warning?: string;
  } {
    const estimatedPromptTokens = this.estimateTokens(
      request.messages.map((m) => m.content).join(" ")
    );
    const totalEstimated = estimatedPromptTokens + (request.maxTokens || TOKEN_LIMITS.SAFE_DEFAULT);

    if (totalEstimated > TOKEN_LIMITS.MAX_TOKENS_PER_REQUEST) {
      return {
        safe: false,
        recommendedMaxTokens: Math.max(
          TOKEN_LIMITS.MAX_TOKENS_PER_REQUEST - estimatedPromptTokens - 100,
          256
        ),
        warning: `Request exceeds maximum token limit. Reducing max_tokens to ${Math.max(
          TOKEN_LIMITS.MAX_TOKENS_PER_REQUEST - estimatedPromptTokens - 100,
          256
        )}`,
      };
    }

    if (totalEstimated > TOKEN_LIMITS.WARNING_THRESHOLD) {
      return {
        safe: true,
        recommendedMaxTokens: request.maxTokens || TOKEN_LIMITS.SAFE_DEFAULT,
        warning: "Request is approaching token limit. Consider summarizing context.",
      };
    }

    return {
      safe: true,
      recommendedMaxTokens: request.maxTokens || TOKEN_LIMITS.SAFE_DEFAULT,
    };
  }

  /**
   * Select appropriate model based on request complexity
   */
  selectModel(request: LLMRequest, forceTier?: "free" | "mid" | "high"): LLMModel {
    const fallbackChain = getFallbackChain();
    
    if (forceTier) {
      const tierModels = fallbackChain.filter((m) => m.tier === forceTier);
      return tierModels[0] || getDefaultModel();
    }

    const estimatedTokens = this.estimateTokens(
      request.messages.map((m) => m.content).join(" ")
    );

    // For simple requests, use free tier
    if (estimatedTokens < 1000) {
      return getModelsByTier("free")[0] || getDefaultModel();
    }

    // For medium requests, try free first, then mid
    if (estimatedTokens < 3000) {
      return getModelsByTier("free")[0] || getModelsByTier("mid")[0] || getDefaultModel();
    }

    // For complex requests, start with mid tier
    return getModelsByTier("mid")[0] || getModelsByTier("free")[0] || getDefaultModel();
  }
}

