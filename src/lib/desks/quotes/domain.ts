import { z } from "zod";

/**
 * The quoting desk.
 *
 * A contractor walks a site talking, and photographs what matters. What comes
 * back has to be a number they are willing to be held to — so the arrangement
 * here is deliberate: the agents describe work and quantities, and never a
 * price. Every figure in the finished quote is computed by code from the
 * contractor's own price book. See `pricing.ts`.
 */

export const lineKind = z.enum(["material", "labour", "plant", "subcontract"]);
export type LineKind = z.infer<typeof lineKind>;

// ---------------------------------------------------------------------------
// The price book — the contractor's own catalogue. Never model-generated.
// ---------------------------------------------------------------------------

export type PriceBookItem = {
  sku: string;
  name: string;
  /** Trade names and abbreviations the same thing gets called on site. */
  aliases: string[];
  unit: string;
  /** What it costs the contractor, before margin. Integer minor units. */
  unitCostCents: number;
  kind: LineKind;
};

export type LabourRate = {
  trade: string;
  aliases: string[];
  hourlyCents: number;
};

export type PriceBookSettings = {
  taxRatePct: number;
  /** Markup the quote aims for. */
  targetMarginPct: number;
  /** Below this the quote loses money and is blocked rather than shown. */
  minMarginPct: number;
  /** Default uplift for unknowns; the risk agent may argue it up. */
  contingencyPct: number;
  /** No job goes out below this, however small. */
  calloutMinimumCents: number;
};

export type PriceBook = {
  id: string;
  name: string;
  currency: string;
  items: PriceBookItem[];
  labour: LabourRate[];
  settings: PriceBookSettings;
};

/** Catalogue lines shown to the takeoff agent so it describes real things. */
export function renderCatalogue(book: PriceBook): string {
  const materials = book.items
    .map(
      (i) =>
        `- ${i.name} (${i.kind}, per ${i.unit})${i.aliases.length ? ` — also called: ${i.aliases.join(", ")}` : ""}`,
    )
    .join("\n");
  const labour = book.labour
    .map(
      (l) =>
        `- ${l.trade} (labour, per hour)${l.aliases.length ? ` — also called: ${l.aliases.join(", ")}` : ""}`,
    )
    .join("\n");

  return `Materials, plant and subcontract:\n${materials}\n\nLabour:\n${labour}`;
}

// ---------------------------------------------------------------------------
// Agent outputs
// ---------------------------------------------------------------------------

/** What the intake agent got out of the walkthrough. */
export const siteNotes = z.object({
  transcript: z
    .string()
    .describe(
      "the spoken walkthrough transcribed verbatim, empty string if there was no audio",
    ),
  propertyType: z
    .string()
    .describe("what kind of building or space this is, as described or shown"),
  observations: z
    .array(
      z.object({
        id: z.string().describe("short stable id such as o1, o2"),
        what: z.string().describe("the thing observed, in one sentence"),
        where: z.string().describe("the room, elevation or area"),
        measurement: z
          .string()
          .describe(
            "the dimension as stated or visible, verbatim; empty string if none was given",
          ),
        condition: z
          .string()
          .describe("its condition, and anything that will complicate the work"),
        source: z
          .enum(["spoken", "photograph", "both"])
          .describe("where this observation came from"),
      }),
    )
    .describe("everything that bears on the price"),
  accessNotes: z
    .array(z.string())
    .describe("parking, stairs, working height, occupancy, restricted hours"),
  unclear: z
    .array(z.string())
    .describe(
      "anything said or shown that could not be made out, and anything a quote needs that was not covered",
    ),
});
export type SiteNotes = z.infer<typeof siteNotes>;

export const scopeOfWork = z.object({
  summary: z.string().describe("what this job is, in two or three sentences"),
  tasks: z.array(
    z.object({
      id: z.string().describe("short stable id such as t1, t2"),
      title: z.string(),
      description: z.string().describe("what will actually be done"),
      observationIds: z
        .array(z.string())
        .describe("the observations this task answers to"),
      assumptions: z
        .array(z.string())
        .describe("what is being taken on trust, stated so the customer can correct it"),
    }),
  ),
  exclusions: z
    .array(z.string())
    .describe(
      "work a customer might reasonably assume is included and is not — the single biggest source of disputes",
    ),
  sequencing: z
    .string()
    .describe("the order the work has to happen in, and why"),
});
export type ScopeOfWork = z.infer<typeof scopeOfWork>;

/**
 * The estimate. Note what is absent: no prices, no totals, no money of any
 * kind. The agent chooses what and how much; the pricing engine decides what
 * that costs.
 */
export const takeoffLine = z.object({
  id: z.string().describe("short stable id such as l1, l2"),
  taskId: z.string().describe("the task this line belongs to"),
  description: z
    .string()
    .describe(
      "the catalogue item or trade, named as closely as possible to how the price book names it",
    ),
  kind: lineKind,
  quantity: z.number().describe("how many units; may be fractional"),
  unit: z.string().describe("the unit of measure, matching the catalogue"),
  basis: z
    .string()
    .describe(
      "how this quantity was arrived at — the measurement used, or the assumption made",
    ),
});
export type TakeoffLine = z.infer<typeof takeoffLine>;

export const takeoff = z.object({
  lines: z.array(takeoffLine),
  measurementBasis: z
    .string()
    .describe("what the quantities were derived from, and how confident that is"),
  unknowns: z
    .array(z.string())
    .describe("what could change these quantities once work starts"),
});
export type Takeoff = z.infer<typeof takeoff>;

export const riskAssessment = z.object({
  findings: z.array(
    z.object({
      risk: z.string().describe("what could go wrong or cost more"),
      likelihood: z.enum(["likely", "possible", "unlikely"]),
      impact: z.enum(["minor", "material", "severe"]),
      mitigation: z
        .string()
        .describe("what to check before starting, or how to price around it"),
    }),
  ),
  recommendedContingencyPct: z
    .number()
    .describe("percentage uplift justified by these risks, 0 if none"),
  contingencyRationale: z.string(),
  confirmBeforeStarting: z
    .array(z.string())
    .describe("things a human must verify on site before this quote is binding"),
});
export type RiskAssessment = z.infer<typeof riskAssessment>;

export const takeoffChallenge = z.object({
  wouldOverrun: z
    .boolean()
    .describe("true if this job would plausibly cost more than the takeoff allows"),
  overrunRationale: z.string(),
  missedItems: z
    .array(
      z.object({
        item: z.string().describe("what the takeoff does not account for"),
        severity: z.enum(["forgotten", "understated", "minor"]),
        consequence: z.string().describe("what it costs when it surfaces on site"),
      }),
    )
    .describe("work or materials a tradesperson would notice were left out"),
  overstatedItems: z
    .array(z.string())
    .describe("lines that are generous and would make the quote uncompetitive"),
  confidence: z.enum(["high", "medium", "low"]),
});
export type TakeoffChallenge = z.infer<typeof takeoffChallenge>;

/**
 * The customer-facing document. Money is injected by the renderer from the
 * priced result, so this stays prose — the writer cannot state a figure.
 */
export const quoteDocument = z.object({
  title: z.string(),
  intro: z
    .string()
    .describe("two or three sentences: what was seen, and what is proposed"),
  scopeNarrative: z
    .string()
    .describe(
      "the work in markdown, task by task, in the order it will happen; never state a price",
    ),
  inclusions: z.array(z.string()),
  exclusions: z.array(z.string()),
  assumptions: z.array(z.string()),
  validityNote: z
    .string()
    .describe("how long the quote stands and what would change it"),
  nextStep: z.string().describe("what the customer does to accept"),
});
export type QuoteDocument = z.infer<typeof quoteDocument>;
