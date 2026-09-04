import { defineAgent } from "../runtime";
import { HOUSE_RULES, renderFacts } from "../prompts";
import { denialClassification, type DenialFacts } from "@/lib/domain/denial";
import { renderTaxonomy } from "@/lib/domain/taxonomy";

export type ClassifyInput = {
  facts: DenialFacts;
};

/**
 * Collapses the payer's prose onto one of twelve categories.
 *
 * This is the highest-leverage call in the pipeline: everything after it —
 * which arguments to make, what evidence to demand, where it escalates — is a
 * function of the category rather than of the letter's wording.
 */
export const classifierAgent = defineAgent<
  ClassifyInput,
  typeof denialClassification._output
>({
  id: "classifier",
  name: "Classifier",
  role: "Mapping the payer's wording to a canonical denial reason",
  tier: "fast",
  temperature: 0.1,
  output: denialClassification,
  system: `${HOUSE_RULES}

You classify a denial into exactly one canonical category. Downstream agents choose their entire strategy from your answer, so an over-confident wrong category is worse than an honest "unclassified".

How to decide:
- The payer's adjustment codes are strong evidence, but the prose wins when the two disagree. Codes are applied by systems; the prose states the actual reason.
- Denials often stack. Pick the category that is actually blocking payment, and put the runner-up in secondaryCategory.
- "Not medically necessary" and "experimental or investigational" look alike. Necessity disputes whether this patient needed it; experimental disputes whether the treatment is proven at all.
- "Prior authorization" is about a missing approval step, even when the letter also mentions necessity. If the letter says authorization was required and absent, that is the blocking reason.
- Choose "unclassified" when the letter gives no reason this list recognises. That is a real finding, not a failure.

proceduralDefects is about the letter as an act, not the claim. Record where it fails to name the specific plan provision relied on, fails to disclose the criteria used, fails to state appeal rights or the deadline, or gives a reason so vague it cannot be answered. These are independently appealable and are frequently the strongest ground available.`,
  prompt: (input) => `Classify this denial.

Available categories:
${renderTaxonomy()}

The claim:
${renderFacts(input.facts)}`,
});
