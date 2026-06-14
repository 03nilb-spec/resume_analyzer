# Phase 3A - AI Resume Rewriter

## Goal

Help users improve resumes automatically with premium AI rewriting.

## Inputs

- Uploaded resume PDF or DOCX
- Optional but recommended job description

## Outputs

- Improved resume
- ATS optimized content
- Section rewrites for Summary, Experience, Projects, and Skills
- AI suggestions
- Missing keywords
- Better resume bullets
- ATS improvements

## Access

The AI Resume Rewriter is a Premium feature. The UI and API both enforce this:

- Logged-out users are redirected to sign in.
- Free signed-in users see a Premium gate.
- Premium-enabled users can call `/api/rewrite`.

Payments are not implemented yet. For local testing before billing exists, premium access can be granted by adding a user email to `PREMIUM_USER_EMAILS` in `.env.local`.

## Privacy

Uploaded resume files are parsed for the rewrite request only. Files are not stored, and raw resume text is not persisted by Phase 3A.

## Failure Mode

If the AI provider fails, the rewriter returns structured fallback suggestions rather than exposing raw provider errors to the user.

