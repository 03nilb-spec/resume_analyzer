"use client";

import { FileText, Lock, PenLine, Sparkles, Upload } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";
import type { ResumeRewriteResponse } from "@/lib/types";

function StringList({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="panel section-panel">
      <h2>{title}</h2>
      {items.length > 0 ? (
        <ul className="list">
          {items.map((item) => (
            <li key={item}>
              <Sparkles size={16} color="#0f7b63" aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">No suggestions available yet.</p>
      )}
    </section>
  );
}

export function ResumeRewriterClient({ isPremium }: { isPremium: boolean }) {
  const [resume, setResume] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState<ResumeRewriteResponse | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!resume) {
      setError("Please upload a PDF or DOCX resume before rewriting.");
      return;
    }

    const formData = new FormData();
    formData.append("resume", resume);
    formData.append("jobDescription", jobDescription);

    setIsLoading(true);
    try {
      const response = await fetch("/api/rewrite", {
        method: "POST",
        body: formData
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Resume rewrite failed.");
      }

      setResult(payload);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Resume rewrite failed.");
    } finally {
      setIsLoading(false);
    }
  }

  if (!isPremium) {
    return (
      <main className="app-shell">
        <section className="dashboard-shell">
          <div className="panel hero-panel">
            <div className="empty-icon">
              <Lock size={28} aria-hidden="true" />
            </div>
            <div>
              <p className="eyebrow">Premium Feature</p>
              <h1 className="headline">AI Resume Rewriter</h1>
              <p className="muted">
                Upgrade to generate an improved resume, ATS optimized content, section rewrites,
                missing keywords, stronger bullets, and job-specific improvements.
              </p>
              <Link className="primary-button compact-button" href="/pricing">
                View Premium
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <div className="workspace">
        <aside className="panel input-panel">
          <div className="brand-row">
            <div className="brand-mark">
              <PenLine size={22} aria-hidden="true" />
            </div>
            <div>
              <p className="eyebrow">Premium</p>
              <h1>AI Resume Rewriter</h1>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="rewrite-resume">Upload resume</label>
              <div className="dropzone">
                <div>
                  <Upload size={28} aria-hidden="true" />
                  <p className="muted">PDF or DOCX, up to 5 MB</p>
                  <input
                    id="rewrite-resume"
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
                <label htmlFor="rewrite-job-description">Job description</label>
                <span className="optional">Recommended</span>
              </div>
              <textarea
                id="rewrite-job-description"
                placeholder="Paste the target job description for job-specific rewrite suggestions."
                value={jobDescription}
                onChange={(event) => setJobDescription(event.target.value)}
              />
            </div>

            <button className="primary-button" type="submit" disabled={isLoading}>
              {isLoading ? "Rewriting" : "Rewrite Resume"}
            </button>

            {error ? (
              <div className="error" role="alert">
                {error}
              </div>
            ) : null}
          </form>
        </aside>

        {result ? (
          <section className="dashboard">
            <section className="panel section-panel">
              <div className="section-heading">
                <FileText size={21} aria-hidden="true" />
                <div>
                  <h2>Improved Resume</h2>
                  <p className="muted">Generated by {result.rewrite.model || result.rewrite.provider}</p>
                </div>
              </div>
              {result.rewrite.message ? <p className="usage-note">{result.rewrite.message}</p> : null}
              <pre className="rewrite-output">{result.rewrite.improvedResume}</pre>
            </section>

            <section className="panel section-panel">
              <div className="section-heading">
                <PenLine size={20} aria-hidden="true" />
                <h2>Section Rewriting</h2>
              </div>
              <div className="rewrite-grid">
                {result.rewrite.sectionRewrites.map((rewrite) => (
                  <article className="rewrite-card" key={rewrite.section}>
                    <h3>{rewrite.section}</h3>
                    <p className="muted">Current: {rewrite.current}</p>
                    <p>
                      <strong>Improved:</strong> {rewrite.improved}
                    </p>
                    <p className="muted">{rewrite.rationale}</p>
                  </article>
                ))}
              </div>
            </section>

            <div className="content-grid">
              <StringList title="ATS Optimized Content" items={result.rewrite.atsOptimizedContent} />
              <StringList title="Missing Keywords" items={result.rewrite.missingKeywords} />
              <StringList title="Better Resume Bullets" items={result.rewrite.betterResumeBullets} />
              <StringList title="ATS Improvements" items={result.rewrite.atsImprovements} />
              <StringList title="AI Suggestions" items={result.rewrite.aiSuggestions} />
            </div>
          </section>
        ) : (
          <section className="empty-state">
            <div className="panel empty-card">
              <div className="empty-icon">
                <PenLine size={28} aria-hidden="true" />
              </div>
              <p className="eyebrow">Rewrite. Optimize. Tailor.</p>
              <h2 className="headline">Generate a stronger resume for a specific job.</h2>
              <p className="muted">
                Upload a resume and paste a job description to rewrite Summary, Experience,
                Projects, and Skills with ATS-friendly improvements.
              </p>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

