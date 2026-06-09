import { CalendarDays, FileText, LogOut, Sparkles, Target } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
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

  async function signOutAction() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

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
            <form action={signOutAction}>
              <button className="icon-button" type="submit">
                <LogOut size={17} aria-hidden="true" />
                Sign out
              </button>
            </form>
          </div>
        </header>

        <div className="metric-grid">
          <article className="panel metric stat-card">
            <FileText size={20} aria-hidden="true" />
            <span>Total analyses</span>
            <strong>{dashboard.totalAnalyses}</strong>
          </article>
          <article className="panel metric stat-card">
            <Sparkles size={20} aria-hidden="true" />
            <span>Monthly AI usage</span>
            <strong>
              {dashboard.monthlyAiUsed}/{dashboard.monthlyAiLimit}
            </strong>
          </article>
          <article className="panel metric stat-card">
            <Target size={20} aria-hidden="true" />
            <span>Latest ATS score</span>
            <strong>{dashboard.history[0]?.atsScore ?? "-"}</strong>
          </article>
          <article className="panel metric stat-card">
            <CalendarDays size={20} aria-hidden="true" />
            <span>Latest analysis</span>
            <strong>{dashboard.history[0] ? formatDate(dashboard.history[0].createdAt) : "-"}</strong>
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
                <Link className="history-row" href={`/dashboard/analyses/${analysis.id}`} key={analysis.id}>
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

