import { BarChart3, CalendarDays, FileText, Sparkles, Target } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DeleteAnalysisButton } from "@/app/dashboard/DeleteAnalysisButton";
import { SignOutButton } from "@/app/dashboard/SignOutButton";
import { getDashboardData } from "@/lib/history";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/signin?callbackUrl=/dashboard");
  }

  const dashboard = await getDashboardData(session.user.id);

  return (
    <main className="app-shell">
      <section className="dashboard-shell">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">Dashboard</p>
            <h1>Analysis History</h1>
            <p className="muted">{session.user.name || session.user.email}</p>
          </div>
          <div className="dashboard-actions">
            <Link className="secondary-button" href="/">
              New analysis
            </Link>
            <Link className="secondary-button" href="/rewriter">
              AI Rewriter
            </Link>
            <SignOutButton />
          </div>
        </header>

        <div className="metric-grid">
          <article className="panel metric stat-card">
            <Target size={20} aria-hidden="true" />
            <span>Best ATS Score</span>
            <strong>{dashboard.bestAtsScore ?? "-"}</strong>
          </article>
          <article className="panel metric stat-card">
            <BarChart3 size={20} aria-hidden="true" />
            <span>Latest ATS Score</span>
            <strong>{dashboard.latestAtsScore ?? "-"}</strong>
          </article>
          <article className="panel metric stat-card">
            <FileText size={20} aria-hidden="true" />
            <span>Total Saved Analyses</span>
            <strong>{dashboard.totalAnalyses}</strong>
          </article>
          <article className="panel metric stat-card">
            <Sparkles size={20} aria-hidden="true" />
            <span>AI Analyses Used This Month</span>
            <strong>{dashboard.monthlyAiUsed}</strong>
          </article>
          <article className="panel metric stat-card">
            <CalendarDays size={20} aria-hidden="true" />
            <span>AI Analyses Remaining This Month</span>
            <strong>{dashboard.monthlyAiRemaining}</strong>
          </article>
        </div>

        <section className="panel section-panel">
          <div className="section-heading">
            <FileText size={20} aria-hidden="true" />
            <h2>Previous Analysis History</h2>
          </div>
          {dashboard.history.length > 0 ? (
            <div className="history-list">
              {dashboard.history.map((analysis) => (
                <div className="history-row" key={analysis.id}>
                  <Link className="history-main" href={`/dashboard/analyses/${analysis.id}`}>
                    <div>
                      <strong>{analysis.resumeName}</strong>
                      <span>{analysis.jobTitle || "General analysis"}</span>
                    </div>
                    <div>
                      <strong>{analysis.atsScore}</strong>
                      <span>ATS score</span>
                    </div>
                    <div>
                      <strong>{analysis.aiModelUsed || "none"}</strong>
                      <span>AI model</span>
                    </div>
                    <div>
                      <strong>{formatDate(analysis.createdAt)}</strong>
                      <span>Created</span>
                    </div>
                  </Link>
                  <DeleteAnalysisButton analysisId={analysis.id} />
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">Your completed logged-in analyses will appear here.</p>
          )}
        </section>
      </section>
    </main>
  );
}
