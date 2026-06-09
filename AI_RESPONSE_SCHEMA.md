# AI Response Schema

The AI layer returns an `AiInsights` object:

```ts
type AiInsights = {
  status: "available" | "unavailable";
  provider: "gemini" | "mock" | "none";
  model?: string;
  message?: string;
  careerCoachSummary: string;
  roleFit: {
    mostSuitableRole: string;
    confidence: number;
    reasoning: string;
  };
  priorityFixes: Array<{
    title: string;
    issue: string;
    reason: string;
    expectedImpact: string;
  }>;
  rewriteSuggestions: Array<{
    section: "Professional Summary" | "Experience Section" | "Project Descriptions";
    current: string;
    suggested: string;
    rationale: string;
  }>;
  jdOptimization: null | {
    mustHaveSkills: string[];
    preferredSkills: string[];
    responsibilities: string[];
    missingSkills: string[];
    experienceGaps: string[];
    optimizationSuggestions: string[];
  };
  strengths: string[];
};
```

The normalizer validates minimum shape and clamps confidence to `1-100`.
