import { SECTION_ALIASES, SKILL_LIBRARY } from "@/lib/skills";
import { getSemanticAnalyzer } from "@/lib/semantic";
import type { ResumeAnalysisResult } from "@/lib/types";
import { clampScore, containsTerm, normalizeText, tokenize, unique } from "@/lib/text";

const WEIGHTS = {
  keyword: 40,
  semantic: 30,
  experience: 20,
  formatting: 10
} as const;

function extractSkills(text: string) {
  const normalized = text.toLowerCase();
  return SKILL_LIBRARY.filter((skill) => containsTerm(normalized, skill));
}

function extractImportantTerms(text: string) {
  const stopWords = new Set([
    "and",
    "the",
    "for",
    "with",
    "you",
    "our",
    "are",
    "will",
    "from",
    "this",
    "that",
    "have",
    "has",
    "your",
    "role",
    "work",
    "team"
  ]);

  const counts = new Map<string, number>();
  for (const token of tokenize(text)) {
    if (!stopWords.has(token)) {
      counts.set(token, (counts.get(token) || 0) + 1);
    }
  }

  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 18)
    .map(([term]) => term);
}

function detectSections(text: string) {
  const normalized = text.toLowerCase();
  return Object.entries(SECTION_ALIASES)
    .filter(([, aliases]) => aliases.some((alias) => containsTerm(normalized, alias)))
    .map(([section]) => section);
}

function scoreKeywords(resumeSkills: string[], targetSkills: string[], resumeText: string) {
  if (targetSkills.length > 0) {
    const matched = resumeSkills.filter((skill) => targetSkills.includes(skill));
    return clampScore((matched.length / targetSkills.length) * 100 || 1);
  }

  const breadthScore = Math.min(75, resumeSkills.length * 8);
  const densityBonus = extractImportantTerms(resumeText).length >= 8 ? 15 : 5;
  return clampScore(breadthScore + densityBonus);
}

function scoreExperience(text: string, hasJobDescription: boolean) {
  const lower = text.toLowerCase();
  const actionVerbs = [
    "achieved",
    "analyzed",
    "built",
    "created",
    "delivered",
    "designed",
    "improved",
    "increased",
    "led",
    "managed",
    "reduced",
    "resolved"
  ];
  const impactSignals = (text.match(/(\d+%|\$[\d,.]+|\b\d+\+?\b)/g) || []).length;
  const actionScore = actionVerbs.filter((verb) => lower.includes(verb)).length * 7;
  const sectionScore =
    lower.includes("experience") || lower.includes("internship") || lower.includes("projects")
      ? 25
      : 8;
  const quantifiedScore = Math.min(25, impactSignals * 5);
  const relevanceBonus = hasJobDescription ? 8 : 14;

  return clampScore(sectionScore + actionScore + quantifiedScore + relevanceBonus);
}

function scoreFormatting(text: string, sections: string[]) {
  const warnings: string[] = [];
  const words = tokenize(text).length;
  const hasEmail = /[^\s@]+@[^\s@]+\.[^\s@]+/.test(text);
  const hasPhone = /(\+?\d[\d\s().-]{8,}\d)/.test(text);
  const bulletCount = (text.match(/[•\-*]\s+/g) || []).length;

  if (!hasEmail) warnings.push("Add a professional email address in the header.");
  if (!hasPhone) warnings.push("Add a reachable phone number in the header.");
  if (!sections.includes("skills")) warnings.push("Add a clear Skills section for ATS parsing.");
  if (!sections.includes("experience") && !sections.includes("projects")) {
    warnings.push("Add Experience or Projects so impact is easy to evaluate.");
  }
  if (words < 180) warnings.push("Resume content looks thin; add more role, project, and impact detail.");
  if (words > 950) warnings.push("Resume may be too long for quick screening; trim low-impact details.");
  if (bulletCount < 3) warnings.push("Use concise bullet points to make achievements easier to scan.");

  const score =
    38 +
    (hasEmail ? 12 : 0) +
    (hasPhone ? 10 : 0) +
    Math.min(25, sections.length * 5) +
    (words >= 180 && words <= 950 ? 10 : 0) +
    (bulletCount >= 3 ? 5 : 0);

  return {
    score: clampScore(score),
    warnings
  };
}

function buildSuggestions(input: {
  missingSkills: string[];
  formattingWarnings: string[];
  hasJobDescription: boolean;
  experienceScore: number;
  keywordScore: number;
}) {
  const suggestions: string[] = [];

  if (input.missingSkills.length > 0) {
    suggestions.push(
      `Add evidence for these target skills where truthful: ${input.missingSkills
        .slice(0, 5)
        .join(", ")}.`
    );
  }

  if (input.keywordScore < 70) {
    suggestions.push("Mirror important role keywords naturally in Skills, Summary, and Experience.");
  }

  if (input.experienceScore < 70) {
    suggestions.push("Rewrite bullets with action, task, result, and measurable impact.");
  }

  if (!input.hasJobDescription) {
    suggestions.push("Paste a job description to get more precise missing-skill and relevance feedback.");
  }

  suggestions.push("Keep section headings simple: Summary, Skills, Experience, Projects, Education.");

  return unique([...suggestions, ...input.formattingWarnings]).slice(0, 8);
}

function buildStrengths(sections: string[], matchedSkills: string[], formattingScore: number) {
  const strengths: string[] = [];

  if (sections.includes("skills")) strengths.push("Skills section is detectable by ATS-style parsing.");
  if (sections.includes("education")) strengths.push("Education details are present and easy to identify.");
  if (sections.includes("experience")) strengths.push("Experience section gives the resume a clear career story.");
  if (matchedSkills.length >= 6) strengths.push("Resume shows a healthy spread of relevant capabilities.");
  if (formattingScore >= 80) strengths.push("Formatting signals are strong for automated screening.");

  return strengths.length > 0
    ? strengths
    : ["The resume has extractable text, so it can be evaluated and improved."];
}

export async function analyzeResume(
  rawResumeText: string,
  rawJobDescription?: string
): Promise<ResumeAnalysisResult> {
  const resumeText = normalizeText(rawResumeText);
  const jobDescription = normalizeText(rawJobDescription || "");

  if (tokenize(resumeText).length < 30) {
    throw new Error("The resume text is too short to analyze. Please upload a text-based PDF or DOCX.");
  }

  const resumeSkills = extractSkills(resumeText);
  const jdSkills = extractSkills(jobDescription);
  const targetTerms = jobDescription ? extractImportantTerms(jobDescription) : [];
  const sections = detectSections(resumeText);
  const targetSkills = jdSkills.length > 0 ? jdSkills : [];
  const matchedSkills =
    targetSkills.length > 0
      ? resumeSkills.filter((skill) => targetSkills.includes(skill))
      : resumeSkills;
  const missingSkills = targetSkills.filter((skill) => !resumeSkills.includes(skill));

  const keywordScore = scoreKeywords(resumeSkills, targetSkills, resumeText);
  const semantic = await getSemanticAnalyzer().compare({
    resumeText,
    jobDescription,
    resumeSkills,
    targetSkills: targetSkills.length > 0 ? targetSkills : targetTerms
  });
  const experienceScore = scoreExperience(resumeText, Boolean(jobDescription));
  const formatting = scoreFormatting(resumeText, sections);

  const finalScore = clampScore(
    keywordScore * 0.4 +
      semantic.score * 0.3 +
      experienceScore * 0.2 +
      formatting.score * 0.1
  );

  const suggestions = buildSuggestions({
    missingSkills,
    formattingWarnings: formatting.warnings,
    hasJobDescription: Boolean(jobDescription),
    experienceScore,
    keywordScore
  });

  return {
    score: finalScore,
    summary:
      finalScore >= 80
        ? "Strong ATS alignment with clear evidence and relevant skills."
        : finalScore >= 60
          ? "Good foundation, with targeted improvements needed to stand out."
          : "Needs stronger keyword coverage, clearer impact, and ATS-friendly structure.",
    breakdown: {
      keyword: keywordScore,
      semantic: semantic.score,
      experience: experienceScore,
      formatting: formatting.score
    },
    matchedSkills: unique(matchedSkills).slice(0, 18),
    missingSkills: unique(missingSkills).slice(0, 18),
    strengths: buildStrengths(sections, matchedSkills, formatting.score),
    suggestions,
    formattingWarnings: formatting.warnings,
    detectedSections: sections,
    parsedWordCount: tokenize(resumeText).length,
    scoringWeights: WEIGHTS
  };
}
