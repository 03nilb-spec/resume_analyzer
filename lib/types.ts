export type ScoreBreakdown = {
  keyword: number;
  semantic: number;
  experience: number;
  formatting: number;
};

export type ResumeAnalysisResult = {
  score: number;
  summary: string;
  breakdown: ScoreBreakdown;
  matchedSkills: string[];
  missingSkills: string[];
  strengths: string[];
  suggestions: string[];
  formattingWarnings: string[];
  detectedSections: string[];
  parsedWordCount: number;
  scoringWeights: {
    keyword: 40;
    semantic: 30;
    experience: 20;
    formatting: 10;
  };
};

export type RewriteSuggestion = {
  section: "Professional Summary" | "Experience Section" | "Project Descriptions";
  current: string;
  suggested: string;
  rationale: string;
};

export type PriorityFix = {
  title: string;
  issue: string;
  reason: string;
  expectedImpact: string;
};

export type RoleFitAnalysis = {
  mostSuitableRole: string;
  confidence: number;
  reasoning: string;
};

export type JdOptimization = {
  mustHaveSkills: string[];
  preferredSkills: string[];
  responsibilities: string[];
  missingSkills: string[];
  experienceGaps: string[];
  optimizationSuggestions: string[];
};

export type AiInsights = {
  status: "available" | "unavailable";
  provider: "gemini" | "mock" | "none";
  model?: string;
  message?: string;
  careerCoachSummary: string;
  roleFit: RoleFitAnalysis;
  priorityFixes: PriorityFix[];
  rewriteSuggestions: RewriteSuggestion[];
  jdOptimization: JdOptimization | null;
  strengths: string[];
};

export type AnalyzeResponse = ResumeAnalysisResult & {
  aiInsights: AiInsights;
  plan: "free" | "premium";
  aiAccess: {
    state: "available" | "login_required" | "limit_reached" | "fallback" | "unavailable";
    isPremium: boolean;
  };
  savedAnalysisId?: string;
  aiUsage?: {
    used: number;
    limit: number;
    remaining: number;
    allowed: boolean;
    periodStart: string;
    periodEnd: string;
  };
};

export type ResumeRewriteSection = {
  section: "Summary" | "Experience" | "Projects" | "Skills";
  current: string;
  improved: string;
  rationale: string;
};

export type ResumeRewriteResult = {
  status: "available" | "unavailable";
  provider: "gemini" | "mock" | "none";
  model?: string;
  message?: string;
  improvedResume: string;
  atsOptimizedContent: string[];
  sectionRewrites: ResumeRewriteSection[];
  missingKeywords: string[];
  betterResumeBullets: string[];
  atsImprovements: string[];
  aiSuggestions: string[];
};

export type ResumeRewriteResponse = {
  plan: "free" | "premium";
  isPremium: boolean;
  rewrite: ResumeRewriteResult;
};

export type SemanticAnalyzer = {
  compare(input: {
    resumeText: string;
    jobDescription?: string;
    resumeSkills: string[];
    targetSkills: string[];
  }): Promise<{
    score: number;
    signals: string[];
  }>;
};

export type AiProviderInput = {
  resumeText: string;
  jobDescription: string;
  ats: ResumeAnalysisResult;
};

export type AiProvider = {
  name: "gemini" | "mock";
  generateInsights(input: AiProviderInput): Promise<AiInsights>;
};
