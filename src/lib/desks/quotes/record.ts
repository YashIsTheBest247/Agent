import type { TokenUsage } from "@/lib/gemini/client";
import type { TraceEvent } from "@/lib/agents/trace";
import type { QuoteMath } from "./pricing";
import type {
  QuoteDocument,
  RiskAssessment,
  ScopeOfWork,
  SiteNotes,
  Takeoff,
  TakeoffChallenge,
} from "./domain";

/**
 * `blocked` is a first-class outcome here for the same reason it is on the
 * appeals desk: a quote the desk cannot stand behind — usually a line that
 * resolves to no real price — is worth less than no quote at all.
 */
export type QuoteStatus =
  | "queued"
  | "running"
  | "needs_review"
  | "approved"
  | "blocked"
  | "failed";

export const quoteStatusLabels: Record<QuoteStatus, string> = {
  queued: "Queued",
  running: "Agents working",
  needs_review: "Ready for your review",
  approved: "Approved by you",
  blocked: "Held back",
  failed: "Could not complete",
};

export type QuoteFileRef = {
  filename: string;
  mimeType: string;
  bytes: number;
};

export type QuoteRecord = {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: QuoteStatus;
  /** Who this belongs to. Every read is checked against it. */
  userId: string;

  priceBookId: string;
  customerName: string;
  files: QuoteFileRef[];

  notes: SiteNotes | null;
  scope: ScopeOfWork | null;
  takeoff: Takeoff | null;
  math: QuoteMath | null;
  risk: RiskAssessment | null;
  challenge: TakeoffChallenge | null;
  document: QuoteDocument | null;

  revisionRounds: number;
  blockedReason: string | null;
  error: string | null;

  trace: TraceEvent[];
  usage: TokenUsage;
  approvedAt: string | null;
};

export function emptyQuote(
  id: string,
  userId: string,
  priceBookId: string,
  customerName: string,
  files: QuoteFileRef[],
): QuoteRecord {
  const now = new Date().toISOString();
  return {
    id,
    userId,
    createdAt: now,
    updatedAt: now,
    status: "queued",
    priceBookId,
    customerName,
    files,
    notes: null,
    scope: null,
    takeoff: null,
    math: null,
    risk: null,
    challenge: null,
    document: null,
    revisionRounds: 0,
    blockedReason: null,
    error: null,
    trace: [],
    usage: { input: 0, output: 0, total: 0 },
    approvedAt: null,
  };
}
