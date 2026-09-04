import { FolderOpen } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

export const metadata = { title: "My cases" };

export default function CasesPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="font-sans text-3xl font-extrabold tracking-[-0.03em] text-ink-900">
        My cases
      </h1>
      <p className="mt-2 text-[14px] text-ink-500">
        Every denial you&apos;ve uploaded, and where each appeal stands.
      </p>

      <div className="mt-8 flex flex-col items-center rounded-card-lg bg-white px-6 py-20 text-center ring-1 ring-ink-200/70">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-leaf-100 text-leaf-700">
          <FolderOpen className="h-6 w-6" />
        </span>
        <h2 className="mt-5 font-sans text-lg font-bold tracking-[-0.02em] text-ink-900">
          No cases yet
        </h2>
        <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-ink-500">
          Start with the denial letter. If you also have your plan documents or
          the EOB, the agents will use them — but the letter alone is enough to
          begin.
        </p>
        <ButtonLink href="/cases/new" variant="ink" size="md" className="mt-6">
          Start a case
        </ButtonLink>
      </div>
    </div>
  );
}
