import "server-only";
import { runAgent, AgentFailure, type RunContext } from "@/lib/agents/runtime";
import { Trace } from "@/lib/agents/trace";
import type { Attachment } from "@/lib/gemini/client";
import {
  challengerAgent,
  quoteIntakeAgent,
  quoteWriterAgent,
  riskAgent,
  scopeAgent,
  takeoffAgent,
} from "./agents";
import { describePricing, priceTakeoff } from "./pricing";
import { priceBookById } from "./price-books";
import type { QuoteRecord } from "./record";

/** Revision rounds before the desk stops and hands back what it has. */
const MAX_REVISIONS = 2;

export type QuoteUpload = {
  filename: string;
  mimeType: string;
  /** Base64, no data: prefix. */
  data: string;
};

export type QuoteRunOptions = {
  signal?: AbortSignal;
  onUpdate?: (record: QuoteRecord) => void;
  typedNotes?: string;
};

/**
 * Runs the quoting desk.
 *
 * Same shape as the appeals pipeline and for the same reason: an explicit
 * sequence a reader can follow top to bottom, including every point at which
 * it refuses to continue. The gate here is the pricing engine — the agents
 * never produce a figure, so a quote that cannot be priced from the
 * contractor's own book simply does not get made.
 */
export async function runQuotePipeline(
  record: QuoteRecord,
  uploads: QuoteUpload[],
  options: QuoteRunOptions = {},
): Promise<QuoteRecord> {
  const trace = new Trace();
  const ctx: RunContext = { trace, signal: options.signal };
  const book = priceBookById(record.priceBookId);

  let current: QuoteRecord = { ...record, status: "running" };

  const commit = (patch: Partial<QuoteRecord>): QuoteRecord => {
    current = {
      ...current,
      ...patch,
      trace: [...trace.all()],
      usage: trace.totalUsage(),
      updatedAt: new Date().toISOString(),
    };
    options.onUpdate?.(current);
    return current;
  };

  trace.push({
    type: "run_started",
    message: `Quoting from ${uploads.length} file${uploads.length === 1 ? "" : "s"} against "${book.name}"`,
  });
  commit({});

  try {
    // --- 1. Intake: the walkthrough becomes structured observations --------
    const attachments: Attachment[] = uploads.map((u) => ({
      mimeType: u.mimeType,
      data: u.data,
    }));

    const { output: notes } = await runAgent(
      quoteIntakeAgent,
      {
        attachments,
        filenames: uploads.map((u) => u.filename),
        typedNotes: options.typedNotes ?? "",
      },
      ctx,
    );
    commit({ notes });

    if (notes.observations.length === 0) {
      trace.push({
        type: "blocked",
        message: "Nothing quotable was found in the walkthrough.",
      });
      return commit({
        status: "blocked",
        blockedReason:
          "No observations could be taken from these files. Record a walkthrough describing the work, or add photographs of the areas involved.",
      });
    }

    if (notes.unclear.length > 0) {
      trace.push({
        type: "note",
        agentId: quoteIntakeAgent.id,
        agentName: quoteIntakeAgent.name,
        message: `${notes.unclear.length} thing${notes.unclear.length === 1 ? "" : "s"} the visit did not establish.`,
        detail: { unclear: notes.unclear.join("; ") },
      });
      commit({});
    }

    // --- 2. Scope ----------------------------------------------------------
    const { output: scope } = await runAgent(scopeAgent, { notes }, ctx);
    trace.push({
      type: "note",
      agentId: scopeAgent.id,
      agentName: scopeAgent.name,
      message: `${scope.tasks.length} tasks, ${scope.exclusions.length} exclusions.`,
      detail: { summary: scope.summary },
    });
    commit({ scope });

    // --- 3. Takeoff, priced, challenged, revised --------------------------
    let revisionNotes: string | undefined;
    let round = 0;
    let takeoff: QuoteRecord["takeoff"] = null;
    let math: QuoteRecord["math"] = null;
    let challenge: QuoteRecord["challenge"] = null;

    while (round <= MAX_REVISIONS) {
      const estimated = await runAgent(
        takeoffAgent,
        { notes, scope, book, revisionNotes },
        ctx,
      );
      takeoff = estimated.output;

      // The gate. No agent has produced a number; this is where money enters.
      math = priceTakeoff(takeoff.lines, book);
      trace.push({
        type: math.passed ? "note" : "blocked",
        agentId: "pricer",
        agentName: "Pricer",
        message: math.passed
          ? describePricing(math)
          : `${math.unresolved.length || "Some"} line(s) could not be priced from the book.`,
        detail: math.passed ? undefined : { detail: describePricing(math) },
      });
      commit({ takeoff, math, revisionRounds: round });

      if (!math.passed) {
        if (round === MAX_REVISIONS) break;
        revisionNotes = `The pricing engine rejected the takeoff:\n${describePricing(math)}\n\nReplace every unpriceable line with a catalogue entry that exists, or drop it and record it in unknowns. Do not invent product names.`;
        round += 1;
        continue;
      }

      const challenged = await runAgent(
        challengerAgent,
        { scope, takeoff, notes },
        ctx,
      );
      challenge = challenged.output;

      const serious = challenge.missedItems.filter(
        (m) => m.severity === "forgotten" || m.severity === "understated",
      );
      trace.push({
        type: "note",
        agentId: challengerAgent.id,
        agentName: challengerAgent.name,
        message: challenge.wouldOverrun
          ? `This job would overrun as estimated. ${serious.length} item${serious.length === 1 ? "" : "s"} missing or understated.`
          : "The estimate holds up against a working read.",
        detail: { rationale: challenge.overrunRationale },
      });
      commit({ challenge, revisionRounds: round });

      if (!challenge.wouldOverrun || serious.length === 0 || round === MAX_REVISIONS) {
        break;
      }

      revisionNotes = [
        "The tradesperson who would do this job found gaps in the takeoff.",
        `Add or increase these:\n${serious.map((m) => `- [${m.severity}] ${m.item}\n  On site this costs: ${m.consequence}`).join("\n")}`,
        challenge.overstatedItems.length
          ? `Trim these, which are generous:\n${challenge.overstatedItems.map((o) => `- ${o}`).join("\n")}`
          : "",
      ]
        .filter(Boolean)
        .join("\n\n");
      round += 1;
    }

    if (!takeoff || !math?.passed) {
      trace.push({
        type: "blocked",
        message:
          "Holding the quote back rather than sending a figure the price book cannot support.",
      });
      trace.push({ type: "run_finished", message: "Run finished — held back" });
      return commit({
        status: "blocked",
        revisionRounds: round,
        blockedReason: math
          ? `The takeoff could not be priced in ${MAX_REVISIONS + 1} attempts:\n${describePricing(math)}`
          : "No takeoff could be produced from this walkthrough.",
      });
    }

    // --- 4. Risk, then re-price with the contingency it argues for ---------
    const { output: risk } = await runAgent(
      riskAgent,
      {
        notes,
        scope,
        takeoff,
        defaultContingencyPct: book.settings.contingencyPct,
      },
      ctx,
    );

    const contingencyPct = Math.max(0, Math.min(50, risk.recommendedContingencyPct));
    const finalMath = priceTakeoff(takeoff.lines, book, { contingencyPct });

    trace.push({
      type: "note",
      agentId: riskAgent.id,
      agentName: riskAgent.name,
      message:
        contingencyPct === book.settings.contingencyPct
          ? `Contingency held at the book default of ${contingencyPct}%.`
          : `Contingency moved from ${book.settings.contingencyPct}% to ${contingencyPct}%.`,
      detail: { rationale: risk.contingencyRationale },
    });
    commit({ risk, math: finalMath });

    // Re-priced with a different contingency, so the gate runs once more.
    if (!finalMath.passed) {
      trace.push({
        type: "blocked",
        message: "The quote fails its own margin floor once risk is priced in.",
      });
      trace.push({ type: "run_finished", message: "Run finished — held back" });
      return commit({
        status: "blocked",
        revisionRounds: round,
        blockedReason: describePricing(finalMath),
      });
    }

    // --- 5. The customer-facing document ----------------------------------
    const { output: document } = await runAgent(
      quoteWriterAgent,
      { scope, risk, notes },
      ctx,
    );

    trace.push({
      type: "run_finished",
      message: "Quote ready for your review. Nothing has been sent.",
    });

    return commit({
      status: "needs_review",
      document,
      revisionRounds: round,
    });
  } catch (error) {
    const message =
      error instanceof AgentFailure
        ? `${error.agentId} failed: ${error.message}`
        : error instanceof Error
          ? error.message
          : "Unknown failure";

    trace.push({ type: "run_finished", message: `Run failed — ${message}` });
    return commit({ status: "failed", error: message });
  }
}
