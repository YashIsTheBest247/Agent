import { z } from "zod";

/**
 * The orders desk.
 *
 * Distributors receive purchase orders as prose and PDF attachments and rekey
 * them by hand. The work is not hard, it is just relentless — and the cost of
 * getting one wrong is a wrong delivery, a credit note and a phone call.
 *
 * The arrangement mirrors the other desks: the agent reads the order and says
 * what it thinks was asked for, and code decides whether that corresponds to
 * something real, in stock, at the agreed price. Nothing is confirmed that does
 * not resolve. See `resolve.ts`.
 */

// ---------------------------------------------------------------------------
// The catalogue and the customer file. Never model-generated.
// ---------------------------------------------------------------------------

export type CatalogItem = {
  sku: string;
  name: string;
  /** What customers actually call it when ordering. */
  aliases: string[];
  unit: string;
  listPriceCents: number;
  stockOnHand: number;
  leadTimeDays: number;
  minOrderQty: number;
};

export type TradeCustomer = {
  id: string;
  name: string;
  /** Addresses an order may legitimately arrive from. */
  emails: string[];
  agreedDiscountPct: number;
  creditLimitCents: number;
  creditUsedCents: number;
  onHold: boolean;
};

export type CatalogSettings = {
  currency: string;
  /** How far a customer's stated price may differ before a human looks. */
  priceTolerancePct: number;
  backorderAllowed: boolean;
  /** Orders above this always go to a person, however cleanly they resolve. */
  manualReviewAboveCents: number;
};

export type Catalog = {
  id: string;
  name: string;
  items: CatalogItem[];
  customers: TradeCustomer[];
  settings: CatalogSettings;
};

/** The net price for a customer, after their agreed discount. */
export function netPriceCents(item: CatalogItem, customer: TradeCustomer | null): number {
  const discount = customer?.agreedDiscountPct ?? 0;
  return Math.round(item.listPriceCents * (1 - discount / 100));
}

/** Catalogue lines shown to the intake agent so it names real products. */
export function renderCatalog(catalog: Catalog): string {
  return catalog.items
    .map(
      (i) =>
        `- ${i.name} (per ${i.unit})${i.aliases.length ? ` — also called: ${i.aliases.join(", ")}` : ""}`,
    )
    .join("\n");
}

// ---------------------------------------------------------------------------
// Agent outputs
// ---------------------------------------------------------------------------

/**
 * What the intake agent believes was ordered.
 *
 * `statedUnitPriceCents` is the price the customer wrote on their own order —
 * a fact copied out of the document, not a price the agent chose. It exists so
 * the resolver can catch a customer ordering at last year's price.
 */
export const parsedOrder = z.object({
  buyerName: z
    .string()
    .describe("the company placing the order, as written; empty string if absent"),
  buyerEmail: z
    .string()
    .describe("the address the order came from, as written; empty string if absent"),
  poNumber: z
    .string()
    .describe("their purchase order reference, verbatim; empty string if absent"),
  requestedDate: z
    .string()
    .describe("requested delivery date as ISO yyyy-mm-dd; empty string if none stated"),
  deliveryAddress: z
    .string()
    .describe("where it goes, as written; empty string if not stated"),
  lines: z.array(
    z.object({
      id: z.string().describe("short stable id such as n1, n2"),
      description: z
        .string()
        .describe(
          "the product as the customer described it, named as closely as possible to the catalogue",
        ),
      quantity: z.number().describe("how many units they asked for"),
      unit: z.string().describe("the unit they used, or the catalogue unit if none was given"),
      statedUnitPriceCents: z
        .number()
        .describe(
          "the unit price the customer wrote, in whole minor units; 0 if they did not state one",
        ),
      verbatim: z
        .string()
        .describe("the original line copied exactly from the order, for a human to check against"),
    }),
  ),
  instructions: z
    .array(z.string())
    .describe("delivery notes, part-shipment preferences, anything conditional"),
  unclear: z
    .array(z.string())
    .describe("anything in the order that could not be read or is genuinely ambiguous"),
});
export type ParsedOrder = z.infer<typeof parsedOrder>;

export const exceptionTriage = z.object({
  items: z.array(
    z.object({
      lineId: z.string().describe("the line this concerns, or 'order' for an order-level problem"),
      whatHappened: z
        .string()
        .describe("the problem in one sentence, in the words a sales clerk would use"),
      likelyCause: z
        .string()
        .describe("the most probable explanation — a renamed product, an old price list, a typo"),
      recommendedAction: z
        .string()
        .describe("the single next action, concrete enough to do without thinking"),
      canAutoResolve: z
        .boolean()
        .describe("true only if the action needs no judgement and no contact with the customer"),
    }),
  ),
  overallAssessment: z
    .string()
    .describe("whether this order is routine, awkward, or needs a call"),
});
export type ExceptionTriage = z.infer<typeof exceptionTriage>;

export const fulfilmentView = z.object({
  canMeetRequestedDate: z
    .boolean()
    .describe("false if any confirmed line cannot arrive by the requested date"),
  earliestCompleteDate: z
    .string()
    .describe("ISO date when the whole order could ship complete, or empty string if unknown"),
  reasoning: z.string(),
  splitRecommended: z
    .boolean()
    .describe("true if shipping the available lines now beats holding the order"),
  notes: z.array(z.string()).describe("anything the warehouse should know"),
});
export type FulfilmentView = z.infer<typeof fulfilmentView>;

/**
 * The reply. Money is injected by the renderer from the resolved order, so the
 * writer stays in prose and cannot state a figure.
 */
export const orderReply = z.object({
  subject: z.string(),
  body: z
    .string()
    .describe(
      "the email body in markdown; refer to lines by their description, never state a price or a total",
    ),
  tone: z
    .enum(["confirmation", "confirmation_with_query", "query_only"])
    .describe("what this email is doing"),
  questionsForCustomer: z
    .array(z.string())
    .describe("anything the customer must answer before the order can proceed"),
});
export type OrderReply = z.infer<typeof orderReply>;
