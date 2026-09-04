import { z } from "zod";

/**
 * Canonical denial reasons.
 *
 * Payers describe the same handful of refusals in endlessly varied prose. The
 * classifier's whole job is collapsing that prose onto this list, because the
 * appeal strategy is a function of the category, not of the wording.
 */
export const denialCategory = z.enum([
  "medical_necessity",
  "prior_authorization",
  "experimental_investigational",
  "out_of_network",
  "benefit_exclusion",
  "coding_error",
  "timely_filing",
  "duplicate_claim",
  "coordination_of_benefits",
  "eligibility",
  "insufficient_documentation",
  "unclassified",
]);
export type DenialCategory = z.infer<typeof denialCategory>;

/** How hard this category is to overturn, which drives how much effort to spend. */
export const appealOutlook = z.enum(["strong", "moderate", "difficult"]);
export type AppealOutlook = z.infer<typeof appealOutlook>;

export type CategoryPlaybook = {
  label: string;
  /** Plain-language description shown to the user on the case page. */
  description: string;
  /** Typical ANSI claim adjustment reason codes seen with this category. */
  commonCodes: string[];
  /** Phrases payers use, which help the classifier recognise the category. */
  tells: string[];
  outlook: AppealOutlook;
  /** The shape of the argument that actually wins this category. */
  winningAngle: string;
  /** What the appeal needs attached to stand up. */
  requiredEvidence: string[];
  /** Where this category can escalate after internal appeals are exhausted. */
  escalation: string;
};

export const playbooks: Record<DenialCategory, CategoryPlaybook> = {
  medical_necessity: {
    label: "Not medically necessary",
    description:
      "The payer accepts the service happened and is covered in principle, but claims it was not needed for you specifically.",
    commonCodes: ["CO-50", "CO-55", "CO-57"],
    tells: [
      "not medically necessary",
      "does not meet medical necessity criteria",
      "not supported by the clinical documentation",
    ],
    outlook: "strong",
    winningAngle:
      "Quote the payer's own published medical policy criteria and walk the clinical record through each criterion in turn. A denial that contradicts the payer's own criteria is the single most overturnable kind.",
    requiredEvidence: [
      "The payer's medical policy or coverage criteria for the code billed",
      "Clinical notes establishing each criterion",
      "Treating provider's letter of medical necessity",
      "Documentation of failed conservative treatment, where the criteria require it",
    ],
    escalation:
      "Independent external review, where a physician reviewer outside the payer decides. Overturn rates at this stage are materially higher than internal appeals.",
  },
  prior_authorization: {
    label: "Prior authorization missing",
    description:
      "The payer says approval was required before the service and was not obtained.",
    commonCodes: ["CO-197", "CO-198"],
    tells: [
      "prior authorization",
      "precertification was not obtained",
      "no authorization on file",
    ],
    outlook: "strong",
    winningAngle:
      "Attack the premise before arguing necessity. Authorization is frequently on file under a different number, was obtained by the facility rather than the provider, was not required for this place of service, or the service was emergent and exempt.",
    requiredEvidence: [
      "Any authorization or reference number, however obtained",
      "Call logs or portal screenshots showing the request",
      "Plan language on which services require authorization",
      "Evidence of emergency or retroactive-eligibility exception",
    ],
    escalation:
      "Internal appeal usually resolves these once the authorization is located; external review if the payer maintains the requirement applied.",
  },
  experimental_investigational: {
    label: "Experimental or investigational",
    description:
      "The payer claims the treatment is unproven and therefore excluded from coverage.",
    commonCodes: ["CO-55"],
    tells: [
      "experimental",
      "investigational",
      "unproven",
      "not established as effective",
    ],
    outlook: "moderate",
    winningAngle:
      "Establish that the treatment is standard of care for this indication: FDA labelling, specialty society guidelines, compendia listings, and peer-reviewed outcomes. Many plans exclude only treatments unproven for the specific indication.",
    requiredEvidence: [
      "FDA approval or clearance for the indication",
      "Specialty society guideline recommending the treatment",
      "Peer-reviewed literature",
      "The plan's own definition of experimental, which is often narrower than applied",
    ],
    escalation:
      "External review is specifically designed for this category and most states guarantee access to it.",
  },
  out_of_network: {
    label: "Out of network",
    description:
      "The payer says the provider is not in your plan's network, shifting cost to you.",
    commonCodes: ["CO-242", "PR-242"],
    tells: ["out of network", "non-participating provider", "not contracted"],
    outlook: "moderate",
    winningAngle:
      "Two separate attacks: that the provider was in network or held out as such, or that federal surprise-billing protections apply because you had no meaningful choice — emergency care, or an out-of-network clinician at an in-network facility.",
    requiredEvidence: [
      "Provider directory listing at the time of service",
      "Facility network status",
      "Evidence the care was emergent or ancillary",
      "Any network-adequacy or continuity-of-care exception",
    ],
    escalation:
      "The federal independent dispute resolution process where the No Surprises Act applies; state insurance regulator otherwise.",
  },
  benefit_exclusion: {
    label: "Not a covered benefit",
    description:
      "The payer says your plan simply does not cover this category of service.",
    commonCodes: ["CO-96", "PR-204", "CO-109"],
    tells: [
      "not a covered benefit",
      "excluded under your plan",
      "services not covered",
    ],
    outlook: "difficult",
    winningAngle:
      "Read the exclusion narrowly and the plan's coverage grant broadly. Exclusions are interpreted against the drafter; the service may fall under a different covered category, or a mandate may override the exclusion.",
    requiredEvidence: [
      "The exact exclusion language from the plan document",
      "The coverage grant the service arguably falls under",
      "Any state or federal mandate requiring coverage",
    ],
    escalation:
      "External review is often unavailable for pure benefit disputes; the regulator or plan administrator is the next step.",
  },
  coding_error: {
    label: "Coding or billing error",
    description:
      "A procedure, diagnosis or modifier was submitted in a way the payer's system rejected.",
    commonCodes: ["CO-4", "CO-11", "CO-16", "CO-45"],
    tells: [
      "inconsistent with the procedure code",
      "missing modifier",
      "invalid code",
      "bundled",
    ],
    outlook: "strong",
    winningAngle:
      "This is a correction, not an argument. Identify the specific coding defect and ask for a corrected claim or reprocessing. These resolve fastest of any category.",
    requiredEvidence: [
      "The itemised bill and the submitted claim",
      "Correct code and modifier per current coding guidance",
      "Clinical documentation supporting the corrected code",
    ],
    escalation:
      "Usually resolved by provider resubmission rather than formal appeal.",
  },
  timely_filing: {
    label: "Filed too late",
    description:
      "The payer says the claim arrived after its submission deadline.",
    commonCodes: ["CO-29"],
    tells: ["time limit for filing", "not filed timely", "filing deadline"],
    outlook: "moderate",
    winningAngle:
      "Prove earlier submission, or establish good cause. Clearinghouse acknowledgements often show a timely first submission the payer lost, and coordination-of-benefits delays usually restart the clock.",
    requiredEvidence: [
      "Clearinghouse or portal submission receipts",
      "Prior denial or correspondence showing the payer had the claim",
      "Evidence of a primary payer's delay in a COB situation",
    ],
    escalation:
      "Provider-side dispute; the patient generally cannot be balance-billed for a provider's untimely filing.",
  },
  duplicate_claim: {
    label: "Duplicate claim",
    description:
      "The payer believes this claim repeats one already processed.",
    commonCodes: ["CO-18"],
    tells: ["duplicate claim", "already adjudicated", "previously processed"],
    outlook: "strong",
    winningAngle:
      "Show the two claims are distinct — different dates, sites, providers or laterality — usually with a modifier that distinguishes them.",
    requiredEvidence: [
      "Both claims side by side",
      "Documentation distinguishing the encounters",
      "Correct distinguishing modifier",
    ],
    escalation: "Reprocessing request rather than formal appeal.",
  },
  coordination_of_benefits: {
    label: "Coordination of benefits",
    description:
      "The payer says another insurer is responsible first, or that your other-coverage information is missing.",
    commonCodes: ["CO-22", "CO-19", "CO-20"],
    tells: [
      "other insurance",
      "primary payer",
      "coordination of benefits",
      "other coverage information needed",
    ],
    outlook: "strong",
    winningAngle:
      "Usually an information gap, not a coverage dispute. Establish the correct payer order and supply the primary payer's determination.",
    requiredEvidence: [
      "Primary payer's EOB or denial",
      "Current coverage information for all plans",
      "Applicable order-of-benefits rule",
    ],
    escalation:
      "Resolves on reprocessing once the payer order is documented.",
  },
  eligibility: {
    label: "Not eligible on the date of service",
    description:
      "The payer says coverage was not active for you on the day of service.",
    commonCodes: ["CO-27", "CO-31"],
    tells: [
      "coverage terminated",
      "patient not eligible",
      "not covered on date of service",
    ],
    outlook: "moderate",
    winningAngle:
      "Establish actual coverage on the date: employer records, premium payments, grace-period rules, or retroactive enrolment the payer has not yet loaded.",
    requiredEvidence: [
      "Insurance card and enrolment confirmation",
      "Proof of premium payment covering the date",
      "Employer or exchange enrolment records",
    ],
    escalation:
      "Plan administrator or employer benefits team, then the state regulator.",
  },
  insufficient_documentation: {
    label: "Insufficient documentation",
    description:
      "The payer says it did not receive enough records to make a decision.",
    commonCodes: ["CO-16", "CO-226"],
    tells: [
      "additional information needed",
      "records not received",
      "insufficient documentation",
    ],
    outlook: "strong",
    winningAngle:
      "Supply exactly what was asked for and nothing else, indexed to the request. Where the payer never made a specific request, say so — a vague documentation denial is itself appealable.",
    requiredEvidence: [
      "The payer's specific records request",
      "The records responsive to it",
      "Proof of any earlier submission",
    ],
    escalation:
      "Reopening or internal appeal; rarely reaches external review.",
  },
  unclassified: {
    label: "Unclear reason",
    description:
      "The letter does not state a reason this system recognises. That vagueness is itself a ground for appeal.",
    commonCodes: [],
    tells: [],
    outlook: "moderate",
    winningAngle:
      "Demand the specific basis. Payers are generally required to state the reason and the plan provision relied on, and to disclose the criteria used. A denial that does not is procedurally defective.",
    requiredEvidence: [
      "The denial letter as issued",
      "A written request for the criteria and the plan provision relied on",
    ],
    escalation:
      "Regulator complaint on procedural grounds alongside the substantive appeal.",
  },
};

export function playbookFor(category: DenialCategory): CategoryPlaybook {
  return playbooks[category];
}

/** Compact catalogue injected into classifier and strategy prompts. */
export function renderTaxonomy(): string {
  return (Object.keys(playbooks) as DenialCategory[])
    .map((key) => {
      const p = playbooks[key];
      const codes = p.commonCodes.length
        ? ` | codes: ${p.commonCodes.join(", ")}`
        : "";
      const tells = p.tells.length
        ? `\n  payer phrasing: ${p.tells.join("; ")}`
        : "";
      return `- ${key} — ${p.label}${codes}\n  ${p.description}${tells}`;
    })
    .join("\n");
}
