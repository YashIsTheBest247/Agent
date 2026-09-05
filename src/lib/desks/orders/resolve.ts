import { bestCandidate } from "@/lib/match";
import {
  netPriceCents,
  type Catalog,
  type CatalogItem,
  type ParsedOrder,
  type TradeCustomer,
} from "./domain";

/**
 * The orders desk's hard gate.
 *
 * A confirmed order is a promise to ship a specific thing at a specific price.
 * So the rule is the same as the other desks': nothing is confirmed that does
 * not resolve. A line the catalogue does not contain, a quantity that exceeds
 * stock, a price that disagrees with the customer's agreement — each goes to a
 * person rather than being smoothed over.
 *
 * Partial confirmation is deliberate. Real distributors ship what they can and
 * query the rest, and an order where seventeen lines clear and three land in a
 * queue is a good day, not a failure.
 */

const EXACT_THRESHOLD = 0.97;
const NEAR_THRESHOLD = 0.84;

export type ExceptionCode =
  | "unknown_item"
  | "ambiguous_item"
  | "invalid_quantity"
  | "below_minimum"
  | "insufficient_stock"
  | "price_mismatch"
  | "unknown_customer"
  | "customer_on_hold"
  | "credit_limit"
  | "manual_review_threshold";

export type OrderException = {
  code: ExceptionCode;
  /** The line it concerns, or null for an order-level problem. */
  lineId: string | null;
  detail: string;
  /** False for things a human should see but which do not stop the line. */
  blocking: boolean;
};

export type ResolvedLine = {
  id: string;
  description: string;
  verbatim: string;
  quantity: number;
  unit: string;
  statedUnitPriceCents: number;

  sku: string | null;
  matchedName: string | null;
  score: number;
  /** The price we would actually charge, after the customer's discount. */
  unitPriceCents: number | null;
  lineTotalCents: number | null;

  confirmable: boolean;
  availableNow: number | null;
  leadTimeDays: number | null;
  exceptions: OrderException[];
};

export type ResolvedOrder = {
  customer: TradeCustomer | null;
  lines: ResolvedLine[];
  confirmable: ResolvedLine[];
  held: ResolvedLine[];
  exceptions: OrderException[];
  /** Totals cover only the lines that can actually be confirmed. */
  confirmedSubtotalCents: number;
  currency: string;
  /** True when every line resolved and the order needs no human decision. */
  clean: boolean;
  /** False when nothing at all can be confirmed. */
  anythingConfirmable: boolean;
};

function findCustomer(order: ParsedOrder, catalog: Catalog): TradeCustomer | null {
  const email = order.buyerEmail.trim().toLowerCase();
  if (email) {
    const byEmail = catalog.customers.find((c) =>
      c.emails.some((e) => e.toLowerCase() === email),
    );
    if (byEmail) return byEmail;
  }

  if (!order.buyerName.trim()) return null;
  const byName = bestCandidate(order.buyerName, catalog.customers, (c) => [c.name]);
  return byName && byName.score >= NEAR_THRESHOLD ? byName.candidate : null;
}

/** Resolves one ordered line against the catalogue and the customer's terms. */
export function resolveLine(
  line: ParsedOrder["lines"][number],
  catalog: Catalog,
  customer: TradeCustomer | null,
): ResolvedLine {
  const exceptions: OrderException[] = [];
  const base: ResolvedLine = {
    id: line.id,
    description: line.description,
    verbatim: line.verbatim,
    quantity: line.quantity,
    unit: line.unit,
    statedUnitPriceCents: line.statedUnitPriceCents,
    sku: null,
    matchedName: null,
    score: 0,
    unitPriceCents: null,
    lineTotalCents: null,
    confirmable: false,
    availableNow: null,
    leadTimeDays: null,
    exceptions,
  };

  const match = bestCandidate(line.description, catalog.items, (i) => [
    i.name,
    ...i.aliases,
  ]);

  if (!match || match.score < NEAR_THRESHOLD) {
    exceptions.push({
      code: "unknown_item",
      lineId: line.id,
      detail: match
        ? `"${line.description}" is not in the catalogue. Closest is "${match.matchedOn}".`
        : `"${line.description}" is not in the catalogue.`,
      blocking: true,
    });
    return { ...base, score: match ? Number(match.score.toFixed(3)) : 0 };
  }

  const item: CatalogItem = match.candidate;
  const unitPriceCents = netPriceCents(item, customer);

  if (match.score < EXACT_THRESHOLD) {
    exceptions.push({
      code: "ambiguous_item",
      lineId: line.id,
      detail: `Read "${line.description}" as "${item.name}". Confirm before shipping.`,
      blocking: false,
    });
  }

  if (!Number.isFinite(line.quantity) || line.quantity <= 0) {
    exceptions.push({
      code: "invalid_quantity",
      lineId: line.id,
      detail: `Quantity is ${line.quantity}, which cannot be filled.`,
      blocking: true,
    });
  } else if (line.quantity < item.minOrderQty) {
    exceptions.push({
      code: "below_minimum",
      lineId: line.id,
      detail: `${item.name} has a minimum order of ${item.minOrderQty} ${item.unit}; they asked for ${line.quantity}.`,
      blocking: true,
    });
  } else if (line.quantity > item.stockOnHand) {
    exceptions.push({
      code: "insufficient_stock",
      lineId: line.id,
      detail: catalog.settings.backorderAllowed
        ? `Only ${item.stockOnHand} of ${line.quantity} ${item.unit} in stock; the balance is ${item.leadTimeDays} days out.`
        : `Only ${item.stockOnHand} of ${line.quantity} ${item.unit} in stock, and backorders are off.`,
      blocking: !catalog.settings.backorderAllowed,
    });
  }

  // A price the customer wrote that disagrees with their agreement is the most
  // common cause of a disputed invoice, and the easiest to catch here.
  if (line.statedUnitPriceCents > 0) {
    const drift =
      Math.abs(line.statedUnitPriceCents - unitPriceCents) / unitPriceCents;
    if (drift * 100 > catalog.settings.priceTolerancePct) {
      exceptions.push({
        code: "price_mismatch",
        lineId: line.id,
        detail: `They ordered at ${(line.statedUnitPriceCents / 100).toFixed(2)}; their agreed price is ${(unitPriceCents / 100).toFixed(2)}.`,
        blocking: true,
      });
    }
  }

  const blocked = exceptions.some((e) => e.blocking);
  const fillable = Math.min(line.quantity, item.stockOnHand);

  return {
    ...base,
    sku: item.sku,
    matchedName: item.name,
    score: Number(match.score.toFixed(3)),
    unitPriceCents,
    lineTotalCents: blocked ? null : Math.round(line.quantity * unitPriceCents),
    confirmable: !blocked,
    availableNow: fillable,
    leadTimeDays: item.leadTimeDays,
    exceptions,
  };
}

/** Resolves a whole order and decides what may be confirmed without a human. */
export function resolveOrder(
  order: ParsedOrder,
  catalog: Catalog,
): ResolvedOrder {
  const customer = findCustomer(order, catalog);
  const orderExceptions: OrderException[] = [];

  if (!customer) {
    orderExceptions.push({
      code: "unknown_customer",
      lineId: null,
      detail: `No account matches "${order.buyerName || order.buyerEmail || "this sender"}". Pricing falls back to list.`,
      blocking: true,
    });
  } else if (customer.onHold) {
    orderExceptions.push({
      code: "customer_on_hold",
      lineId: null,
      detail: `${customer.name} is on hold. Nothing ships until accounts clear it.`,
      blocking: true,
    });
  }

  const lines = order.lines.map((l) => resolveLine(l, catalog, customer));
  const customerBlocked = orderExceptions.some((e) => e.blocking);

  const confirmable = customerBlocked ? [] : lines.filter((l) => l.confirmable);
  const held = customerBlocked ? lines : lines.filter((l) => !l.confirmable);

  const confirmedSubtotalCents = confirmable.reduce(
    (sum, l) => sum + (l.lineTotalCents ?? 0),
    0,
  );

  if (customer && confirmedSubtotalCents > 0) {
    const headroom = customer.creditLimitCents - customer.creditUsedCents;
    if (confirmedSubtotalCents > headroom) {
      orderExceptions.push({
        code: "credit_limit",
        lineId: null,
        detail: `Order is ${(confirmedSubtotalCents / 100).toFixed(2)} against ${(headroom / 100).toFixed(2)} of remaining credit.`,
        blocking: true,
      });
    }
  }

  if (confirmedSubtotalCents > catalog.settings.manualReviewAboveCents) {
    orderExceptions.push({
      code: "manual_review_threshold",
      lineId: null,
      detail: `Above the ${(catalog.settings.manualReviewAboveCents / 100).toFixed(2)} threshold, so a person signs this one off.`,
      blocking: false,
    });
  }

  const creditBlocked = orderExceptions.some(
    (e) => e.blocking && e.code === "credit_limit",
  );
  const finalConfirmable = creditBlocked ? [] : confirmable;
  const finalHeld = creditBlocked ? lines : held;

  const allExceptions = [
    ...orderExceptions,
    ...lines.flatMap((l) => l.exceptions),
  ];

  return {
    customer,
    lines,
    confirmable: finalConfirmable,
    held: finalHeld,
    exceptions: allExceptions,
    confirmedSubtotalCents: creditBlocked ? 0 : confirmedSubtotalCents,
    currency: catalog.settings.currency,
    clean: allExceptions.length === 0 && lines.length > 0,
    anythingConfirmable: finalConfirmable.length > 0,
  };
}

/** Human-readable summary for the trace and the exception prompt. */
export function describeResolution(resolved: ResolvedOrder): string {
  const total = resolved.lines.length;
  const ok = resolved.confirmable.length;

  if (total === 0) return "The order contained no line items.";
  if (resolved.clean) return `All ${total} lines resolved and can be confirmed.`;

  const blocking = resolved.exceptions.filter((e) => e.blocking);
  return [
    `${ok} of ${total} lines can be confirmed. ${blocking.length} problem${blocking.length === 1 ? "" : "s"} need a person.`,
    ...blocking.map((e) => `- ${e.detail}`),
  ].join("\n");
}
