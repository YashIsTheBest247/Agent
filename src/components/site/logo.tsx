import { cn } from "@/lib/utils";

/**
 * A lime tile carrying a sheet of paper and the arrow that turns it back over.
 * Sized in a 32-unit box so it stays crisp at nav and favicon scale.
 */
export function LogoMark({
  className,
  tile = "var(--lime)",
  glyph = "var(--ink)",
}: {
  className?: string;
  tile?: string;
  glyph?: string;
}) {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 32 32"
      fill="none"
      role="img"
      aria-label="Overturn"
      className={className}
    >
      <rect x="1.5" y="1.5" width="29" height="29" rx="7" fill={tile} />
      <g fill={glyph}>
        {/* The denial letter. */}
        <path d="M9 6.6h9.6L23 11v9.2a1.2 1.2 0 0 1-1.2 1.2H9a1.2 1.2 0 0 1-1.2-1.2V7.8A1.2 1.2 0 0 1 9 6.6Z" opacity="0.28" />
        <path
          d="M9.4 7.8h8.4l3.8 3.8v8.2H9.4V7.8Z"
          stroke={glyph}
          strokeWidth="1.5"
          strokeLinejoin="round"
          fill="none"
        />
        {/* The turn. */}
        <path
          d="M11.6 25.4a6 6 0 0 0 9.9-3.1"
          stroke={glyph}
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <path d="M9.2 22.2 14 23.4l-2.2 3.4-2.6-4.6Z" />
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
          Overturn
        </span>
        <span
          className={cn(
            "mt-0.5 hidden font-mono text-[8.5px] tracking-[0.2em] uppercase sm:block",
            tone === "light" ? "text-white/60" : "text-[var(--text-3)]",
          )}
        >
          Appeals desk
        </span>
      </span>
    </span>
  );
}
