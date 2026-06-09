import { AlertCircle, ArrowLeft, Brain, CheckCircle2, Lightbulb } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { CSSProperties } from "react";
import { auth } from "@/auth";
import { getSavedAnalysisDetail } from "@/lib/history";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
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

  return (
    <main className="app-shell">
      <section className="dashboard-shell">
        <Link className="back-link" href="/dashboard">
          <ArrowLeft size={17} aria-hidden="true" />
          Back to dashboard
        </Link>

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
          {Object.entries(analysis.breakdown).map(([label, score]) => (
            <article className="panel metric" key={label}>
              <div className="metric-top">
                <span>{label}</span>
                <span className="metric-score">{score}/100</span>
              </div>
              <div className="bar" style={{ "--bar-width": `${score}%` } as CSSProperties}>
                <span />
              </div>
            </article>
          ))}
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
