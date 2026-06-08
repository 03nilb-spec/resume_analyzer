import { NextResponse } from "next/server";
import { analyzeResume } from "@/lib/analyzer";
import { parseResumeFile } from "@/lib/parseResume";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const resume = formData.get("resume");
    const jobDescription = formData.get("jobDescription");

    if (!(resume instanceof File)) {
      return NextResponse.json({ error: "Please upload a resume file." }, { status: 400 });
    }

    const parsedText = await parseResumeFile(resume);
    const analysis = await analyzeResume(
      parsedText,
      typeof jobDescription === "string" ? jobDescription : ""
    );

    return NextResponse.json(analysis);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to analyze this resume. Please try another PDF or DOCX.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
