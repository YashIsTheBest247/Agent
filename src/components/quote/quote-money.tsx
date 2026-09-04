import { AlertTriangle, Check, CircleAlert } from "lucide-react";
import type { PricedLine, QuoteMath } from "@/lib/desks/quotes/pricing";
import { cn, formatMoney } from "@/lib/utils";

/**
 * The arithmetic, shown rather than asserted.
 *
 * This panel is the quoting desk's proof of work: every line names the price
 * book entry it resolved to, and the ladder from cost to total is the same
 * calculation the engine ran. A contractor who cannot check the maths has no
 * reason to stand behind the number.
 */

const resolutionChip: Record<
  PricedLine["resolution"],
  { label: string; className: string; icon: typeof Check }
> = {
  exact: {
    label: "Book price",
    className:
      "border-[var(--lime-deep)] bg-[var(--lime-wash)] text-[var(--ok-deep)]",
    icon: Check,
  },
  near: {
    label: "Check line",
    className:
      "border-[var(--risk-amber)]/40 bg-[var(--risk-amber-wash)] text-[#9a5f08]",
    icon: CircleAlert,
  },
  unresolved: {
    label: "No price",
    className: "border-[var(--risk-red)]/40 bg-[var(--risk-red-wash)] text-[#8f1f1f]",
    icon: AlertTriangle,
  },
};

function Row({
  label,
  value,
  hint,
  strong,
  currency,
}: {
  label: string;
  value: number;
  hint?: string;
  strong?: boolean;
  currency: string;
}) {
  return (
    <div
      className={cn(
        "flex items-baseline justify-between gap-4 py-2",
        strong && "border-t border-[var(--line)] pt-3",
      )}
    >
      <span
        className={cn(
          "text-[13px]",
          strong ? "font-semibold text-[var(--ink)]" : "text-[var(--text-2)]",
        )}
      >
        {label}
        {hint ? (
          <span className="ml-1.5 font-mono text-[10px] tracking-[0.1em] text-[var(--text-3)] uppercase">
            {hint}
          </span>
        ) : null}
      </span>
      <span
        className={cn(
          "shrink-0 tabular-nums",
          strong
            ? "display text-[17px] tracking-[-0.02em]"
            : "text-[13px] text-[var(--text)]",
        )}
      >
        {formatMoney(value, { currency })}
      </span>
    </div>
  );
}

export function QuoteMoney({
  math,
  currency,
}: {
  math: QuoteMath;
  currency: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      {/* ---- The lines ---- */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-3.5">
          <h3 className="display text-[14px] tracking-[-0.015em]">
            Priced from the book
          </h3>
          <span className="font-mono text-[9.5px] tracking-[0.12em] text-[var(--text-3)] uppercase">
            {math.lines.length} lines
          </span>
        </div>

        <ul className="divide-y divide-[var(--line)]">
          {math.lines.map((line) => {
            const chip = resolutionChip[line.resolution];
            const Icon = chip.icon;
            return (
              <li key={line.id} className="px-5 py-3.5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-[var(--ink)]">
                      {line.description}
                    </p>
                    <p className="mt-0.5 text-[12px] text-[var(--text-2)]">
                      {line.quantity} {line.unit}
                      {line.unitCostCents !== null ? (
                        <>
                          {" × "}
                          {formatMoney(line.unitCostCents, { currency })}
                        </>
                      ) : null}
                    </p>
                    <p className="mt-1 text-[11.5px] leading-snug text-[var(--text-3)]">
                      {line.basis}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-[13px] tabular-nums text-[var(--ink)]">
                      {line.lineCostCents !== null
                        ? formatMoney(line.lineCostCents, { currency })
                        : "—"}
                    </p>
                    <span
                      className={cn(
                        "mt-1.5 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[9px] tracking-[0.1em] uppercase",
                        chip.className,
                      )}
                    >
                      <Icon className="h-2.5 w-2.5" />
                      {chip.label}
                    </span>
                  </div>
                </div>

                {line.matchedName && line.resolution !== "exact" ? (
                  <p className="mt-2 text-[11.5px] text-[var(--text-3)]">
                    Matched to “{line.matchedName}” ({Math.round(line.score * 100)}%)
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>

      {/* ---- The ladder ---- */}
      <div className="card p-5">
        <h3 className="display text-[14px] tracking-[-0.015em]">
          How the number is built
        </h3>
        <div className="mt-3">
          <Row label="Cost of materials and labour" value={math.costSubtotalCents} currency={currency} />
          <Row
            label="Contingency"
            hint={`${math.contingencyPct}%`}
            value={math.contingencyCents}
            currency={currency}
          />
          <Row
            label="Margin"
            hint={`${math.marginPct}%`}
            value={math.marginCents}
            currency={currency}
          />
          <Row label="Net" value={math.netCents} strong currency={currency} />
          <Row label="Tax" hint={`${math.taxRatePct}%`} value={math.taxCents} currency={currency} />
          <Row label="Total to quote" value={math.totalCents} strong currency={currency} />
        </div>

        <p className="mt-4 border-t border-[var(--line)] pt-3 text-[11.5px] leading-relaxed text-[var(--text-3)]">
          No agent produced any figure on this page. Each line was matched to an
          entry in your price book and multiplied out in whole pence.
        </p>
      </div>

      {math.warnings.length > 0 ? (
        <div className="rounded-[var(--r-md)] border border-[var(--risk-amber)]/30 bg-[var(--risk-amber-wash)] p-4">
          <h3 className="text-[12.5px] font-semibold text-[var(--ink)]">
            Worth checking before you send it
          </h3>
          <ul className="mt-2 flex flex-col gap-1.5">
            {math.warnings.map((w) => (
              <li key={w} className="flex gap-2 text-[12.5px] leading-snug text-[var(--text)]">
                <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[var(--risk-amber)]" />
                {w}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
