import { normalizeAiInsights } from "@/lib/ai/schema";
import type { AiProvider, AiProviderInput } from "@/lib/types";
import { safeJsonParse } from "@/lib/text";

const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";
export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
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

function truncateForGemini(text: string, limit: number) {
  const normalized = text.trim();
  if (normalized.length <= limit) return normalized;
  return `${normalized.slice(0, limit)}\n\n[Truncated for Gemini request size. Continue using ATS analysis for full document context.]`;
}

export function getGeminiModel() {
  return process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
}

async function callGeminiText(prompt: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const model = getGeminiModel();

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
      throw new Error(`Gemini request failed with status ${response.status}.`);
    }

    const data = (await response.json()) as GeminiResponse;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error("Gemini returned an empty response.");
    }

    return text;
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
  const text = await callGeminiText('Return JSON only: {"status":"ok","message":"Gemini test successful"}');
  const parsed = safeJsonParse<{ status?: string; message?: string }>(text);

  if (!parsed || parsed.status !== "ok") {
    throw new Error("Gemini test returned an invalid response.");
  }

  return {
    model: getGeminiModel(),
    message: parsed.message || "Gemini test successful"
  };
}

export const geminiProvider: AiProvider = {
  name: "gemini",
  async generateInsights(input: AiProviderInput) {
    const text = await callGeminiText(buildPrompt(input));
    const parsed = safeJsonParse<unknown>(text);
    const normalized = normalizeAiInsights(parsed, "gemini");
    if (!normalized) {
      throw new Error("Gemini returned an invalid AI insights schema.");
    }

    return normalized;
  }
};