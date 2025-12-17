import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

// Rate limiting
const requestCounts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10; // requests per minute for image generation
const RATE_WINDOW = 60 * 1000;

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
    const { prompt, format = "png", size = "1024x1024" } = body;

    if (!prompt || !prompt.trim()) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Determine media type based on format
    let mediaType: "image" | "video" | "3d" = "image";
    if (format === "mp4") {
      mediaType = "video";
    } else if (format === "glb" || format === "gltf") {
      mediaType = "3d";
    }

    // Use OpenRouter for image generation (supports multiple models)
    const openRouterKey = process.env.OPENROUTER_API_KEY || process.env.AI_API_KEY;
    
    if (!openRouterKey) {
      // Fallback: Use a free image generation API or return placeholder
      return NextResponse.json({
        url: `https://via.placeholder.com/${size}?text=${encodeURIComponent(prompt)}`,
        format: format as any,
        prompt,
        type: mediaType,
        note: "Image generation API key not configured. Using placeholder.",
      });
    }

    try {
      // Try using OpenRouter with image generation models
      // For now, we'll use a simple approach with Replicate or similar
      // In production, you'd use: stability-ai, dall-e, midjourney, etc.
      
      // For GIF generation, use a different approach
      if (format === "gif") {
        // Use a GIF generation service or create animated GIF
        return NextResponse.json({
          url: `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(prompt)}`,
          format: "gif",
          prompt,
          type: "image",
          note: "GIF generation - using placeholder service",
        });
      }

      // For MP4 video
      if (format === "mp4") {
        return NextResponse.json({
          url: `https://via.placeholder.com/${size}/000000/FFFFFF?text=${encodeURIComponent(prompt)}`,
          format: "mp4",
          prompt,
          type: "video",
          note: "Video generation - placeholder (integrate with video generation API)",
        });
      }

      // For 3D models
      if (format === "glb" || format === "gltf") {
        return NextResponse.json({
          url: `https://via.placeholder.com/${size}/000000/FFFFFF?text=${encodeURIComponent(prompt)}`,
          format: format as any,
          prompt,
          type: "3d",
          note: "3D model generation - placeholder (integrate with 3D generation API)",
        });
      }

      // For regular images (PNG, JPG, WEBP)
      // Use OpenRouter with image generation models
      const response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model: "black-forest-labs/flux-pro",
          messages: [
            {
              role: "user",
              content: `Generate an image: ${prompt}. Format: ${format}, Size: ${size}`,
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${openRouterKey}`,
            "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
            "X-Title": "AI Dev Agent",
          },
        }
      );

      // If OpenRouter returns image data, use it
      // Otherwise, use a placeholder or different service
      const imageUrl = response.data?.choices?.[0]?.message?.content || 
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(prompt)}`;

      return NextResponse.json({
        url: imageUrl,
        format: format as any,
        prompt,
        type: mediaType,
      });
    } catch (error: any) {
      console.error("Image generation error:", error);
      
      // Fallback to placeholder
      return NextResponse.json({
        url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(prompt)}`,
        format: format as any,
        prompt,
        type: mediaType,
        note: "Using fallback image generation service",
      });
    }
  } catch (error: any) {
    console.error("Generate API error:", error);
    return NextResponse.json(
      {
        error: error.message || "An error occurred while generating media",
      },
      { status: 500 }
    );
  }
}

