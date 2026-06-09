import { unavailableAiInsights } from "@/lib/ai/schema";
import { geminiProvider } from "@/lib/ai/providers/gemini";
import { mockAiProvider } from "@/lib/ai/providers/mock";
import type { AiInsights, AiProviderInput } from "@/lib/types";

export async function generateAiInsights(input: AiProviderInput): Promise<AiInsights> {
  const provider = process.env.GEMINI_API_KEY ? geminiProvider : mockAiProvider;

  try {
    return await provider.generateInsights(input);
  } catch (error) {
    const reason = error instanceof Error ? error.message : "AI provider failed.";
    return unavailableAiInsights(`AI insights unavailable. ATS analysis completed successfully. ${reason}`);
  }
}
