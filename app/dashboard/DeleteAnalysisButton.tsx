"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteAnalysisButton({
  analysisId,
  redirectToDashboard = false
}: {
  analysisId: string;
  redirectToDashboard?: boolean;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm("Are you sure you want to delete this saved analysis?");
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/analyses/${analysisId}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Unable to delete this saved analysis.");
      }

      if (redirectToDashboard) {
        router.push("/dashboard");
      } else {
        router.refresh();
      }
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to delete this saved analysis.");
      setIsDeleting(false);
    }
  }

  return (
    <button className="danger-button" type="button" disabled={isDeleting} onClick={handleDelete}>
      <Trash2 size={16} aria-hidden="true" />
      {isDeleting ? "Deleting" : "Delete"}
    </button>
  );
}

