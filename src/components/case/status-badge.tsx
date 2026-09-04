import { Pill } from "@/components/ui/pill";
import { caseStatusLabels, type CaseStatus } from "@/lib/domain/case";

const tones = {
  queued: "neutral",
  running: "leaf",
  needs_review: "leaf",
  approved: "leaf",
  blocked: "caution",
  failed: "flag",
} as const;

export function StatusBadge({ status }: { status: CaseStatus }) {
  return (
    <Pill tone={tones[status]}>
      {status === "running" ? (
        <span className="h-1.5 w-1.5 animate-trace-pulse rounded-full bg-leaf-600" />
      ) : null}
      {caseStatusLabels[status]}
    </Pill>
  );
}
