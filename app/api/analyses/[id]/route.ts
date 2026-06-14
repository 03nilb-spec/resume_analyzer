import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { deleteSavedAnalysis } from "@/lib/history";

export const runtime = "nodejs";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please sign in to delete saved analyses." }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing analysis id." }, { status: 400 });
  }

  const deleted = await deleteSavedAnalysis(session.user.id, id);
  if (!deleted) {
    return NextResponse.json({ error: "Analysis not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

