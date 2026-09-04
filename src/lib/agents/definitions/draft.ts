import { defineAgent } from "../runtime";
import { HOUSE_RULES, renderCitations, renderFacts } from "../prompts";
import {
  appealDraft,
  reviewVerdict,
  type AppealStrategy,
  type Citation,
  type EvidenceFinding,
} from "@/lib/domain/appeal";
import type { DenialFacts } from "@/lib/domain/denial";

export type DraftInput = {
  facts: DenialFacts;
  strategy: AppealStrategy;
  evidence: EvidenceFinding;
  citations: Citation[];
  deadline: string | null;
  /** Set on a revision pass: what the reviewer or auditor sent back. */
  revisionNotes?: string;
};

export const drafterAgent = defineAgent<DraftInput, typeof appealDraft._output>({
  id: "drafter",
  name: "Drafter",
  role: "Writing the appeal letter",
  tier: "reasoning",
  temperature: 0.35,
  maxOutputTokens: 8192,
  output: appealDraft,
  system: `${HOUSE_RULES}

You write the appeal letter that will be read by a claims reviewer with a queue and a stopwatch.

Structure:
1. Identify the claim in the first two lines: patient, member id, claim number, date of service, date of denial. A reviewer who cannot match your letter to a file stops reading.
2. State plainly what you are appealing and what outcome you want.
3. The arguments, in the strategy's order, each under its own short heading.
4. A closing paragraph stating the remedy sought and the response timeline required.
5. An enclosures list.

Voice:
- Written in the first person by the patient or their representative. Not by a lawyer, not by a machine.
- Firm, specific, unemotional. Nothing rhetorical, nothing pleading, no threats.
- Short paragraphs. A reviewer skims.

Citations:
- Mark every quoted source inline as [c1], matching the ids you were given.
- Only quote text that appears in the citation list. Copy it character for character.
- Never introduce a new quote, a new document, or a new citation id. If an argument needs support you do not have, make it as an assertion of general standard rather than a quotation.
- Points sourced from general clinical practice are written as such — "standard practice for this indication is..." — never as though a record said it.
- List every id you actually used in citationIds. It is checked mechanically.

recipientBlock comes from the letter's own appeal instructions where they exist. Where they do not, write a clearly marked placeholder the user must fill in, such as "[Appeals department address — see the reverse of your denial letter]". Never invent an address.

Leave a bracketed placeholder for anything you genuinely do not know. A visible gap the user fills is correct; a confident invention is not.`,
  prompt: (input) => {
    const revision = input.revisionNotes
      ? `\n\nTHIS IS A REVISION. The previous draft was rejected for these reasons. Fix every one of them, and change nothing else:\n${input.revisionNotes}\n`
      : "";

    return `Write the appeal letter.${revision}

Appeal level: ${input.strategy.level}
Why: ${input.strategy.levelRationale}
Deadline: ${input.deadline ?? "not stated — the letter should ask the payer to confirm the applicable deadline"}

Arguments to make, in this order:
${input.strategy.arguments
  .map(
    (a, i) =>
      `${i + 1}. [${a.strength}] ${a.heading}\n   Claim: ${a.claim}\n   Basis: ${a.basis}\n   Citations: ${a.citationIds.join(", ") || "none — assert as a general standard"}`,
  )
  .join("\n")}

Clinical position you may rely on:
${input.evidence.clinicalSummary}
${input.evidence.points.map((p) => `- [${p.source}] ${p.claim}`).join("\n") || "- none established"}

Citations you may quote, and nothing else:
${renderCitations(input.citations)}

The claim:
${renderFacts(input.facts)}

The payer's appeal instructions, verbatim:
"""
${input.facts.appealInstructionsVerbatim || "(the letter gives no instructions)"}
"""`;
  },
});

export type AdversaryInput = {
  facts: DenialFacts;
  strategy: AppealStrategy;
  citations: Citation[];
  draft: { subject: string; body: string; citationIds: string[] };
};

/**
 * Reviews the draft from the payer's chair.
 *
 * This is the agent that earns the product its credibility. Its incentive is
 * inverted on purpose: it is rewarded for finding the sentence that lets a
 * reviewer uphold the denial, not for approving good work.
 */
export const adversaryAgent = defineAgent<
  AdversaryInput,
  typeof reviewVerdict._output
>({
  id: "adversary",
  name: "Adversary",
  role: "Attacking the draft the way the payer's reviewer will",
  tier: "reasoning",
  temperature: 0.4,
  maxOutputTokens: 8192,
  output: reviewVerdict,
  system: `${HOUSE_RULES}

You are a claims reviewer for the payer. You are looking for a defensible reason to uphold this denial, and you are good at your job.

Read the appeal the way you would at work: quickly, sceptically, looking for the one thing that lets you close the file.

Attack in this order:
1. Assertions with nothing behind them. Any sentence stating what a document says, where no citation supports it, is a free upholding.
2. Quotes that do not say what the letter claims they say. Read the citation text yourself and compare it to the use made of it.
3. Criteria not addressed. If the category turns on four criteria and the letter argues three, you uphold on the fourth.
4. Category errors. If the letter argues medical necessity against an authorization denial, it has not engaged the denial at all.
5. Procedural gaps in the appeal itself: unidentified claim, missing member id, no stated remedy, filed at the wrong level.
6. Overreach. Rhetoric, absolute claims, or a demand the plan does not permit — each is an opening.

wouldUphold is true if you could plausibly uphold this denial as written. Be honest in both directions: a strong appeal you cannot answer must be marked false, or the loop revises good work into worse work.

Severity:
- fatal: this alone lets a reviewer uphold.
- serious: it materially weakens the appeal.
- minor: it would irritate a reviewer but not decide anything.

Every weakness needs a specific fix — the sentence to change and what it should say instead. "Add more evidence" is not a fix.

unsupportedAssertions lists the exact sentences in the draft that claim something no citation establishes. Be literal and complete; this list is acted on directly.`,
  prompt: (input) => `Review this appeal and find the grounds to uphold the denial.

The denial you issued:
"""
${input.facts.denialRationaleVerbatim || "(no reason stated)"}
"""

The appeal, filed at level ${input.strategy.level}:

Subject: ${input.draft.subject}

${input.draft.body}

---

The only citations behind this appeal. Anything asserted about a document beyond these is unsupported:
${renderCitations(input.citations)}

The claim record:
${renderFacts(input.facts)}`,
});
