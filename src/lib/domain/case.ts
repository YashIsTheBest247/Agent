import type { TokenUsage } from "@/lib/gemini/client";
import type { TraceEvent } from "@/lib/agents/trace";
import type {
  AppealDraft,
  AppealStrategy,
  AuditReport,
  Citation,
  CoverageFinding,
  EvidenceFinding,
  FilingPacket,
  ReviewVerdict,
} from "./appeal";
import type { DenialClassification, DenialFacts } from "./denial";
import type { SourceDocument } from "./documents";

/**
 * `blocked` is a first-class outcome, not an error.
 *
 * It means the pipeline produced a draft it could not stand behind — usually
 * a citation that does not resolve. Showing the user nothing, and saying why,
 * is the correct result there.
 */
export type CaseStatus =
  | "queued"
  | "running"
  | "needs_review"
  | "approved"
  | "blocked"
  | "failed";

export const caseStatusLabels: Record<CaseStatus, string> = {
  queued: "Queued",
  running: "Agents working",
  needs_review: "Ready for your review",
  approved: "Approved by you",
  blocked: "Held back",
  failed: "Could not complete",
};

export type CaseRecord = {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: CaseStatus;
  /** Who this belongs to. Every read is checked against it. */
  userId: string;

  documents: SourceDocument[];
  citations: Citation[];

  facts: DenialFacts | null;
  classification: DenialClassification | null;
  coverage: CoverageFinding | null;
  evidence: EvidenceFinding | null;
  strategy: AppealStrategy | null;
  draft: AppealDraft | null;
  review: ReviewVerdict | null;
  audit: AuditReport | null;
  filing: FilingPacket | null;

  deadline: string | null;
  revisionRounds: number;
  /** Set when status is blocked: what the pipeline refused to ship, and why. */
  blockedReason: string | null;
  error: string | null;

  trace: TraceEvent[];
  usage: TokenUsage;
  approvedAt: string | null;
};

export function emptyCase(
  id: string,
  userId: string,
  documents: SourceDocument[],
): CaseRecord {
  const now = new Date().toISOString();
  return {
    id,
    userId,
    createdAt: now,
    updatedAt: now,
    status: "queued",
    documents,
    citations: [],
    facts: null,
    classification: null,
    coverage: null,
    evidence: null,
    strategy: null,
    draft: null,
    review: null,
    audit: null,
    filing: null,
    deadline: null,
    revisionRounds: 0,
    blockedReason: null,
    error: null,
    trace: [],
    usage: { input: 0, output: 0, total: 0 },
    approvedAt: null,
  };
}
