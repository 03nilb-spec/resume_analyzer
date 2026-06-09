import type { AnalyzeResponse } from "@/lib/types";
import { requireDbPool } from "@/lib/db";
import { FREE_MONTHLY_AI_LIMIT, getMonthlyUsageWindow } from "@/lib/usage";

export type SavedAnalysisSummary = {
  id: string;
  resumeName: string;
  jobTitle: string | null;
  atsScore: number;
  keywordScore: number;
  semanticScore: number;
  experienceScore: number;
  formattingScore: number;
  aiModelUsed: string | null;
  createdAt: string;
};

export type SavedAnalysisDetail = SavedAnalysisSummary & {
  analysis: AnalyzeResponse;
};

type AnalysisRow = {
  id: string;
  resume_name: string;
  job_title: string | null;
  ats_score: number;
  keyword_score: number;
  semantic_score: number;
  experience_score: number;
  formatting_score: number;
  ai_model_used: string | null;
  analysis_json?: AnalyzeResponse;
  created_at: Date;
};

function mapSummary(row: AnalysisRow): SavedAnalysisSummary {
  return {
    id: row.id,
    resumeName: row.resume_name,
    jobTitle: row.job_title,
    atsScore: row.ats_score,
    keywordScore: row.keyword_score,
    semanticScore: row.semantic_score,
    experienceScore: row.experience_score,
    formattingScore: row.formatting_score,
    aiModelUsed: row.ai_model_used,
    createdAt: row.created_at.toISOString()
  };
}

export function extractJobTitle(jobDescription: string) {
  const firstMeaningfulLine = jobDescription
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length >= 3 && line.length <= 90);

  if (!firstMeaningfulLine) return null;

  return firstMeaningfulLine
    .replace(/^(job title|title|role)\s*:\s*/i, "")
    .trim()
    .slice(0, 120);
}

export async function saveResumeAnalysis(input: {
  userId: string;
  resumeName: string;
  jobTitle: string | null;
  analysis: AnalyzeResponse;
}) {
  const pool = requireDbPool();
  const result = await pool.query<{ id: string }>(
    `
      insert into resume_analyses (
        user_id,
        resume_name,
        job_title,
        ats_score,
        keyword_score,
        semantic_score,
        experience_score,
        formatting_score,
        ai_model_used,
        analysis_json
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb)
      returning id
    `,
    [
      input.userId,
      input.resumeName,
      input.jobTitle,
      input.analysis.score,
      input.analysis.breakdown.keyword,
      input.analysis.breakdown.semantic,
      input.analysis.breakdown.experience,
      input.analysis.breakdown.formatting,
      input.analysis.aiInsights.model || input.analysis.aiInsights.provider,
      JSON.stringify(input.analysis)
    ]
  );

  return result.rows[0]?.id;
}

export async function getDashboardData(userId: string) {
  const pool = requireDbPool();
  const { periodStart, periodEnd } = getMonthlyUsageWindow();
  const [totalResult, usageResult, historyResult] = await Promise.all([
    pool.query<{ count: string }>(
      "select count(*)::text as count from resume_analyses where user_id = $1",
      [userId]
    ),
    pool.query<{ count: string }>(
      `
        select count(*)::text as count
        from usage_events
        where user_id = $1
          and event_type = 'ai_analysis'
          and created_at >= $2
          and created_at < $3
      `,
      [userId, periodStart, periodEnd]
    ),
    pool.query<AnalysisRow>(
      `
        select
          id,
          resume_name,
          job_title,
          ats_score,
          keyword_score,
          semantic_score,
          experience_score,
          formatting_score,
          ai_model_used,
          created_at
        from resume_analyses
        where user_id = $1
        order by created_at desc
        limit 25
      `,
      [userId]
    )
  ]);
  const monthlyAiUsed = Number(usageResult.rows[0]?.count || 0);

  return {
    totalAnalyses: Number(totalResult.rows[0]?.count || 0),
    monthlyAiUsed,
    monthlyAiLimit: FREE_MONTHLY_AI_LIMIT,
    history: historyResult.rows.map(mapSummary)
  };
}

export async function getSavedAnalysisDetail(userId: string, analysisId: string) {
  const pool = requireDbPool();
  const result = await pool.query<AnalysisRow>(
    `
      select
        id,
        resume_name,
        job_title,
        ats_score,
        keyword_score,
        semantic_score,
        experience_score,
        formatting_score,
        ai_model_used,
        analysis_json,
        created_at
      from resume_analyses
      where user_id = $1 and id = $2
      limit 1
    `,
    [userId, analysisId]
  );
  const row = result.rows[0];
  if (!row || !row.analysis_json) return null;

  return {
    ...mapSummary(row),
    analysis: row.analysis_json
  };
}

