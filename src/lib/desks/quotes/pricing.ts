import { bestCandidate } from "@/lib/match";
import type {
  LabourRate,
  PriceBook,
  PriceBookItem,
  TakeoffLine,
} from "./domain";

/**
 * The quoting desk's hard gate, and the counterpart to the appeals desk's
 * citation auditor.
 *
 * A quote is a number a contractor is bound to. An invented unit price, or a
 * total that does not add up, is not a cosmetic error — it is money out of
 * their pocket on a job they have already agreed to do. So no model is
 * permitted to produce a figure: the takeoff describes work and quantities,
 * every rate is looked up in the contractor's own price book, and all
 * arithmetic happens here in integer minor units.
 */

/** A described line has to look this much like a catalogue entry to be priced. */
const EXACT_THRESHOLD = 0.97;
const NEAR_THRESHOLD = 0.82;

export type Resolution = "exact" | "near" | "unresolved";

export type PricedLine = TakeoffLine & {
  resolution: Resolution;
  sku: string | null;
  matchedName: string | null;
  /** How close the description was to the catalogue entry, 0-1. */
  score: number;
  unitCostCents: number | null;
  lineCostCents: number | null;
  /** Set when the line cannot be priced, or was priced with a caveat. */
  note: string | null;
};

export type QuoteMath = {
  lines: PricedLine[];
  unresolved: PricedLine[];
  costSubtotalCents: number;
  contingencyPct: number;
  contingencyCents: number;
  marginPct: number;
  marginCents: number;
  netCents: number;
  taxRatePct: number;
  taxCents: number;
  totalCents: number;
  /** True when the quote may be shown to a customer. */
  passed: boolean;
  blocking: string[];
  warnings: string[];
};

export type PricingOptions = {
  /** Overrides the book default, e.g. an uplift the risk agent argued for. */
  contingencyPct?: number;
};

type Candidate =
  | { kind: "item"; item: PriceBookItem }
  | { kind: "labour"; rate: LabourRate };

function candidatesFor(book: PriceBook, line: TakeoffLine): Candidate[] {
  // Labour is looked up against trades; everything else against the catalogue.
  // A line whose kind disagrees with the book is still searched across both, so
  // a mislabelled line resolves rather than silently failing.
  const items: Candidate[] = book.items.map((item) => ({ kind: "item", item }));
  const labour: Candidate[] = book.labour.map((rate) => ({ kind: "labour", rate }));
  return line.kind === "labour" ? [...labour, ...items] : [...items, ...labour];
}

function namesOf(candidate: Candidate): string[] {
  return candidate.kind === "item"
    ? [candidate.item.name, ...candidate.item.aliases]
    : [candidate.rate.trade, ...candidate.rate.aliases];
}

function unitCostOf(candidate: Candidate): number {
  return candidate.kind === "item"
    ? candidate.item.unitCostCents
    : candidate.rate.hourlyCents;
}

function skuOf(candidate: Candidate): string {
  return candidate.kind === "item"
    ? candidate.item.sku
    : `LABOUR:${candidate.rate.trade}`;
}

/** Resolves one described line against the price book and costs it. */
export function priceLine(line: TakeoffLine, book: PriceBook): PricedLine {
  const base: PricedLine = {
    ...line,
    resolution: "unresolved",
    sku: null,
    matchedName: null,
    score: 0,
    unitCostCents: null,
    lineCostCents: null,
    note: null,
  };

  if (!Number.isFinite(line.quantity) || line.quantity <= 0) {
    return {
      ...base,
      note: `Quantity is ${line.quantity}, which cannot be priced.`,
    };
  }

  const match = bestCandidate(line.description, candidatesFor(book, line), namesOf);

  if (!match || match.score < NEAR_THRESHOLD) {
    return {
      ...base,
      score: match ? Number(match.score.toFixed(3)) : 0,
      matchedName: match?.matchedOn ?? null,
      note: match
        ? `No price-book entry matches "${line.description}". Closest is "${match.matchedOn}".`
        : `No price-book entry matches "${line.description}".`,
    };
  }

  const unitCostCents = unitCostOf(match.candidate);
  // Fractional quantities are normal — 12.5 m² of render, 3.5 hours of labour —
  // so the product is rounded once, here, and never re-derived downstream.
  const lineCostCents = Math.round(line.quantity * unitCostCents);
  const resolution: Resolution =
    match.score >= EXACT_THRESHOLD ? "exact" : "near";

  return {
    ...base,
    resolution,
    sku: skuOf(match.candidate),
    matchedName: match.matchedOn,
    score: Number(match.score.toFixed(3)),
    unitCostCents,
    lineCostCents,
    note:
      resolution === "near"
        ? `Priced as "${match.matchedOn}" — confirm this is the right line.`
        : null,
  };
}

/**
 * Prices a whole takeoff and decides whether the result may be shown.
 *
 * `passed` is the gate: an unresolved line means a price nobody can source,
 * and a quote below the contractor's margin floor means they lose money on
 * work they have committed to. Both are refusals, not warnings.
 */
export function priceTakeoff(
  lines: TakeoffLine[],
  book: PriceBook,
  options: PricingOptions = {},
): QuoteMath {
  const priced = lines.map((line) => priceLine(line, book));
  const unresolved = priced.filter((l) => l.resolution === "unresolved");

  const costSubtotalCents = priced.reduce(
    (sum, l) => sum + (l.lineCostCents ?? 0),
    0,
  );

  const contingencyPct = options.contingencyPct ?? book.settings.contingencyPct;
  const contingencyCents = Math.round(
    costSubtotalCents * (contingencyPct / 100),
  );

  const costWithContingency = costSubtotalCents + contingencyCents;
  const marginPct = book.settings.targetMarginPct;
  const marginCents = Math.round(costWithContingency * (marginPct / 100));

  const net = costWithContingency + marginCents;
  // Every job carries a floor; a two-hour call-out cannot be quoted at cost.
  const netCents = Math.max(net, book.settings.calloutMinimumCents);

  const taxRatePct = book.settings.taxRatePct;
  const taxCents = Math.round(netCents * (taxRatePct / 100));
  const totalCents = netCents + taxCents;

  // Recovered from the final figure rather than assumed, so the callout floor
  // and any rounding are reflected in the margin actually being earned.
  const realisedMarginPct =
    netCents > 0
      ? ((netCents - costWithContingency) / netCents) * 100
      : 0;

  const blocking: string[] = [];
  const warnings: string[] = [];

  for (const line of unresolved) {
    blocking.push(line.note ?? `Line ${line.id} could not be priced.`);
  }

  if (priced.length === 0) {
    blocking.push("The takeoff contains no lines, so there is nothing to price.");
  }

  if (realisedMarginPct < book.settings.minMarginPct) {
    blocking.push(
      `Realised margin is ${realisedMarginPct.toFixed(1)}%, below the ${book.settings.minMarginPct}% floor. This quote loses money.`,
    );
  }

  for (const line of priced) {
    if (line.resolution === "near" && line.note) warnings.push(line.note);
  }
  if (net < book.settings.calloutMinimumCents) {
    warnings.push("Priced up to the call-out minimum.");
  }

  return {
    lines: priced,
    unresolved,
    costSubtotalCents,
    contingencyPct,
    contingencyCents,
    marginPct,
    marginCents,
    netCents,
    taxRatePct,
    taxCents,
    totalCents,
    passed: blocking.length === 0,
    blocking,
    warnings,
  };
}

/** Human-readable summary for the trace and for the revision prompt. */
export function describePricing(math: QuoteMath): string {
  if (math.passed) {
    const near = math.lines.filter((l) => l.resolution === "near").length;
    return near > 0
      ? `All ${math.lines.length} lines priced from the book (${near} matched approximately).`
      : `All ${math.lines.length} lines priced from the book exactly.`;
  }
  return math.blocking.map((b) => `- ${b}`).join("\n");
}
