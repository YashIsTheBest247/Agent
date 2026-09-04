import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PillTone = "leaf" | "ink" | "glass" | "flag" | "caution" | "neutral";

const tones: Record<PillTone, string> = {
  leaf: "bg-leaf-100 text-leaf-800 ring-1 ring-leaf-300/60",
  ink: "bg-ink-900 text-white",
  glass:
    "bg-white/75 text-ink-700 ring-1 ring-white/60 backdrop-blur-md shadow-[0_2px_10px_rgba(22,25,20,0.06)]",
  flag: "bg-flag-100 text-flag-500 ring-1 ring-flag-500/25",
  caution: "bg-caution-100 text-caution-500 ring-1 ring-caution-500/25",
  neutral: "bg-ink-100 text-ink-600 ring-1 ring-ink-200",
};

export function Pill({
  tone = "glass",
  icon,
  children,
  className,
}: {
  tone?: PillTone;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium tracking-[-0.005em]",
        tones[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
