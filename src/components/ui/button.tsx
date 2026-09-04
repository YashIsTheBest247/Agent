import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "ink" | "leaf" | "outline" | "ghost" | "white";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  ink: "bg-ink-900 text-white hover:bg-ink-800 shadow-[0_1px_2px_rgba(22,25,20,0.28),0_8px_24px_-12px_rgba(22,25,20,0.5)]",
  leaf: "bg-leaf-500 text-ink-900 hover:bg-leaf-400 shadow-[0_1px_2px_rgba(71,131,31,0.3),0_10px_28px_-14px_rgba(95,170,40,0.8)]",
  outline:
    "border border-ink-200 bg-white/70 text-ink-800 hover:border-ink-300 hover:bg-white",
  ghost: "text-ink-600 hover:bg-ink-100 hover:text-ink-900",
  white: "bg-white text-ink-900 hover:bg-ink-100 shadow-sm",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-[13px]",
  md: "h-11 px-6 text-sm",
  lg: "h-[52px] px-8 text-[15px]",
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-[-0.01em] " +
  "transition-all duration-200 ease-[var(--ease-out-soft)] active:scale-[0.98] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf-600 focus-visible:ring-offset-2 " +
  "focus-visible:ring-offset-canvas disabled:pointer-events-none disabled:opacity-50";

type ButtonProps = ComponentProps<"button"> & {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
};

export function Button({
  variant = "ink",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
};

export function ButtonLink({
  variant = "ink",
  size = "md",
  className,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </Link>
  );
}
