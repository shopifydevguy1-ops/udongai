import { LLMRequest, LLMResponse, TokenUsage } from "@/types";

/**
 * Base provider interface
 */
export interface LLMProvider {
  name: string;
  chat(request: LLMRequest): Promise<LLMResponse>;
  isAvailable(): Promise<boolean>;
}

/**
 * Base provider implementation
 */
export abstract class BaseProvider implements LLMProvider {
  abstract name: string;

  abstract chat(request: LLMRequest): Promise<LLMResponse>;

  abstract isAvailable(): Promise<boolean>;

  /**
   * Format messages for provider
   */
  protected formatMessages(
    messages: LLMRequest["messages"]
  ): Array<{ role: string; content: string }> {
    return messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));
  }

  /**
   * Calculate token usage (rough estimate)
   */
  protected estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Create token usage object
   */
  protected createTokenUsage(
    prompt: string,
    completion: string,
    model: string,
    provider: string
  ): TokenUsage {
    return {
      promptTokens: this.estimateTokens(prompt),
      completionTokens: this.estimateTokens(completion),
      totalTokens: this.estimateTokens(prompt) + this.estimateTokens(completion),
      model,
      provider: provider as any,
    };
  }
}

