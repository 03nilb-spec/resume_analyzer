# Usage Limits

## Monthly AI Limit

Free users receive 3 AI analyses per calendar month.

## What Counts

A usage event is recorded when a signed-in user receives available AI coaching. The event stores user ID, event type, model metadata, and creation time.

## Limit Behavior

When the monthly limit is reached:

- Resume parsing still runs.
- Local ATS analysis still runs.
- AI coaching is blocked.
- The response includes: "You have used all 3 free AI analyses this month."
- The UI shows: "Upgrade to Premium to continue with AI analysis."
- The UI includes a "Buy Premium" CTA pointing to the pricing placeholder.
- Logged-in analyses can still be saved with ATS-only output.
- Usage events are not deleted when a saved analysis is deleted.
- Deleting a saved analysis does not reduce monthly usage count.

## Public Users

Anonymous users can run basic ATS analysis. They do not receive AI coaching and do not have saved history.

## AI Failure Handling

If the AI provider fails, the app keeps ATS results available and shows fallback messaging instead of raw API errors.

