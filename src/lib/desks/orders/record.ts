import type { TokenUsage } from "@/lib/gemini/client";
import type { TraceEvent } from "@/lib/agents/trace";
import type { ResolvedOrder } from "./resolve";
import type {
  ExceptionTriage,
  FulfilmentView,
  OrderReply,
  ParsedOrder,
} from "./domain";

/**
 * Unlike the other desks, a held order is the normal case rather than a
 * failure: most real orders have one line that needs a person. `blocked` here
 * means nothing at all could be confirmed.
 */
export type OrderStatus =
  | "queued"
  | "running"
  | "needs_review"
  | "approved"
  | "blocked"
  | "failed";

export const orderStatusLabels: Record<OrderStatus, string> = {
  queued: "Queued",
  running: "Agents working",
  needs_review: "Ready for your review",
  approved: "Approved by you",
  blocked: "Nothing confirmable",
  failed: "Could not complete",
};

export type OrderFileRef = {
  filename: string;
  mimeType: string;
  bytes: number;
};

export type OrderRecord = {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: OrderStatus;
  /** Who this belongs to. Every read is checked against it. */
  userId: string;

  catalogId: string;
  /** Snapshotted so an old order still renders after the catalogue changes. */
  catalogName: string;
  currency: string;
  emailText: string;
  files: OrderFileRef[];

  parsed: ParsedOrder | null;
  resolved: ResolvedOrder | null;
  triage: ExceptionTriage | null;
  fulfilment: FulfilmentView | null;
  reply: OrderReply | null;

  blockedReason: string | null;
  error: string | null;

  trace: TraceEvent[];
  usage: TokenUsage;
  approvedAt: string | null;
};

export function emptyOrder(
  id: string,
  userId: string,
  catalogId: string,
  catalogName: string,
  currency: string,
  emailText: string,
  files: OrderFileRef[],
): OrderRecord {
  const now = new Date().toISOString();
  return {
    id,
    userId,
    createdAt: now,
    updatedAt: now,
    status: "queued",
    catalogId,
    catalogName,
    currency,
    emailText,
    files,
    parsed: null,
    resolved: null,
    triage: null,
    fulfilment: null,
    reply: null,
    blockedReason: null,
    error: null,
    trace: [],
    usage: { input: 0, output: 0, total: 0 },
    approvedAt: null,
  };
}
