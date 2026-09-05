import Link from "next/link";
import { Logo } from "@/components/site/logo";
import { ButtonLink } from "@/components/ui/button";

export default function DemoLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--paper)]/92 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="press" aria-label="Second Chair home">
              <Logo />
            </Link>
            <span className="hidden h-5 w-px bg-[var(--line)] sm:block" aria-hidden="true" />
            <span className="hidden font-mono text-[10px] tracking-[0.16em] text-[var(--text-3)] uppercase sm:block">
              Recorded run
            </span>
          </div>
          <nav className="flex items-center gap-2">
            <ButtonLink href="/demo" variant="ghost" size="sm">
              All three
            </ButtonLink>
            <ButtonLink href="/signup" variant="lime" size="sm">
              Run your own
            </ButtonLink>
          </nav>
        </div>
      </header>
      <main className="px-5 py-12 sm:py-16">{children}</main>
    </div>
  );
}
