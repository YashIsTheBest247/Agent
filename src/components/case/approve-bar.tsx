"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * The human approval gate.
 *
 * Approving records that the user has read and accepted the draft. It does not
 * transmit anything — filing stays a deliberate act the person performs with
 * the letter in hand, which is the whole basis of the product's safety claim.
 */
export function ApproveBar({
  caseId,
  letter,
  approvedAt,
}: {
  caseId: string;
  letter: string;
  approvedAt: string | null;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(letter);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable; the letter is on screen to select */
    }
  };

  const approve = async () => {
    setPending(true);
    try {
      await fetch(`/api/cases/${caseId}/approve`, { method: "POST" });
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
          <p className="display text-[15px] font-bold tracking-[-0.015em]">
            {approvedAt ? "You approved this draft" : "Nothing has been sent"}
          </p>
          <p className="mt-1 max-w-md text-[12.5px] leading-relaxed text-[var(--text-3)]">
            {approvedAt
              ? "Copy the letter, attach the checklist items, and file it by the route below."
              : "Read the letter and check the quotes. Approving records that you have reviewed it — Overturn never contacts your insurer."}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 gap-2">
        <Button variant="ghost" size="md" onClick={copy} className="border-white/20 bg-white/10 text-white hover:border-white/30 hover:bg-white/15">
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy letter"}
        </Button>
        {!approvedAt ? (
          <Button variant="lime" size="md" onClick={approve} disabled={pending}>
            {pending ? "Recording…" : "I've reviewed this"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
