import Link from "next/link";
import { Logo } from "@/components/site/logo";
import { ButtonLink } from "@/components/ui/button";
import { AccountMenu } from "@/components/auth/account-menu";

/** Shared chrome for every desk's workspace, so they read as one product. */
export function DeskHeader({
  desk,
  listHref,
  listLabel,
  newHref,
  newLabel,
  userName,
}: {
  desk: string;
  listHref: string;
  listLabel: string;
  newHref: string;
  newLabel: string;
  userName: string;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--paper)]/92 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
        <div className="flex items-center gap-3">
          <Link href="/" className="press" aria-label="Second Chair home">
            <Logo />
          </Link>
          <span
            className="hidden h-5 w-px bg-[var(--line)] sm:block"
            aria-hidden="true"
          />
          <span className="hidden font-mono text-[10px] tracking-[0.16em] text-[var(--text-3)] uppercase sm:block">
            {desk}
          </span>
        </div>

        <nav className="flex items-center gap-2">
          <ButtonLink href={listHref} variant="ghost" size="sm">
            {listLabel}
          </ButtonLink>
          <ButtonLink href={newHref} variant="lime" size="sm">
            {newLabel}
          </ButtonLink>
          <AccountMenu name={userName} />
        </nav>
      </div>
    </header>
  );
}
