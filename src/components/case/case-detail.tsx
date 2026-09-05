import Link from "next/link";
import {
  AlertTriangle,
  CalendarClock,
  ClipboardList,
  Gavel,
  Phone,
  Target,
  TriangleAlert,
} from "lucide-react";
import { AgentTimeline } from "@/components/case/agent-timeline";
import { ApprovalBar } from "@/components/ui/approval-bar";
import { DraftView } from "@/components/case/draft-view";
import { StatusBadge } from "@/components/ui/status-badge";
import { Pill } from "@/components/ui/pill";
import { PrintButton } from "@/components/ui/print-button";
import { playbookFor } from "@/lib/domain/taxonomy";
import { cn, daysUntil, formatMoney } from "@/lib/utils";


function Section({
  title,
  icon: Icon,
  children,
  className,
  printHide,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  className?: string;
  /** The agent trace belongs on screen, not in a document you send. */
  printHide?: boolean;
}) {
  return (
    <section
      data-print={printHide ? "hide" : "block"}
      className={cn("rounded-[var(--r-lg)] bg-white p-6 ring-1 ring-[var(--line)]", className)}
    >
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--lime-wash)] text-[var(--ok-deep)]">
          <Icon className="h-4 w-4" />
        </span>
        <h2 className="display text-[15px] font-bold tracking-[-0.015em] text-[var(--ink)]">
          {title}
        </h2>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}
import type { CaseRecord } from "@/lib/domain/case";

/**
 * The full record view, shared by the live desk page and the recorded demo.
 *
 * `readOnly` hides the approval gate: a recorded run is not something anyone
 * can approve or delete.
 */
export function CaseDetail({
  record,
  readOnly = false,
}: {
  record: CaseRecord;
  readOnly?: boolean;
}) {
  const { facts, classification, strategy, draft, review, filing, audit } = record;
  const playbook = classification ? playbookFor(classification.category) : null;
  const remaining = record.deadline ? daysUntil(record.deadline) : null;
  const amount = facts?.patientResponsibilityCents.value ?? facts?.billedAmountCents.value;

  return (
    <div data-print="page" className="mx-auto flex max-w-[1240px] flex-col gap-5">
      {/* ---- Header ---- */}
      <header data-print="block" className="rounded-[var(--r-lg)] bg-white p-6 ring-1 ring-[var(--line)] sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={record.status} />
          {playbook ? <Pill tone="neutral">{playbook.label}</Pill> : null}
          {record.revisionRounds > 0 ? (
            <Pill tone="neutral">
              {record.revisionRounds} revision{record.revisionRounds === 1 ? "" : "s"}
            </Pill>
          ) : null}
          <span className="ml-auto" data-print="hide">
            <PrintButton label="Save appeal as PDF" />
          </span>
        </div>

        <h1 className="mt-4 display text-[clamp(1.5rem,3.5vw,2.25rem)] leading-tight tracking-[-0.03em] text-[var(--ink)]">
          {facts?.payerName.value ?? "Denied claim"}
          {facts?.claimNumber.value ? (
            <span className="text-[var(--text-3)]"> · {facts.claimNumber.value}</span>
          ) : null}
        </h1>

        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 lg:grid-cols-4">
          <div>
            <dt className="text-[11px] font-medium tracking-wide text-[var(--text-3)] uppercase">
              At stake
            </dt>
            <dd className="mt-1 display text-xl tracking-[-0.03em] text-[var(--ink)]">
              {typeof amount === "number" ? formatMoney(amount) : "Not stated"}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-medium tracking-wide text-[var(--text-3)] uppercase">
              Deadline
            </dt>
            <dd
              className={cn(
                "mt-1 display text-xl tracking-[-0.03em]",
                remaining !== null && remaining < 14 ? "text-[var(--risk-red)]" : "text-[var(--ink)]",
              )}
            >
              {record.deadline ?? "Not stated"}
            </dd>
            {remaining !== null ? (
              <dd className="text-[12px] text-[var(--text-2)]">
                {remaining < 0 ? `${Math.abs(remaining)} days past` : `${remaining} days left`}
              </dd>
            ) : null}
          </div>
          <div>
            <dt className="text-[11px] font-medium tracking-wide text-[var(--text-3)] uppercase">
              Outlook
            </dt>
            <dd className="mt-1 display text-xl tracking-[-0.03em] text-[var(--ink)] capitalize">
              {strategy?.outlook ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-medium tracking-wide text-[var(--text-3)] uppercase">
              Agent tokens
            </dt>
            <dd className="mt-1 display text-xl tracking-[-0.03em] text-[var(--ink)]">
              {record.usage.total.toLocaleString()}
            </dd>
          </div>
        </dl>
      </header>

      {/* ---- Held back / failed ---- */}
      {record.status === "blocked" && record.blockedReason ? (
        <div className="flex gap-3.5 rounded-[var(--r-lg)] bg-[var(--risk-amber-wash)] p-6 ring-1 ring-[var(--risk-amber)]/25">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--risk-amber)]" />
          <div>
            <h2 className="display text-[15px] font-bold tracking-[-0.015em] text-[var(--ink)]">
              This draft was held back
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed whitespace-pre-line text-[var(--text)]">
              {record.blockedReason}
            </p>
            <p className="mt-3 text-[12.5px] leading-relaxed text-[var(--text-2)]">
              An appeal citing text a reviewer cannot find is dismissed, and the
              deadline usually goes with it. Uploading your plan documents gives
              the agents real language to quote.
            </p>
          </div>
        </div>
      ) : null}

      {record.status === "failed" && record.error ? (
        <div className="flex gap-3.5 rounded-[var(--r-lg)] bg-[var(--risk-red-wash)] p-6 ring-1 ring-[var(--risk-red)]/25">
          <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-[var(--risk-red)]" />
          <div>
            <h2 className="display text-[15px] font-bold tracking-[-0.015em] text-[var(--ink)]">
              The run did not finish
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-[var(--text)]">{record.error}</p>
          </div>
        </div>
      ) : null}

      {/* ---- Approval gate ---- */}
      {!readOnly && draft && (record.status === "needs_review" || record.status === "approved") ? (
        <ApprovalBar
          recordId={record.id}
          basePath="/api/cases"
          listPath="/cases"
          copyText={`${draft.recipientBlock}\n\n${draft.subject}\n\n${draft.body}`}
          approvedAt={record.approvedAt}
          copyLabel="Copy letter"
          headline="Nothing has been sent"
          blurb="Read the letter and check the quotes. Approving records that you have reviewed it — the desk never contacts your insurer."
          approvedHeadline="You approved this draft"
          approvedBlurb="Copy the letter, attach the checklist items, and file it by the route below."
        />
      ) : null}

      {/* ---- The letter ---- */}
      {draft ? <DraftView draft={draft} audit={audit} /> : null}

      {/* ---- Strategy ---- */}
      {strategy ? (
        <Section title="Why this appeal is built this way" icon={Target}>
          <p className="text-[13px] leading-relaxed text-[var(--text-2)]">
            {strategy.levelRationale}
          </p>
          <p className="mt-3 text-[13px] leading-relaxed text-[var(--text-2)]">
            <span className="font-semibold text-[var(--ink)] capitalize">
              {strategy.outlook} outlook.
            </span>{" "}
            {strategy.outlookRationale}
          </p>

          <ul className="mt-6 flex flex-col gap-3">
            {strategy.arguments.map((argument, i) => (
              <li
                key={argument.heading}
                className="rounded-2xl bg-[var(--paper)] p-4 ring-1 ring-[var(--line)]"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="display text-[12px] font-bold text-[var(--ok-deep)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="text-[13.5px] font-semibold text-[var(--ink)]">
                    {argument.heading}
                  </h3>
                  <Pill tone={argument.strength === "load_bearing" ? "lime" : "neutral"}>
                    {argument.strength.replace("_", " ")}
                  </Pill>
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-[var(--text-2)]">
                  {argument.claim}
                </p>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-[var(--text-2)]">
                  {argument.basis}
                </p>
              </li>
            ))}
          </ul>

          {strategy.missingEvidence.length > 0 ? (
            <div className="mt-6 rounded-2xl bg-[var(--risk-amber-wash)] p-4 ring-1 ring-[var(--risk-amber)]/20">
              <h3 className="text-[13px] font-semibold text-[var(--ink)]">
                Get these, and this appeal gets materially stronger
              </h3>
              <ul className="mt-2.5 flex flex-col gap-1.5">
                {strategy.missingEvidence.map((item) => (
                  <li key={item} className="flex gap-2.5 text-[12.5px] leading-relaxed text-[var(--text)]">
                    <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[var(--risk-amber)]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Section>
      ) : null}

      {/* ---- Adversarial review ---- */}
      {review ? (
        <Section title="How the payer's reviewer will attack this" icon={Gavel}>
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone={review.wouldUphold ? "amber" : "lime"}>
              {review.wouldUphold
                ? "A reviewer could still uphold"
                : "Hard to uphold as written"}
            </Pill>
            <Pill tone="neutral">{review.confidence} confidence</Pill>
          </div>

          <p className="mt-4 text-[13px] leading-relaxed text-[var(--text-2)]">
            <span className="font-semibold text-[var(--ink)]">Their best argument: </span>
            {review.upholdRationale}
          </p>
          <p className="mt-2.5 text-[13px] leading-relaxed text-[var(--text-2)]">
            <span className="font-semibold text-[var(--ink)]">Hardest for them to dismiss: </span>
            {review.strongestPoint}
          </p>

          {review.weaknesses.length > 0 ? (
            <ul className="mt-6 flex flex-col gap-2.5">
              {review.weaknesses.map((w) => (
                <li
                  key={`${w.severity}-${w.location}`}
                  className="rounded-2xl bg-[var(--paper)] p-4 ring-1 ring-[var(--line)]"
                >
                  <Pill tone={w.severity === "minor" ? "neutral" : "red"}>
                    {w.severity}
                  </Pill>
                  <p className="mt-2 text-[13px] leading-relaxed text-[var(--text)]">{w.issue}</p>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-[var(--text-2)]">
                    <span className="font-semibold text-[var(--text)]">Fix: </span>
                    {w.fix}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-[13px] text-[var(--text-2)]">
              The reviewer found nothing worth acting on.
            </p>
          )}
        </Section>
      ) : null}

      {/* ---- Filing ---- */}
      {filing ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <Section title="How to file it" icon={ClipboardList}>
            <dl className="flex flex-col gap-3 text-[13px]">
              <div>
                <dt className="font-semibold text-[var(--ink)]">Send to</dt>
                <dd className="mt-0.5 whitespace-pre-line text-[var(--text-2)]">
                  {filing.recipient}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-[var(--ink)]">Route</dt>
                <dd className="mt-0.5 text-[var(--text-2)]">{filing.submissionRoute}</dd>
              </div>
            </dl>

            <ul className="mt-5 flex flex-col gap-2">
              {filing.checklist.map((item) => (
                <li key={item.item} className="flex gap-2.5">
                  <span
                    className={cn(
                      "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                      item.readyAlready
                        ? "bg-[var(--lime)] text-white"
                        : "bg-[var(--line)] text-[var(--text-2)]",
                    )}
                  >
                    {item.readyAlready ? "✓" : ""}
                  </span>
                  <div>
                    <p className="text-[13px] leading-snug text-[var(--text)]">{item.item}</p>
                    <p className="mt-0.5 text-[12px] leading-snug text-[var(--text-3)]">
                      {item.note}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <p className="mt-5 border-t border-[var(--line)] pt-4 text-[12.5px] leading-relaxed text-[var(--text-2)]">
              <span className="font-semibold text-[var(--text)]">If this fails: </span>
              {filing.nextEscalation}
            </p>
          </Section>

          <div className="flex flex-col gap-5">
            <Section title="Dates to keep" icon={CalendarClock}>
              <ul className="flex flex-col gap-2.5">
                {filing.reminders.map((r) => (
                  <li key={`${r.date}-${r.label}`} className="flex gap-3">
                    <span className="shrink-0 rounded-full bg-[var(--paper)] px-2 py-0.5 text-[11.5px] font-semibold text-[var(--text)] ring-1 ring-[var(--line)]">
                      {r.date}
                    </span>
                    <span className="text-[12.5px] leading-snug text-[var(--text-2)]">
                      {r.label}
                    </span>
                  </li>
                ))}
              </ul>
            </Section>

            <Section title="If you call them" icon={Phone}>
              <p className="text-[13px] leading-relaxed whitespace-pre-line text-[var(--text-2)]">
                {filing.callScript}
              </p>
            </Section>
          </div>
        </div>
      ) : null}

      {/* ---- Trace ---- */}
      <Section printHide title="Everything the agents did" icon={ClipboardList}>
        <AgentTimeline events={record.trace} />
      </Section>

      <div className="flex flex-col gap-4 border-t border-[var(--line)] pt-6 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[12px] text-[var(--text-3)]">
          Second Chair is not a law firm, insurer, or medical provider, and this
          is not legal or medical advice.{" "}
          <Link href="/#safeguards" className="underline hover:text-[var(--text)]">
            How this is kept honest
          </Link>
        </p>
      </div>
    </div>
  );
}
