import { BaseProvider } from "./base";
import { LLMRequest, LLMResponse } from "@/types";
import axios from "axios";

export class OpenRouterProvider extends BaseProvider {
  name = "openrouter";
  private apiKey: string | null = null;

  constructor() {
    super();
    this.apiKey = process.env.OPENROUTER_API_KEY || null;
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }

  async chat(request: LLMRequest): Promise<LLMResponse> {
    if (!this.apiKey) {
      throw new Error("OpenRouter API key not configured");
    }

    const model = request.model || "meta-llama/llama-3.1-70b-instruct:free";
    const maxTokens = Math.min(request.maxTokens || 2048, 8192);

    try {
      const response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model,
          messages: this.formatMessages(request.messages),
          max_tokens: maxTokens,
          temperature: request.temperature || 0.7,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
            "X-Title": "AI Dev Agent",
          },
        }
      );

      const data = response.data;
      const content = data.choices[0]?.message?.content || "";
      const promptText = request.messages.map((m) => m.content).join("\n");

      return {
        content,
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0,
          model: data.model,
          provider: "openrouter",
        },
        model: data.model,
        provider: "openrouter",
        truncated: data.choices[0]?.finish_reason === "length",
      };
    } catch (error: any) {
      throw new Error(`OpenRouter API error: ${error.message}`);
    }
  }
}

