import { CheckCircle2, Sparkles } from "lucide-react";
import Link from "next/link";

const freeFeatures = [
  "3 AI analyses/month",
  "Basic ATS score",
  "Skill count summary"
];

const premiumFeatures = [
  "Unlimited AI analyses",
  "Full matched/missing skills",
  "AI resume improvement",
  "Job-specific optimization",
  "Downloadable reports"
];

function FeatureList({ features }: { features: string[] }) {
  return (
    <ul className="list">
      {features.map((feature) => (
        <li key={feature}>
          <CheckCircle2 size={17} color="#0f7b63" aria-hidden="true" />
          <span>{feature}</span>
        </li>
      ))}
    </ul>
  );
}

export default function PricingPage() {
  return (
    <main className="auth-page pricing-page">
      <section className="pricing-shell">
        <div className="pricing-header">
          <div className="brand-mark">
            <Sparkles size={22} aria-hidden="true" />
          </div>
          <p className="eyebrow">Pricing</p>
          <h1>Choose how deeply you want to analyze your resume</h1>
          <p className="muted">Premium checkout is coming soon. For now, this page shows the planned upgrade path.</p>
        </div>

        <div className="pricing-grid">
          <article className="panel section-panel pricing-card">
            <h2>Free Plan</h2>
            <FeatureList features={freeFeatures} />
            <Link className="secondary-button" href="/">
              Continue Free
            </Link>
          </article>

          <article className="panel section-panel pricing-card premium-plan">
            <h2>Premium Plan</h2>
            <FeatureList features={premiumFeatures} />
            <Link className="secondary-button" href="/rewriter">
              Preview AI Rewriter
            </Link>
            <button className="primary-button compact-button" type="button" disabled>
              Buy Premium
            </button>
          </article>
        </div>
      </section>
    </main>
  );
}
