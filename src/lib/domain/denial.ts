import { z } from "zod";
import { denialCategory } from "./taxonomy";

export const confidence = z.enum(["high", "medium", "low"]);
export type Confidence = z.infer<typeof confidence>;

/**
 * Every fact the intake agent pulls out arrives with the text it came from.
 *
 * This is the spine of the whole system: a value with no supporting quote is a
 * guess, and downstream agents are told to treat it as one. It also means the
 * user can click any fact on the case page and land on the line it came from.
 */
export function extracted<T extends z.ZodTypeAny>(inner: T) {
  return z.object({
    value: inner.nullable().describe("null if the documents do not state it"),
    quote: z
      .string()
      .describe(
        "verbatim text from the source document supporting this value, empty string if absent",
      ),
    documentId: z.string().describe("id of the document the quote came from"),
    page: z.number().int().describe("page number of the quote, 0 if unknown"),
    confidence,
  });
}

export type Extracted<T> = {
  value: T | null;
  quote: string;
  documentId: string;
  page: number;
  confidence: Confidence;
};

/** Structured facts pulled off the denial letter and EOB. */
export const denialFacts = z.object({
  payerName: extracted(z.string()).describe("the insurance company"),
  planName: extracted(z.string()),
  memberId: extracted(z.string()),
  claimNumber: extracted(z.string()),
  patientName: extracted(z.string()),
  providerName: extracted(z.string()).describe("who delivered the service"),

  serviceDate: extracted(z.string()).describe("ISO date of the service"),
  denialDate: extracted(z.string()).describe("ISO date the denial was issued"),
  appealDeadline: extracted(z.string()).describe(
    "ISO date the appeal must be filed by, as stated in the letter",
  ),
  appealWindowDays: extracted(z.number().int()).describe(
    "days allowed to appeal, if the letter states a duration rather than a date",
  ),

  procedureCodes: z
    .array(z.string())
    .describe("CPT or HCPCS codes billed, empty if none stated"),
  diagnosisCodes: z
    .array(z.string())
    .describe("ICD-10 codes, empty if none stated"),
  denialCodes: z
    .array(z.string())
    .describe("payer adjustment reason codes such as CO-50, empty if none"),

  billedAmountCents: extracted(z.number().int()),
  allowedAmountCents: extracted(z.number().int()),
  patientResponsibilityCents: extracted(z.number().int()),

  denialRationaleVerbatim: z
    .string()
    .describe(
      "the payer's stated reason, quoted exactly and completely from the letter",
    ),
  appealInstructionsVerbatim: z
    .string()
    .describe(
      "how the letter says to appeal, quoted exactly, empty string if the letter is silent",
    ),

  unreadableSections: z
    .array(z.string())
    .describe(
      "descriptions of anything illegible or missing that a human should re-upload",
    ),
});
export type DenialFacts = z.infer<typeof denialFacts>;

/** The classifier's verdict on which playbook applies. */
export const denialClassification = z.object({
  category: denialCategory,
  confidence,
  reasoning: z
    .string()
    .describe("two or three sentences on why this category and not the others"),
  supportingQuote: z
    .string()
    .describe("the phrase in the denial that decided the category"),
  secondaryCategory: denialCategory.describe(
    "the next most likely category, or unclassified if there is no real alternative",
  ),
  proceduralDefects: z
    .array(z.string())
    .describe(
      "ways the letter itself falls short — no specific plan provision cited, no criteria disclosed, no appeal rights stated",
    ),
});
export type DenialClassification = z.infer<typeof denialClassification>;

/** Convenience: the deadline we will actually track, however the letter expressed it. */
export function resolveDeadline(facts: DenialFacts): string | null {
  if (facts.appealDeadline.value) return facts.appealDeadline.value;

  const days = facts.appealWindowDays.value;
  const from = facts.denialDate.value;
  if (days && from) {
    const d = new Date(from);
    if (!Number.isNaN(d.getTime())) {
      d.setDate(d.getDate() + days);
      return d.toISOString().slice(0, 10);
    }
  }
  return null;
}
