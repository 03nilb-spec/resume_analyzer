import { AlertCircle, ArrowLeft, Brain, CheckCircle2, Lightbulb } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { CSSProperties } from "react";
import { auth } from "@/auth";
import { DeleteAnalysisButton } from "@/app/dashboard/DeleteAnalysisButton";
import { getSavedAnalysisDetail } from "@/lib/history";
import type { AnalyzeResponse } from "@/lib/types";

const detailMetrics = [
  { key: "keyword", label: "Keyword Match" },
  { key: "semantic", label: "Semantic Similarity" },
  { key: "experience", label: "Experience Relevance" },
  { key: "formatting", label: "Formatting" }
] as const;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function getAiStatusLabel(analysis: AnalyzeResponse) {
  if (analysis.aiInsights.status === "unavailable") return "Unavailable";
  if (analysis.aiAccess?.state === "fallback" || analysis.aiInsights.provider === "mock") return "Fallback";
  return "Real AI";
}

export default async function AnalysisDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.id) {
    redirect(`/signin?callbackUrl=/dashboard/analyses/${id}`);
  }

  const saved = await getSavedAnalysisDetail(session.user.id, id);
  if (!saved) notFound();

  const analysis = saved.analysis;
  const isPremium = analysis.aiAccess?.isPremium === true;
  const aiStatus = getAiStatusLabel(analysis);

  return (
    <main className="app-shell">
      <section className="dashboard-shell">
        <div className="detail-actions">
          <Link className="back-link" href="/dashboard">
            <ArrowLeft size={17} aria-hidden="true" />
            Back to dashboard
          </Link>
          <DeleteAnalysisButton analysisId={saved.id} redirectToDashboard />
        </div>

        <div className="panel hero-panel">
          <div className="score-ring" style={{ "--score-angle": `${(analysis.score / 100) * 360}deg` } as CSSProperties}>
            <div>
              <strong>{analysis.score}</strong>
              <span>ATS Score</span>
            </div>
          </div>
          <div>
            <p className="eyebrow">{formatDate(saved.createdAt)}</p>
            <h1 className="headline">{saved.resumeName}</h1>
            <p className="muted">{saved.jobTitle || analysis.summary}</p>
          </div>
        </div>

        <div className="metric-grid">
          <article className="panel metric stat-card">
            <span>ATS Score</span>
            <strong>{analysis.score}</strong>
          </article>
          <article className="panel metric stat-card">
            <span>Created Date</span>
            <strong>{formatDate(saved.createdAt)}</strong>
          </article>
          <article className="panel metric stat-card">
            <span>AI Model Used</span>
            <strong>{analysis.aiInsights.model || saved.aiModelUsed || "none"}</strong>
          </article>
          <article className="panel metric stat-card">
            <span>AI Coaching Status</span>
            <strong>{aiStatus}</strong>
          </article>
        </div>

        <div className="metric-grid">
          {detailMetrics.map((metric) => {
            const score = analysis.breakdown[metric.key];

            return (
              <article className="panel metric" key={metric.key}>
              <div className="metric-top">
                <span>{metric.label}</span>
                <span className="metric-score">{score}/100</span>
              </div>
              <div className="bar" style={{ "--bar-width": `${score}%` } as CSSProperties}>
                <span />
              </div>
            </article>
            );
          })}
        </div>

        <section className={`panel section-panel coach-panel ${analysis.aiInsights.status}`}>
          <div className="section-heading">
            <Brain size={21} aria-hidden="true" />
            <div>
              <h2>AI Career Coach</h2>
              <p className="muted">{analysis.aiInsights.model || analysis.aiInsights.provider}</p>
            </div>
          </div>
          <p>{analysis.aiInsights.careerCoachSummary}</p>
          {analysis.aiInsights.message ? <p className="muted">{analysis.aiInsights.message}</p> : null}
        </section>

        <div className="content-grid">
          {isPremium ? (
            <>
              <section className="panel section-panel">
                <h2>Matched Skills</h2>
                <div className="pill-row">
                  {analysis.matchedSkills.map((skill) => (
                    <span className="pill" key={skill}>
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
              <section className="panel section-panel">
                <h2>Missing Skills</h2>
                <div className="pill-row">
                  {analysis.missingSkills.map((skill) => (
                    <span className="pill missing" key={skill}>
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            </>
          ) : (
            <section className="panel section-panel skill-summary-card">
              <h2>Skill Summary</h2>
              <div className="summary-counts">
                <div>
                  <strong>Matched skills: {analysis.matchedSkills.length}</strong>
                  <span>Full list available with Premium.</span>
                </div>
                <div>
                  <strong>Missing skills: {analysis.missingSkills.length}</strong>
                  <span>Keep editing around the biggest gaps.</span>
                </div>
              </div>
            </section>
          )}
          <section className="panel section-panel">
            <h2>Strengths</h2>
            <ul className="list">
              {analysis.strengths.map((item) => (
                <li key={item}>
                  <CheckCircle2 size={17} color="#0f7b63" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
          <section className="panel section-panel">
            <h2>Suggestions</h2>
            <ul className="list">
              {analysis.suggestions.map((item) => (
                <li key={item}>
                  <Lightbulb size={17} color="#d97706" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
          <section className="panel section-panel">
            <h2>Formatting Issues</h2>
            <ul className="list">
              {analysis.formattingWarnings.map((item) => (
                <li key={item}>
                  <AlertCircle size={17} color="#b42318" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </section>
    </main>
  );
}
