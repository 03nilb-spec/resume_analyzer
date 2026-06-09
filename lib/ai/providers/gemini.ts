import { normalizeAiInsights } from "@/lib/ai/schema";
import type { AiProvider, AiProviderInput } from "@/lib/types";
import { safeJsonParse } from "@/lib/text";

const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";
export const DEFAULT_GEMINI_MODELS = [
  "gemma-4-26b-a4b-it",
  "gemma-4-31b-it",
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash"
] as const;
export const DEFAULT_GEMINI_MODEL = DEFAULT_GEMINI_MODELS[0];
const TIMEOUT_MS = 12000;
const RESUME_CHAR_LIMIT = 6500;
const JD_CHAR_LIMIT = 3000;

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

export class GeminiRequestError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "GeminiRequestError";
    this.status = status;
  }
}

function truncateForGemini(text: string, limit: number) {
  const normalized = text.trim();
  if (normalized.length <= limit) return normalized;
  return `${normalized.slice(0, limit)}\n\n[Truncated for Gemini request size. Continue using ATS analysis for full document context.]`;
}

export function getGeminiModel() {
  return getGeminiModels()[0] || DEFAULT_GEMINI_MODEL;
}

export function getGeminiModelLabel() {
  return getGeminiModels().join(" -> ");
}

function getGeminiModels() {
  const configured = process.env.GEMINI_MODEL_PRIORITY?.split(",")
    .map((model) => model.trim())
    .filter(Boolean);

  return configured && configured.length > 0 ? configured : [...DEFAULT_GEMINI_MODELS];
}

async function callGeminiModel(prompt: string, model: string, apiKey: string) {
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
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();

      console.error("Gemini error:", {
        status: response.status,
        model,
        body: errorText
      });

      throw new GeminiRequestError(
        `Gemini request failed with status ${response.status}: ${errorText}`,
        response.status
      );
    }

    const data = (await response.json()) as GeminiResponse;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new GeminiRequestError("Gemini returned an empty response.");
    }

    return text;
  } catch (error) {
    if (error instanceof GeminiRequestError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new GeminiRequestError("Gemini request timed out.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function buildPrompt({ resumeText, jobDescription, ats }: AiProviderInput) {
  const truncatedResume = truncateForGemini(resumeText, RESUME_CHAR_LIMIT);
  const truncatedJd = jobDescription
    ? truncateForGemini(jobDescription, JD_CHAR_LIMIT)
    : "No job description provided.";

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
${truncatedResume}

Job Description:
${truncatedJd}
`;
}

export async function testGeminiPrompt() {
  const result = await callGeminiJson<{ status?: string; message?: string }>(
    'Return JSON only: {"status":"ok","message":"Gemini test successful"}'
  );

  if (result.parsed.status !== "ok") {
    throw new GeminiRequestError("Gemini test returned an invalid response.");
  }

  return {
    model: result.model,
    message: result.parsed.message || "Gemini test successful"
  };
}

async function callGeminiJson<T>(prompt: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new GeminiRequestError("GEMINI_API_KEY is not configured.");
  }

  let lastError: Error | undefined;

  for (const model of getGeminiModels()) {
    try {
      const text = await callGeminiModel(prompt, model, apiKey);
      const parsed = safeJsonParse<T>(text);
      if (!parsed) {
        throw new GeminiRequestError("Gemini returned invalid JSON.");
      }

      return { model, parsed };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error("Gemini model failed, trying next model if available:", {
        model,
        error: lastError.message
      });
    }
  }

  throw lastError || new GeminiRequestError("All Gemini models are unavailable.");
}

export const geminiProvider: AiProvider = {
  name: "gemini",
  async generateInsights(input: AiProviderInput) {
    const prompt = buildPrompt(input);
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new GeminiRequestError("GEMINI_API_KEY is not configured.");
    }

    let lastError: Error | undefined;

    for (const model of getGeminiModels()) {
      try {
        const text = await callGeminiModel(prompt, model, apiKey);
        const parsed = safeJsonParse<unknown>(text);
        if (!parsed) {
          throw new GeminiRequestError("Gemini returned invalid JSON.");
        }

        const normalized = normalizeAiInsights(parsed, "gemini");
        if (!normalized) {
          throw new GeminiRequestError("Gemini returned an invalid AI insights schema.");
        }

        return normalized;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error("Gemini model failed, trying next model if available:", {
          model,
          error: lastError.message
        });
      }
    }

    throw lastError || new GeminiRequestError("All Gemini models are unavailable.");
  }
};
