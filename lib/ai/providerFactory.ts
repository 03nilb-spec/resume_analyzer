import { unavailableAiInsights } from "@/lib/ai/schema";
import { GeminiRequestError, geminiProvider } from "@/lib/ai/providers/gemini";
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
    // Free-tier protection: one Gemini request per analysis, no retries.
    return await geminiProvider.generateInsights(input);
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Gemini provider failed.";
    const isRateLimited = error instanceof GeminiRequestError && error.status === 429;

    try {
      const fallback = await mockAiProvider.generateInsights(input);
      return {
        ...fallback,
        message: isRateLimited
          ? "Gemini free-tier rate limit reached. Local ATS analysis and fallback coaching are shown."
          : `Gemini is temporarily unavailable, so fallback coaching is shown. ${reason}`
      };
    } catch {
      return unavailableAiInsights(`AI insights unavailable. ATS analysis completed successfully. ${reason}`);
    }
  }
}