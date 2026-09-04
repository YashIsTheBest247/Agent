import { cn } from "@/lib/utils";

/**
 * The mark is a leaf whose midrib is a rising line — growth, and a claim
 * turned back over. Kept as inline SVG so it inherits currentColor.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn("h-6 w-6", className)}
    >
      <path
        d="M20.5 3.5C20.5 3.5 8.8 2.2 5 6c-3.1 3.1-2.6 8.6.6 11.7 3.2 3.1 8.7 3.4 11.7.4 3.8-3.8 3.2-14.6 3.2-14.6Z"
        fill="currentColor"
        fillOpacity="0.16"
      />
      <path
        d="M20.5 3.5C20.5 3.5 8.8 2.2 5 6c-3.1 3.1-2.6 8.6.6 11.7 3.2 3.1 8.7 3.4 11.7.4 3.8-3.8 3.2-14.6 3.2-14.6Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M3.5 20.5 12 12m0 0h-4m4 0v4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({
  className,
  wordmarkClassName,
}: {
  className?: string;
  wordmarkClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark className="h-[22px] w-[22px] text-leaf-600" />
      <span
        className={cn(
          "font-sans text-[15px] font-extrabold tracking-[0.14em] text-ink-900 uppercase",
          wordmarkClassName,
        )}
      >
        Overturn
      </span>
    </span>
  );
}
