import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isPremiumSession } from "@/lib/premium";
import { ResumeRewriterClient } from "@/app/rewriter/ResumeRewriterClient";

export default async function RewriterPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/signin?callbackUrl=/rewriter");
  }

  return <ResumeRewriterClient isPremium={isPremiumSession(session)} />;
}

