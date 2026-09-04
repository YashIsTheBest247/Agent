"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  CircleDashed,
  Flag,
  Info,
  RefreshCw,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { TraceEvent, TraceEventType } from "@/lib/agents/trace";
import { cn } from "@/lib/utils";

const marks: Record<
  TraceEventType,
  { icon: LucideIcon; ring: string; fill: string }
> = {
  run_started: { icon: Flag, ring: "ring-[var(--line)]", fill: "bg-white text-[var(--text-2)]" },
  agent_started: {
    icon: CircleDashed,
    ring: "ring-[var(--lime-deep)]",
    fill: "bg-[var(--lime-wash)] text-[var(--ok-deep)]",
  },
  agent_finished: {
    icon: Check,
    ring: "ring-[var(--lime-deep)]",
    fill: "bg-[var(--lime)] text-white",
  },
  agent_repaired: {
    icon: RefreshCw,
    ring: "ring-[var(--risk-amber)]/40",
    fill: "bg-[var(--risk-amber-wash)] text-[var(--risk-amber)]",
  },
  agent_failed: { icon: X, ring: "ring-[var(--risk-red)]/40", fill: "bg-[var(--risk-red-wash)] text-[var(--risk-red)]" },
  note: { icon: Info, ring: "ring-[var(--line)]", fill: "bg-white text-[var(--text-2)]" },
  blocked: {
    icon: AlertTriangle,
    ring: "ring-[var(--risk-amber)]/40",
    fill: "bg-[var(--risk-amber-wash)] text-[var(--risk-amber)]",
  },
  run_finished: { icon: Flag, ring: "ring-[var(--text-3)]", fill: "bg-[var(--ink)] text-white" },
};

function relative(at: string, from: string | null): string {
  if (!from) return "";
  const ms = new Date(at).getTime() - new Date(from).getTime();
  if (!Number.isFinite(ms) || ms < 0) return "";
  return `+${(ms / 1000).toFixed(1)}s`;
}

function TimelineRow({
  event,
  startedAt,
}: {
  event: TraceEvent;
  startedAt: string | null;
}) {
  const [open, setOpen] = useState(false);
  const mark = marks[event.type];
  const Icon = mark.icon;
  const hasDetail = Boolean(event.detail && Object.keys(event.detail).length);

  return (
    <li className="relative flex gap-3.5 pb-5 last:pb-0">
      <span className="absolute top-7 bottom-0 left-[13px] w-px bg-[var(--line)]" aria-hidden />
      <span
        className={cn(
          "relative z-10 flex h-[27px] w-[27px] shrink-0 items-center justify-center rounded-full ring-1",
          mark.ring,
          mark.fill,
          event.type === "agent_started" && "animate-trace-pulse",
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>

      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          {event.agentName ? (
            <span className="text-[13px] font-semibold text-[var(--ink)]">
              {event.agentName}
            </span>
          ) : null}
          <span className="text-[13px] text-[var(--text-2)]">{event.message}</span>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--text-3)]">
          <span>{relative(event.at, startedAt)}</span>
          {event.durationMs ? <span>{(event.durationMs / 1000).toFixed(1)}s</span> : null}
          {event.usage?.total ? (
            <span>{event.usage.total.toLocaleString()} tokens</span>
          ) : null}
          {hasDetail ? (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[var(--text-2)] transition-colors hover:bg-[var(--paper-2)] hover:text-[var(--ink)]"
              aria-expanded={open}
            >
              {open ? "Hide" : "Detail"}
              <ChevronDown
                className={cn("h-3 w-3 transition-transform", open && "rotate-180")}
              />
            </button>
          ) : null}
        </div>

        {open && hasDetail ? (
          <div className="mt-2 rounded-2xl bg-[var(--paper)] p-3 ring-1 ring-[var(--line)]">
            {Object.entries(event.detail ?? {}).map(([key, value]) => (
              <div key={key} className="text-[12px] leading-relaxed">
                <span className="font-semibold text-[var(--text)]">{key}: </span>
                <span className="whitespace-pre-wrap text-[var(--text-2)]">
                  {typeof value === "string" ? value : JSON.stringify(value, null, 2)}
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </li>
  );
}

/**
 * The run, as it happened.
 *
 * This is the "every decision is inspectable" promise made good: the same
 * events that drive the live view are what a user reads afterwards to see why
 * an agent concluded what it did.
 */
export function AgentTimeline({ events }: { events: TraceEvent[] }) {
  const startedAt = events[0]?.at ?? null;

  if (events.length === 0) {
    return (
      <p className="text-[13px] text-[var(--text-3)]">
        The run has not started yet.
      </p>
    );
  }

  return (
    <ol className="flex flex-col">
      {events.map((event) => (
        <TimelineRow key={event.id} event={event} startedAt={startedAt} />
      ))}
    </ol>
  );
}
