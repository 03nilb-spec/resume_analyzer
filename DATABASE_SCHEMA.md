# Database Schema

PostgreSQL is used for Auth.js records and Phase 2B app data. The executable schema is in `database/schema.sql`.

## Core Tables

- `users`: Auth.js user records from Google login.
- `accounts`: OAuth account links for Google.
- `sessions`: Database sessions.
- `verification_token`: Auth.js token support.
- `resume_analyses`: Saved analysis summaries and full analysis JSON.
- `usage_events`: Monthly AI usage events.

## Resume Analysis Storage

`resume_analyses` stores:

- `user_id`
- `resume_name`
- `job_title`
- `ats_score`
- `keyword_score`
- `semantic_score`
- `experience_score`
- `formatting_score`
- `ai_model_used`
- `analysis_json`
- `created_at`

Uploaded resume files are not stored. Raw parsed resume text is not stored; the app persists analysis output only.

