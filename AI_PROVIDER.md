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
