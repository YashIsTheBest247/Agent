"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * The contractor's gate. Approving records that they have read the quote and
 * checked the maths — it sends nothing to their customer, and nothing in this
 * codebase does.
 */
export function QuoteApproveBar({
  quoteId,
  documentText,
  approvedAt,
}: {
  quoteId: string;
  documentText: string;
  approvedAt: string | null;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(documentText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable; the quote is on screen to select */
    }
  };

  const approve = async () => {
    setPending(true);
    try {
      await fetch(`/api/quotes/${quoteId}/approve`, { method: "POST" });
      router.refresh();
    } finally {
      setPending(false);
    }
  };

  const remove = async () => {
    setPending(true);
    try {
      await fetch(`/api/quotes/${quoteId}`, { method: "DELETE" });
      router.push("/quotes");
      router.refresh();
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-[var(--r-lg)] bg-[var(--ink)] p-5 text-white sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div className="flex gap-3">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[var(--lime)]" />
        <div>
          <p className="display text-[15px] tracking-[-0.015em]">
            {approvedAt ? "You approved this quote" : "Nothing has been sent"}
          </p>
          <p className="mt-1 max-w-md text-[12.5px] leading-relaxed text-[var(--text-3)]">
            {approvedAt
              ? "Copy it into your own template, or send it as it stands."
              : "Check the lines against your book and the exclusions against the job. Approving records that you have read it — the desk never contacts your customer."}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {confirming ? (
          <>
            <button
              type="button"
              onClick={remove}
              disabled={pending}
              className="press rounded-full border border-white/25 bg-white/10 px-3 py-1.5 font-mono text-[10px] tracking-[0.14em] text-white uppercase disabled:opacity-50"
            >
              {pending ? "Deleting…" : "Confirm delete"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="press font-mono text-[10px] tracking-[0.14em] text-[var(--text-3)] uppercase hover:text-white"
            >
              Keep
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            aria-label="Delete this quote"
            className="press flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-3)] transition-colors hover:bg-white/10 hover:text-white"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}

        <Button
          variant="ghost"
          size="md"
          onClick={copy}
          className="border-white/20 bg-white/10 text-white hover:border-white/30 hover:bg-white/15"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy quote"}
        </Button>

        {!approvedAt ? (
          <Button variant="lime" size="md" onClick={approve} disabled={pending}>
            {pending ? "Recording…" : "I've checked it"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
