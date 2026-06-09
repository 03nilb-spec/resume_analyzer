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
