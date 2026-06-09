import type { AiInsights } from "@/lib/types";

const emptyRoleFit = {
  mostSuitableRole: "General Candidate",
  confidence: 50,
  reasoning: "The resume has enough information for general career guidance, but role signals are not yet specific."
};

export function unavailableAiInsights(message: string): AiInsights {
  return {
    status: "unavailable",
    provider: "none",
    model: "none",
    message,
    careerCoachSummary: "AI insights unavailable. ATS analysis completed successfully.",
    roleFit: emptyRoleFit,
    priorityFixes: [],
    rewriteSuggestions: [],
    jdOptimization: null,
    strengths: []
  };
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function normalizeAiInsights(value: unknown, provider: "gemini" | "mock"): AiInsights | null {
  if (!value || typeof value !== "object") return null;
  const source = value as Partial<AiInsights>;

  if (
    typeof source.careerCoachSummary !== "string" ||
    !source.roleFit ||
    !Array.isArray(source.priorityFixes) ||
    !Array.isArray(source.rewriteSuggestions)
  ) {
    return null;
  }

  return {
    status: "available",
    provider,
    model: typeof source.model === "string" ? source.model : undefined,
    careerCoachSummary: source.careerCoachSummary,
    roleFit: {
      mostSuitableRole:
        typeof source.roleFit.mostSuitableRole === "string"
          ? source.roleFit.mostSuitableRole
          : emptyRoleFit.mostSuitableRole,
      confidence:
        typeof source.roleFit.confidence === "number"
          ? Math.max(1, Math.min(100, Math.round(source.roleFit.confidence)))
          : emptyRoleFit.confidence,
      reasoning:
        typeof source.roleFit.reasoning === "string"
          ? source.roleFit.reasoning
          : emptyRoleFit.reasoning
    },
    priorityFixes: source.priorityFixes
      .filter((item) => item && typeof item === "object")
      .slice(0, 3)
      .map((item) => {
        const fix = item as Record<string, unknown>;
        return {
          title: String(fix.title || "Priority Fix"),
          issue: String(fix.issue || "Improve resume clarity."),
          reason: String(fix.reason || "Recruiters need fast evidence of fit."),
          expectedImpact: String(fix.expectedImpact || "Improves scanability and confidence.")
        };
      }),
    rewriteSuggestions: source.rewriteSuggestions
      .filter((item) => item && typeof item === "object")
      .slice(0, 3)
      .map((item) => {
        const rewrite = item as Record<string, unknown>;
        return {
          section: String(rewrite.section || "Professional Summary") as AiInsights["rewriteSuggestions"][number]["section"],
          current: String(rewrite.current || "Current wording not clearly detected."),
          suggested: String(rewrite.suggested || "Add a clearer, impact-focused version."),
          rationale: String(rewrite.rationale || "The revised wording is more specific and recruiter-friendly.")
        };
      }),
    jdOptimization: source.jdOptimization
      ? {
          mustHaveSkills: stringArray(source.jdOptimization.mustHaveSkills),
          preferredSkills: stringArray(source.jdOptimization.preferredSkills),
          responsibilities: stringArray(source.jdOptimization.responsibilities),
          missingSkills: stringArray(source.jdOptimization.missingSkills),
          experienceGaps: stringArray(source.jdOptimization.experienceGaps),
          optimizationSuggestions: stringArray(source.jdOptimization.optimizationSuggestions)
        }
      : null,
    strengths: stringArray(source.strengths)
  };
}
