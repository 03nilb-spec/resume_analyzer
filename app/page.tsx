"use client";

import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  FileText,
  Lightbulb,
  Loader2,
  Search,
  Sparkles,
  Upload,
  XCircle
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import type { ResumeAnalysisResult, ScoreBreakdown } from "@/lib/types";

const metrics: Array<{
  key: keyof ScoreBreakdown;
  label: string;
  weight: string;
}> = [
  { key: "keyword", label: "Keyword Match", weight: "40%" },
  { key: "semantic", label: "Semantic Similarity", weight: "30%" },
  { key: "experience", label: "Experience Relevance", weight: "20%" },
  { key: "formatting", label: "Formatting", weight: "10%" }
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

export default function Home() {
  const [resume, setResume] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState<ResumeAnalysisResult | null>(null);
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
              <p className="eyebrow">Phase 1 ATS Analyzer</p>
              <h1>Resume Analyzer</h1>
            </div>
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
                placeholder="Paste the target job description to make the score JD-aware."
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
                  Weighted score: keyword match 40%, semantic similarity 30%, experience
                  relevance 20%, and formatting 10%.
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
                      <span className="metric-score">
                        {score}/100 · {metric.weight}
                      </span>
                    </div>
                    <div className="bar" style={{ "--bar-width": `${score}%` } as React.CSSProperties}>
                      <span />
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="content-grid">
              <SkillPills
                title="Matched Skills"
                skills={result.matchedSkills}
                empty="No clear skill matches were detected yet."
              />
              <SkillPills
                title="Missing Skills"
                skills={result.missingSkills}
                empty="No JD-specific missing skills detected."
                missing
              />
              <ResultList
                title="Suggestions"
                icon={<Lightbulb size={17} color="#d97706" aria-hidden="true" />}
                items={result.suggestions}
                empty="No suggestions available."
              />
              <ResultList
                title="Resume Strengths"
                icon={<CheckCircle2 size={17} color="#0f7b63" aria-hidden="true" />}
                items={result.strengths}
                empty="Upload a stronger text-based resume to detect strengths."
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
              <h2 className="headline">Get an ATS-friendly resume score with precise improvement areas.</h2>
              <p className="muted">
                The dashboard will show category scores, missing skills, matched skills,
                formatting feedback, strengths, and practical suggestions.
              </p>
              {error ? <XCircle size={26} color="#b42318" aria-hidden="true" /> : <BarChart3 size={26} color="#0f7b63" aria-hidden="true" />}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
