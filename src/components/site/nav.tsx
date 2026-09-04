"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Logo } from "@/components/site/logo";
import { cn } from "@/lib/utils";

const links = [
  { label: "How it works", href: "/#how-it-works" },
  { label: "Use cases", href: "/#use-cases" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Safeguards", href: "/#safeguards" },
] as const;

export function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4">
      <nav
        className={cn(
          "mx-auto flex max-w-6xl items-center justify-between rounded-full px-4 py-2.5 transition-all duration-300 ease-[var(--ease-out-soft)] sm:px-5",
          scrolled
            ? "bg-white/85 shadow-[0_8px_30px_-12px_rgba(22,25,20,0.18)] ring-1 ring-ink-200/70 backdrop-blur-xl"
            : "bg-transparent",
        )}
      >
        <Link href="/" className="shrink-0" aria-label="Overturn home">
          <Logo />
        </Link>

        <ul className="hidden items-center gap-1 rounded-full bg-white/70 p-1 ring-1 ring-ink-200/60 backdrop-blur-md lg:flex">
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="inline-flex rounded-full px-4 py-1.5 text-[13px] font-medium text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-900"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <ButtonLink
            href="/cases"
            variant="outline"
            size="sm"
            className="hidden sm:inline-flex"
          >
            Sign in
          </ButtonLink>
          <ButtonLink href="/cases/new" variant="ink" size="sm">
            Start a case
          </ButtonLink>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-700 ring-1 ring-ink-200 transition-colors hover:bg-ink-100 lg:hidden"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </nav>

      {open ? (
        <div className="mx-auto mt-2 max-w-6xl rounded-card bg-white p-2 shadow-[0_18px_50px_-20px_rgba(22,25,20,0.28)] ring-1 ring-ink-200 lg:hidden">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block rounded-2xl px-4 py-3 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-100"
            >
              {l.label}
            </Link>
          ))}
        </div>
      ) : null}
    </header>
  );
}
