import { defineAgent } from "@/lib/agents/runtime";
import type { Attachment } from "@/lib/gemini/client";
import {
  exceptionTriage,
  fulfilmentView,
  orderReply,
  parsedOrder,
  renderCatalog,
  type Catalog,
  type FulfilmentView,
  type ParsedOrder,
} from "./domain";
import type { ResolvedOrder } from "./resolve";

/**
 * Inherited by every agent on the orders desk.
 *
 * The rule that matters is about invention. A confirmed order is a promise to
 * ship a specific thing at a specific price; a line the agent quietly improves
 * becomes a wrong delivery, a credit note and a phone call.
 */
const HOUSE_RULES = `You are one specialist on a team turning incoming purchase orders into confirmed orders for a distributor.

Absolute rules:
- Never invent a product, a quantity, a price, a reference or a date. Everything you report must be present in the order you were given.
- Copy the customer's own words. Where you interpret them, keep the original alongside so a person can check the reading.
- Never decide a price. Prices come from the customer's agreed terms, which you do not have.
- Where an order is ambiguous, say so. An ambiguity raised now costs an email; one resolved by guessing costs a delivery.

Write for a sales clerk under time pressure. Plain, specific, no padding.`;

// ---------------------------------------------------------------------------

export type OrderIntakeInput = {
  emailText: string;
  attachments: Attachment[];
  filenames: string[];
  catalog: Catalog;
};

export const orderIntakeAgent = defineAgent<OrderIntakeInput, ParsedOrder>({
  id: "order_intake",
  name: "Intake",
  role: "Reading the order out of the email and its attachments",
  tier: "fast",
  temperature: 0,
  maxOutputTokens: 16384,
  output: parsedOrder,
  system: `${HOUSE_RULES}

You turn an incoming purchase order into structured lines.

Orders arrive in every shape there is: a table in a PDF, a sentence in an email, a photograph of a handwritten list, a forwarded thread with the real order three replies down. Find the order.

For every line:
- "description" names the product as closely as you can to the catalogue you were given, and nothing else — no unit, no pack size, no parenthetical. "Double socket white", never "Double socket white (per each)". Use the catalogue's wording where it plainly fits; where nothing fits, keep the customer's own words rather than forcing a match. A wrong match is worse than no match, because the next stage can catch a miss and cannot catch a substitution.
- "verbatim" is the line exactly as it appears in the order, so a person can check your reading in one glance.
- "statedUnitPriceCents" is the unit price the CUSTOMER wrote, in whole minor units — £2.65 is 265. Set 0 if they did not state one. Never supply a price they did not give.
- Quantities are numbers only. If a line says "10 boxes of 50", record what the customer asked for and put the packing question in "unclear".

Ignore quotations, previous orders quoted in a thread, and anything marked as a request for pricing rather than an order. If the message is not an order at all, return no lines and say so in "unclear".`,
  attachments: (input) => input.attachments,
  prompt: (input) => `Read the order.

The catalogue you may name products from:
${renderCatalog(input.catalog)}

Attachments: ${input.filenames.join(", ") || "none"}

The message:
"""
${input.emailText || "(no message body — the order is in the attachments)"}
"""`,
});

// ---------------------------------------------------------------------------

export type TriageInput = {
  order: ParsedOrder;
  resolved: ResolvedOrder;
  catalog: Catalog;
};

/**
 * Explains the exception queue in the words a sales clerk would use.
 *
 * The resolver already decided what is wrong; this agent's only job is making
 * each item actionable, because a queue nobody understands is a queue nobody
 * clears.
 */
export const triageAgent = defineAgent<TriageInput, typeof exceptionTriage._output>({
  id: "order_triage",
  name: "Triage",
  role: "Turning the exceptions into actions someone can take",
  tier: "reasoning",
  temperature: 0.25,
  output: exceptionTriage,
  system: `${HOUSE_RULES}

You explain why each line could not be confirmed, and what to do about it.

You are not re-deciding anything. The resolver has already checked the catalogue, the stock, the agreed prices and the credit position, and its findings are facts. Your job is to make each one actionable.

For every exception, the likely cause matters as much as the problem. An unrecognised product is usually a renamed line, a discontinued item, a competitor's part number, or a customer using their own internal code. A price mismatch is usually an old price list or a quote the customer thinks still stands. Say which you think it is.

The recommended action is one thing, specific enough to do without thinking about it. "Ring Kate and ask which panel she means" beats "clarify the requirement".

Set canAutoResolve true only where the action needs no judgement and no contact with the customer — substituting a like-for-like renamed SKU, say. If it needs a person to decide, it is false.`,
  prompt: (input) => `Explain what needs a person on this order.

Customer: ${input.resolved.customer?.name ?? "not recognised"}
${input.order.poNumber ? `Their reference: ${input.order.poNumber}` : "No purchase order reference given."}

What the resolver found:
${input.resolved.exceptions.map((e) => `- [${e.code}${e.blocking ? ", blocking" : ""}] ${e.lineId ? `line ${e.lineId}: ` : ""}${e.detail}`).join("\n") || "- nothing"}

The lines as the customer wrote them:
${input.order.lines.map((l) => `[${l.id}] ${l.verbatim}`).join("\n")}

How each was read:
${input.resolved.lines.map((l) => `[${l.id}] "${l.description}" → ${l.matchedName ?? "no match"}${l.sku ? ` (${l.sku})` : ""}, qty ${l.quantity}`).join("\n")}

Anything the customer left ambiguous: ${input.order.unclear.join("; ") || "nothing"}`,
});

// ---------------------------------------------------------------------------

export type FulfilmentInput = {
  order: ParsedOrder;
  resolved: ResolvedOrder;
  today: string;
};

export const fulfilmentAgent = defineAgent<FulfilmentInput, FulfilmentView>({
  id: "order_fulfilment",
  name: "Fulfilment",
  role: "Checking the dates against stock and lead times",
  tier: "fast",
  temperature: 0.2,
  output: fulfilmentView,
  system: `${HOUSE_RULES}

You work out whether this order can arrive when the customer asked.

Use the stock and lead times you were given, and nothing else. A line held in full stock ships from the next dispatch; a line short on stock arrives after its lead time. The order ships complete on the latest of those dates unless it is split.

Recommend a split when the customer would rather have most of it now — which is usually, for a contractor with people on site — and say plainly when holding the order is better because the parts are useless separately.

If no delivery date was requested, say so and give the earliest complete date anyway.

Dates are ISO yyyy-mm-dd. Count in calendar days from today. Do not invent a dispatch schedule you were not given; if you cannot work a date out, leave earliestCompleteDate empty and explain why.`,
  prompt: (input) => `Work out the dates.

Today is ${input.today}.
Requested delivery: ${input.order.requestedDate || "none stated"}

Lines that can be confirmed:
${input.resolved.confirmable.map((l) => `- ${l.matchedName}: ordered ${l.quantity}, ${l.availableNow} in stock, lead time ${l.leadTimeDays} days on the balance`).join("\n") || "- none"}

Lines held for a person:
${input.resolved.held.map((l) => `- ${l.description} (${l.exceptions.map((e) => e.code).join(", ")})`).join("\n") || "- none"}

Customer instructions: ${input.order.instructions.join("; ") || "none"}`,
});

// ---------------------------------------------------------------------------

export type ReplyInput = {
  order: ParsedOrder;
  resolved: ResolvedOrder;
  fulfilment: FulfilmentView;
  triage: typeof exceptionTriage._output;
};

export const replyAgent = defineAgent<ReplyInput, typeof orderReply._output>({
  id: "order_reply",
  name: "Reply",
  role: "Drafting the response to the customer",
  tier: "reasoning",
  temperature: 0.3,
  output: orderReply,
  system: `${HOUSE_RULES}

You draft the email back to the customer. A person reads it and sends it; you never send anything.

The figures are added by the system from the customer's agreed terms — you must not state a price, a line total, or an order total, not even approximately.

Structure:
- Acknowledge their reference in the first line, so it threads against their own paperwork.
- Confirm what is going ahead, by description, with dates.
- Raise what you need from them, as a short numbered list. Only things that genuinely block the order.
- Close with what happens next and by when.

Tone: a supplier who has been dealing with this customer for years. Warm, brief, no apology for asking a reasonable question, no corporate throat-clearing.

Set "tone" to confirmation when nothing needs asking, query_only when nothing can go ahead at all, and confirmation_with_query when some lines are confirmed and others are not — which is the usual case.

Never promise a date the fulfilment view did not support.`,
  prompt: (input) => `Draft the reply.

Customer: ${input.resolved.customer?.name ?? "not a recognised account"}
Their reference: ${input.order.poNumber || "none given"}

Going ahead:
${input.resolved.confirmable.map((l) => `- ${l.quantity} ${l.unit} ${l.matchedName}`).join("\n") || "- nothing yet"}

Not going ahead, and why:
${input.triage.items.map((t) => `- ${t.whatHappened} → ${t.recommendedAction}`).join("\n") || "- nothing"}

Dates: ${input.fulfilment.reasoning}
Can meet the requested date: ${input.fulfilment.canMeetRequestedDate ? "yes" : "no"}
${input.fulfilment.earliestCompleteDate ? `Earliest complete: ${input.fulfilment.earliestCompleteDate}` : "No complete date could be established."}
Split delivery recommended: ${input.fulfilment.splitRecommended ? "yes" : "no"}`,
});
