import { Pill } from "@/components/ui/pill";
import { caseStatusLabels, type CaseStatus } from "@/lib/domain/case";

const tones = {
  queued: "neutral",
  running: "lime",
  needs_review: "lime",
  approved: "ok",
  blocked: "amber",
  failed: "red",
} as const;

export function StatusBadge({ status }: { status: CaseStatus }) {
  return (
    <Pill tone={tones[status]}>
      {status === "running" ? (
        <span className="h-1.5 w-1.5 animate-trace-pulse rounded-full bg-[var(--ok-deep)]" />
      ) : null}
      {caseStatusLabels[status]}
    </Pill>
  );
}
