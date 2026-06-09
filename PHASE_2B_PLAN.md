# Phase 2B Plan

## Objective

Add Google authentication, PostgreSQL persistence, analysis history, and monthly AI usage tracking while preserving the Phase 1 ATS analyzer and Phase 2A AI coaching flow.

## Scope

- Google-only login with Auth.js / NextAuth.
- Protected dashboard and saved analysis detail pages.
- PostgreSQL-backed users, analyses, and usage events.
- Public ATS analysis remains available without login.
- AI coaching requires login and is limited to 3 free analyses per month.

## Flow

1. Anonymous users can upload a resume and receive local ATS analysis.
2. Anonymous users see a sign-in prompt instead of AI coaching.
3. Signed-in users run ATS analysis first.
4. The API checks monthly AI usage.
5. If usage remains, AI coaching runs and a usage event is recorded.
6. If the limit is reached, ATS results return with a friendly AI limit message.
7. Signed-in analyses are saved as analysis output only.

## Out of Scope

Payments, subscriptions, admin tools, resume file storage, raw resume text storage, email notifications, and team accounts.

