import { safeJsonParse } from "@/lib/text";
import type { ResumeRewriteResult, ResumeRewriteSection } from "@/lib/types";
import { DEFAULT_GEMINI_MODELS, GeminiRequestError } from "@/lib/ai/providers/gemini";

const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";
const TIMEOUT_MS = 12000;
const RESUME_CHAR_LIMIT = 7000;
const JD_CHAR_LIMIT = 3500;

type RewriteSource = Partial<Omit<ResumeRewriteResult, "status" | "provider">>;
type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

function truncate(text: string, limit: number) {
  const normalized = text.trim();
  if (normalized.length <= limit) return normalized;
  return `${normalized.slice(0, limit)}\n\n[Truncated for rewrite request size.]`;
}

function configuredModels() {
  const configured = process.env.GEMINI_MODEL_PRIORITY?.split(",")
    .map((model) => model.trim())
    .filter(Boolean);

  return configured && configured.length > 0 ? configured : [...DEFAULT_GEMINI_MODELS];
}

async function callGemini(prompt: string, model: string, apiKey: string) {
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
          temperature: 0.25,
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Resume rewriter model failed:", {
        model,
        status: response.status,
        body: errorText
      });
      throw new GeminiRequestError(`Gemini rewrite failed with status ${response.status}`, response.status);
    }

    const data = (await response.json()) as GeminiResponse;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new GeminiRequestError("Gemini rewrite returned an empty response.");

    return text;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new GeminiRequestError("Gemini rewrite request timed out.");
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function normalizeSections(value: unknown): ResumeRewriteSection[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item) => item && typeof item === "object")
    .slice(0, 4)
    .map((item) => {
      const section = item as Record<string, unknown>;
      return {
        section: String(section.section || "Summary") as ResumeRewriteSection["section"],
        current: String(section.current || "Current wording not clearly detected."),
        improved: String(section.improved || "Rewrite this section with clearer impact and role alignment."),
        rationale: String(section.rationale || "The improved wording is clearer and more ATS-friendly.")
      };
    });
}

function normalizeRewrite(value: unknown, provider: "gemini" | "mock", model?: string): ResumeRewriteResult | null {
  if (!value || typeof value !== "object") return null;
  const source = value as RewriteSource;

  if (typeof source.improvedResume !== "string") return null;

  return {
    status: "available",
    provider,
    model,
    improvedResume: source.improvedResume,
    atsOptimizedContent: stringArray(source.atsOptimizedContent),
    sectionRewrites: normalizeSections(source.sectionRewrites),
    missingKeywords: stringArray(source.missingKeywords),
    betterResumeBullets: stringArray(source.betterResumeBullets),
    atsImprovements: stringArray(source.atsImprovements),
    aiSuggestions: stringArray(source.aiSuggestions)
  };
}

function buildRewritePrompt(resumeText: string, jobDescription: string) {
  return `
You are an expert resume rewriter. Return JSON only. Do not include markdown.

Schema:
{
  "improvedResume": "string",
  "atsOptimizedContent": ["string"],
  "sectionRewrites": [
    { "section": "Summary", "current": "string", "improved": "string", "rationale": "string" },
    { "section": "Experience", "current": "string", "improved": "string", "rationale": "string" },
    { "section": "Projects", "current": "string", "improved": "string", "rationale": "string" },
    { "section": "Skills", "current": "string", "improved": "string", "rationale": "string" }
  ],
  "missingKeywords": ["string"],
  "betterResumeBullets": ["string"],
  "atsImprovements": ["string"],
  "aiSuggestions": ["string"]
}

Rules:
- Improve clarity, ATS alignment, specificity, and measurable impact.
- Rewrite Summary, Experience, Projects, and Skills.
- Include missing keywords from the job description.
- Create better resume bullets but do not invent employers, degrees, certifications, dates, or tools.
- If exact metrics are missing, use truthful placeholders like "[add metric]" instead of fabricating numbers.

Resume:
${truncate(resumeText, RESUME_CHAR_LIMIT)}

Job Description:
${jobDescription ? truncate(jobDescription, JD_CHAR_LIMIT) : "No job description provided."}
`;
}

function mockRewrite(jobDescription: string): ResumeRewriteResult {
  const hasJd = Boolean(jobDescription.trim());

  return {
    status: "available",
    provider: "mock",
    model: "mock",
    message: "AI rewriter is temporarily using fallback mode.",
    improvedResume:
      "Professional Summary\nAnalytical professional with experience translating information into clear decisions, practical improvements, and measurable outcomes. Skilled in communication, research, reporting, and cross-functional execution.\n\nExperience\n- Rewrote role bullets to start with action, show ownership, and end with measurable impact.\n- Added clearer context around tools, stakeholders, and outcomes where supported by the original resume.\n\nProjects\n- Framed projects around problem, approach, result, and business value.\n\nSkills\n- Organized skills into role-relevant groups for easier ATS parsing.",
    atsOptimizedContent: [
      "Use standard section headings: Summary, Skills, Experience, Projects, Education.",
      "Mirror job description language naturally where it is truthful.",
      "Prioritize measurable outcomes and tools used."
    ],
    sectionRewrites: [
      {
        section: "Summary",
        current: "General summary.",
        improved:
          "Analytical professional skilled in research, reporting, and stakeholder communication, with experience turning complex information into practical decisions.",
        rationale: "A sharper summary gives recruiters role fit in the first few seconds."
      },
      {
        section: "Experience",
        current: "Task-focused bullets.",
        improved:
          "Analyzed [process/data/customer need], coordinated with [stakeholders], and delivered [outcome] that improved [metric or business result].",
        rationale: "This structure adds action, ownership, and measurable value."
      },
      {
        section: "Projects",
        current: "Basic project description.",
        improved:
          "Built [project] to solve [problem], using [tools/methods] to produce [deliverable] and support [decision/outcome].",
        rationale: "This connects project work to business usefulness."
      },
      {
        section: "Skills",
        current: "Unstructured skills list.",
        improved:
          "Group skills by category, such as Analytics, Tools, Communication, and Domain Knowledge.",
        rationale: "Grouped skills are easier for ATS systems and recruiters to scan."
      }
    ],
    missingKeywords: hasJd ? ["Add truthful JD-specific keywords from the target role."] : [],
    betterResumeBullets: [
      "Improved [workflow/process] by [action], resulting in [measurable outcome].",
      "Analyzed [data/source] to identify [insight] and recommend [action].",
      "Collaborated with [team/stakeholders] to deliver [project/result] within [timeframe]."
    ],
    atsImprovements: [
      "Add role keywords to Summary, Skills, and Experience.",
      "Use consistent bullet formatting.",
      "Include tools and outcomes where supported by the resume."
    ],
    aiSuggestions: [
      "Keep every rewrite truthful to the original resume.",
      "Replace placeholders with real metrics before using the rewritten resume.",
      "Tailor the final version to one job description at a time."
    ]
  };
}

export async function generateResumeRewrite(input: {
  resumeText: string;
  jobDescription: string;
}): Promise<ResumeRewriteResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return mockRewrite(input.jobDescription);

  const prompt = buildRewritePrompt(input.resumeText, input.jobDescription);
  let lastError: Error | undefined;

  for (const model of configuredModels()) {
    try {
      const text = await callGemini(prompt, model, apiKey);
      const parsed = safeJsonParse<unknown>(text);
      const normalized = normalizeRewrite(parsed, "gemini", model);
      if (!normalized) throw new GeminiRequestError("Gemini rewrite returned an invalid schema.");
      return normalized;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error("Resume rewriter model failed, trying next model if available:", {
        model,
        reason: lastError.message
      });
    }
  }

  console.error("Resume rewriter fallback used:", lastError?.message || "All models failed.");
  return mockRewrite(input.jobDescription);
}

