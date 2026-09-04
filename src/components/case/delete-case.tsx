"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

/**
 * Deleting a case drops the uploads, the transcriptions, the citations and the
 * draft together — the safeguards section promises exactly that, so it needs a
 * way to be reached. Two-step, because there is no undo behind it.
 */
export function DeleteCase({ caseId }: { caseId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);

  const remove = async () => {
    setPending(true);
    try {
      await fetch(`/api/cases/${caseId}`, { method: "DELETE" });
      router.push("/cases");
      router.refresh();
    } finally {
      setPending(false);
    }
  };

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="press inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.14em] text-[var(--text-3)] uppercase transition-colors hover:text-[var(--risk-red)]"
      >
        <Trash2 className="h-3.5 w-3.5" />
        Delete this case
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-[12.5px] text-[var(--text-2)]">
        Delete the documents, the draft and the trace? This cannot be undone.
      </span>
      <button
        type="button"
        onClick={remove}
        disabled={pending}
        className="press rounded-full border border-[var(--risk-red)]/40 bg-[var(--risk-red-wash)] px-3 py-1.5 font-mono text-[10px] tracking-[0.14em] text-[#8f1f1f] uppercase disabled:opacity-50"
      >
        {pending ? "Deleting…" : "Delete"}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="press font-mono text-[10px] tracking-[0.14em] text-[var(--text-3)] uppercase hover:text-[var(--ink)]"
      >
        Keep
      </button>
    </div>
  );
}
