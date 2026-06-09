import { unavailableAiInsights } from "@/lib/ai/schema";
import { geminiProvider } from "@/lib/ai/providers/gemini";
import { mockAiProvider } from "@/lib/ai/providers/mock";
import type { AiInsights, AiProviderInput } from "@/lib/types";

export async function generateAiInsights(input: AiProviderInput): Promise<AiInsights> {
  if (!process.env.GEMINI_API_KEY) {
    try {
      return await mockAiProvider.generateInsights(input);
    } catch {
      return unavailableAiInsights("AI insights unavailable. ATS analysis completed successfully.");
    }
  }

  try {
    // Free-tier protection: one request per Gemini model, no repeated retries.
    return await geminiProvider.generateInsights(input);
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Gemini provider failed.";
    console.error("AI provider failed, falling back to mock:", {
      provider: "gemini",
      reason
    });

    try {
      const fallback = await mockAiProvider.generateInsights(input);
      return {
        ...fallback,
        model: fallback.model || "mock",
        message: "AI coaching is temporarily using fallback mode."
      };
    } catch {
      console.error("AI fallback failed:", reason);
      return unavailableAiInsights("AI coaching is temporarily using fallback mode.");
    }
  }
}
