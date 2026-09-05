import Link from "next/link";
import {
  AlertTriangle,
  ClipboardList,
  FileText,
  HardHat,
  ShieldQuestion,
  TriangleAlert,
} from "lucide-react";
import { AgentTimeline } from "@/components/case/agent-timeline";
import { ApprovalBar } from "@/components/ui/approval-bar";
import { QuoteMoney } from "@/components/quote/quote-money";
import { StatusBadge } from "@/components/ui/status-badge";
import { Pill } from "@/components/ui/pill";
import { PrintButton } from "@/components/ui/print-button";
import { cn, formatMoney } from "@/lib/utils";


function Section({
  title,
  icon: Icon,
  children,
  printHide,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  /** The agent trace belongs on screen, not in a document you send. */
  printHide?: boolean;
}) {
  return (
    <section
      data-print={printHide ? "hide" : "block"}
      className="card p-6"
    >
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--lime-wash)] text-[var(--ok-deep)]">
          <Icon className="h-4 w-4" />
        </span>
        <h2 className="display text-[15px] tracking-[-0.015em]">{title}</h2>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

/** Renders the writer's markdown-ish prose without a markdown dependency. */
function Prose({ text }: { text: string }) {
  return (
    <div className="flex flex-col gap-3">
      {text
        .split(/\n{2,}/)
        .map((block) => block.trim())
        .filter(Boolean)
        .map((block, i) => {
          const heading = /^#{1,4}\s+(.*)$/.exec(block);
          if (heading) {
            return (
              <h3
                key={i}
                className="display mt-2 text-[15px] tracking-[-0.015em]"
              >
                {heading[1]}
              </h3>
            );
          }
          const isList = block.split("\n").every((l) => /^\s*[-*]\s+/.test(l));
          if (isList) {
            return (
              <ul key={i} className="flex flex-col gap-1.5">
                {block.split("\n").map((line, j) => (
                  <li
                    key={j}
                    className="flex gap-2.5 text-[13.5px] leading-relaxed text-[var(--text-2)]"
                  >
                    <span className="mt-[8px] h-1 w-1 shrink-0 rounded-full bg-[var(--text-3)]" />
                    {line.replace(/^\s*[-*]\s+/, "")}
                  </li>
                ))}
              </ul>
            );
          }
          return (
            <p
              key={i}
              className="text-[13.5px] leading-relaxed whitespace-pre-line text-[var(--text-2)]"
            >
              {block}
            </p>
          );
        })}
    </div>
  );
}

function List({ items, tone }: { items: string[]; tone?: "warn" }) {
  if (items.length === 0) {
    return <p className="text-[13px] text-[var(--text-3)]">None stated.</p>;
  }
  return (
    <ul className="flex flex-col gap-1.5">
      {items.map((item) => (
        <li
          key={item}
          className="flex gap-2.5 text-[13px] leading-relaxed text-[var(--text-2)]"
        >
          <span
            className={cn(
              "mt-[7px] h-1 w-1 shrink-0 rounded-full",
              tone === "warn" ? "bg-[var(--risk-amber)]" : "bg-[var(--lime-deep)]",
            )}
          />
          {item}
        </li>
      ))}
    </ul>
  );
}
import type { QuoteRecord } from "@/lib/desks/quotes/record";

/**
 * The full record view, shared by the live desk page and the recorded demo.
 *
 * `readOnly` hides the approval gate: a recorded run is not something anyone
 * can approve or delete.
 */
export function QuoteDetail({
  record,
  readOnly = false,
}: {
  record: QuoteRecord;
  readOnly?: boolean;
}) {
  const { math, document: doc, scope, risk, challenge, notes } = record;
  const currency = record.currency;

  const plainText = doc
    ? [
        doc.title,
        "",
        doc.intro,
        "",
        doc.scopeNarrative,
        "",
        `Included: ${doc.inclusions.join("; ")}`,
        `Not included: ${doc.exclusions.join("; ")}`,
        `Assumptions: ${doc.assumptions.join("; ")}`,
        "",
        math?.passed
          ? `Total: ${formatMoney(math.totalCents, { currency })} (including ${formatMoney(math.taxCents, { currency })} tax)`
          : "",
        "",
        doc.validityNote,
        doc.nextStep,
      ]
        .filter(Boolean)
        .join("\n")
    : "";

  return (
    <div data-print="page" className="mx-auto flex max-w-[1240px] flex-col gap-5">
      {/* ---- Header ---- */}
      <header data-print="block" className="card p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={record.status} />
          <Pill tone="neutral">{record.priceBookName}</Pill>
          {record.revisionRounds > 0 ? (
            <Pill tone="neutral">
              {record.revisionRounds} revision
              {record.revisionRounds === 1 ? "" : "s"}
            </Pill>
          ) : null}
          <span className="ml-auto" data-print="hide">
            <PrintButton label="Save quote as PDF" />
          </span>
        </div>

        <h1 className="display mt-4 text-[clamp(1.5rem,3.5vw,2.25rem)] leading-tight tracking-[-0.03em]">
          {record.customerName}
        </h1>

        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 lg:grid-cols-4">
          <div>
            <dt className="font-mono text-[9.5px] tracking-[0.12em] text-[var(--text-3)] uppercase">
              Total to quote
            </dt>
            <dd className="display mt-1 text-2xl tracking-[-0.03em]">
              {math?.passed
                ? formatMoney(math.totalCents, { currency })
                : "Held back"}
            </dd>
          </div>
          <div>
            <dt className="font-mono text-[9.5px] tracking-[0.12em] text-[var(--text-3)] uppercase">
              Cost
            </dt>
            <dd className="display mt-1 text-2xl tracking-[-0.03em]">
              {math ? formatMoney(math.costSubtotalCents, { currency }) : "—"}
            </dd>
          </div>
          <div>
            <dt className="font-mono text-[9.5px] tracking-[0.12em] text-[var(--text-3)] uppercase">
              Contingency
            </dt>
            <dd className="display mt-1 text-2xl tracking-[-0.03em]">
              {math ? `${math.contingencyPct}%` : "—"}
            </dd>
          </div>
          <div>
            <dt className="font-mono text-[9.5px] tracking-[0.12em] text-[var(--text-3)] uppercase">
              Agent tokens
            </dt>
            <dd className="display mt-1 text-2xl tracking-[-0.03em]">
              {record.usage.total.toLocaleString()}
            </dd>
          </div>
        </dl>
      </header>

      {/* ---- Held back / failed ---- */}
      {record.status === "blocked" && record.blockedReason ? (
        <div className="flex gap-3.5 rounded-[var(--r-lg)] border border-[var(--risk-amber)]/25 bg-[var(--risk-amber-wash)] p-6">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--risk-amber)]" />
          <div>
            <h2 className="display text-[15px] tracking-[-0.015em]">
              This quote was held back
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed whitespace-pre-line text-[var(--text)]">
              {record.blockedReason}
            </p>
            <p className="mt-3 text-[12.5px] leading-relaxed text-[var(--text-2)]">
              A figure the price book cannot support is a number you would be
              bound to without knowing where it came from. Add the missing items
              to your book, or record a walkthrough that covers them.
            </p>
          </div>
        </div>
      ) : null}

      {record.status === "failed" && record.error ? (
        <div className="flex gap-3.5 rounded-[var(--r-lg)] border border-[var(--risk-red)]/25 bg-[var(--risk-red-wash)] p-6">
          <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-[var(--risk-red)]" />
          <div>
            <h2 className="display text-[15px] tracking-[-0.015em]">
              The run did not finish
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-[var(--text)]">
              {record.error}
            </p>
          </div>
        </div>
      ) : null}

      {/* ---- Approval gate ---- */}
      {!readOnly && doc && (record.status === "needs_review" || record.status === "approved") ? (
        <ApprovalBar
          recordId={record.id}
          basePath="/api/quotes"
          listPath="/quotes"
          copyText={plainText}
          approvedAt={record.approvedAt}
          copyLabel="Copy quote"
          headline="Nothing has been sent"
          blurb="Check the lines against your book and the exclusions against the job. Approving records that you have read it — the desk never contacts your customer."
          approvedHeadline="You approved this quote"
          approvedBlurb="Copy it into your own template, or send it as it stands."
        />
      ) : null}

      {/* ---- The quote and the maths ---- */}
      <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        {doc ? (
          <article className="card p-6 sm:p-8">
            <p className="eyebrow">Quote — not sent</p>
            <h2 className="display mt-4 text-xl tracking-[-0.02em]">
              {doc.title}
            </h2>
            <p className="mt-3 text-[13.5px] leading-relaxed text-[var(--text-2)]">
              {doc.intro}
            </p>

            <div className="mt-6">
              <Prose text={doc.scopeNarrative} />
            </div>

            <div className="mt-7 grid gap-6 border-t border-[var(--line)] pt-6 sm:grid-cols-2">
              <div>
                <h3 className="eyebrow">Included</h3>
                <div className="mt-2.5">
                  <List items={doc.inclusions} />
                </div>
              </div>
              <div>
                <h3 className="eyebrow">Not included</h3>
                <div className="mt-2.5">
                  <List items={doc.exclusions} tone="warn" />
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-[var(--line)] pt-6">
              <h3 className="eyebrow">Assumptions</h3>
              <div className="mt-2.5">
                <List items={doc.assumptions} />
              </div>
            </div>

            <p className="mt-6 border-t border-[var(--line)] pt-5 text-[12.5px] leading-relaxed text-[var(--text-3)]">
              {doc.validityNote}
            </p>
            <p className="mt-2 text-[13px] font-medium text-[var(--ink)]">
              {doc.nextStep}
            </p>
          </article>
        ) : (
          <div className="card flex items-center justify-center p-10">
            <p className="text-[13px] text-[var(--text-3)]">
              No quote document was produced.
            </p>
          </div>
        )}

        {math ? <QuoteMoney math={math} currency={currency} /> : null}
      </div>

      {/* ---- Scope ---- */}
      {scope ? (
        <Section title="What the desk understood the job to be" icon={FileText}>
          <p className="text-[13px] leading-relaxed text-[var(--text-2)]">
            {scope.summary}
          </p>
          <ul className="mt-5 flex flex-col gap-3">
            {scope.tasks.map((task, i) => (
              <li
                key={task.id}
                className="rounded-[var(--r-sm)] border border-[var(--line)] bg-[var(--paper)] p-4"
              >
                <div className="flex items-baseline gap-2.5">
                  <span className="font-mono text-[10px] tracking-[0.14em] text-[var(--text-3)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="text-[13.5px] font-semibold text-[var(--ink)]">
                    {task.title}
                  </h3>
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-[var(--text-2)]">
                  {task.description}
                </p>
                {task.assumptions.length > 0 ? (
                  <p className="mt-2 text-[12px] leading-relaxed text-[var(--text-3)]">
                    Assuming: {task.assumptions.join("; ")}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
          <p className="mt-5 border-t border-[var(--line)] pt-4 text-[12.5px] leading-relaxed text-[var(--text-2)]">
            <span className="font-semibold text-[var(--ink)]">Sequencing: </span>
            {scope.sequencing}
          </p>
        </Section>
      ) : null}

      {/* ---- Challenger ---- */}
      {challenge ? (
        <Section title="What the person doing the job would say" icon={HardHat}>
          <Pill tone={challenge.wouldOverrun ? "amber" : "lime"}>
            {challenge.wouldOverrun
              ? "Would overrun as estimated"
              : "The estimate holds up"}
          </Pill>
          <p className="mt-4 text-[13px] leading-relaxed text-[var(--text-2)]">
            {challenge.overrunRationale}
          </p>

          {challenge.missedItems.length > 0 ? (
            <ul className="mt-5 flex flex-col gap-2.5">
              {challenge.missedItems.map((m) => (
                <li
                  key={m.item}
                  className="rounded-[var(--r-sm)] border border-[var(--line)] bg-[var(--paper)] p-4"
                >
                  <Pill tone={m.severity === "minor" ? "neutral" : "amber"}>
                    {m.severity}
                  </Pill>
                  <p className="mt-2 text-[13px] text-[var(--ink)]">{m.item}</p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--text-2)]">
                    {m.consequence}
                  </p>
                </li>
              ))}
            </ul>
          ) : null}

          {challenge.overstatedItems.length > 0 ? (
            <div className="mt-5 border-t border-[var(--line)] pt-4">
              <h3 className="eyebrow">Generous, and worth trimming</h3>
              <div className="mt-2.5">
                <List items={challenge.overstatedItems} />
              </div>
            </div>
          ) : null}
        </Section>
      ) : null}

      {/* ---- Risk ---- */}
      {risk ? (
        <Section title="What could still change the price" icon={ShieldQuestion}>
          <p className="text-[13px] leading-relaxed text-[var(--text-2)]">
            {risk.contingencyRationale}
          </p>

          <ul className="mt-5 flex flex-col gap-2.5">
            {risk.findings.map((f) => (
              <li
                key={f.risk}
                className="rounded-[var(--r-sm)] border border-[var(--line)] bg-[var(--paper)] p-4"
              >
                <div className="flex flex-wrap gap-2">
                  <Pill tone="neutral">{f.likelihood}</Pill>
                  <Pill tone={f.impact === "severe" ? "red" : f.impact === "material" ? "amber" : "neutral"}>
                    {f.impact}
                  </Pill>
                </div>
                <p className="mt-2 text-[13px] text-[var(--ink)]">{f.risk}</p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--text-2)]">
                  {f.mitigation}
                </p>
              </li>
            ))}
          </ul>

          {risk.confirmBeforeStarting.length > 0 ? (
            <div className="mt-5 rounded-[var(--r-sm)] border border-[var(--risk-amber)]/25 bg-[var(--risk-amber-wash)] p-4">
              <h3 className="text-[13px] font-semibold text-[var(--ink)]">
                Check these on site before the quote is binding
              </h3>
              <div className="mt-2.5">
                <List items={risk.confirmBeforeStarting} tone="warn" />
              </div>
            </div>
          ) : null}
        </Section>
      ) : null}

      {/* ---- What was never established ---- */}
      {notes && notes.unclear.length > 0 ? (
        <Section title="What the visit did not establish" icon={ShieldQuestion}>
          <List items={notes.unclear} tone="warn" />
        </Section>
      ) : null}

      {/* ---- Trace ---- */}
      <Section printHide title="Everything the desk did" icon={ClipboardList}>
        <AgentTimeline events={record.trace} />
      </Section>

      <p className="pb-4 text-center text-[12px] text-[var(--text-3)]">
        Every figure above was computed from your price book, not written by a
        model.{" "}
        <Link href="/#safeguards" className="underline hover:text-[var(--text)]">
          How this is kept honest
        </Link>
      </p>
    </div>
  );
}
