import type { AiInsights, AiProvider, AiProviderInput } from "@/lib/types";

export const mockAiProvider: AiProvider = {
  name: "mock",
  async generateInsights({ ats, jobDescription }: AiProviderInput): Promise<AiInsights> {
    const topMissing = ats.missingSkills.slice(0, 4);

    return {
      status: "available",
      provider: "mock",
      model: "mock",
      careerCoachSummary:
        "Your resume has a workable ATS foundation. The next improvement is making achievements more measurable and aligning the opening summary with the target role.",
      roleFit: {
        mostSuitableRole: topMissing.some((skill) => skill.includes("sql") || skill.includes("dashboard"))
          ? "Data Analyst"
          : "Business or Operations Analyst",
        confidence: Math.max(55, Math.min(88, ats.score + 12)),
        reasoning:
          "The recommendation is based on detected skills, project/experience structure, and the current ATS score."
      },
      priorityFixes: [
        {
          title: "Priority Fix #1",
          issue: "Add quantified results.",
          reason: "Several bullets describe activity but not measurable outcomes.",
          expectedImpact: "Could improve recruiter confidence and experience relevance."
        },
        {
          title: "Priority Fix #2",
          issue: topMissing.length > 0 ? `Address missing JD terms: ${topMissing.join(", ")}.` : "Strengthen role keywords.",
          reason: "The resume should echo important requirements naturally and truthfully.",
          expectedImpact: "Can improve keyword matching and role-fit clarity."
        },
        {
          title: "Priority Fix #3",
          issue: "Sharpen the professional summary.",
          reason: "A focused summary helps recruiters understand role fit in seconds.",
          expectedImpact: "Makes the resume feel more targeted and market-ready."
        }
      ],
      rewriteSuggestions: [
        {
          section: "Professional Summary",
          current: "General resume summary.",
          suggested:
            "Analytical professional skilled in research, reporting, and problem solving, with hands-on experience turning information into practical business insights.",
          rationale: "This version is role-focused and emphasizes outcomes."
        },
        {
          section: "Experience Section",
          current: "Worked on business or project tasks.",
          suggested:
            "Led project tasks, analyzed key information, and delivered improvements that supported faster decisions and clearer team execution.",
          rationale: "This adds action, ownership, and business value."
        },
        {
          section: "Project Descriptions",
          current: "Created a project or dashboard.",
          suggested:
            "Built a project deliverable that organized data, surfaced key trends, and helped stakeholders identify practical next steps.",
          rationale: "This frames project work as decision support."
        }
      ],
      jdOptimization: jobDescription
        ? {
            mustHaveSkills: ats.missingSkills.slice(0, 6),
            preferredSkills: [],
            responsibilities: [],
            missingSkills: ats.missingSkills.slice(0, 6),
            experienceGaps: topMissing.length > 0 ? ["No strong evidence found for some JD requirements."] : [],
            optimizationSuggestions:
              topMissing.length > 0
                ? [`Add truthful examples for ${topMissing.join(", ")} in skills, projects, or experience.`]
                : ["The resume already covers the most visible JD terms."]
          }
        : null,
      strengths: ats.strengths
    };
  }
};
