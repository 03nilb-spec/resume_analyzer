# Phase 1 Scoring Algorithm

## Score Weights

The final score is a 1-100 weighted score:

- Keyword match: 40%
- Semantic similarity: 30%
- Experience relevance: 20%
- Formatting: 10%

The API returns each category score plus the final weighted score so the dashboard can explain the result.

## Keyword Match

The analyzer extracts known skills from the resume using a broad cross-field skill library covering engineering, commerce, arts, management, education, marketing, design, operations, and general professional skills.

- With a JD: score is based on how many JD skills appear in the resume.
- Without a JD: score is based on skill breadth and important repeated resume terms.

## Semantic Similarity

Phase 1 uses a mock semantic adapter. It combines token overlap, skill-context coverage, and action-oriented resume signals. The adapter is intentionally isolated behind `getSemanticAnalyzer()` so a future OpenAI or embedding-based provider can replace it without changing the API route or UI.

## Experience Relevance

Experience scoring checks for:

- Experience, internship, or project sections.
- Action verbs such as built, led, managed, improved, designed, and analyzed.
- Quantified impact such as percentages, counts, money, or other numeric results.
- A small relevance bonus depending on whether the analysis is JD-aware or general.

## Formatting

Formatting scoring checks:

- Contact details such as email and phone.
- Standard ATS-friendly sections.
- Resume length.
- Bullet-point usage.
- Parseable text quality.

Formatting warnings are returned separately so users can fix specific issues.

## Skill Matching Rules

- Skill terms are matched case-insensitively.
- Multi-word skills are matched with flexible spacing.
- Matched skills are skills found in both the resume and the target JD.
- Missing skills are JD skills not found in the resume.
- If no JD is supplied, matched skills means all recognizable skills detected in the resume.

## Future AI Upgrade Path

Replace the mock semantic analyzer with a provider implementation that can call embeddings or an LLM. The replacement should keep the same interface: resume text, optional JD, detected resume skills, target skills, and a returned semantic score with explanatory signals.
