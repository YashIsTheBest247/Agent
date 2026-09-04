import "server-only";
import { runAgent, AgentFailure, type RunContext } from "./runtime";
import { Trace } from "./trace";
import { auditCitations, describeAudit } from "./audit";
import { transcriberAgent, intakeAgent } from "./definitions/intake";
import { classifierAgent } from "./definitions/classify";
import { coverageAgent } from "./definitions/coverage";
import { evidenceAgent } from "./definitions/evidence";
import { strategyAgent } from "./definitions/strategy";
import { drafterAgent, adversaryAgent } from "./definitions/draft";
import { filingAgent } from "./definitions/filing";
import { resolveDeadline } from "@/lib/domain/denial";
import type { Citation } from "@/lib/domain/appeal";
import type { SourceDocument } from "@/lib/domain/documents";
import type { CaseRecord } from "@/lib/domain/case";
import type { Attachment } from "@/lib/gemini/client";
import { daysUntil } from "@/lib/utils";

/** Revision rounds before the pipeline stops and hands back what it has. */
const MAX_REVISIONS = 2;

export type UploadedFile = {
  filename: string;
  mimeType: string;
  /** Base64, no data: prefix. */
  data: string;
};

export type OrchestratorOptions = {
  signal?: AbortSignal;
  /** Called after every stage so a caller can persist and stream progress. */
  onUpdate?: (record: CaseRecord) => void;
};

/**
 * Runs the full appeal pipeline.
 *
 * The shape is deliberately an explicit sequence rather than a general graph
 * engine: there are nine agents in one known order, and a reader should be able
 * to see the whole flow — including where it refuses to continue — in one pass
 * down this function.
 */
export async function runAppealPipeline(
  record: CaseRecord,
  files: UploadedFile[],
  options: OrchestratorOptions = {},
): Promise<CaseRecord> {
  const trace = new Trace();
  const ctx: RunContext = { trace, signal: options.signal };

  let current: CaseRecord = { ...record, status: "running" };

  const commit = (patch: Partial<CaseRecord>): CaseRecord => {
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
    message: `Starting appeal run over ${files.length} document${files.length === 1 ? "" : "s"}`,
  });
  commit({});

  try {
    // --- 1. Intake, pass one: every upload becomes checkable text ----------
    const documents = await transcribeAll(files, ctx);
    commit({ documents });

    const readable = documents.filter((d) =>
      d.pages.some((p) => p.text.trim().length > 0),
    );
    if (readable.length === 0) {
      trace.push({
        type: "blocked",
        message: "Nothing legible was found in the uploads.",
      });
      return commit({
        status: "blocked",
        blockedReason:
          "None of the uploaded files contained readable text. Re-upload a clearer photo or the original PDF of the denial letter.",
      });
    }

    // --- 2. Intake, pass two: structured facts ----------------------------
    const { output: facts } = await runAgent(
      intakeAgent,
      { documents: readable },
      ctx,
    );
    const deadline = resolveDeadline(facts);
    const daysRemaining = deadline ? daysUntil(deadline) : null;
    commit({ facts, deadline });

    if (deadline && daysRemaining !== null) {
      trace.push({
        type: "note",
        message:
          daysRemaining < 0
            ? `The stated deadline of ${deadline} has passed. The appeal is still worth filing, and late filing has recognised exceptions.`
            : `Filing deadline is ${deadline} — ${daysRemaining} days from today.`,
      });
    } else {
      trace.push({
        type: "note",
        message:
          "No filing deadline is stated in the documents. Treating this as urgent.",
      });
    }
    commit({});

    // --- 3. Classification -------------------------------------------------
    const { output: classification } = await runAgent(
      classifierAgent,
      { facts },
      ctx,
    );
    trace.push({
      type: "note",
      agentId: classifierAgent.id,
      agentName: classifierAgent.name,
      message: `Classified as ${classification.category} (${classification.confidence} confidence).`,
      detail: { reasoning: classification.reasoning },
    });
    commit({ classification });

    // --- 4. Coverage and evidence, in parallel ----------------------------
    const [coverage, evidence] = await Promise.all([
      runAgent(coverageAgent, { facts, classification, documents: readable }, ctx),
      runAgent(evidenceAgent, { facts, classification, documents: readable }, ctx),
    ]).then(([c, e]) => [c.output, e.output] as const);

    // --- 5. Verify the citation pool BEFORE anything is written -----------
    // Cheaper and safer than catching a bad quote after it is woven into a
    // letter: an unverifiable citation never enters the drafter's vocabulary.
    const proposed: Citation[] = dedupeCitations([
      ...coverage.citations,
      ...evidence.citations,
    ]);
    const poolAudit = auditCitations(proposed, readable);
    const citations = poolAudit.checked
      .filter((c) => c.status === "verified" || c.status === "near_match")
      .map(stripVerification);
    const rejected = poolAudit.checked.length - citations.length;

    trace.push({
      type: rejected > 0 ? "blocked" : "note",
      message:
        rejected > 0
          ? `Discarded ${rejected} of ${poolAudit.checked.length} proposed citations that do not appear in the source documents.`
          : `All ${citations.length} proposed citations resolve to the source documents.`,
      detail: rejected > 0 ? { detail: describeAudit(poolAudit) } : undefined,
    });
    commit({ coverage, evidence, citations });

    // --- 6. Strategy -------------------------------------------------------
    const { output: strategy } = await runAgent(
      strategyAgent,
      {
        facts,
        classification,
        coverage,
        evidence,
        citations,
        deadline,
        daysRemaining,
      },
      ctx,
    );
    commit({ strategy });

    // --- 7. Draft, audit, adversarial review, revise ----------------------
    let revisionNotes: string | undefined;
    let round = 0;
    let draft = null as CaseRecord["draft"];
    let review = null as CaseRecord["review"];
    let audit = null as CaseRecord["audit"];

    while (round <= MAX_REVISIONS) {
      const drafted = await runAgent(
        drafterAgent,
        { facts, strategy, evidence, citations, deadline, revisionNotes },
        ctx,
      );
      draft = drafted.output;

      audit = auditCitations(citations, readable, draft.citationIds);
      trace.push({
        type: audit.passed ? "note" : "blocked",
        agentId: "auditor",
        agentName: "Auditor",
        message: audit.passed
          ? describeAudit(audit)
          : "The draft cites text that cannot be found in the sources.",
        detail: audit.passed ? undefined : { detail: describeAudit(audit) },
      });
      commit({ draft, audit, revisionRounds: round });

      if (!audit.passed) {
        if (round === MAX_REVISIONS) break;
        revisionNotes = `The citation auditor rejected the draft:\n${describeAudit(audit)}\n\nRemove or replace every unsupported passage. Do not introduce new citations.`;
        round += 1;
        continue;
      }

      const reviewed = await runAgent(
        adversaryAgent,
        { facts, strategy, citations, draft },
        ctx,
      );
      review = reviewed.output;

      const serious = review.weaknesses.filter(
        (w) => w.severity === "fatal" || w.severity === "serious",
      );
      trace.push({
        type: "note",
        agentId: adversaryAgent.id,
        agentName: adversaryAgent.name,
        message: review.wouldUphold
          ? `A reviewer could still uphold this denial. ${serious.length} significant weakness${serious.length === 1 ? "" : "es"} found.`
          : "A reviewer would struggle to uphold this denial as written.",
        detail: { strongestPoint: review.strongestPoint },
      });
      commit({ review, revisionRounds: round });

      const needsRevision =
        (review.wouldUphold && serious.length > 0) ||
        review.unsupportedAssertions.length > 0;

      if (!needsRevision || round === MAX_REVISIONS) break;

      revisionNotes = [
        "The adversarial reviewer found grounds to uphold the denial.",
        serious.length
          ? `Weaknesses to fix:\n${serious.map((w) => `- [${w.severity}] ${w.location}\n  Problem: ${w.issue}\n  Fix: ${w.fix}`).join("\n")}`
          : "",
        review.unsupportedAssertions.length
          ? `Sentences asserting things no citation establishes — rewrite or remove each:\n${review.unsupportedAssertions.map((s) => `- ${s}`).join("\n")}`
          : "",
      ]
        .filter(Boolean)
        .join("\n\n");
      round += 1;
    }

    if (!draft || !audit?.passed) {
      trace.push({
        type: "blocked",
        message:
          "Holding the draft back rather than handing over an appeal with citations that do not resolve.",
      });
      trace.push({ type: "run_finished", message: "Run finished — held back" });
      return commit({
        status: "blocked",
        revisionRounds: round,
        blockedReason: audit
          ? `The draft could not be made citation-clean in ${MAX_REVISIONS + 1} attempts:\n${describeAudit(audit)}`
          : "No draft could be produced from these documents.",
      });
    }

    // --- 8. Filing packet --------------------------------------------------
    const { output: filing } = await runAgent(
      filingAgent,
      {
        facts,
        strategy,
        deadline,
        daysRemaining,
        today: new Date().toISOString().slice(0, 10),
      },
      ctx,
    );

    trace.push({
      type: "run_finished",
      message: "Draft ready for your review. Nothing has been sent.",
    });

    return commit({
      status: "needs_review",
      filing,
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

/** Transcribes uploads concurrently; one unreadable file must not sink the run. */
async function transcribeAll(
  files: UploadedFile[],
  ctx: RunContext,
): Promise<SourceDocument[]> {
  const results = await Promise.all(
    files.map(async (file, index): Promise<SourceDocument | null> => {
      const attachment: Attachment = {
        mimeType: file.mimeType,
        data: file.data,
      };
      try {
        const { output } = await runAgent(
          transcriberAgent,
          { filename: file.filename, attachment },
          ctx,
        );
        if (output.legibilityNotes.length > 0) {
          ctx.trace.push({
            type: "note",
            agentId: transcriberAgent.id,
            agentName: transcriberAgent.name,
            message: `Parts of ${file.filename} were hard to read.`,
            detail: { notes: output.legibilityNotes },
          });
        }
        return {
          id: `doc_${index + 1}`,
          kind: output.detectedKind,
          filename: file.filename,
          mimeType: file.mimeType,
          pages: output.pages,
          uploadedAt: new Date().toISOString(),
        };
      } catch {
        ctx.trace.push({
          type: "agent_failed",
          agentId: transcriberAgent.id,
          agentName: transcriberAgent.name,
          message: `Could not read ${file.filename}. Continuing without it.`,
        });
        return null;
      }
    }),
  );

  return results.filter((d): d is SourceDocument => d !== null);
}

/** Coverage and evidence number their citations independently; keep both. */
function dedupeCitations(citations: Citation[]): Citation[] {
  const byId = new Map<string, Citation>();
  for (const c of citations) {
    let id = c.id;
    let suffix = 2;
    while (byId.has(id) && byId.get(id)?.quote !== c.quote) {
      id = `${c.id}_${suffix}`;
      suffix += 1;
    }
    byId.set(id, { ...c, id });
  }
  return [...byId.values()];
}

function stripVerification(c: Citation & Record<string, unknown>): Citation {
  return {
    id: c.id,
    documentId: c.documentId,
    page: c.page,
    quote: c.quote,
    supports: c.supports,
  };
}
