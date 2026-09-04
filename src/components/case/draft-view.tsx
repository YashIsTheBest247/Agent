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
          ? "bg-flag-100 text-flag-500 ring-1 ring-flag-500/30"
          : active
            ? "bg-leaf-500 text-white"
            : "bg-leaf-100 text-leaf-800 ring-1 ring-leaf-300/60 hover:bg-leaf-200",
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
          <strong key={j} className="font-semibold text-ink-900">
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
              className="mt-3 font-sans text-[15px] font-bold tracking-[-0.015em] text-ink-900"
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
                <li key={j} className="flex gap-2.5 text-[13.5px] leading-relaxed text-ink-700">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-ink-300" />
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
          <p key={i} className="text-[13.5px] leading-relaxed whitespace-pre-line text-ink-700">
            {renderInline(trimmed, citations, selected, onSelect)}
          </p>
        );
      })}
    </div>
  );
}

const statusCopy: Record<VerifiedCitation["status"], { label: string; tone: string }> = {
  verified: { label: "Verified in source", tone: "text-leaf-700" },
  near_match: { label: "Verified, minor wording drift", tone: "text-leaf-700" },
  not_found: { label: "Not found in source", tone: "text-flag-500" },
  missing_document: { label: "Document not uploaded", tone: "text-flag-500" },
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
      <article className="rounded-card-lg bg-white p-6 ring-1 ring-ink-200/70 sm:p-8">
        <p className="text-[11px] font-semibold tracking-[0.12em] text-ink-400 uppercase">
          Draft appeal — not sent
        </p>

        {draft.recipientBlock ? (
          <pre className="mt-5 font-body text-[12.5px] leading-relaxed whitespace-pre-wrap text-ink-500">
            {draft.recipientBlock}
          </pre>
        ) : null}

        <h2 className="mt-5 font-sans text-lg leading-snug font-bold tracking-[-0.02em] text-ink-900">
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
          <div className="mt-7 border-t border-ink-200/70 pt-5">
            <p className="text-[12px] font-semibold text-ink-900">Enclosures</p>
            <ul className="mt-2 flex flex-col gap-1">
              {draft.enclosures.map((e) => (
                <li key={e} className="text-[12.5px] text-ink-500">
                  — {e}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </article>

      <aside className="flex flex-col gap-4">
        <div className="rounded-card-lg bg-white p-5 ring-1 ring-ink-200/70">
          <div className="flex items-center gap-2">
            {audit?.passed ? (
              <CheckCircle2 className="h-4 w-4 text-leaf-600" />
            ) : (
              <FileWarning className="h-4 w-4 text-flag-500" />
            )}
            <h3 className="font-sans text-[14px] font-bold tracking-[-0.015em] text-ink-900">
              Citation audit
            </h3>
          </div>
          <p className="mt-2 text-[12.5px] leading-relaxed text-ink-500">
            {audit
              ? audit.passed
                ? `Every one of the ${audit.checked.length} quotes in this letter was found in the document it cites.`
                : `${audit.blocking.length} quote${audit.blocking.length === 1 ? "" : "s"} could not be found in the source. This draft is held back.`
              : "Not yet audited."}
          </p>
        </div>

        <div className="rounded-card-lg bg-white p-5 ring-1 ring-ink-200/70">
          <h3 className="font-sans text-[14px] font-bold tracking-[-0.015em] text-ink-900">
            Sources
          </h3>
          <p className="mt-1 text-[12px] text-ink-400">
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
                        ? "bg-leaf-50 ring-leaf-300"
                        : "bg-surface-muted ring-ink-200/60 hover:bg-ink-100",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span className="rounded-full bg-white px-1.5 py-px text-[10.5px] font-semibold text-ink-700 ring-1 ring-ink-200">
                        {c.id}
                      </span>
                      <span className={cn("text-[11px] font-medium", copy.tone)}>
                        {copy.label}
                      </span>
                    </span>
                    <span className="mt-1.5 block text-[12px] leading-snug text-ink-600">
                      {c.supports}
                    </span>
                  </button>
                </li>
              );
            })}
            {citations.size === 0 ? (
              <li className="text-[12.5px] text-ink-400">
                This letter rests on general standards rather than quoted documents.
              </li>
            ) : null}
          </ul>
        </div>

        {open ? (
          <div className="rounded-card-lg bg-ink-900 p-5 text-white">
            <div className="flex items-center gap-2">
              <QuoteIcon className="h-3.5 w-3.5 text-leaf-400" />
              <p className="text-[11px] font-semibold tracking-[0.1em] text-ink-400 uppercase">
                {open.documentId}
                {open.page ? ` · page ${open.page}` : ""}
              </p>
            </div>
            <blockquote className="mt-3 text-[13px] leading-relaxed text-white/90">
              “{open.quote}”
            </blockquote>
            {open.status === "near_match" && open.matchedText ? (
              <p className="mt-3 border-t border-white/10 pt-3 text-[11.5px] leading-relaxed text-ink-400">
                Source reads: “{open.matchedText}”
              </p>
            ) : null}
          </div>
        ) : null}
      </aside>
    </div>
  );
}
