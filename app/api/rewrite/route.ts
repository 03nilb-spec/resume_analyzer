import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateResumeRewrite } from "@/lib/ai/rewriter";
import { parseResumeFile } from "@/lib/parseResume";
import { isPremiumSession } from "@/lib/premium";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      {
        error: "Sign in to use the AI Resume Rewriter.",
        code: "login_required"
      },
      { status: 401 }
    );
  }

  if (!isPremiumSession(session)) {
    return NextResponse.json(
      {
        error: "AI Resume Rewriter is a Premium feature.",
        code: "premium_required",
        upgradeUrl: "/pricing"
      },
      { status: 402 }
    );
  }

  try {
    const formData = await request.formData();
    const resume = formData.get("resume");
    const jobDescription = formData.get("jobDescription");

    if (!(resume instanceof File)) {
      return NextResponse.json({ error: "Please upload a resume file." }, { status: 400 });
    }

    const resumeText = await parseResumeFile(resume);
    const rewrite = await generateResumeRewrite({
      resumeText,
      jobDescription: typeof jobDescription === "string" ? jobDescription : ""
    });

    return NextResponse.json({
      plan: "premium",
      isPremium: true,
      rewrite
    });
  } catch (error) {
    console.error("Resume rewrite failed:", error);
    return NextResponse.json(
      {
        error: "Unable to rewrite this resume right now. Please try another PDF or DOCX."
      },
      { status: 400 }
    );
  }
}

