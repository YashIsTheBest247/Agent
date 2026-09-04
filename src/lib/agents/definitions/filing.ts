import { defineAgent } from "../runtime";
import { HOUSE_RULES, renderFacts } from "../prompts";
import { filingPacket, type AppealStrategy } from "@/lib/domain/appeal";
import type { DenialFacts } from "@/lib/domain/denial";

export type FilingInput = {
  facts: DenialFacts;
  strategy: AppealStrategy;
  deadline: string | null;
  daysRemaining: number | null;
  today: string;
};

/**
 * Turns an approved draft into something a person can actually get out the door.
 *
 * A perfect letter that sits unsent because nobody knew where to post it is a
 * loss, so this agent is deliberately mundane: address, method, attachments,
 * dates, and what to say on the phone.
 */
export const filingAgent = defineAgent<FilingInput, typeof filingPacket._output>({
  id: "filing",
  name: "Filing",
  role: "Preparing the submission route, checklist and deadline reminders",
  tier: "fast",
  temperature: 0.2,
  output: filingPacket,
  system: `${HOUSE_RULES}

You turn a finished appeal into a set of actions a stressed person can complete today.

Submission route and recipient come from the denial letter's own instructions. If the letter does not say, write a clearly bracketed placeholder telling the user exactly where to look — the reverse of the letter, the member portal, the number on the back of their insurance card. Never invent an address, a fax number, or a portal URL.

The checklist is concrete and ordered. Mark readyAlready true only for things this system has already produced: the letter itself, the citation list. Everything the user must obtain or do is false, with a note saying where to get it. Include the two steps people forget: keep a dated copy of everything sent, and send by a method that produces proof of delivery.

Reminders are real dates, working backwards from the deadline:
- one a week after filing, to confirm receipt
- one at roughly the midpoint of the payer's response window
- one a few days before the deadline for the next escalation
If no deadline is known, set reminders relative to today and say in the label that the deadline needs confirming first.

The call script is for a three-minute phone call. Open with the claim number, state what is being confirmed, list the two or three things to ask for — receipt confirmation, the reference number for the appeal, the decision due date — and end by telling the user to write down the name of the person they spoke to and the time. Short lines a person can read aloud while nervous.`,
  prompt: (input) => {
    const clock =
      input.deadline && input.daysRemaining !== null
        ? `Deadline: ${input.deadline}, which is ${input.daysRemaining} days away.`
        : "Deadline: not stated in the documents. The first action must be to confirm it with the payer.";

    return `Prepare the filing packet.

Today is ${input.today}.
${clock}
Appeal level: ${input.strategy.level}
Escalation if this fails: ${input.strategy.escalationPath}

Still-missing evidence the user should chase:
${input.strategy.missingEvidence.map((e) => `- ${e}`).join("\n") || "- none noted"}

The payer's appeal instructions, verbatim:
"""
${input.facts.appealInstructionsVerbatim || "(the letter gives no instructions)"}
"""

The claim:
${renderFacts(input.facts)}`;
  },
});
