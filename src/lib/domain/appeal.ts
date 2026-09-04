import { z } from "zod";
import { appealOutlook } from "./taxonomy";
import { confidence } from "./denial";

/**
 * A claim about what a document says, tied to the document it came from.
 *
 * Agents may only assert things through citations. The auditor later re-opens
 * each source and confirms the quote is really there — see `verifiedCitation`.
 */
export const citation = z.object({
  id: z.string().describe("short stable id such as c1, c2"),
  documentId: z.string().describe("id of the source document"),
  page: z.number().int().describe("page the quote appears on, 0 if unknown"),
  quote: z
    .string()
    .describe(
      "text copied verbatim from the source, never paraphrased or reconstructed",
    ),
  supports: z
    .string()
    .describe("the proposition this quote is being offered to establish"),
});
export type Citation = z.infer<typeof citation>;

export const citationStatus = z.enum([
  "verified",
  "near_match",
  "not_found",
  "missing_document",
]);
export type CitationStatus = z.infer<typeof citationStatus>;

export type VerifiedCitation = Citation & {
  status: CitationStatus;
  /** 0-1 similarity against the closest passage actually present in the source. */
  similarity: number;
  /** What the source really says at that location, when the quote was wrong. */
  matchedText: string | null;
};

export const coverageFinding = z.object({
  citations: z.array(citation),
  governingLanguage: z
    .string()
    .describe(
      "the clause that decides this claim, in the user's own words, or an explanation of why the policy is silent",
    ),
  favoursAppeal: z
    .boolean()
    .describe("true if the policy language helps the appellant"),
  gaps: z
    .array(z.string())
    .describe("documents that would settle the question but were not provided"),
});
export type CoverageFinding = z.infer<typeof coverageFinding>;

export const argumentStrength = z.enum(["load_bearing", "supporting", "weak"]);

/**
 * Where a supporting point comes from, which decides how it may be used.
 *
 * A point grounded in an uploaded document can be quoted. A point that rests on
 * general clinical practice cannot — the draft must present it as the standard
 * it is, not dress it up as something the record says.
 */
export const evidenceSource = z.enum(["document", "clinical_standard"]);

export const evidencePoint = z.object({
  claim: z.string().describe("the supporting proposition, in one sentence"),
  source: evidenceSource,
  citationIds: z
    .array(z.string())
    .describe("empty when source is clinical_standard"),
  strength: argumentStrength,
});
export type EvidencePoint = z.infer<typeof evidencePoint>;

export const evidenceFinding = z.object({
  clinicalSummary: z
    .string()
    .describe(
      "what the records establish about this patient and this service, or a statement that no clinical records were provided",
    ),
  points: z.array(evidencePoint),
  citations: z.array(citation).describe("citations backing the document-sourced points"),
  missingRecords: z
    .array(z.string())
    .describe(
      "specific documents that would materially strengthen the appeal, named concretely enough to request",
    ),
});
export type EvidenceFinding = z.infer<typeof evidenceFinding>;

export const appealArgument = z.object({
  heading: z.string().describe("short label for this line of argument"),
  claim: z.string().describe("what this argument asserts, in one sentence"),
  basis: z
    .string()
    .describe("the reasoning, referring to citations by their ids"),
  citationIds: z.array(z.string()),
  strength: argumentStrength,
});
export type AppealArgument = z.infer<typeof appealArgument>;

export const appealLevel = z.enum([
  "reprocessing_request",
  "internal_level_1",
  "internal_level_2",
  "external_review",
  "regulator_complaint",
]);
export type AppealLevel = z.infer<typeof appealLevel>;

export const appealStrategy = z.object({
  level: appealLevel,
  levelRationale: z
    .string()
    .describe("why this level rather than the one above or below"),
  outlook: appealOutlook,
  outlookRationale: z.string(),
  arguments: z
    .array(appealArgument)
    .describe("ordered strongest first, at most four"),
  missingEvidence: z
    .array(z.string())
    .describe("what the user should gather to make this materially stronger"),
  escalationPath: z
    .string()
    .describe("what happens if this level fails, and by when"),
});
export type AppealStrategy = z.infer<typeof appealStrategy>;

export const appealDraft = z.object({
  subject: z.string().describe("the re: line"),
  recipientBlock: z
    .string()
    .describe("addressee lines taken from the denial letter's appeal instructions"),
  body: z
    .string()
    .describe(
      "the letter body in markdown, citing sources inline as [c1] style markers",
    ),
  citationIds: z
    .array(z.string())
    .describe("every citation id used anywhere in the body"),
  enclosures: z
    .array(z.string())
    .describe("documents the letter says are attached"),
  wordCount: z.number().int(),
});
export type AppealDraft = z.infer<typeof appealDraft>;

export const weaknessSeverity = z.enum(["fatal", "serious", "minor"]);

export const draftWeakness = z.object({
  severity: weaknessSeverity,
  location: z
    .string()
    .describe("the sentence or section of the draft at issue"),
  issue: z.string().describe("how a reviewer would use this to uphold"),
  fix: z.string().describe("the specific change that closes the hole"),
});
export type DraftWeakness = z.infer<typeof draftWeakness>;

/** The adversary agent's report, written from the payer reviewer's chair. */
export const reviewVerdict = z.object({
  wouldUphold: z
    .boolean()
    .describe("true if a reviewer could plausibly uphold the denial as written"),
  upholdRationale: z
    .string()
    .describe("the reviewer's best argument for rejecting this appeal"),
  weaknesses: z.array(draftWeakness),
  strongestPoint: z
    .string()
    .describe("the part of the appeal a reviewer would find hardest to dismiss"),
  unsupportedAssertions: z
    .array(z.string())
    .describe("claims in the draft that no citation actually establishes"),
  confidence,
});
export type ReviewVerdict = z.infer<typeof reviewVerdict>;

export const filingChecklistItem = z.object({
  item: z.string().describe("one concrete thing the user must do or attach"),
  /** True when the pipeline already produced it; false when the user must act. */
  readyAlready: z.boolean(),
  note: z.string().describe("where to get it, or why it matters"),
});

export const filingReminder = z.object({
  date: z.string().describe("ISO date"),
  label: z.string().describe("what to do on that date"),
});

export const filingPacket = z.object({
  submissionRoute: z
    .string()
    .describe(
      "how to actually send this, taken from the letter's instructions, or a marked placeholder if the letter is silent",
    ),
  recipient: z.string().describe("who it goes to, or a marked placeholder"),
  checklist: z.array(filingChecklistItem),
  reminders: z.array(filingReminder),
  nextEscalation: z
    .string()
    .describe("what to do if this level fails, and by when"),
  callScript: z
    .string()
    .describe(
      "a short script for phoning the payer to confirm receipt and status, including what to ask for and what to write down",
    ),
});
export type FilingPacket = z.infer<typeof filingPacket>;

/** Deterministic output of the citation auditor. Not model-generated. */
export type AuditReport = {
  passed: boolean;
  checked: VerifiedCitation[];
  blocking: VerifiedCitation[];
  /** Ids the draft referenced that no agent ever produced. */
  danglingIds: string[];
};
