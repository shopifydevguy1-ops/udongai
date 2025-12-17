import { BaseProvider } from "./base";
import { LLMRequest, LLMResponse } from "@/types";
import Groq from "groq-sdk";

export class GroqProvider extends BaseProvider {
  name = "groq";
  private client: Groq | null = null;

  constructor() {
    super();
    if (process.env.GROQ_API_KEY) {
      this.client = new Groq({
        apiKey: process.env.GROQ_API_KEY,
      });
    }
  }

  async isAvailable(): Promise<boolean> {
    return !!this.client && !!process.env.GROQ_API_KEY;
  }

  async chat(request: LLMRequest): Promise<LLMResponse> {
    if (!this.client) {
      throw new Error("Groq API key not configured");
    }

    const model = request.model || "llama-3.1-8b-instant";
    const maxTokens = Math.min(request.maxTokens || 2048, 8192);

    try {
      const completion = await this.client.chat.completions.create({
        model,
        messages: this.formatMessages(request.messages),
        max_tokens: maxTokens,
        temperature: request.temperature || 0.7,
      });

      const content = completion.choices[0]?.message?.content || "";
      const promptText = request.messages.map((m) => m.content).join("\n");

      return {
        content,
        usage: {
          promptTokens: completion.usage?.prompt_tokens || 0,
          completionTokens: completion.usage?.completion_tokens || 0,
          totalTokens: completion.usage?.total_tokens || 0,
          model: completion.model,
          provider: "groq",
        },
        model: completion.model,
        provider: "groq",
        truncated: completion.choices[0]?.finish_reason === "length",
      };
    } catch (error: any) {
      throw new Error(`Groq API error: ${error.message}`);
    }
  }
}

