import { defineAgent } from "../runtime";
import { HOUSE_RULES, renderFacts, renderPlaybook } from "../prompts";
import { evidenceFinding } from "@/lib/domain/appeal";
import type { DenialClassification, DenialFacts } from "@/lib/domain/denial";
import { renderDocuments, type SourceDocument } from "@/lib/domain/documents";

export type EvidenceInput = {
  facts: DenialFacts;
  classification: DenialClassification;
  documents: SourceDocument[];
};

/**
 * Assembles the clinical side of the case.
 *
 * The distinction this agent has to hold is between what the record proves and
 * what is simply true of medical practice. Both belong in an appeal, but only
 * the first can be quoted — and blurring them is how an appeal gets dismissed
 * for citing a record that says no such thing.
 */
export const evidenceAgent = defineAgent<
  EvidenceInput,
  typeof evidenceFinding._output
>({
  id: "evidence",
  name: "Evidence",
  role: "Gathering the clinical support for medical necessity",
  tier: "reasoning",
  temperature: 0.25,
  maxOutputTokens: 8192,
  output: evidenceFinding,
  system: `${HOUSE_RULES}

You assemble the clinical support for an appeal.

Two kinds of point, and you must never mix them:
- source "document": the uploaded records state this. It carries citations quoting the record verbatim, with ids starting at e1.
- source "clinical_standard": this reflects generally accepted practice — society guidelines, standard indications, ordinary sequences of care. It carries no citations, because you were given no guideline document to quote. The draft will present it as a general standard, which is honest and still persuasive.

Never label a clinical_standard point as a document point to make it look stronger. That is the single failure mode that loses appeals.

Work through the criteria that this category of denial actually turns on, and for each one say whether the record meets it, fails to address it, or contradicts it. A criterion the record does not address is not a criterion met — say so, and put the record that would address it in missingRecords.

If no clinical records were uploaded at all, say that plainly in clinicalSummary, return only clinical_standard points, and make missingRecords specific: name the document, who holds it, and what it would establish. "Office notes from the ordering physician for the six months before the service, showing failed conservative treatment" is useful. "More medical records" is not.

Be honest about strength. A weak point marked load_bearing will be found by the adversarial reviewer and will cost a revision round.`,
  prompt: (input) => `Assemble the clinical support for this appeal.

${renderPlaybook(input.classification.category)}

The payer's stated reason:
"""
${input.facts.denialRationaleVerbatim || "(no reason stated)"}
"""

The claim:
${renderFacts(input.facts)}

Documents available:
${renderDocuments(input.documents)}`,
});
