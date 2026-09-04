import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "lime" | "ink" | "ghost" | "quiet";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  lime: "pill-lime",
  ink: "pill-ink",
  ghost: "pill-ghost",
  quiet:
    "border border-transparent text-[var(--text-2)] hover:text-[var(--ink)]",
};

const sizes: Record<Size, string> = {
  sm: "px-3.5 py-2 text-[11px]",
  md: "px-5 py-2.5 text-[11.5px]",
  lg: "px-7 py-3.5 text-[12.5px]",
};

const base =
  "press pill justify-center disabled:pointer-events-none disabled:opacity-45";

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
