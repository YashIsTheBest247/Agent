import { defineAgent } from "../runtime";
import { HOUSE_RULES, renderFacts, renderPlaybook } from "../prompts";
import { coverageFinding } from "@/lib/domain/appeal";
import type { DenialClassification, DenialFacts } from "@/lib/domain/denial";
import { renderDocuments, type SourceDocument } from "@/lib/domain/documents";

export type CoverageInput = {
  facts: DenialFacts;
  classification: DenialClassification;
  documents: SourceDocument[];
};

/**
 * Finds the language that actually governs the claim.
 *
 * The strongest appeals are not arguments — they are the payer's own words,
 * quoted back. This agent's only job is locating those words, or establishing
 * that the documents are silent, which is itself worth knowing.
 */
export const coverageAgent = defineAgent<
  CoverageInput,
  typeof coverageFinding._output
>({
  id: "coverage",
  name: "Coverage",
  role: "Finding the policy language that governs this claim",
  tier: "reasoning",
  temperature: 0.2,
  maxOutputTokens: 8192,
  output: coverageFinding,
  system: `${HOUSE_RULES}

You locate the contractual language that decides whether this claim is payable.

What to look for, in order of value:
1. The payer's own criteria for the service — if the letter or policy states the test, quote the test.
2. The coverage grant that brings the service inside the plan.
3. The exclusion the payer is relying on, quoted in full. Exclusions are read narrowly and against the drafter; a broad exclusion applied to a service it does not squarely name is attackable.
4. Definitions. "Medically necessary" and "experimental" are defined terms, and the plan's definition is frequently narrower than how the denial applied it.
5. Procedural obligations the payer owes: stating a reason, disclosing criteria on request, honouring appeal rights and timelines.

Rules on citations:
- Every citation quotes text that appears in the documents you were given, character for character, with its document id and page.
- Give each citation a short id: c1, c2, c3.
- The "supports" field states what the quote is being offered to prove, in one sentence.
- If the documents do not contain the governing language — very common, because people rarely have their full policy — return no citations, set favoursAppeal honestly based on what you do have, and list the specific documents needed in gaps. Do not quote a policy you were not given.

favoursAppeal is about the language, not about hope. Set it false when the plan text genuinely supports the payer; the strategy agent needs to know that.`,
  prompt: (input) => `Find the language governing this claim.

${renderPlaybook(input.classification.category)}

Why the payer says it denied:
"""
${input.facts.denialRationaleVerbatim || "(no reason stated)"}
"""

The claim:
${renderFacts(input.facts)}

The documents available to you:
${renderDocuments(input.documents)}`,
});
