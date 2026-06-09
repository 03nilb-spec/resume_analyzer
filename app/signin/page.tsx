import { LogIn, Sparkles } from "lucide-react";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";

export default async function SignInPage({
  searchParams
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  const { callbackUrl } = await searchParams;

  if (session?.user) {
    redirect(callbackUrl || "/dashboard");
  }

  async function signInWithGoogle() {
    "use server";
    await signIn("google", { redirectTo: callbackUrl || "/dashboard" });
  }

  return (
    <main className="auth-page">
      <section className="panel auth-card">
        <div className="brand-mark">
          <Sparkles size={22} aria-hidden="true" />
        </div>
        <p className="eyebrow">Resume Analyzer</p>
        <h1>Sign in for AI coaching and history</h1>
        <p className="muted">
          Google login unlocks monthly AI usage, saved analyses, and your private dashboard.
        </p>
        <form action={signInWithGoogle}>
          <button className="primary-button" type="submit">
            <LogIn size={18} aria-hidden="true" />
            Continue with Google
          </button>
        </form>
      </section>
    </main>
  );
}

