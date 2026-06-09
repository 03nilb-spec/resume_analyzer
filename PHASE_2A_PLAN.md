# Phase 2A Plan

## Objective

Enhance the Resume Analyzer with Gemini-powered career coaching while keeping the existing ATS scoring engine unchanged. AI insights are additive and must never block ATS analysis.

## Features

- AI Career Coach summary.
- Role fit analysis with most suitable role, confidence, and reasoning.
- Top 3 priority fixes with issue, reason, and expected impact.
- Resume rewrite suggestions for professional summary, experience, and projects.
- JD optimization when a job description is supplied.
- Positive resume strengths so the dashboard does more than criticize.

## Flow

1. Parse uploaded PDF or DOCX.
2. Run ATS analysis.
3. Send resume, optional JD, and ATS output to the AI provider.
4. Render ATS output and AI insights together.
5. If AI fails, render ATS output with an AI unavailable message.

## Out of Scope

Authentication, Google login, database, saved history, payments, premium plans, admin panel, email notifications, resume builder, and cover letter generation.
