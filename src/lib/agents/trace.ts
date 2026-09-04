import type { TokenUsage } from "@/lib/gemini/client";

/**
 * The trace is a product surface, not a debug log.
 *
 * "Every decision is inspectable" is a promise the case page has to keep, so
 * each event carries enough to render a human-readable timeline: which agent
 * ran, what it concluded, what it cost, and where it disagreed with another.
 */
export type TraceEventType =
  | "run_started"
  | "agent_started"
  | "agent_finished"
  | "agent_repaired"
  | "agent_failed"
  | "note"
  | "blocked"
  | "run_finished";

export type TraceEvent = {
  id: string;
  at: string;
  type: TraceEventType;
  agentId?: string;
  agentName?: string;
  message: string;
  detail?: Record<string, unknown>;
  usage?: TokenUsage;
  durationMs?: number;
};

export type TraceListener = (event: TraceEvent) => void;

let counter = 0;
const nextId = () => `ev_${Date.now().toString(36)}_${(counter += 1).toString(36)}`;

export class Trace {
  private readonly events: TraceEvent[] = [];
  private readonly listeners = new Set<TraceListener>();

  push(event: Omit<TraceEvent, "id" | "at">): TraceEvent {
    const full: TraceEvent = {
      ...event,
      id: nextId(),
      at: new Date().toISOString(),
    };
    this.events.push(full);
    for (const listener of this.listeners) {
      // A broken listener must never take the run down with it.
      try {
        listener(full);
      } catch {
        /* ignored */
      }
    }
    return full;
  }

  /** Replays what has happened so far, then streams what happens next. */
  subscribe(listener: TraceListener): () => void {
    for (const event of this.events) listener(event);
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  all(): readonly TraceEvent[] {
    return this.events;
  }

  totalUsage(): TokenUsage {
    return this.events.reduce<TokenUsage>(
      (acc, e) =>
        e.usage
          ? {
              input: acc.input + e.usage.input,
              output: acc.output + e.usage.output,
              total: acc.total + e.usage.total,
            }
          : acc,
      { input: 0, output: 0, total: 0 },
    );
  }

  failures(): TraceEvent[] {
    return this.events.filter(
      (e) => e.type === "agent_failed" || e.type === "blocked",
    );
  }
}
