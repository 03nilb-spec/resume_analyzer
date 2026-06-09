import { normalizeAiInsights } from "@/lib/ai/schema";
import type { AiProvider, AiProviderInput } from "@/lib/types";
import { safeJsonParse } from "@/lib/text";

const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_MODEL = "gemini-2.5-flash";
const TIMEOUT_MS = 12000;

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

function buildPrompt({ resumeText, jobDescription, ats }: AiProviderInput) {
  return `
You are an expert resume coach. Return JSON only. Do not include markdown.

Schema:
{
  "careerCoachSummary": "string",
  "roleFit": { "mostSuitableRole": "string", "confidence": number, "reasoning": "string" },
  "priorityFixes": [
    { "title": "Priority Fix #1", "issue": "string", "reason": "string", "expectedImpact": "string" }
  ],
  "rewriteSuggestions": [
    { "section": "Professional Summary", "current": "string", "suggested": "string", "rationale": "string" },
    { "section": "Experience Section", "current": "string", "suggested": "string", "rationale": "string" },
    { "section": "Project Descriptions", "current": "string", "suggested": "string", "rationale": "string" }
  ],
  "jdOptimization": {
    "mustHaveSkills": ["string"],
    "preferredSkills": ["string"],
    "responsibilities": ["string"],
    "missingSkills": ["string"],
    "experienceGaps": ["string"],
    "optimizationSuggestions": ["string"]
  } | null,
  "strengths": ["string"]
}

Rules:
- Keep ATS scores unchanged.
- Be positive but direct.
- Return exactly 3 priorityFixes.
- Return exactly 3 rewriteSuggestions.
- If no job description exists, set jdOptimization to null.
- Never invent certifications, employers, degrees, or tools not supported by the text.

ATS:
${JSON.stringify({
  score: ats.score,
  breakdown: ats.breakdown,
  matchedSkills: ats.matchedSkills,
  missingSkills: ats.missingSkills,
  formattingWarnings: ats.formattingWarnings,
  strengths: ats.strengths
})}

Resume:
${resumeText.slice(0, 12000)}

Job Description:
${jobDescription ? jobDescription.slice(0, 7000) : "No job description provided."}
`;
}

export const geminiProvider: AiProvider = {
  name: "gemini",
  async generateInsights(input: AiProviderInput) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }

    const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(`${GEMINI_ENDPOINT}/${model}:generateContent`, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: buildPrompt(input) }]
            }
          ],
          generationConfig: {
            temperature: 0.25,
            responseMimeType: "application/json"
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini request failed with status ${response.status}.`);
      }

      const data = (await response.json()) as GeminiResponse;
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error("Gemini returned an empty response.");
      }

      const parsed = safeJsonParse<unknown>(text);
      const normalized = normalizeAiInsights(parsed, "gemini");
      if (!normalized) {
        throw new Error("Gemini returned an invalid AI insights schema.");
      }

      return normalized;
    } finally {
      clearTimeout(timeout);
    }
  }
};
