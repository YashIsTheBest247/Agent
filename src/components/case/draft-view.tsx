"use client";

import { Fragment, useState } from "react";
import { CheckCircle2, FileWarning, Quote as QuoteIcon } from "lucide-react";
import type { AppealDraft, AuditReport, VerifiedCitation } from "@/lib/domain/appeal";
import { cn } from "@/lib/utils";

/** Inline `[c1]` markers become chips that open the quote they stand for. */
function CitationChip({
  id,
  citation,
  onSelect,
  active,
}: {
  id: string;
  citation: VerifiedCitation | undefined;
  onSelect: () => void;
  active: boolean;
}) {
  const unresolved = !citation || citation.status === "not_found" ||
    citation.status === "missing_document";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "mx-0.5 inline-flex translate-y-[-1px] items-center rounded-full px-1.5 py-px align-middle text-[10.5px] font-semibold transition-colors",
        unresolved
          ? "bg-[var(--risk-red-wash)] text-[var(--risk-red)] ring-1 ring-[var(--risk-red)]/30"
          : active
            ? "bg-[var(--lime)] text-white"
            : "bg-[var(--lime-wash)] text-[var(--ok-deep)] ring-1 ring-[var(--lime-deep)] hover:bg-[var(--lime)]",
      )}
      title={citation?.quote ?? "This citation was never produced"}
    >
      {id}
    </button>
  );
}

function renderInline(
  text: string,
  citations: Map<string, VerifiedCitation>,
  selected: string | null,
  onSelect: (id: string) => void,
) {
  const parts = text.split(/(\[[a-z]\d+(?:_\d+)?\])/g);

  return parts.map((part, i) => {
    const match = /^\[([a-z]\d+(?:_\d+)?)\]$/.exec(part);
    if (!match) {
      // Render **bold** without a markdown dependency.
      const bolded = part.split(/(\*\*[^*]+\*\*)/g).map((chunk, j) =>
        chunk.startsWith("**") && chunk.endsWith("**") ? (
          <strong key={j} className="font-semibold text-[var(--ink)]">
            {chunk.slice(2, -2)}
          </strong>
        ) : (
          <Fragment key={j}>{chunk}</Fragment>
        ),
      );
      return <Fragment key={i}>{bolded}</Fragment>;
    }

    const id = match[1];
    return (
      <CitationChip
        key={i}
        id={id}
        citation={citations.get(id)}
        active={selected === id}
        onSelect={() => onSelect(id)}
      />
    );
  });
}

function Body({
  body,
  citations,
  selected,
  onSelect,
}: {
  body: string;
  citations: Map<string, VerifiedCitation>;
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  const blocks = body.split(/\n{2,}/);

  return (
    <div className="flex flex-col gap-3.5">
      {blocks.map((block, i) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        const heading = /^#{1,4}\s+(.*)$/.exec(trimmed);
        if (heading) {
          return (
            <h3
              key={i}
              className="mt-3 display text-[15px] font-bold tracking-[-0.015em] text-[var(--ink)]"
            >
              {renderInline(heading[1], citations, selected, onSelect)}
            </h3>
          );
        }

        const isList = trimmed.split("\n").every((l) => /^\s*[-*]\s+/.test(l));
        if (isList) {
          return (
            <ul key={i} className="flex flex-col gap-1.5 pl-1">
              {trimmed.split("\n").map((line, j) => (
                <li key={j} className="flex gap-2.5 text-[13.5px] leading-relaxed text-[var(--text)]">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[var(--text-3)]" />
                  <span>
                    {renderInline(
                      line.replace(/^\s*[-*]\s+/, ""),
                      citations,
                      selected,
                      onSelect,
                    )}
                  </span>
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={i} className="text-[13.5px] leading-relaxed whitespace-pre-line text-[var(--text)]">
            {renderInline(trimmed, citations, selected, onSelect)}
          </p>
        );
      })}
    </div>
  );
}

const statusCopy: Record<VerifiedCitation["status"], { label: string; tone: string }> = {
  verified: { label: "Verified in source", tone: "text-[var(--ok-deep)]" },
  near_match: { label: "Verified, minor wording drift", tone: "text-[var(--ok-deep)]" },
  not_found: { label: "Not found in source", tone: "text-[var(--risk-red)]" },
  missing_document: { label: "Document not uploaded", tone: "text-[var(--risk-red)]" },
};

export function DraftView({
  draft,
  audit,
}: {
  draft: AppealDraft;
  audit: AuditReport | null;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  const citations = new Map<string, VerifiedCitation>(
    (audit?.checked ?? []).map((c) => [c.id, c]),
  );
  const open = selected ? citations.get(selected) : undefined;

  return (
    <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
      <article className="rounded-[var(--r-lg)] bg-white p-6 ring-1 ring-[var(--line)] sm:p-8">
        <p className="text-[11px] font-semibold tracking-[0.12em] text-[var(--text-3)] uppercase">
          Draft appeal — not sent
        </p>

        {draft.recipientBlock ? (
          <pre className="mt-5 font-sans text-[12.5px] leading-relaxed whitespace-pre-wrap text-[var(--text-2)]">
            {draft.recipientBlock}
          </pre>
        ) : null}

        <h2 className="mt-5 display text-lg leading-snug font-bold tracking-[-0.02em] text-[var(--ink)]">
          {draft.subject}
        </h2>

        <div className="mt-5">
          <Body
            body={draft.body}
            citations={citations}
            selected={selected}
            onSelect={(id) => setSelected((cur) => (cur === id ? null : id))}
          />
        </div>

        {draft.enclosures.length > 0 ? (
          <div className="mt-7 border-t border-[var(--line)] pt-5">
            <p className="text-[12px] font-semibold text-[var(--ink)]">Enclosures</p>
            <ul className="mt-2 flex flex-col gap-1">
              {draft.enclosures.map((e) => (
                <li key={e} className="text-[12.5px] text-[var(--text-2)]">
                  — {e}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </article>

      <aside className="flex flex-col gap-4">
        <div className="rounded-[var(--r-lg)] bg-white p-5 ring-1 ring-[var(--line)]">
          <div className="flex items-center gap-2">
            {audit?.passed ? (
              <CheckCircle2 className="h-4 w-4 text-[var(--ok-deep)]" />
            ) : (
              <FileWarning className="h-4 w-4 text-[var(--risk-red)]" />
            )}
            <h3 className="display text-[14px] font-bold tracking-[-0.015em] text-[var(--ink)]">
              Citation audit
            </h3>
          </div>
          <p className="mt-2 text-[12.5px] leading-relaxed text-[var(--text-2)]">
            {audit
              ? audit.passed
                ? `Every one of the ${audit.checked.length} quotes in this letter was found in the document it cites.`
                : `${audit.blocking.length} quote${audit.blocking.length === 1 ? "" : "s"} could not be found in the source. This draft is held back.`
              : "Not yet audited."}
          </p>
        </div>

        <div className="rounded-[var(--r-lg)] bg-white p-5 ring-1 ring-[var(--line)]">
          <h3 className="display text-[14px] font-bold tracking-[-0.015em] text-[var(--ink)]">
            Sources
          </h3>
          <p className="mt-1 text-[12px] text-[var(--text-3)]">
            Click a marker in the letter, or a row here.
          </p>

          <ul className="mt-4 flex flex-col gap-2">
            {[...citations.values()].map((c) => {
              const copy = statusCopy[c.status];
              const isOpen = selected === c.id;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(isOpen ? null : c.id)}
                    className={cn(
                      "w-full rounded-2xl p-3 text-left ring-1 transition-colors",
                      isOpen
                        ? "bg-[var(--lime-wash)] ring-[var(--lime-deep)]"
                        : "bg-[var(--paper)] ring-[var(--line)] hover:bg-[var(--paper-2)]",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span className="rounded-full bg-white px-1.5 py-px text-[10.5px] font-semibold text-[var(--text)] ring-1 ring-[var(--line)]">
                        {c.id}
                      </span>
                      <span className={cn("text-[11px] font-medium", copy.tone)}>
                        {copy.label}
                      </span>
                    </span>
                    <span className="mt-1.5 block text-[12px] leading-snug text-[var(--text-2)]">
                      {c.supports}
                    </span>
                  </button>
                </li>
              );
            })}
            {citations.size === 0 ? (
              <li className="text-[12.5px] text-[var(--text-3)]">
                This letter rests on general standards rather than quoted documents.
              </li>
            ) : null}
          </ul>
        </div>

        {open ? (
          <div className="rounded-[var(--r-lg)] bg-[var(--ink)] p-5 text-white">
            <div className="flex items-center gap-2">
              <QuoteIcon className="h-3.5 w-3.5 text-[var(--lime)]" />
              <p className="text-[11px] font-semibold tracking-[0.1em] text-[var(--text-3)] uppercase">
                {open.documentId}
                {open.page ? ` · page ${open.page}` : ""}
              </p>
            </div>
            <blockquote className="mt-3 text-[13px] leading-relaxed text-white/90">
              “{open.quote}”
            </blockquote>
            {open.status === "near_match" && open.matchedText ? (
              <p className="mt-3 border-t border-white/10 pt-3 text-[11.5px] leading-relaxed text-[var(--text-3)]">
                Source reads: “{open.matchedText}”
              </p>
            ) : null}
          </div>
        ) : null}
      </aside>
    </div>
  );
}
