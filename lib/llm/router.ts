import { LLMRequest, LLMResponse, LLMProvider } from "@/types";
import { GroqProvider } from "./providers/groq";
import { OpenRouterProvider } from "./providers/openrouter";
import { HuggingFaceProvider } from "./providers/huggingface";
import { TokenManager } from "../token-manager";
import { findModel, getDefaultModel, getFallbackChain } from "../models";

/**
 * LLM Router with automatic fallback and cost optimization
 */
export class LLMRouter {
  private providers: Map<string, any> = new Map();
  private tokenManager = TokenManager.getInstance();

  constructor() {
    // Initialize providers
    this.providers.set("groq", new GroqProvider());
    this.providers.set("openrouter", new OpenRouterProvider());
    this.providers.set("huggingface", new HuggingFaceProvider());
  }

  /**
   * Route request with automatic fallback
   */
  async route(request: LLMRequest): Promise<LLMResponse> {
    // Safety check
    const safetyCheck = this.tokenManager.isRequestSafe(request);
    if (!safetyCheck.safe) {
      // Adjust request to be safe
      request.maxTokens = safetyCheck.recommendedMaxTokens;
      console.warn(safetyCheck.warning);
    }

    // Select model if not specified
    if (!request.model) {
      const selectedModel = this.tokenManager.selectModel(request);
      request.model = selectedModel.id;
      request.provider = selectedModel.provider;
    }

    // Get fallback chain
    const model = findModel(request.model || "") || getDefaultModel();
    const fallbackChain = this.getFallbackChainForModel(model);

    // Try providers in order
    let lastError: Error | null = null;
    for (const fallbackModel of fallbackChain) {
      try {
        const provider = this.providers.get(fallbackModel.provider);
        if (!provider) {
          continue;
        }

        // Check if provider is available
        if (!(await provider.isAvailable())) {
          console.warn(`Provider ${fallbackModel.provider} not available, trying next...`);
          continue;
        }

        // Make request with fallback model
        const requestWithModel = {
          ...request,
          model: fallbackModel.id,
          provider: fallbackModel.provider,
        };

        const response = await provider.chat(requestWithModel);

        // Track usage
        this.tokenManager.trackUsage(response.usage);

        // Log warning if truncated
        if (response.truncated) {
          console.warn(`Response truncated for model ${fallbackModel.id}. Consider using a larger model.`);
        }

        return response;
      } catch (error: any) {
        lastError = error;
        console.warn(`Failed with model ${fallbackModel.id}: ${error.message}`);
        continue;
      }
    }

    // All providers failed
    throw new Error(
      `All providers failed. Last error: ${lastError?.message || "Unknown error"}`
    );
  }

  /**
   * Get fallback chain starting from a specific model
   */
  private getFallbackChainForModel(model: any): any[] {
    const allModels = getFallbackChain();
    const modelIndex = allModels.findIndex((m) => m.id === model.id);

    if (modelIndex === -1) {
      return [getDefaultModel()];
    }

    // Return chain starting from current model, then free -> mid -> high
    const chain = [model];
    const remaining = allModels.slice(modelIndex + 1);
    
    // Add free models first, then mid, then high
    const freeModels = remaining.filter((m) => m.tier === "free");
    const midModels = remaining.filter((m) => m.tier === "mid");
    const highModels = remaining.filter((m) => m.tier === "high");

    return [...chain, ...freeModels, ...midModels, ...highModels];
  }
}

// Singleton instance
let routerInstance: LLMRouter | null = null;

export function getLLMRouter(): LLMRouter {
  if (!routerInstance) {
    routerInstance = new LLMRouter();
  }
  return routerInstance;
}

