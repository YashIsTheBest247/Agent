import "server-only";
import { runAgent, AgentFailure, type RunContext } from "@/lib/agents/runtime";
import { Trace } from "@/lib/agents/trace";
import type { Attachment } from "@/lib/gemini/client";
import {
  fulfilmentAgent,
  orderIntakeAgent,
  replyAgent,
  triageAgent,
} from "./agents";
import { catalogById } from "./catalogs";
import { describeResolution, resolveOrder } from "./resolve";
import type { OrderRecord } from "./record";

export type OrderUpload = {
  filename: string;
  mimeType: string;
  /** Base64, no data: prefix. */
  data: string;
};

export type OrderRunOptions = {
  signal?: AbortSignal;
  onUpdate?: (record: OrderRecord) => void;
};

/**
 * Runs the orders desk.
 *
 * Shorter than the other two, and deliberately so: most of the work here is
 * deterministic. The agent reads the order, code decides what is real, and the
 * remaining agents exist to make the exception queue legible and to draft the
 * reply a person sends.
 */
export async function runOrderPipeline(
  record: OrderRecord,
  uploads: OrderUpload[],
  options: OrderRunOptions = {},
): Promise<OrderRecord> {
  const trace = new Trace();
  const ctx: RunContext = { trace, signal: options.signal };
  const catalog = catalogById(record.catalogId);

  let current: OrderRecord = { ...record, status: "running" };

  const commit = (patch: Partial<OrderRecord>): OrderRecord => {
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
    message: `Reading an order against "${catalog.name}"`,
  });
  commit({});

  try {
    // --- 1. Intake: the message becomes structured lines -------------------
    const attachments: Attachment[] = uploads.map((u) => ({
      mimeType: u.mimeType,
      data: u.data,
    }));

    const { output: parsed } = await runAgent(
      orderIntakeAgent,
      {
        emailText: record.emailText,
        attachments,
        filenames: uploads.map((u) => u.filename),
        catalog,
      },
      ctx,
    );
    commit({ parsed });

    if (parsed.lines.length === 0) {
      trace.push({
        type: "blocked",
        message: "No order lines were found in this message.",
      });
      trace.push({ type: "run_finished", message: "Run finished — nothing to order" });
      return commit({
        status: "blocked",
        blockedReason:
          parsed.unclear.length > 0
            ? `No order lines were found. ${parsed.unclear.join(" ")}`
            : "No order lines were found in this message. It may be an enquiry rather than an order.",
      });
    }

    // --- 2. The gate. Nothing is confirmed that does not resolve -----------
    const resolved = resolveOrder(parsed, catalog);
    trace.push({
      type: resolved.clean ? "note" : "blocked",
      agentId: "resolver",
      agentName: "Resolver",
      message: describeResolution(resolved).split("\n")[0],
      detail: resolved.clean ? undefined : { detail: describeResolution(resolved) },
    });
    commit({ resolved });

    // --- 3. Triage, only when there is something to triage -----------------
    let triage: OrderRecord["triage"] = null;
    if (resolved.exceptions.length > 0) {
      const triaged = await runAgent(
        triageAgent,
        { order: parsed, resolved, catalog },
        ctx,
      );
      triage = triaged.output;
      const auto = triage.items.filter((t) => t.canAutoResolve).length;
      trace.push({
        type: "note",
        agentId: triageAgent.id,
        agentName: triageAgent.name,
        message: `${triage.items.length} item${triage.items.length === 1 ? "" : "s"} for the queue${auto > 0 ? `, ${auto} of which need no decision` : ""}.`,
        detail: { assessment: triage.overallAssessment },
      });
      commit({ triage });
    } else {
      trace.push({
        type: "note",
        message: "No exceptions. This order needs nobody.",
      });
      commit({});
    }

    // --- 4. Dates ----------------------------------------------------------
    const { output: fulfilment } = await runAgent(
      fulfilmentAgent,
      { order: parsed, resolved, today: new Date().toISOString().slice(0, 10) },
      ctx,
    );
    trace.push({
      type: "note",
      agentId: fulfilmentAgent.id,
      agentName: fulfilmentAgent.name,
      message: fulfilment.canMeetRequestedDate
        ? "The requested date can be met."
        : "The requested date cannot be met in full.",
      detail: { reasoning: fulfilment.reasoning },
    });
    commit({ fulfilment });

    // --- 5. The reply ------------------------------------------------------
    const { output: reply } = await runAgent(
      replyAgent,
      {
        order: parsed,
        resolved,
        fulfilment,
        triage: triage ?? { items: [], overallAssessment: "Routine order." },
      },
      ctx,
    );

    if (!resolved.anythingConfirmable) {
      trace.push({
        type: "blocked",
        message: "Nothing on this order can be confirmed without a person.",
      });
      trace.push({ type: "run_finished", message: "Run finished — held" });
      return commit({
        status: "blocked",
        reply,
        blockedReason: describeResolution(resolved),
      });
    }

    trace.push({
      type: "run_finished",
      message: `${resolved.confirmable.length} of ${resolved.lines.length} lines ready to confirm. Nothing has been sent.`,
    });

    return commit({ status: "needs_review", reply });
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
