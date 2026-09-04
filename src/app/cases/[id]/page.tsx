import { notFound } from "next/navigation";
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
import { ApproveBar } from "@/components/case/approve-bar";
import { DraftView } from "@/components/case/draft-view";
import { StatusBadge } from "@/components/case/status-badge";
import { Pill } from "@/components/ui/pill";
import { playbookFor } from "@/lib/domain/taxonomy";
import { caseStore } from "@/lib/store";
import { cn, daysUntil, formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Case" };

function Section({
  title,
  icon: Icon,
  children,
  className,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-card-lg bg-white p-6 ring-1 ring-ink-200/70", className)}>
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-leaf-100 text-leaf-700">
          <Icon className="h-4 w-4" />
        </span>
        <h2 className="font-sans text-[15px] font-bold tracking-[-0.015em] text-ink-900">
          {title}
        </h2>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default async function CasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const record = await caseStore.get(id);
  if (!record) notFound();

  const { facts, classification, strategy, draft, review, filing, audit } = record;
  const playbook = classification ? playbookFor(classification.category) : null;
  const remaining = record.deadline ? daysUntil(record.deadline) : null;
  const amount = facts?.patientResponsibilityCents.value ?? facts?.billedAmountCents.value;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      {/* ---- Header ---- */}
      <header className="rounded-card-lg bg-white p-6 ring-1 ring-ink-200/70 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={record.status} />
          {playbook ? <Pill tone="neutral">{playbook.label}</Pill> : null}
          {record.revisionRounds > 0 ? (
            <Pill tone="neutral">
              {record.revisionRounds} revision{record.revisionRounds === 1 ? "" : "s"}
            </Pill>
          ) : null}
        </div>

        <h1 className="mt-4 font-sans text-[clamp(1.5rem,3.5vw,2.25rem)] leading-tight font-extrabold tracking-[-0.03em] text-ink-900">
          {facts?.payerName.value ?? "Denied claim"}
          {facts?.claimNumber.value ? (
            <span className="text-ink-400"> · {facts.claimNumber.value}</span>
          ) : null}
        </h1>

        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 lg:grid-cols-4">
          <div>
            <dt className="text-[11px] font-medium tracking-wide text-ink-400 uppercase">
              At stake
            </dt>
            <dd className="mt-1 font-sans text-xl font-extrabold tracking-[-0.03em] text-ink-900">
              {typeof amount === "number" ? formatMoney(amount) : "Not stated"}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-medium tracking-wide text-ink-400 uppercase">
              Deadline
            </dt>
            <dd
              className={cn(
                "mt-1 font-sans text-xl font-extrabold tracking-[-0.03em]",
                remaining !== null && remaining < 14 ? "text-flag-500" : "text-ink-900",
              )}
            >
              {record.deadline ?? "Not stated"}
            </dd>
            {remaining !== null ? (
              <dd className="text-[12px] text-ink-500">
                {remaining < 0 ? `${Math.abs(remaining)} days past` : `${remaining} days left`}
              </dd>
            ) : null}
          </div>
          <div>
            <dt className="text-[11px] font-medium tracking-wide text-ink-400 uppercase">
              Outlook
            </dt>
            <dd className="mt-1 font-sans text-xl font-extrabold tracking-[-0.03em] text-ink-900 capitalize">
              {strategy?.outlook ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-medium tracking-wide text-ink-400 uppercase">
              Agent tokens
            </dt>
            <dd className="mt-1 font-sans text-xl font-extrabold tracking-[-0.03em] text-ink-900">
              {record.usage.total.toLocaleString()}
            </dd>
          </div>
        </dl>
      </header>

      {/* ---- Held back / failed ---- */}
      {record.status === "blocked" && record.blockedReason ? (
        <div className="flex gap-3.5 rounded-card-lg bg-caution-100 p-6 ring-1 ring-caution-500/25">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-caution-500" />
          <div>
            <h2 className="font-sans text-[15px] font-bold tracking-[-0.015em] text-ink-900">
              This draft was held back
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed whitespace-pre-line text-ink-700">
              {record.blockedReason}
            </p>
            <p className="mt-3 text-[12.5px] leading-relaxed text-ink-600">
              An appeal citing text a reviewer cannot find is dismissed, and the
              deadline usually goes with it. Uploading your plan documents gives
              the agents real language to quote.
            </p>
          </div>
        </div>
      ) : null}

      {record.status === "failed" && record.error ? (
        <div className="flex gap-3.5 rounded-card-lg bg-flag-100 p-6 ring-1 ring-flag-500/25">
          <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-flag-500" />
          <div>
            <h2 className="font-sans text-[15px] font-bold tracking-[-0.015em] text-ink-900">
              The run did not finish
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-700">{record.error}</p>
          </div>
        </div>
      ) : null}

      {/* ---- Approval gate ---- */}
      {draft && (record.status === "needs_review" || record.status === "approved") ? (
        <ApproveBar
          caseId={record.id}
          letter={`${draft.recipientBlock}\n\n${draft.subject}\n\n${draft.body}`}
          approvedAt={record.approvedAt}
        />
      ) : null}

      {/* ---- The letter ---- */}
      {draft ? <DraftView draft={draft} audit={audit} /> : null}

      {/* ---- Strategy ---- */}
      {strategy ? (
        <Section title="Why this appeal is built this way" icon={Target}>
          <p className="text-[13px] leading-relaxed text-ink-600">
            {strategy.levelRationale}
          </p>
          <p className="mt-3 text-[13px] leading-relaxed text-ink-600">
            <span className="font-semibold text-ink-900 capitalize">
              {strategy.outlook} outlook.
            </span>{" "}
            {strategy.outlookRationale}
          </p>

          <ul className="mt-6 flex flex-col gap-3">
            {strategy.arguments.map((argument, i) => (
              <li
                key={argument.heading}
                className="rounded-2xl bg-surface-muted p-4 ring-1 ring-ink-200/50"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-sans text-[12px] font-bold text-leaf-600">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="text-[13.5px] font-semibold text-ink-900">
                    {argument.heading}
                  </h3>
                  <Pill tone={argument.strength === "load_bearing" ? "leaf" : "neutral"}>
                    {argument.strength.replace("_", " ")}
                  </Pill>
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-ink-600">
                  {argument.claim}
                </p>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-500">
                  {argument.basis}
                </p>
              </li>
            ))}
          </ul>

          {strategy.missingEvidence.length > 0 ? (
            <div className="mt-6 rounded-2xl bg-caution-100 p-4 ring-1 ring-caution-500/20">
              <h3 className="text-[13px] font-semibold text-ink-900">
                Get these, and this appeal gets materially stronger
              </h3>
              <ul className="mt-2.5 flex flex-col gap-1.5">
                {strategy.missingEvidence.map((item) => (
                  <li key={item} className="flex gap-2.5 text-[12.5px] leading-relaxed text-ink-700">
                    <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-caution-500" />
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
            <Pill tone={review.wouldUphold ? "caution" : "leaf"}>
              {review.wouldUphold
                ? "A reviewer could still uphold"
                : "Hard to uphold as written"}
            </Pill>
            <Pill tone="neutral">{review.confidence} confidence</Pill>
          </div>

          <p className="mt-4 text-[13px] leading-relaxed text-ink-600">
            <span className="font-semibold text-ink-900">Their best argument: </span>
            {review.upholdRationale}
          </p>
          <p className="mt-2.5 text-[13px] leading-relaxed text-ink-600">
            <span className="font-semibold text-ink-900">Hardest for them to dismiss: </span>
            {review.strongestPoint}
          </p>

          {review.weaknesses.length > 0 ? (
            <ul className="mt-6 flex flex-col gap-2.5">
              {review.weaknesses.map((w) => (
                <li
                  key={`${w.severity}-${w.location}`}
                  className="rounded-2xl bg-surface-muted p-4 ring-1 ring-ink-200/50"
                >
                  <Pill tone={w.severity === "minor" ? "neutral" : "flag"}>
                    {w.severity}
                  </Pill>
                  <p className="mt-2 text-[13px] leading-relaxed text-ink-700">{w.issue}</p>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-500">
                    <span className="font-semibold text-ink-700">Fix: </span>
                    {w.fix}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-[13px] text-ink-500">
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
                <dt className="font-semibold text-ink-900">Send to</dt>
                <dd className="mt-0.5 whitespace-pre-line text-ink-600">
                  {filing.recipient}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-ink-900">Route</dt>
                <dd className="mt-0.5 text-ink-600">{filing.submissionRoute}</dd>
              </div>
            </dl>

            <ul className="mt-5 flex flex-col gap-2">
              {filing.checklist.map((item) => (
                <li key={item.item} className="flex gap-2.5">
                  <span
                    className={cn(
                      "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                      item.readyAlready
                        ? "bg-leaf-500 text-white"
                        : "bg-ink-200 text-ink-500",
                    )}
                  >
                    {item.readyAlready ? "✓" : ""}
                  </span>
                  <div>
                    <p className="text-[13px] leading-snug text-ink-800">{item.item}</p>
                    <p className="mt-0.5 text-[12px] leading-snug text-ink-400">
                      {item.note}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <p className="mt-5 border-t border-ink-200/70 pt-4 text-[12.5px] leading-relaxed text-ink-500">
              <span className="font-semibold text-ink-700">If this fails: </span>
              {filing.nextEscalation}
            </p>
          </Section>

          <div className="flex flex-col gap-5">
            <Section title="Dates to keep" icon={CalendarClock}>
              <ul className="flex flex-col gap-2.5">
                {filing.reminders.map((r) => (
                  <li key={`${r.date}-${r.label}`} className="flex gap-3">
                    <span className="shrink-0 rounded-full bg-surface-muted px-2 py-0.5 text-[11.5px] font-semibold text-ink-700 ring-1 ring-ink-200/60">
                      {r.date}
                    </span>
                    <span className="text-[12.5px] leading-snug text-ink-600">
                      {r.label}
                    </span>
                  </li>
                ))}
              </ul>
            </Section>

            <Section title="If you call them" icon={Phone}>
              <p className="text-[13px] leading-relaxed whitespace-pre-line text-ink-600">
                {filing.callScript}
              </p>
            </Section>
          </div>
        </div>
      ) : null}

      {/* ---- Trace ---- */}
      <Section title="Everything the agents did" icon={ClipboardList}>
        <AgentTimeline events={record.trace} />
      </Section>

      <p className="pb-4 text-center text-[12px] text-ink-400">
        Overturn is not a law firm, insurer, or medical provider, and this is not
        legal or medical advice.{" "}
        <Link href="/#safeguards" className="underline hover:text-ink-700">
          How this is kept honest
        </Link>
      </p>
    </div>
  );
}
