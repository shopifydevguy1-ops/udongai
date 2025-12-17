import { BaseProvider } from "./base";
import { LLMRequest, LLMResponse } from "@/types";
import axios from "axios";

export class HuggingFaceProvider extends BaseProvider {
  name = "huggingface";
  private apiKey: string | null = null;

  constructor() {
    super();
    this.apiKey = process.env.HUGGINGFACE_API_KEY || null;
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }

  async chat(request: LLMRequest): Promise<LLMResponse> {
    if (!this.apiKey) {
      throw new Error("HuggingFace API key not configured");
    }

    // HuggingFace Inference API endpoint
    const model = request.model || "meta-llama/Llama-3.1-70B-Instruct";
    const maxTokens = Math.min(request.maxTokens || 2048, 4096);

    try {
      // Format messages for HuggingFace
      const prompt = this.formatPromptForHF(request.messages);
      
      const response = await axios.post(
        `https://api-inference.huggingface.co/models/${model}`,
        {
          inputs: prompt,
          parameters: {
            max_new_tokens: maxTokens,
            temperature: request.temperature || 0.7,
            return_full_text: false,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      const content = Array.isArray(response.data)
        ? response.data[0]?.generated_text || ""
        : response.data?.generated_text || "";

      const promptText = request.messages.map((m) => m.content).join("\n");

      return {
        content,
        usage: this.createTokenUsage(promptText, content, model, "huggingface"),
        model,
        provider: "huggingface",
      };
    } catch (error: any) {
      throw new Error(`HuggingFace API error: ${error.message}`);
    }
  }

  /**
   * Format messages for HuggingFace (simplified prompt format)
   */
  private formatPromptForHF(
    messages: LLMRequest["messages"]
  ): string {
    return messages
      .map((msg) => {
        if (msg.role === "system") {
          return `System: ${msg.content}`;
        } else if (msg.role === "user") {
          return `User: ${msg.content}`;
        } else {
          return `Assistant: ${msg.content}`;
        }
      })
      .join("\n\n") + "\n\nAssistant:";
  }
}

