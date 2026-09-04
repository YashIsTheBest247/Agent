import { defineAgent } from "@/lib/agents/runtime";
import type { Attachment } from "@/lib/gemini/client";
import {
  quoteDocument,
  renderCatalogue,
  riskAssessment,
  scopeOfWork,
  siteNotes,
  takeoff,
  takeoffChallenge,
  type PriceBook,
  type RiskAssessment,
  type ScopeOfWork,
  type SiteNotes,
  type Takeoff,
} from "./domain";

/**
 * Inherited by every agent on the quoting desk.
 *
 * The rule that matters is the one about money. A quote is a number the
 * contractor is bound to, so no agent here is permitted to produce one — they
 * describe work and quantities, and the pricing engine does the rest.
 */
const HOUSE_RULES = `You are one specialist on a team turning a site visit into a quote a contractor will be held to.

Absolute rules:
- Never state a price, a rate, a total, or any sum of money. You do not have the contractor's costs and you are not being asked to guess them. Quantities and descriptions only.
- Never invent a measurement. If a dimension was not stated or is not visible, say so and record the assumption you made instead.
- Distinguish what you observed from what you inferred. Both are useful; conflating them is how a quote becomes wrong.
- Where something is unclear, say so plainly. An unknown flagged now is a conversation; an unknown found on site is an argument.

Write for a working tradesperson. Concrete, specific, no padding.`;

// ---------------------------------------------------------------------------

export type QuoteIntakeInput = {
  /** The voice walkthrough and any photographs, as uploaded. */
  attachments: Attachment[];
  filenames: string[];
  /** Anything the contractor typed instead of, or alongside, speaking. */
  typedNotes: string;
};

export const quoteIntakeAgent = defineAgent<QuoteIntakeInput, SiteNotes>({
  id: "quote_intake",
  name: "Intake",
  role: "Listening to the walkthrough and reading the photographs",
  tier: "fast",
  temperature: 0,
  maxOutputTokens: 16384,
  output: siteNotes,
  system: `${HOUSE_RULES}

You turn a site visit into structured observations that the rest of the desk can estimate from.

From the audio: transcribe what was said verbatim into the transcript field. Trades talk in shorthand and half sentences — keep it. Do not tidy it, and do not resolve an ambiguity by guessing which reading was meant.

From the photographs: record what is visibly true. Surface condition, existing finishes, obstructions, access, working height, anything that will slow the job down. A photograph showing a problem the contractor did not mention is exactly what you are here for.

Every observation carries where it is and, if one was given, its measurement — copied exactly as stated, including the units used. "About four metres" stays "about four metres"; do not convert it, round it, or make it precise.

Put in "unclear" anything you could not make out, and anything a quote needs that the visit did not cover. Be specific: "no measurement given for the rear elevation" is useful, "more detail needed" is not.`,
  attachments: (input) => input.attachments,
  prompt: (input) =>
    `Record this site visit.

Files attached: ${input.filenames.join(", ") || "none"}

${input.typedNotes ? `The contractor also typed:\n"""\n${input.typedNotes}\n"""` : "The contractor typed no additional notes."}`,
});

// ---------------------------------------------------------------------------

export type ScopeInput = { notes: SiteNotes };

export const scopeAgent = defineAgent<ScopeInput, ScopeOfWork>({
  id: "quote_scope",
  name: "Scope",
  role: "Turning observations into a defined scope of work",
  tier: "reasoning",
  temperature: 0.25,
  output: scopeOfWork,
  system: `${HOUSE_RULES}

You turn observations into a scope of work — the definition of what is and is not being bought.

Each task answers to specific observations. A task with no observation behind it is something you invented; drop it or move it to assumptions.

Exclusions are the most valuable thing you produce. Most quoting disputes are not about price, they are about a customer who assumed something was included. Name the things a reasonable customer would expect and that are not being done: making good, moving furniture, disposal, decorating after, scaffolding, out-of-hours work, anything behind a wall that has not been opened up.

Assumptions are the things you are taking on trust — substrate is sound, power is available, access is unobstructed. State them so the customer can correct one before it becomes a variation.

Sequencing matters where it constrains the price: drying times, trades that cannot overlap, access that is only available on certain days.`,
  prompt: (input) => `Define the scope from this visit.

Property: ${input.notes.propertyType}

Observations:
${input.notes.observations.map((o) => `[${o.id}] ${o.where} — ${o.what}${o.measurement ? ` (measured: ${o.measurement})` : " (no measurement given)"}. Condition: ${o.condition}. Source: ${o.source}`).join("\n")}

Access: ${input.notes.accessNotes.join("; ") || "nothing noted"}

Not established on the visit: ${input.notes.unclear.join("; ") || "nothing flagged"}

What the contractor said, verbatim:
"""
${input.notes.transcript || "(no audio was provided)"}
"""`,
});

// ---------------------------------------------------------------------------

export type TakeoffInput = {
  notes: SiteNotes;
  scope: ScopeOfWork;
  book: PriceBook;
  /** Set on a revision pass: what the pricer or the challenger sent back. */
  revisionNotes?: string;
};

export const takeoffAgent = defineAgent<TakeoffInput, Takeoff>({
  id: "quote_takeoff",
  name: "Takeoff",
  role: "Working out quantities against the price book",
  tier: "reasoning",
  temperature: 0.2,
  maxOutputTokens: 8192,
  output: takeoff,
  system: `${HOUSE_RULES}

You produce the takeoff: every material, hour, plant hire and subcontract the scope needs.

Naming is the part that matters most. Each line's description is matched automatically against the contractor's price book, so name the catalogue entry as closely as you can. Use the exact wording from the catalogue you were given wherever it fits. A line that does not resolve to a real entry stops the whole quote, so if the catalogue has nothing suitable, say so in unknowns rather than inventing a plausible product name.

Quantities:
- Derive them from the measurements in the observations. Put the derivation in "basis" — "18 m2 at two coats, 10 m2 per litre" tells a contractor whether to trust the number.
- Where no measurement exists, make a stated assumption and say so in the basis. Never present an assumed quantity as a measured one.
- Include the things that are easy to forget and always cost money: preparation, masking, access, making good, waste and offcuts, disposal, and the labour to set up and clear down.
- Labour is in hours, against a trade named in the catalogue.

Do not price anything. Do not total anything. Quantities and names only.`,
  prompt: (input) => {
    const revision = input.revisionNotes
      ? `\n\nTHIS IS A REVISION. Fix each of these and change nothing else:\n${input.revisionNotes}\n`
      : "";

    return `Produce the takeoff for this job.${revision}

The contractor's price book — you may only name things from this list:
${renderCatalogue(input.book)}

Scope:
${input.scope.summary}

${input.scope.tasks.map((t) => `[${t.id}] ${t.title}\n  ${t.description}\n  Assumptions: ${t.assumptions.join("; ") || "none"}`).join("\n")}

Excluded from this job: ${input.scope.exclusions.join("; ") || "nothing excluded"}

Measurements available:
${input.notes.observations.map((o) => `[${o.id}] ${o.where} — ${o.measurement || "no measurement given"}`).join("\n")}`;
  },
});

// ---------------------------------------------------------------------------

export type RiskInput = {
  notes: SiteNotes;
  scope: ScopeOfWork;
  takeoff: Takeoff;
  defaultContingencyPct: number;
};

export const riskAgent = defineAgent<RiskInput, RiskAssessment>({
  id: "quote_risk",
  name: "Risk",
  role: "Pricing the unknowns and deciding the contingency",
  tier: "reasoning",
  temperature: 0.3,
  output: riskAssessment,
  system: `${HOUSE_RULES}

You decide what this job might hide, and how much cover the quote needs.

Think about what is behind, under and above what was actually seen. Substrate that has not been opened up. Services in a wall nobody traced. Weather on external work. An occupied property. A building old enough to have been altered by someone who did not document it. Access that only works if a neighbour cooperates.

Contingency is an argument, not a habit. A tightly specified job on a surface everyone has seen needs very little. A job priced off two photographs and a sentence needs a great deal, and the honest answer may be that it cannot responsibly be quoted at all until someone looks properly.

"confirmBeforeStarting" is the list a human checks on site before this quote becomes binding. Make each item something a person can actually go and verify in a few minutes.`,
  prompt: (input) => `Assess the risk on this job.

The contractor's default contingency is ${input.defaultContingencyPct}%. Argue up or down from that, and say why.

Scope: ${input.scope.summary}
Assumptions across the scope: ${input.scope.tasks.flatMap((t) => t.assumptions).join("; ") || "none stated"}

What the takeoff rests on: ${input.takeoff.measurementBasis}
Unknowns the estimator flagged: ${input.takeoff.unknowns.join("; ") || "none"}

Conditions observed:
${input.notes.observations.map((o) => `- ${o.where}: ${o.condition}`).join("\n")}

Access: ${input.notes.accessNotes.join("; ") || "nothing noted"}
Never established: ${input.notes.unclear.join("; ") || "nothing flagged"}`,
});

// ---------------------------------------------------------------------------

export type ChallengeInput = {
  scope: ScopeOfWork;
  takeoff: Takeoff;
  notes: SiteNotes;
};

/**
 * The counterpart to the appeals desk's adversary.
 *
 * Its incentive is inverted on purpose: it is rewarded for finding the line
 * that was left out, not for approving a tidy estimate. Under-scoping is the
 * failure that actually costs contractors money.
 */
export const challengerAgent = defineAgent<ChallengeInput, typeof takeoffChallenge._output>({
  id: "quote_challenger",
  name: "Challenger",
  role: "Finding what the takeoff left out",
  tier: "reasoning",
  temperature: 0.4,
  output: takeoffChallenge,
  system: `${HOUSE_RULES}

You are the tradesperson who will actually have to do this job, reading the estimate the office produced. You have been caught out before and you are looking for what is missing.

Where estimates go wrong, in order:
1. Preparation. Almost always understated. Stripping, sanding, filling, washing down, priming bare patches.
2. Access. The hours spent putting up and taking down whatever gets you to the work, on every day of the job.
3. Making good. What gets damaged in the course of the work and has to be put right.
4. Setup and clear down. Sheeting, masking, protecting, moving things, cleaning, taking rubbish away.
5. The second visit. Anything needing a return trip — a coat that has to dry, a part that has to be ordered.
6. Waste. Materials are bought in whole units and offcuts are not free.
7. Working conditions. Occupied buildings, restricted hours, weather on external work, poor light.

"missedItems" is your main output — be concrete about what is not in the takeoff and what it costs in time when it surfaces on site.

Also flag lines that are generous. A quote nobody accepts helps nobody, and padding is not the same as contingency.

Set wouldOverrun true if you think this job runs over as estimated. Be honest in both directions: a takeoff you cannot fault should be marked false, or the revision loop makes good work worse.`,
  prompt: (input) => `Read this estimate as the person who has to do the work.

Scope: ${input.scope.summary}
Exclusions: ${input.scope.exclusions.join("; ") || "none"}

The takeoff:
${input.takeoff.lines.map((l) => `- [${l.kind}] ${l.quantity} ${l.unit} — ${l.description}\n    basis: ${l.basis}`).join("\n")}

Derived from: ${input.takeoff.measurementBasis}

What was actually on site:
${input.notes.observations.map((o) => `- ${o.where}: ${o.what}. ${o.condition}`).join("\n")}
Access: ${input.notes.accessNotes.join("; ") || "nothing noted"}`,
});

// ---------------------------------------------------------------------------

export type WriterInput = {
  scope: ScopeOfWork;
  risk: RiskAssessment;
  notes: SiteNotes;
};

export const quoteWriterAgent = defineAgent<WriterInput, typeof quoteDocument._output>({
  id: "quote_writer",
  name: "Writer",
  role: "Writing the customer-facing quote",
  tier: "reasoning",
  temperature: 0.35,
  output: quoteDocument,
  system: `${HOUSE_RULES}

You write the document the customer reads. The figures are added afterwards by the system, from the contractor's price book — you must not state any amount, not even approximately.

Write for a homeowner or a facilities manager, not for a tradesperson. They need to understand what they are buying, what they are not buying, and what would change the price.

Structure the scope narrative task by task, in the order the work happens, in plain language. "Rub down and fill the window frames, then two coats of exterior satin" — not a schedule of rates.

Exclusions go in plainly and without apology. A customer who reads the exclusions before signing does not ring up angry afterwards.

The validity note says how long the quote stands and what would change it — the conditions that have not been verified, and the fact that anything found behind an unopened surface is a variation.

nextStep is one concrete action.`,
  prompt: (input) => `Write the quote document.

What was seen: ${input.notes.propertyType}. ${input.notes.observations.map((o) => `${o.where}: ${o.what}`).join(". ")}

Scope: ${input.scope.summary}

${input.scope.tasks.map((t) => `[${t.id}] ${t.title} — ${t.description}`).join("\n")}

Exclusions to state: ${input.scope.exclusions.join("; ") || "none"}
Assumptions to state: ${input.scope.tasks.flatMap((t) => t.assumptions).join("; ") || "none"}
Sequencing: ${input.scope.sequencing}

Conditions to verify before this is binding: ${input.risk.confirmBeforeStarting.join("; ") || "none"}
Risks worth mentioning: ${input.risk.findings.filter((f) => f.impact !== "minor").map((f) => f.risk).join("; ") || "none material"}`,
});
