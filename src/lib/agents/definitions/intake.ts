import { z } from "zod";
import { defineAgent } from "../runtime";
import { HOUSE_RULES } from "../prompts";
import { denialFacts } from "@/lib/domain/denial";
import { documentKind, renderDocuments, type SourceDocument } from "@/lib/domain/documents";
import type { Attachment } from "@/lib/gemini/client";

/**
 * Pass one of intake: turn an upload into text a human could check.
 *
 * Transcription has to be literal. Every citation later in the pipeline is
 * verified by searching this text, so a model that "helpfully" tidies a line
 * here makes a truthful quote unverifiable three agents downstream.
 */
export const transcription = z.object({
  detectedKind: documentKind.describe("what this document actually is"),
  pages: z
    .array(
      z.object({
        page: z.number().int().min(1),
        text: z
          .string()
          .describe("the full text of this page, transcribed literally"),
      }),
    )
    .describe("one entry per page, in order"),
  legibilityNotes: z
    .array(z.string())
    .describe(
      "anything illegible, cut off, or missing that the user should re-upload",
    ),
});
export type Transcription = z.infer<typeof transcription>;

export type TranscribeInput = {
  filename: string;
  attachment: Attachment;
};

export const transcriberAgent = defineAgent<TranscribeInput, Transcription>({
  id: "intake_transcribe",
  name: "Intake",
  role: "Reading the upload and transcribing it",
  tier: "fast",
  maxOutputTokens: 16384,
  temperature: 0,
  output: transcription,
  system: `${HOUSE_RULES}

You transcribe insurance documents so that other agents can quote them and a verifier can check those quotes against your output.

Transcribe literally:
- Reproduce the words exactly as printed, including headings, reference numbers, codes, dates and amounts.
- Preserve line structure where it carries meaning, such as tables of charges or lists of codes.
- Do not summarise, reorder, correct spelling, expand abbreviations, or omit boilerplate. The small print is often where the appeal rights are.
- If a word is genuinely unreadable, write [illegible] in its place and record it in legibilityNotes. Never guess at a number.
- If the document has one page, return exactly one page entry.`,
  attachments: (input) => [input.attachment],
  prompt: (input) =>
    `Transcribe the attached document (filename: ${input.filename}).

Return every page in order. Identify what kind of document it is. Note anything you could not read.`,
});

export type IntakeInput = {
  documents: SourceDocument[];
};

/**
 * Pass two of intake: pull the structured facts off the transcribed text.
 *
 * Each field arrives with the quote it came from, which is what lets the case
 * page make every fact clickable back to its source line.
 */
export const intakeAgent = defineAgent<IntakeInput, typeof denialFacts._output>({
  id: "intake_facts",
  name: "Intake",
  role: "Extracting the claim facts and the filing deadline",
  tier: "fast",
  temperature: 0,
  maxOutputTokens: 8192,
  output: denialFacts,
  system: `${HOUSE_RULES}

You extract the structured facts of a denied claim from documents that have already been transcribed.

For every field:
- Copy the supporting quote verbatim from the document text you were given, and record which document id and page it came from.
- If the documents do not state a field, set value to null, leave quote empty, and set confidence to low. Never infer a claim number, a date, or an amount.
- Amounts are integer cents. $1,284.50 is 128450. If an amount is shown as a range or is unclear, treat it as not stated.
- Dates are ISO yyyy-mm-dd. If a date is ambiguous, prefer the one printed nearest the relevant label and lower the confidence.

The deadline field matters more than any other. Letters express it either as a date ("you must appeal by March 4") or as a duration ("within 180 days of this notice"). Capture whichever the letter actually uses, in the matching field, and leave the other null.

denialRationaleVerbatim must be the payer's complete stated reason, quoted exactly. Do not shorten it. If the letter gives no reason, return an empty string rather than describing the absence.`,
  prompt: (input) =>
    `Extract the claim facts from these documents.

${renderDocuments(input.documents)}`,
});
