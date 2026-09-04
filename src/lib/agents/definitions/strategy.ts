import { defineAgent } from "../runtime";
import {
  HOUSE_RULES,
  renderCitations,
  renderFacts,
  renderPlaybook,
} from "../prompts";
import {
  appealStrategy,
  type Citation,
  type CoverageFinding,
  type EvidenceFinding,
} from "@/lib/domain/appeal";
import type { DenialClassification, DenialFacts } from "@/lib/domain/denial";

export type StrategyInput = {
  facts: DenialFacts;
  classification: DenialClassification;
  coverage: CoverageFinding;
  evidence: EvidenceFinding;
  citations: Citation[];
  deadline: string | null;
  daysRemaining: number | null;
};

/**
 * Decides what appeal this is, and which two or three arguments carry it.
 *
 * The temptation is to make every available argument. That loses: a reviewer
 * reading six arguments finds the weakest one and answers only that. Ordering
 * and pruning is most of the value here.
 */
export const strategyAgent = defineAgent<
  StrategyInput,
  typeof appealStrategy._output
>({
  id: "strategy",
  name: "Strategy",
  role: "Choosing the appeal level, the deadline, and the arguments worth making",
  tier: "reasoning",
  temperature: 0.3,
  maxOutputTokens: 8192,
  output: appealStrategy,
  system: `${HOUSE_RULES}

You decide how this appeal is fought.

Choosing the level:
- reprocessing_request for defects that are corrections rather than disputes: coding errors, duplicates, coordination of benefits, a located authorization. These resolve fastest and should not be dressed up as formal appeals.
- internal_level_1 is the default for a first substantive challenge.
- internal_level_2 only when a first-level appeal has already been decided.
- external_review when internal appeals are exhausted, or when the deadline makes internal appeal futile and the category qualifies.
- regulator_complaint when the defect is procedural — no reason given, criteria withheld, appeal rights not stated — usually alongside a substantive appeal rather than instead of one.

Choosing the arguments:
- At most four, ordered strongest first. Two strong arguments beat five mixed ones.
- Lead with the argument that requires the reviewer to do the least work to agree. An authorization number that exists, or a criterion the payer's own letter states and the record plainly meets, beats a subtle interpretive point.
- Procedural defects are arguments. A denial that fails to state the plan provision relied on can be challenged on that basis alone.
- Mark an argument load_bearing only if the appeal could succeed on it by itself.
- Every argument's basis refers to citations by id. An argument with no citation must rest openly on a general standard or on the payer's own stated reason — say which.

Outlook is your honest read, not encouragement. "difficult" is a useful answer that tells the user where to spend their effort.

missingEvidence is the most actionable thing you produce. Name documents concretely and say what each would establish.

escalationPath states what happens if this level fails and by roughly when, so the user knows this is not their last move.`,
  prompt: (input) => {
    const clock =
      input.deadline && input.daysRemaining !== null
        ? `Filing deadline: ${input.deadline} (${input.daysRemaining} days from today).`
        : "Filing deadline: not stated in the documents. Treat it as urgent and say so.";

    return `Decide the strategy for this appeal.

${clock}

${renderPlaybook(input.classification.category)}

Classifier's read: ${input.classification.category} (${input.classification.confidence} confidence). ${input.classification.reasoning}
Procedural defects noted: ${input.classification.proceduralDefects.join("; ") || "none"}

Coverage findings:
${input.coverage.governingLanguage}
Policy language favours the appeal: ${input.coverage.favoursAppeal ? "yes" : "no"}
Coverage gaps: ${input.coverage.gaps.join("; ") || "none noted"}

Clinical position:
${input.evidence.clinicalSummary}
${input.evidence.points.map((p) => `- [${p.source}/${p.strength}] ${p.claim}`).join("\n") || "- no clinical points established"}
Records still missing: ${input.evidence.missingRecords.join("; ") || "none noted"}

Citations available to you:
${renderCitations(input.citations)}

The claim:
${renderFacts(input.facts)}`;
  },
});
