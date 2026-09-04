import Link from "next/link";
import { Logo } from "@/components/site/logo";
import { ButtonLink } from "@/components/ui/button";

export default function CasesLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-dvh">
      <header className="px-3 pt-3 sm:px-5 sm:pt-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between rounded-full bg-white/85 px-4 py-2.5 ring-1 ring-ink-200/70 backdrop-blur-xl sm:px-5">
          <Link href="/" aria-label="Overturn home">
            <Logo />
          </Link>
          <nav className="flex items-center gap-2">
            <ButtonLink href="/cases" variant="ghost" size="sm">
              My cases
            </ButtonLink>
            <ButtonLink href="/cases/new" variant="ink" size="sm">
              New case
            </ButtonLink>
          </nav>
        </div>
      </header>
      <main className="px-3 py-10 sm:px-5 sm:py-14">{children}</main>
    </div>
  );
}
