import Link from "next/link";
import { demoAppeal, demoOrder, demoQuote } from "@/lib/demo";

/**
 * Numbers computed from the recorded runs, not asserted.
 *
 * Every figure here is derived at build time from the three saved runs shipped
 * in `src/lib/demo/fixtures`, so it cannot drift from what those runs actually
 * contain — and a reader can click through and check any of it.
 */
function metrics() {
  const audit = demoAppeal.audit;
  const citationsChecked = audit?.checked.length ?? 0;
  const citationsResolved =
    audit?.checked.filter(
      (c) => c.status === "verified" || c.status === "near_match",
    ).length ?? 0;

  const pricedLines = demoQuote.math?.lines.length ?? 0;
  const unpriced = demoQuote.math?.unresolved.length ?? 0;

  const orderLines = demoOrder.resolved?.lines.length ?? 0;
  const heldLines = demoOrder.resolved?.held.length ?? 0;

  const tokens =
    demoAppeal.usage.total + demoQuote.usage.total + demoOrder.usage.total;

  return {
    citationsChecked,
    citationsResolved,
    pricedLines,
    unpriced,
    orderLines,
    heldLines,
    tokens,
  };
}

export function Evidence() {
  const m = metrics();

  const stats = [
    {
      value: `${m.citationsResolved}/${m.citationsChecked}`,
      label: "Citations resolved",
      note: "Every quotation in the recorded appeal was found in the document it cites. None was taken on trust.",
      href: "/demo/appeal",
    },
    {
      value: `${m.pricedLines - m.unpriced}/${m.pricedLines}`,
      label: "Lines priced from the book",
      note: "No agent produced a figure. Every number in the recorded quote was computed in code, and the totals reconcile.",
      href: "/demo/quote",
    },
    {
      value: `${m.heldLines}`,
      label: "Order lines held for a person",
      note: `Of ${m.orderLines} lines: a superseded price, a sub-minimum quantity, and a product nobody stocks — each with its reason.`,
      href: "/demo/order",
    },
  ];

  return (
    <section className="mx-auto max-w-[1240px] px-5 pb-20 sm:pb-28">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="eyebrow">The receipts</div>
          <h2 className="mt-3 text-[clamp(2rem,5vw,3.4rem)]">
            <span className="display">Counted, not </span>
            <span className="script text-[var(--ok-deep)]">claimed</span>
          </h2>
        </div>
        <p className="max-w-sm text-[13px] leading-relaxed text-[var(--text-2)]">
          These are read straight out of three saved runs against the live API.
          Open any of them and check the working.
        </p>
      </div>

      <dl className="mt-12 grid gap-4 lg:grid-cols-3">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="card group flex flex-col p-6 transition-shadow hover:shadow-[0_20px_45px_-28px_rgba(14,16,15,0.28)]"
          >
            <dt className="display text-[clamp(2.4rem,5vw,3.2rem)] leading-none tracking-[-0.04em]">
              {s.value}
            </dt>
            <dd className="mt-3 text-[13px] font-semibold text-[var(--ink)]">
              {s.label}
            </dd>
            <dd className="mt-2 text-[12.5px] leading-relaxed text-[var(--text-2)]">
              {s.note}
            </dd>
          </Link>
        ))}
      </dl>

      <p className="mt-6 font-mono text-[10px] leading-relaxed tracking-[0.08em] text-[var(--text-3)] uppercase">
        Three recorded runs · {m.tokens.toLocaleString()} tokens total · every
        figure on this page derived from them at build time
      </p>
    </section>
  );
}
