"use client";

import { Printer } from "lucide-react";

/**
 * Saving a PDF is the browser's job, not a library's. The print stylesheet in
 * globals.css decides what lands on the page; this just opens the dialogue.
 */
export function PrintButton({ label = "Save as PDF" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      data-print="hide"
      className="press inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--white)] px-4 py-2 font-mono text-[10px] tracking-[0.14em] text-[var(--text-2)] uppercase transition-colors hover:border-[var(--text-3)] hover:text-[var(--ink)]"
    >
      <Printer className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
