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
- Gemini/Gemma model priority is configured with GEMINI_MODEL_PRIORITY; default order is `gemma-4-26b-a4b-it` -> `gemma-4-31b-it` -> `gemini-2.5-flash-lite` -> `gemini-2.5-flash`.

## Free-Tier Rate Limit Protection

- Default Google AI model chain is `gemma-4-26b-a4b-it` -> `gemma-4-31b-it` -> `gemini-2.5-flash-lite` -> `gemini-2.5-flash`.
- Gemma 4 models are used through the same Gemini API transport; no separate Gemma provider is used.
- Each resume analysis makes at most one request per real Google AI model.
- No automatic retries run during free-tier testing.
- If Gemini returns `429`, the dashboard keeps the local ATS result and shows fallback coaching.
