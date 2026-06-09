# Gemini Provider

## Endpoint

The provider uses the Gemini REST `generateContent` endpoint:

`https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`

The request sends the API key in the `x-goog-api-key` header and asks for JSON using `responseMimeType: "application/json"`.

## Timeout

Gemini calls use an `AbortController` timeout of 12 seconds. Timeout, invalid JSON, missing text, and non-2xx responses are treated as AI failure.

## Failure Mode

Gemini failure returns:

`AI insights unavailable. ATS analysis completed successfully.`

The ATS score, breakdown, missing skills, matched skills, formatting analysis, and ATS suggestions still render.

## Test Endpoint

Use /api/test-gemini to send a tiny Gemini prompt and verify the configured model/API key without uploading a resume.

## Request Size Control

Resume text is truncated to 6,500 characters and job description text is truncated to 3,000 characters before Gemini requests. ATS analysis still uses the full parsed resume text.

## Rate Limit Handling

Gemma 4 models are called through the same Gemini API endpoint. During testing the app sends at most one request per real model and does not retry the same model repeatedly. Priority order is `gemini-3.1-flash-lite` -> `gemma-4-26b-a4b-it` -> `gemma-4-31b-it` -> `gemini-2.5-flash-lite` -> `gemini-2.5-flash`. If all real models fail, mock fallback is used. Technical API errors are logged on the server with model name and failure reason; users only see fallback-mode messaging.
