import { NextRequest, NextResponse } from "next/server";
import { getLLMRouter } from "@/lib/llm/router";
import { LLMRequest } from "@/types";
import { TokenManager } from "@/lib/token-manager";

// Rate limiting (simple in-memory, use Redis in production)
const requestCounts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30; // requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = requestCounts.get(ip);

  if (!record || now > record.resetAt) {
    requestCounts.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { messages, maxTokens, temperature, model, provider } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    // Create LLM request
    const llmRequest: LLMRequest = {
      messages,
      maxTokens: maxTokens ? Math.min(maxTokens, 4096) : undefined,
      temperature: temperature || 0.7,
      model,
      provider,
    };

    // Safety check
    const tokenManager = TokenManager.getInstance();
    const safetyCheck = tokenManager.isRequestSafe(llmRequest);

    if (!safetyCheck.safe) {
      llmRequest.maxTokens = safetyCheck.recommendedMaxTokens;
    }

    // Route request
    const router = getLLMRouter();
    const response = await router.route(llmRequest);

    return NextResponse.json({
      content: response.content,
      usage: response.usage,
      model: response.model,
      provider: response.provider,
      truncated: response.truncated,
      warning: safetyCheck.warning,
    });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      {
        error: error.message || "An error occurred while processing your request",
      },
      { status: 500 }
    );
  }
}

