import type { SemanticAnalyzer } from "@/lib/types";
import { tokenize, unique } from "@/lib/text";

function jaccardScore(a: string[], b: string[]) {
  const left = new Set(a);
  const right = new Set(b);
  const intersection = [...left].filter((item) => right.has(item)).length;
  const union = new Set([...left, ...right]).size || 1;
  return (intersection / union) * 100;
}

export const mockSemanticAnalyzer: SemanticAnalyzer = {
  async compare({ resumeText, jobDescription, resumeSkills, targetSkills }) {
    const resumeTokens = tokenize(resumeText);
    const targetTokens = tokenize(jobDescription || targetSkills.join(" "));
    const lexicalOverlap = jaccardScore(resumeTokens, targetTokens);
    const skillCoverage =
      targetSkills.length === 0
        ? Math.min(100, resumeSkills.length * 8)
        : (resumeSkills.filter((skill) => targetSkills.includes(skill)).length /
            targetSkills.length) *
          100;
    const actionSignals = [
      "managed",
      "built",
      "designed",
      "improved",
      "increased",
      "reduced",
      "led",
      "analyzed",
      "created",
      "delivered"
    ];
    const signalCoverage = unique(
      actionSignals.filter((signal) => resumeText.toLowerCase().includes(signal))
    ).length;

    const score = Math.round(
      Math.min(100, lexicalOverlap * 0.45 + skillCoverage * 0.45 + signalCoverage * 3)
    );

    return {
      score,
      signals: [
        `${Math.round(lexicalOverlap)}% wording overlap`,
        `${Math.round(skillCoverage)}% skill-context coverage`,
        `${signalCoverage} action-oriented impact signals`
      ]
    };
  }
};
