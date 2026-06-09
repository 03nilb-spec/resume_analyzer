import { NextResponse } from "next/server";
import { getGeminiModel, testGeminiPrompt } from "@/lib/ai/providers/gemini";

export const runtime = "nodejs";

export async function GET() {
  try {
    const result = await testGeminiPrompt();
    return NextResponse.json({
      ok: true,
      provider: "gemini",
      model: result.model,
      message: result.message
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        provider: "gemini",
        model: getGeminiModel(),
        error: error instanceof Error ? error.message : "Gemini test failed."
      },
      { status: 502 }
    );
  }
}