import { notFound } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarClock,
  Check,
  ClipboardList,
  Mail,
  TriangleAlert,
  X,
} from "lucide-react";
import { AgentTimeline } from "@/components/case/agent-timeline";
import { ApprovalBar } from "@/components/ui/approval-bar";
import { StatusBadge } from "@/components/ui/status-badge";
import { Pill } from "@/components/ui/pill";
import { catalogById } from "@/lib/desks/orders/catalogs";
import type { ResolvedLine } from "@/lib/desks/orders/resolve";
import { orderStore } from "@/lib/store";
import { ownedBy, requireUser } from "@/lib/auth/guard";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Order" };

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <section className="card p-6">
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

function LineRow({
  line,
  currency,
  confirmed,
}: {
  line: ResolvedLine;
  currency: string;
  confirmed: boolean;
}) {
  return (
    <li className="px-5 py-3.5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={
                confirmed
                  ? "flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[var(--lime)] text-[var(--ink)]"
                  : "flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[var(--risk-amber-wash)] text-[#9a5f08]"
              }
            >
              {confirmed ? (
                <Check className="h-2.5 w-2.5" strokeWidth={3} />
              ) : (
                <X className="h-2.5 w-2.5" strokeWidth={3} />
              )}
            </span>
            <p className="text-[13px] font-medium text-[var(--ink)]">
              {line.matchedName ?? line.description}
            </p>
          </div>

          <p className="mt-1 pl-6 text-[12px] text-[var(--text-2)]">
            {line.quantity} {line.unit}
            {line.unitPriceCents !== null ? (
              <> × {formatMoney(line.unitPriceCents, { currency })}</>
            ) : null}
            {line.sku ? (
              <span className="ml-2 font-mono text-[10px] tracking-[0.08em] text-[var(--text-3)]">
                {line.sku}
              </span>
            ) : null}
          </p>

          {/* What the customer actually wrote, so a person can check the reading. */}
          <p className="mt-1 pl-6 font-mono text-[11px] leading-snug text-[var(--text-3)]">
            “{line.verbatim}”
          </p>

          {line.exceptions.length > 0 ? (
            <ul className="mt-2 flex flex-col gap-1 pl-6">
              {line.exceptions.map((e) => (
                <li
                  key={`${e.code}-${e.detail}`}
                  className="text-[12px] leading-snug text-[var(--text-2)]"
                >
                  <span
                    className={
                      e.blocking
                        ? "font-mono text-[9.5px] tracking-[0.1em] text-[#8f1f1f] uppercase"
                        : "font-mono text-[9.5px] tracking-[0.1em] text-[#9a5f08] uppercase"
                    }
                  >
                    {e.code.replace(/_/g, " ")}
                  </span>{" "}
                  — {e.detail}
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <p className="shrink-0 text-[13px] tabular-nums text-[var(--ink)]">
          {line.lineTotalCents !== null
            ? formatMoney(line.lineTotalCents, { currency })
            : "—"}
        </p>
      </div>
    </li>
  );
}

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser(`/orders/${id}`);
  // notFound for someone else's record too, so an id cannot be probed.
  const record = ownedBy(await orderStore.get(id), user);
  if (!record) notFound();

  const catalog = catalogById(record.catalogId);
  const currency = catalog.settings.currency;
  const { parsed, resolved, triage, fulfilment, reply } = record;

  const replyText = reply
    ? `Subject: ${reply.subject}\n\n${reply.body}`
    : "";

  return (
    <div className="mx-auto flex max-w-[1240px] flex-col gap-5">
      {/* ---- Header ---- */}
      <header className="card p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={record.status} />
          <Pill tone="neutral">{catalog.name}</Pill>
          {resolved ? (
            <Pill
              tone={
                resolved.confirmable.length === resolved.lines.length
                  ? "lime"
                  : "amber"
              }
            >
              {resolved.confirmable.length} of {resolved.lines.length} lines clear
            </Pill>
          ) : null}
        </div>

        <h1 className="display mt-4 text-[clamp(1.5rem,3.5vw,2.25rem)] leading-tight tracking-[-0.03em]">
          {resolved?.customer?.name ?? parsed?.buyerName ?? "Unread order"}
        </h1>
        {parsed?.poNumber ? (
          <p className="mt-1 font-mono text-[11px] tracking-[0.12em] text-[var(--text-3)] uppercase">
            Their ref {parsed.poNumber}
          </p>
        ) : null}

        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 lg:grid-cols-4">
          <div>
            <dt className="font-mono text-[9.5px] tracking-[0.12em] text-[var(--text-3)] uppercase">
              Confirmed value
            </dt>
            <dd className="display mt-1 text-2xl tracking-[-0.03em]">
              {resolved
                ? formatMoney(resolved.confirmedSubtotalCents, { currency })
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="font-mono text-[9.5px] tracking-[0.12em] text-[var(--text-3)] uppercase">
              Needs a person
            </dt>
            <dd className="display mt-1 text-2xl tracking-[-0.03em]">
              {resolved?.held.length ?? 0}
            </dd>
          </div>
          <div>
            <dt className="font-mono text-[9.5px] tracking-[0.12em] text-[var(--text-3)] uppercase">
              Requested
            </dt>
            <dd className="display mt-1 text-2xl tracking-[-0.03em]">
              {parsed?.requestedDate || "Not stated"}
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

      {record.status === "blocked" && record.blockedReason ? (
        <div className="flex gap-3.5 rounded-[var(--r-lg)] border border-[var(--risk-amber)]/25 bg-[var(--risk-amber-wash)] p-6">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--risk-amber)]" />
          <div>
            <h2 className="display text-[15px] tracking-[-0.015em]">
              Nothing here could be confirmed
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed whitespace-pre-line text-[var(--text)]">
              {record.blockedReason}
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

      {reply && (record.status === "needs_review" || record.status === "approved") ? (
        <ApprovalBar
          recordId={record.id}
          basePath="/api/orders"
          listPath="/orders"
          copyText={replyText}
          approvedAt={record.approvedAt}
          copyLabel="Copy reply"
          approveLabel="Confirm these lines"
          headline="Nothing has been sent or committed"
          blurb="The desk drafted this reply and reserved nothing. Confirming records that you have checked the lines — sending stays yours."
          approvedHeadline="You confirmed these lines"
          approvedBlurb="Send the reply and raise the order in your system."
        />
      ) : null}

      {/* ---- The split ---- */}
      {resolved ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-3.5">
              <h2 className="display text-[14px] tracking-[-0.015em]">
                Going ahead
              </h2>
              <span className="font-mono text-[9.5px] tracking-[0.12em] text-[var(--text-3)] uppercase">
                {resolved.confirmable.length} lines
              </span>
            </div>
            {resolved.confirmable.length > 0 ? (
              <ul className="divide-y divide-[var(--line)]">
                {resolved.confirmable.map((line) => (
                  <LineRow key={line.id} line={line} currency={currency} confirmed />
                ))}
              </ul>
            ) : (
              <p className="px-5 py-8 text-center text-[13px] text-[var(--text-3)]">
                Nothing on this order cleared automatically.
              </p>
            )}
            {resolved.confirmable.length > 0 ? (
              <div className="flex items-baseline justify-between border-t border-[var(--line)] px-5 py-3.5">
                <span className="text-[13px] font-semibold text-[var(--ink)]">
                  Confirmed value
                </span>
                <span className="display text-[17px] tracking-[-0.02em]">
                  {formatMoney(resolved.confirmedSubtotalCents, { currency })}
                </span>
              </div>
            ) : null}
          </div>

          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-3.5">
              <h2 className="display text-[14px] tracking-[-0.015em]">
                The queue
              </h2>
              <span className="font-mono text-[9.5px] tracking-[0.12em] text-[var(--text-3)] uppercase">
                {resolved.held.length} lines
              </span>
            </div>
            {resolved.held.length > 0 ? (
              <ul className="divide-y divide-[var(--line)]">
                {resolved.held.map((line) => (
                  <LineRow
                    key={line.id}
                    line={line}
                    currency={currency}
                    confirmed={false}
                  />
                ))}
              </ul>
            ) : (
              <p className="px-5 py-8 text-center text-[13px] text-[var(--text-3)]">
                Nothing needed a person. This order cleared on its own.
              </p>
            )}

            {resolved.exceptions.filter((e) => e.lineId === null).length > 0 ? (
              <div className="border-t border-[var(--line)] bg-[var(--risk-amber-wash)] px-5 py-4">
                <h3 className="text-[12.5px] font-semibold text-[var(--ink)]">
                  Account-level
                </h3>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {resolved.exceptions
                    .filter((e) => e.lineId === null)
                    .map((e) => (
                      <li
                        key={e.code}
                        className="text-[12.5px] leading-snug text-[var(--text)]"
                      >
                        {e.detail}
                      </li>
                    ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* ---- Triage ---- */}
      {triage && triage.items.length > 0 ? (
        <Section title="What to do about it" icon={ClipboardList}>
          <p className="text-[13px] leading-relaxed text-[var(--text-2)]">
            {triage.overallAssessment}
          </p>
          <ul className="mt-5 flex flex-col gap-2.5">
            {triage.items.map((item, i) => (
              <li
                key={i}
                className="rounded-[var(--r-sm)] border border-[var(--line)] bg-[var(--paper)] p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Pill tone="neutral">
                    {item.lineId === "order" ? "Account" : `Line ${item.lineId}`}
                  </Pill>
                  {item.canAutoResolve ? (
                    <Pill tone="lime">No decision needed</Pill>
                  ) : null}
                </div>
                <p className="mt-2 text-[13px] text-[var(--ink)]">
                  {item.whatHappened}
                </p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--text-2)]">
                  Likely: {item.likelyCause}
                </p>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-[var(--text)]">
                  <span className="font-semibold">Do this: </span>
                  {item.recommendedAction}
                </p>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {/* ---- Dates ---- */}
      {fulfilment ? (
        <Section title="Dates" icon={CalendarClock}>
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone={fulfilment.canMeetRequestedDate ? "lime" : "amber"}>
              {fulfilment.canMeetRequestedDate
                ? "Requested date can be met"
                : "Requested date cannot be met in full"}
            </Pill>
            {fulfilment.splitRecommended ? (
              <Pill tone="neutral">Split delivery recommended</Pill>
            ) : null}
            {fulfilment.earliestCompleteDate ? (
              <Pill tone="neutral">
                Complete by {fulfilment.earliestCompleteDate}
              </Pill>
            ) : null}
          </div>
          <p className="mt-4 text-[13px] leading-relaxed text-[var(--text-2)]">
            {fulfilment.reasoning}
          </p>
          {fulfilment.notes.length > 0 ? (
            <ul className="mt-4 flex flex-col gap-1.5">
              {fulfilment.notes.map((n) => (
                <li
                  key={n}
                  className="flex gap-2.5 text-[12.5px] leading-relaxed text-[var(--text-2)]"
                >
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[var(--lime-deep)]" />
                  {n}
                </li>
              ))}
            </ul>
          ) : null}
        </Section>
      ) : null}

      {/* ---- The reply ---- */}
      {reply ? (
        <Section title="The reply, for you to send" icon={Mail}>
          <p className="font-mono text-[11px] tracking-[0.1em] text-[var(--text-3)] uppercase">
            Subject
          </p>
          <p className="mt-1 text-[14px] font-medium text-[var(--ink)]">
            {reply.subject}
          </p>
          <div className="mt-4 rounded-[var(--r-sm)] border border-[var(--line)] bg-[var(--paper)] p-5">
            <p className="text-[13.5px] leading-relaxed whitespace-pre-line text-[var(--text-2)]">
              {reply.body}
            </p>
          </div>
          {reply.questionsForCustomer.length > 0 ? (
            <div className="mt-4">
              <h3 className="eyebrow">Waiting on the customer</h3>
              <ul className="mt-2 flex flex-col gap-1.5">
                {reply.questionsForCustomer.map((q) => (
                  <li
                    key={q}
                    className="flex gap-2.5 text-[13px] leading-relaxed text-[var(--text-2)]"
                  >
                    <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[var(--risk-amber)]" />
                    {q}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Section>
      ) : null}

      {/* ---- Trace ---- */}
      <Section title="Everything the desk did" icon={ClipboardList}>
        <AgentTimeline events={record.trace} />
      </Section>

      <p className="pb-4 text-center text-[12px] text-[var(--text-3)]">
        No line was confirmed that did not resolve to real stock at the agreed
        price.{" "}
        <Link href="/#safeguards" className="underline hover:text-[var(--text)]">
          How this is kept honest
        </Link>
      </p>
    </div>
  );
}
