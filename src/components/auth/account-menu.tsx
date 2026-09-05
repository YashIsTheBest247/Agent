"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut } from "lucide-react";

/** Initials from a name, for the avatar disc. */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function AccountMenu({
  name,
  tone = "solid",
}: {
  name: string;
  /** `onDark` for the landing nav while it sits over the hero photograph. */
  tone?: "solid" | "onDark";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const signOut = async () => {
    setPending(true);
    try {
      await fetch("/api/auth/signout", { method: "POST" });
      router.push("/");
      router.refresh();
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account: ${name}`}
        className={
          tone === "onDark"
            ? "press flex h-9 w-9 items-center justify-center rounded-full border border-white/35 bg-white/15 font-mono text-[11px] tracking-[0.06em] text-white uppercase backdrop-blur-sm hover:bg-white/25"
            : "press flex h-9 w-9 items-center justify-center rounded-full bg-[var(--ink)] font-mono text-[11px] tracking-[0.06em] text-[var(--lime)] uppercase"
        }
      >
        {initials(name)}
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--white)] shadow-[0_20px_45px_-24px_rgba(14,16,15,0.35)]"
        >
          <div className="border-b border-[var(--line)] px-4 py-3">
            <p className="text-[13px] font-semibold text-[var(--ink)]">{name}</p>
            <p className="mt-0.5 font-mono text-[9.5px] tracking-[0.12em] text-[var(--text-3)] uppercase">
              Signed in
            </p>
          </div>

          <ul className="py-1">
            {[
              { label: "Appeals", href: "/cases" },
              { label: "Quoting", href: "/quotes" },
              { label: "Orders", href: "/orders" },
            ].map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="block px-4 py-2 text-[13px] text-[var(--text-2)] transition-colors hover:bg-[var(--paper)] hover:text-[var(--ink)]"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <button
            type="button"
            role="menuitem"
            onClick={signOut}
            disabled={pending}
            className="flex w-full items-center gap-2 border-t border-[var(--line)] px-4 py-3 text-left text-[13px] text-[var(--text-2)] transition-colors hover:bg-[var(--paper)] hover:text-[var(--ink)] disabled:opacity-50"
          >
            <LogOut className="h-3.5 w-3.5" />
            {pending ? "Signing out…" : "Sign out"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
