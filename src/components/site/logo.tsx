import { cn } from "@/lib/utils";

/**
 * Two seats: the lead, and the one beside it. The second chair does the
 * preparation; the lead signs. Sized in a 32-unit box so it holds at nav scale.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 32 32"
      fill="none"
      role="img"
      aria-label="Second Chair"
      className={className}
    >
      <rect x="1.5" y="1.5" width="29" height="29" rx="7" fill="var(--lime)" />
      <g fill="var(--ink)">
        {/* The lead — taller, and only outlined. */}
        <rect x="7.5" y="7.5" width="6.5" height="17" rx="2.2" opacity="0.3" />
        {/* The second chair — shorter, solid, and doing the work. */}
        <rect x="17.2" y="12" width="7.3" height="12.5" rx="2.2" />
        <rect x="7.5" y="21.6" width="17" height="2.9" rx="1.45" />
      </g>
    </svg>
  );
}

export function Logo({
  className,
  tone = "ink",
}: {
  className?: string;
  /** `light` for the transparent header sitting over the hero photograph. */
  tone?: "ink" | "light";
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "display text-[20px] tracking-[-0.02em]",
            tone === "light" ? "text-[var(--lime)]" : "text-[var(--ink)]",
          )}
        >
          Second Chair
        </span>
        <span
          className={cn(
            "mt-0.5 hidden font-mono text-[8.5px] tracking-[0.2em] uppercase sm:block",
            tone === "light" ? "text-white/60" : "text-[var(--text-3)]",
          )}
        >
          Three desks
        </span>
      </span>
    </span>
  );
}
