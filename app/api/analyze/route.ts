import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateAiInsights } from "@/lib/ai/providerFactory";
import { unavailableAiInsights } from "@/lib/ai/schema";
import { analyzeResume } from "@/lib/analyzer";
import { extractJobTitle, saveResumeAnalysis } from "@/lib/history";
import { parseResumeFile } from "@/lib/parseResume";
import type { AnalyzeResponse, AiInsights } from "@/lib/types";
import { getMonthlyAiUsage, recordAiUsageEvent } from "@/lib/usage";

export const runtime = "nodejs";

async function getOptionalUserId() {
  try {
    const session = await auth();
    return session?.user?.id || null;
  } catch (error) {
    console.error("Auth lookup failed during analysis:", error);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const resume = formData.get("resume");
    const jobDescription = formData.get("jobDescription");

    if (!(resume instanceof File)) {
      return NextResponse.json({ error: "Please upload a resume file." }, { status: 400 });
    }

    const parsedText = await parseResumeFile(resume);
    const jdText = typeof jobDescription === "string" ? jobDescription : "";
    const ats = await analyzeResume(parsedText, jdText);
    const userId = await getOptionalUserId();
    let aiInsights: AiInsights;
    let aiUsage: AnalyzeResponse["aiUsage"];

    if (!userId) {
      aiInsights = unavailableAiInsights(
        "Sign in with Google to unlock AI coaching and saved analysis history."
      );
    } else {
      try {
        const usage = await getMonthlyAiUsage(userId);
        aiUsage = usage;

        if (!usage.allowed) {
          aiInsights = unavailableAiInsights(
            "You have used your 3 free AI analyses this month. Local ATS analysis is still available."
          );
        } else {
          aiInsights = await generateAiInsights({
            resumeText: parsedText,
            jobDescription: jdText,
            ats
          });
          aiUsage = {
            ...usage,
            used: usage.used + 1,
            remaining: Math.max(0, usage.remaining - 1),
            allowed: usage.used + 1 < usage.limit
          };
        }
      } catch (error) {
        console.error("AI usage check failed; returning ATS-only analysis:", error);
        aiInsights = unavailableAiInsights(
          "AI coaching is temporarily unavailable. Local ATS analysis completed successfully."
        );
      }
    }

    const responsePayload: AnalyzeResponse = {
      ...ats,
      aiInsights,
      ...(aiUsage ? { aiUsage } : {})
    };

    if (userId) {
      let savedAnalysisId: string | undefined;

      try {
        savedAnalysisId = await saveResumeAnalysis({
          userId,
          resumeName: resume.name,
          jobTitle: extractJobTitle(jdText),
          analysis: responsePayload
        });

        if (savedAnalysisId) {
          responsePayload.savedAnalysisId = savedAnalysisId;
        }

      } catch (error) {
        console.error("Saving analysis failed; returning completed analysis without history:", error);
      }

      if (aiInsights.status === "available") {
        try {
          await recordAiUsageEvent({
            userId,
            analysisId: savedAnalysisId,
            aiModelUsed: aiInsights.model || aiInsights.provider
          });
        } catch (error) {
          console.error("AI usage event recording failed:", error);
        }
      }
    }

    return NextResponse.json(responsePayload);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to analyze this resume. Please try another PDF or DOCX.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
