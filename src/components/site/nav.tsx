"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "@/components/site/logo";
import { cn } from "@/lib/utils";

const links = [
  { label: "Appeals", href: "/cases" },
  { label: "Quoting", href: "/quotes" },
  { label: "Orders", href: "/orders" },
  { label: "How it works", href: "/#method" },
  { label: "Safeguards", href: "/#safeguards" },
] as const;

/**
 * Transparent while it sits over the hero photograph, solid once the page
 * scrolls past it — so the lime wordmark reads on the image and the ink
 * wordmark reads on paper.
 */
export function Nav({
  signedIn = false,
  userName,
}: {
  signedIn?: boolean;
  userName?: string;
}) {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300",
        solid
          ? "border-[var(--line)] bg-[var(--paper)]/92 backdrop-blur-md"
          : "border-transparent bg-transparent",
      )}
    >
      <nav className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
        <Link href="/" className="press shrink-0" aria-label="Second Chair home">
          <Logo tone={solid ? "ink" : "light"} />
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "press text-[13.5px] transition-colors",
                solid
                  ? "text-[var(--text-2)] hover:text-[var(--ink)]"
                  : "text-white/80 hover:text-white",
              )}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {signedIn ? null : (
            <Link
              href="/signin"
              className={cn(
                "press hidden text-[13.5px] transition-colors sm:inline-flex",
                solid
                  ? "text-[var(--text-2)] hover:text-[var(--ink)]"
                  : "text-white/80 hover:text-white",
              )}
            >
              Sign in
            </Link>
          )}
          <Link
            href={signedIn ? "/#desks" : "/signup"}
            className={cn(
              "press pill hidden sm:inline-flex",
              solid
                ? "pill-lime"
                : "border border-white/35 bg-white/12 text-white backdrop-blur-sm hover:bg-white/20",
            )}
          >
            {signedIn ? "Pick a desk" : "Get started"}
          </Link>
          <button
            type="button"
            aria-expanded={open}
            aria-controls="nav-sheet"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
            className={cn(
              "press flex h-10 w-10 items-center justify-center rounded-full border md:hidden",
              solid
                ? "border-[var(--line)] text-[var(--ink)]"
                : "border-white/30 text-white",
            )}
          >
            <span className="relative block h-3.5 w-4.5" aria-hidden="true">
              <span
                className="absolute left-0 block h-[1.5px] w-full bg-current transition-transform duration-200"
                style={{
                  top: 2,
                  transform: open ? "translateY(5px) rotate(45deg)" : "none",
                }}
              />
              <span
                className="absolute left-0 block h-[1.5px] w-full bg-current transition-transform duration-200"
                style={{
                  bottom: 2,
                  transform: open ? "translateY(-5px) rotate(-45deg)" : "none",
                }}
              />
            </span>
          </button>
        </div>
      </nav>

      <div
        id="nav-sheet"
        hidden={!open}
        className="border-t border-[var(--line-ink)] bg-[var(--ink)] px-5 pt-2 pb-5 md:hidden"
      >
        <ul className="flex flex-col">
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                onClick={() => setOpen(false)}
                className="block border-b border-[var(--line-ink)] py-3.5 text-[15px] text-white/85"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href={signedIn ? "/#desks" : "/signup"}
          onClick={() => setOpen(false)}
          className="pill pill-lime mt-4 w-full justify-center"
        >
          {signedIn ? `Signed in as ${userName ?? "you"}` : "Get started — free"}
        </Link>
      </div>
    </header>
  );
}
