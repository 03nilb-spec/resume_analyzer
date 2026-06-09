# Auth Flow

## Provider

Authentication uses Auth.js / NextAuth with Google OAuth only. Custom password authentication is intentionally not implemented.

## Routes

- `/signin`: Google sign-in page.
- `/api/auth/[...nextauth]`: Auth.js route handlers.
- `/dashboard`: protected analysis dashboard.
- `/dashboard/analyses/[id]`: protected saved analysis detail page.

## Access Rules

- `/` remains public for basic ATS analysis.
- AI coaching requires a signed-in user.
- Saved history requires a signed-in user.
- Dashboard pages redirect unauthenticated users to `/signin`.

## Environment

- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `DATABASE_URL`

