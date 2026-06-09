# AI Provider Architecture

## Files

- `lib/ai/providerFactory.ts`
- `lib/ai/providers/gemini.ts`
- `lib/ai/providers/mock.ts`
- `lib/ai/schema.ts`

## Behavior

The API route runs ATS analysis first. It then calls `generateAiInsights()`. If `GEMINI_API_KEY` exists, the Gemini provider is used. If no key exists, the mock provider returns deterministic local insights for development.

If the selected provider fails, the factory returns an unavailable AI payload instead of throwing. This keeps the dashboard usable and preserves ATS analysis.

## Environment Variables

- `GEMINI_API_KEY`: required for real Gemini insights.
- `GEMINI_MODEL`: optional, defaults to `gemini-2.5-flash`.

## Free-Tier Rate Limit Protection

- Default model is gemini-2.5-flash because this project has active free-tier quota for Gemini 2.5 Flash only.
- Do not use gemini-1.5-flash, gemini-2.0-flash, or gemini-2.0-flash-lite for this project.
- Each resume analysis makes at most one Gemini request.
- No automatic retries run during free-tier testing.
- If Gemini returns 429, the dashboard keeps the local ATS result and shows fallback coaching.
