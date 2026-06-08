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
