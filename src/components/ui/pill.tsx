import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "lime" | "ink" | "neutral" | "amber" | "red" | "ok";

/**
 * The small status chip used across the workspace. Mono, uppercase, hairline
 * border — it labels state without competing with the content it sits beside.
 */
const tones: Record<Tone, string> = {
  lime: "border-[var(--lime-deep)] bg-[var(--lime-wash)] text-[var(--ok-deep)]",
  ink: "border-[var(--ink)] bg-[var(--ink)] text-white",
  neutral: "border-[var(--line)] bg-[var(--paper)] text-[var(--text-2)]",
  amber:
    "border-[var(--risk-amber)]/40 bg-[var(--risk-amber-wash)] text-[#9a5f08]",
  red: "border-[var(--risk-red)]/35 bg-[var(--risk-red-wash)] text-[#8f1f1f]",
  ok: "border-[#bfe3cc] bg-[var(--ok-wash)] text-[#3d5406]",
};

export function Pill({
  tone = "neutral",
  icon,
  children,
  className,
}: {
  tone?: Tone;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[9.5px] tracking-[0.12em] uppercase",
        tones[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
