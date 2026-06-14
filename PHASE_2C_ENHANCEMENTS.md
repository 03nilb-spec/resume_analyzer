# Phase 2C Enhancements

## Objective

Improve freemium UX, login gating, premium messaging, dashboard clarity, and saved-analysis management while preserving ATS scoring, AI coaching, Google auth, PostgreSQL storage, monthly usage tracking, and model-used tracking.

## Implemented UX Rules

- Logged-out users can run basic local ATS analysis.
- Logged-out users see an "Unlock AI Career Coach" card instead of AI results.
- Logged-in free users receive 3 AI analyses per month.
- After 3 AI analyses, local ATS analysis still runs and AI is blocked.
- Free users see matched/missing skill counts, not full skill lists.
- Detailed skill data remains in backend responses for a future premium unlock.
- Weighted scoring details are hidden from the UI, while calculations remain unchanged.
- Saved analyses can be deleted by their owner only.

## Dashboard Enhancements

The dashboard now shows:

- Best ATS Score
- Latest ATS Score
- Total Saved Analyses
- AI Analyses Used This Month
- AI Analyses Remaining This Month

## Out of Scope

Real payments, subscriptions, admin tools, resume file storage, and database provider changes remain out of scope.

