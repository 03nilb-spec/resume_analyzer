import { requireDbPool } from "@/lib/db";

export const FREE_MONTHLY_AI_LIMIT = 3;

export type MonthlyUsage = {
  used: number;
  limit: number;
  remaining: number;
  allowed: boolean;
  periodStart: string;
  periodEnd: string;
};

export function getMonthlyUsageWindow(now = new Date()) {
  const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const periodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  return { periodStart, periodEnd };
}

export async function getMonthlyAiUsage(userId: string): Promise<MonthlyUsage> {
  const pool = requireDbPool();
  const { periodStart, periodEnd } = getMonthlyUsageWindow();
  const result = await pool.query<{ count: string }>(
    `
      select count(*)::text as count
      from usage_events
      where user_id = $1
        and event_type = 'ai_analysis'
        and created_at >= $2
        and created_at < $3
    `,
    [userId, periodStart, periodEnd]
  );
  const used = Number(result.rows[0]?.count || 0);
  const remaining = Math.max(0, FREE_MONTHLY_AI_LIMIT - used);

  return {
    used,
    limit: FREE_MONTHLY_AI_LIMIT,
    remaining,
    allowed: used < FREE_MONTHLY_AI_LIMIT,
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString()
  };
}

export async function recordAiUsageEvent(input: {
  userId: string;
  analysisId?: string;
  aiModelUsed: string;
}) {
  const pool = requireDbPool();
  await pool.query(
    `
      insert into usage_events (user_id, event_type, metadata)
      values ($1, 'ai_analysis', $2::jsonb)
    `,
    [
      input.userId,
      JSON.stringify({
        analysisId: input.analysisId || null,
        aiModelUsed: input.aiModelUsed
      })
    ]
  );
}

export function limitReachedUsage(): MonthlyUsage {
  const { periodStart, periodEnd } = getMonthlyUsageWindow();

  return {
    used: FREE_MONTHLY_AI_LIMIT,
    limit: FREE_MONTHLY_AI_LIMIT,
    remaining: 0,
    allowed: false,
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString()
  };
}

