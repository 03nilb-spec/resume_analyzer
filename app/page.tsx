"use client";

import {
  AlertCircle,
  BarChart3,
  Brain,
  CheckCircle2,
  FileText,
  Flame,
  Lightbulb,
  LogIn,
  LogOut,
  Lock,
  Loader2,
  PenLine,
  Search,
  ShoppingCart,
  Sparkles,
  Target,
  Upload,
  WandSparkles,
  XCircle
} from "lucide-react";
import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";
import { FormEvent, useMemo, useState } from "react";
import type { AnalyzeResponse, ScoreBreakdown } from "@/lib/types";

const metrics: Array<{
  key: keyof ScoreBreakdown;
  label: string;
}> = [
  { key: "keyword", label: "Keyword Match" },
  { key: "semantic", label: "Semantic Similarity" },
  { key: "experience", label: "Experience Relevance" },
  { key: "formatting", label: "Formatting" }
];

function ResultList({
  title,
  icon,
  items,
  empty
}: {
  title: string;
  icon: React.ReactNode;
  items: string[];
  empty: string;
}) {
  return (
    <section className="panel section-panel">
      <h2>{title}</h2>
      {items.length > 0 ? (
        <ul className="list">
          {items.map((item) => (
            <li key={item}>
              {icon}
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">{empty}</p>
      )}
    </section>
  );
}

function SkillPills({
  title,
  skills,
  empty,
  missing = false
}: {
  title: string;
  skills: string[];
  empty: string;
  missing?: boolean;
}) {
  return (
    <section className="panel section-panel">
      <h2>{title}</h2>
      {skills.length > 0 ? (
        <div className="pill-row">
          {skills.map((skill) => (
            <span className={`pill ${missing ? "missing" : ""}`} key={skill}>
              {skill}
            </span>
          ))}
        </div>
      ) : (
        <p className="muted">{empty}</p>
      )}
    </section>
  );
}

function SkillSummaryCard({
  matchedCount,
  missingCount
}: {
  matchedCount: number;
  missingCount: number;
}) {
  return (
    <section className="panel section-panel skill-summary-card">
      <h2>Skill Summary</h2>
      <div className="summary-counts">
        <div>
          <strong>Matched skills: {matchedCount}</strong>
          <span>Full list available with Premium.</span>
        </div>
        <div>
          <strong>Missing skills: {missingCount}</strong>
          <span>Use counts to guide your next edit.</span>
        </div>
      </div>
    </section>
  );
}

function AiGateCard({
  state,
  usage
}: {
  state: AnalyzeResponse["aiAccess"]["state"];
  usage?: AnalyzeResponse["aiUsage"];
}) {
  if (state === "login_required") {
    return (
      <section className="panel section-panel premium-card">
        <div className="section-heading">
          <Lock size={21} aria-hidden="true" />
          <h2>Unlock AI Career Coach</h2>
        </div>
        <p className="muted">
          Sign in to get personalized resume feedback, job-specific suggestions, resume
          improvement tips, and saved analysis history.
        </p>
        <button
          className="primary-button compact-button"
          type="button"
          onClick={() => signIn("google", { redirectTo: "/dashboard" })}
        >
          <LogIn size={18} aria-hidden="true" />
          Continue with Google
        </button>
      </section>
    );
  }

  if (state === "limit_reached") {
    return (
      <section className="panel section-panel premium-card">
        <div className="section-heading">
          <ShoppingCart size={21} aria-hidden="true" />
          <h2>You have used all 3 free AI analyses this month.</h2>
        </div>
        <p className="muted">Upgrade to Premium to continue with AI analysis.</p>
        {usage ? (
          <p className="usage-note">
            Monthly AI usage: {usage.used}/{usage.limit}
          </p>
        ) : null}
        <Link className="primary-button compact-button" href="/pricing">
          Buy Premium
        </Link>
      </section>
    );
  }

  return null;
}

export default function Home() {
  const { data: session, status } = useSession();
  const [resume, setResume] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const scoreAngle = useMemo(() => `${((result?.score || 0) / 100) * 360}deg`, [result]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!resume) {
      setError("Please upload a PDF or DOCX resume before analyzing.");
      return;
    }

    const formData = new FormData();
    formData.append("resume", resume);
    formData.append("jobDescription", jobDescription);

    setIsLoading(true);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Resume analysis failed.");
      }

      setResult(payload);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Resume analysis failed.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <div className="workspace">
        <aside className="panel input-panel">
          <div className="brand-row">
            <div className="brand-mark">
              <Sparkles size={22} aria-hidden="true" />
            </div>
            <div>
              <p className="eyebrow">ATS Analyzer</p>
              <h1>Resume Analyzer</h1>
            </div>
          </div>

          <div className="auth-panel">
            {status === "authenticated" ? (
              <>
                <div>
                  <p className="eyebrow">Signed in</p>
                  <p className="auth-name">{session.user?.name || session.user?.email}</p>
                </div>
                <div className="auth-actions">
                  <Link className="secondary-button" href="/dashboard">
                    Dashboard
                  </Link>
                  <button className="icon-button" type="button" onClick={() => signOut()}>
                    <LogOut size={17} aria-hidden="true" />
                    <span>Sign out</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="muted">
                  Basic ATS analysis is public. Sign in with Google for AI coaching and saved history.
                </p>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => signIn("google", { redirectTo: "/dashboard" })}
                >
                  <LogIn size={17} aria-hidden="true" />
                  Continue with Google
                </button>
              </>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="resume">Upload resume</label>
              <div className="dropzone">
                <div>
                  <Upload size={28} aria-hidden="true" />
                  <p className="muted">PDF or DOCX, up to 5 MB</p>
                  <input
                    id="resume"
                    className="file-input"
                    type="file"
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={(event) => {
                      setResume(event.target.files?.[0] || null);
                      setResult(null);
                      setError("");
                    }}
                  />
                  {resume ? <p className="file-name">{resume.name}</p> : null}
                </div>
              </div>
            </div>

            <div className="field">
              <div className="label-row">
                <label htmlFor="jobDescription">Job description</label>
                <span className="optional">Optional</span>
              </div>
              <textarea
                id="jobDescription"
                placeholder="Paste the target job description to unlock JD optimization."
                value={jobDescription}
                onChange={(event) => setJobDescription(event.target.value)}
              />
            </div>

            <button className="primary-button" type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="loader" />
                  Analyzing
                </>
              ) : (
                <>
                  <Search size={18} aria-hidden="true" />
                  Analyze Resume
                </>
              )}
            </button>

            {error ? (
              <div className="error" role="alert">
                {error}
              </div>
            ) : null}
          </form>
        </aside>

        {result ? (
          <section className="dashboard" aria-live="polite">
            <div className="panel hero-panel">
              <div className="score-ring" style={{ "--score-angle": scoreAngle } as React.CSSProperties}>
                <div>
                  <strong>{result.score}</strong>
                  <span>ATS Score</span>
                </div>
              </div>
              <div>
                <p className="eyebrow">{result.parsedWordCount} words parsed</p>
                <h2 className="headline">{result.summary}</h2>
                <p className="muted">
                  Review the core ATS score, skill coverage, formatting, and AI coaching status.
                </p>
              </div>
            </div>

            <div className="metric-grid">
              {metrics.map((metric) => {
                const score = result.breakdown[metric.key];
                return (
                  <article className="panel metric" key={metric.key}>
                    <div className="metric-top">
                      <span>{metric.label}</span>
                      <span className="metric-score">{score}/100</span>
                    </div>
                    <div className="bar" style={{ "--bar-width": `${score}%` } as React.CSSProperties}>
                      <span />
                    </div>
                  </article>
                );
              })}
            </div>

            {result.aiAccess.state === "login_required" || result.aiAccess.state === "limit_reached" ? (
              <AiGateCard state={result.aiAccess.state} usage={result.aiUsage} />
            ) : (
              <section className={`panel section-panel coach-panel ${result.aiInsights.status}`}>
                <div className="section-heading">
                  <Brain size={21} aria-hidden="true" />
                  <div>
                    <h2>AI Career Coach</h2>
                    <p className="muted">
                      {result.aiInsights.status === "available"
                        ? `Powered by ${result.aiInsights.model || result.aiInsights.provider}`
                        : "ATS analysis completed successfully"}
                    </p>
                  </div>
                </div>
                <p>{result.aiInsights.careerCoachSummary}</p>
                {result.aiInsights.message ? <p className="muted">{result.aiInsights.message}</p> : null}
                {result.aiUsage ? (
                  <p className="usage-note">
                    Monthly AI usage: {result.aiUsage.used}/{result.aiUsage.limit}
                  </p>
                ) : null}
              </section>
            )}

            {result.savedAnalysisId ? (
              <section className="panel section-panel saved-panel">
                <CheckCircle2 size={19} aria-hidden="true" />
                <span>Saved to your history.</span>
                <Link href={`/dashboard/analyses/${result.savedAnalysisId}`}>Open analysis</Link>
              </section>
            ) : null}

            {result.aiInsights.status === "available" ? (
              <>
                <div className="content-grid">
                  <section className="panel section-panel">
                    <div className="section-heading">
                      <Target size={20} aria-hidden="true" />
                      <h2>Role Fit Analysis</h2>
                    </div>
                    <div className="role-fit">
                      <strong>{result.aiInsights.roleFit.mostSuitableRole}</strong>
                      <span>{result.aiInsights.roleFit.confidence}% confidence</span>
                    </div>
                    <p className="muted">{result.aiInsights.roleFit.reasoning}</p>
                  </section>

                  <ResultList
                    title="Resume Strengths"
                    icon={<CheckCircle2 size={17} color="#0f7b63" aria-hidden="true" />}
                    items={result.aiInsights.strengths.length > 0 ? result.aiInsights.strengths : result.strengths}
                    empty="No strengths detected yet."
                  />
                </div>

                <section className="panel section-panel">
                  <div className="section-heading">
                    <Flame size={20} aria-hidden="true" />
                    <h2>Top 3 Priority Fixes</h2>
                  </div>
                  <div className="fix-grid">
                    {result.aiInsights.priorityFixes.map((fix) => (
                      <article className="fix-card" key={fix.title}>
                        <h3>{fix.title}</h3>
                        <p>
                          <strong>Issue:</strong> {fix.issue}
                        </p>
                        <p>
                          <strong>Reason:</strong> {fix.reason}
                        </p>
                        <p>
                          <strong>Impact:</strong> {fix.expectedImpact}
                        </p>
                      </article>
                    ))}
                  </div>
                </section>

                <section className="panel section-panel">
                  <div className="section-heading">
                    <PenLine size={20} aria-hidden="true" />
                    <h2>Resume Rewrite Suggestions</h2>
                  </div>
                  <div className="rewrite-grid">
                    {result.aiInsights.rewriteSuggestions.map((rewrite) => (
                      <article className="rewrite-card" key={rewrite.section}>
                        <h3>{rewrite.section}</h3>
                        <p className="muted">Current: {rewrite.current}</p>
                        <p>
                          <strong>Suggested:</strong> {rewrite.suggested}
                        </p>
                        <p className="muted">{rewrite.rationale}</p>
                      </article>
                    ))}
                  </div>
                </section>

                {result.aiInsights.jdOptimization ? (
                  <section className="panel section-panel">
                    <div className="section-heading">
                      <WandSparkles size={20} aria-hidden="true" />
                      <h2>JD Optimization</h2>
                    </div>
                    <div className="content-grid compact">
                      <SkillPills
                        title="Must-Have Skills"
                        skills={result.aiInsights.jdOptimization.mustHaveSkills}
                        empty="No must-have skills extracted."
                      />
                      <SkillPills
                        title="JD Missing Skills"
                        skills={result.aiInsights.jdOptimization.missingSkills}
                        empty="No JD-specific missing skills detected."
                        missing
                      />
                      <ResultList
                        title="Experience Gaps"
                        icon={<AlertCircle size={17} color="#b42318" aria-hidden="true" />}
                        items={result.aiInsights.jdOptimization.experienceGaps}
                        empty="No experience gaps detected."
                      />
                      <ResultList
                        title="Optimization Suggestions"
                        icon={<Lightbulb size={17} color="#d97706" aria-hidden="true" />}
                        items={result.aiInsights.jdOptimization.optimizationSuggestions}
                        empty="No JD optimization suggestions available."
                      />
                    </div>
                  </section>
                ) : null}
              </>
            ) : null}

            <div className="content-grid">
              {result.aiAccess.isPremium ? (
                <>
                  <SkillPills
                    title="ATS Matched Skills"
                    skills={result.matchedSkills}
                    empty="No clear skill matches were detected yet."
                  />
                  <SkillPills
                    title="ATS Missing Skills"
                    skills={result.missingSkills}
                    empty="No JD-specific missing skills detected."
                    missing
                  />
                </>
              ) : (
                <SkillSummaryCard
                  matchedCount={result.matchedSkills.length}
                  missingCount={result.missingSkills.length}
                />
              )}
              <ResultList
                title="ATS Suggestions"
                icon={<Lightbulb size={17} color="#d97706" aria-hidden="true" />}
                items={result.suggestions}
                empty="No suggestions available."
              />
              <ResultList
                title="Formatting Issues"
                icon={<AlertCircle size={17} color="#b42318" aria-hidden="true" />}
                items={result.formattingWarnings}
                empty="No major ATS formatting issues detected."
              />
              <SkillPills
                title="Detected Sections"
                skills={result.detectedSections}
                empty="No standard resume sections detected."
              />
            </div>
          </section>
        ) : (
          <section className="empty-state">
            <div className="panel empty-card">
              <div className="empty-icon">
                {isLoading ? <Loader2 size={28} aria-hidden="true" /> : <FileText size={28} aria-hidden="true" />}
              </div>
              <p className="eyebrow">Upload. Paste JD. Analyze.</p>
              <h2 className="headline">Get ATS scoring plus AI career coaching in one dashboard.</h2>
              <p className="muted">
                The dashboard will show category scores, role fit, priority fixes, rewrite
                suggestions, JD optimization, strengths, and formatting feedback.
              </p>
              {error ? <XCircle size={26} color="#b42318" aria-hidden="true" /> : <BarChart3 size={26} color="#0f7b63" aria-hidden="true" />}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
