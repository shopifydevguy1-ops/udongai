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

    // Check which providers are available first
    const availableProviders: string[] = [];
    const unavailableProviders: Array<{ provider: string; reason: string }> = [];
    
    for (const [name, provider] of this.providers.entries()) {
      try {
        const isAvailable = await provider.isAvailable();
        if (isAvailable) {
          availableProviders.push(name);
        } else {
          unavailableProviders.push({ 
            provider: name, 
            reason: `API key not configured` 
          });
        }
      } catch (error: any) {
        unavailableProviders.push({ 
          provider: name, 
          reason: error.message || "Unknown error" 
        });
      }
    }

    if (availableProviders.length === 0) {
      const missingKeys = unavailableProviders
        .map(p => `${p.provider.toUpperCase()}_API_KEY`)
        .join(", ");
      throw new Error(
        `No LLM providers are configured. Please set at least one API key: ${missingKeys}`
      );
    }

    // Try providers in order
    const errors: Array<{ model: string; provider: string; error: string }> = [];
    
    for (const fallbackModel of fallbackChain) {
      try {
        const provider = this.providers.get(fallbackModel.provider);
        if (!provider) {
          continue;
        }

        // Check if provider is available
        if (!(await provider.isAvailable())) {
          errors.push({
            model: fallbackModel.id,
            provider: fallbackModel.provider,
            error: "API key not configured"
          });
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
        errors.push({
          model: fallbackModel.id,
          provider: fallbackModel.provider,
          error: error.message || "Unknown error"
        });
        continue;
      }
    }

    // All providers failed - provide detailed error message
    const errorDetails = errors
      .slice(0, 3) // Show first 3 errors
      .map(e => `${e.provider}/${e.model}: ${e.error}`)
      .join("; ");
    
    throw new Error(
      `All LLM providers failed. Errors: ${errorDetails}${errors.length > 3 ? ` (and ${errors.length - 3} more)` : ""}. ` +
      `Please check your API keys in Vercel environment variables.`
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

