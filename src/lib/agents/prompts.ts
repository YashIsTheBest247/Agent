import type { Citation } from "@/lib/domain/appeal";
import type { DenialFacts, Extracted } from "@/lib/domain/denial";
import { playbookFor, type DenialCategory } from "@/lib/domain/taxonomy";

/**
 * Inherited by every agent.
 *
 * The rules that matter are the ones about quoting. An appeal that cites text
 * the payer cannot find in its own file is dismissed on sight, and the deadline
 * is usually gone by the time anyone notices — so a missing fact must stay
 * missing rather than become a plausible one.
 */
export const HOUSE_RULES = `You are one specialist on a team preparing a health insurance appeal for a real person facing a real deadline.

Absolute rules:
- Never invent a fact, a date, a code, a policy clause, or a quotation. If the documents do not say it, say they do not say it.
- Quotations must be copied character for character from the source you were given. Never tidy, complete, paraphrase, or reconstruct a quote from memory.
- Never cite a document id you were not given.
- Distinguish what the documents establish from what you believe to be generally true. Both are useful; conflating them is not.
- Where the evidence is thin, say so plainly. A weak point identified early can be fixed; a weak point disguised as a strong one loses the appeal.

Write for an adult under stress. Be direct, concrete and calm. No filler, no reassurance, no marketing language.`;

function fieldLine(label: string, field: Extracted<unknown>): string {
  if (field.value === null || field.value === "") {
    return `- ${label}: not stated in the documents`;
  }
  const provenance = field.quote
    ? ` (from ${field.documentId}${field.page ? ` p.${field.page}` : ""}, ${field.confidence} confidence)`
    : ` (${field.confidence} confidence)`;
  return `- ${label}: ${String(field.value)}${provenance}`;
}

/** Renders extracted facts for downstream agents, provenance included. */
export function renderFacts(facts: DenialFacts): string {
  const lines = [
    fieldLine("Payer", facts.payerName),
    fieldLine("Plan", facts.planName),
    fieldLine("Member id", facts.memberId),
    fieldLine("Claim number", facts.claimNumber),
    fieldLine("Patient", facts.patientName),
    fieldLine("Provider", facts.providerName),
    fieldLine("Date of service", facts.serviceDate),
    fieldLine("Date of denial", facts.denialDate),
    fieldLine("Appeal deadline", facts.appealDeadline),
    fieldLine("Appeal window (days)", facts.appealWindowDays),
    fieldLine("Billed amount (cents)", facts.billedAmountCents),
    fieldLine("Allowed amount (cents)", facts.allowedAmountCents),
    fieldLine("Patient responsibility (cents)", facts.patientResponsibilityCents),
    `- Procedure codes: ${facts.procedureCodes.join(", ") || "none stated"}`,
    `- Diagnosis codes: ${facts.diagnosisCodes.join(", ") || "none stated"}`,
    `- Payer denial codes: ${facts.denialCodes.join(", ") || "none stated"}`,
  ];

  const extras = [
    `\nThe payer's stated reason, verbatim:\n"""\n${facts.denialRationaleVerbatim || "(the letter states no reason)"}\n"""`,
    facts.appealInstructionsVerbatim
      ? `\nThe letter's appeal instructions, verbatim:\n"""\n${facts.appealInstructionsVerbatim}\n"""`
      : "\nThe letter gives no appeal instructions.",
    facts.unreadableSections.length
      ? `\nUnreadable or missing in the uploads: ${facts.unreadableSections.join("; ")}`
      : "",
  ];

  return [...lines, ...extras].filter(Boolean).join("\n");
}

/** Renders the citation pool. Agents may only refer to ids listed here. */
export function renderCitations(citations: Citation[]): string {
  if (citations.length === 0) {
    return "(no citations have been established — you may not quote any document)";
  }
  return citations
    .map(
      (c) =>
        `[${c.id}] ${c.documentId}${c.page ? ` p.${c.page}` : ""} — supports: ${c.supports}\n    "${c.quote}"`,
    )
    .join("\n");
}

/** The playbook for a category, injected so strategy and drafting share one view. */
export function renderPlaybook(category: DenialCategory): string {
  const p = playbookFor(category);
  return `Category: ${p.label} (${category})
Outlook in general: ${p.outlook}
What usually wins this category: ${p.winningAngle}
Evidence this category normally needs:
${p.requiredEvidence.map((e) => `- ${e}`).join("\n")}
Escalation path: ${p.escalation}`;
}
