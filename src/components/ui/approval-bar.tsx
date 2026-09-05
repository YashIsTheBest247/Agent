"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * The human gate, shared by all three desks.
 *
 * Approving records that a person has read the document and accepted it. It
 * transmits nothing — no letter to a payer, no quote to a customer, no
 * confirmation to a buyer. Nothing in this codebase sends anything outward,
 * and this control is where that promise is kept.
 */
export function ApprovalBar({
  recordId,
  basePath,
  listPath,
  copyText,
  approvedAt,
  headline,
  blurb,
  approvedHeadline,
  approvedBlurb,
  approveLabel = "I've checked it",
  copyLabel = "Copy",
}: {
  recordId: string;
  /** API base, e.g. "/api/orders". Approve posts to `${basePath}/${id}/approve`. */
  basePath: string;
  listPath: string;
  copyText: string;
  approvedAt: string | null;
  headline: string;
  blurb: string;
  approvedHeadline: string;
  approvedBlurb: string;
  approveLabel?: string;
  copyLabel?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable; the text is on screen to select */
    }
  };

  const approve = async () => {
    setPending(true);
    try {
      await fetch(`${basePath}/${recordId}/approve`, { method: "POST" });
      router.refresh();
    } finally {
      setPending(false);
    }
  };

  const remove = async () => {
    setPending(true);
    try {
      await fetch(`${basePath}/${recordId}`, { method: "DELETE" });
      router.push(listPath);
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
            {approvedAt ? approvedHeadline : headline}
          </p>
          <p className="mt-1 max-w-md text-[12.5px] leading-relaxed text-[var(--text-3)]">
            {approvedAt ? approvedBlurb : blurb}
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
            aria-label="Delete this record"
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
          {copied ? "Copied" : copyLabel}
        </Button>

        {!approvedAt ? (
          <Button variant="lime" size="md" onClick={approve} disabled={pending}>
            {pending ? "Recording…" : approveLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
