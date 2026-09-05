import Link from "next/link";
import { ArrowUpRight, FolderOpen } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Pill } from "@/components/ui/pill";
import { playbookFor } from "@/lib/domain/taxonomy";
import { caseStore, isPersistent } from "@/lib/store";
import { requireUser } from "@/lib/auth/guard";
import { cn, daysUntil } from "@/lib/utils";

export const metadata = { title: "My cases" };
export const dynamic = "force-dynamic";

export default async function CasesPage() {
  const user = await requireUser("/cases");
  const all = await caseStore.list();
  const cases = all.filter((r) => r.userId === user.id);
  const persisted = isPersistent();

  return (
    <div className="mx-auto max-w-[1240px]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow">Workspace</div>
          <h1 className="mt-3 text-[clamp(1.9rem,4vw,2.6rem)]">
            <span className="display">My </span>
            <span className="script text-[var(--ok-deep)]">cases</span>
          </h1>
          <p className="mt-3 text-[13.5px] text-[var(--text-2)]">
            Every denial you have uploaded, and where each appeal stands.
          </p>
        </div>
        {cases.length > 0 ? (
          <ButtonLink href="/cases/new" variant="ink" size="md">
            New case
          </ButtonLink>
        ) : null}
      </div>

      {cases.length === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-[var(--r-lg)] bg-white px-6 py-20 text-center ring-1 ring-[var(--line)]">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--lime-wash)] text-[var(--ok-deep)]">
            <FolderOpen className="h-6 w-6" />
          </span>
          <h2 className="mt-5 display text-lg font-bold tracking-[-0.02em] text-[var(--ink)]">
            No cases yet
          </h2>
          <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-[var(--text-2)]">
            Start with the denial letter. If you also have your plan documents or
            the EOB, the agents will use them — but the letter alone is enough to
            begin.
          </p>
          <ButtonLink href="/cases/new" variant="ink" size="md" className="mt-6">
            Start a case
          </ButtonLink>
        </div>
      ) : (
        <ul className="mt-8 flex flex-col gap-3">
          {cases.map((record) => {
            const remaining = record.deadline ? daysUntil(record.deadline) : null;
            const playbook = record.classification
              ? playbookFor(record.classification.category)
              : null;

            return (
              <li key={record.id}>
                <Link
                  href={`/cases/${record.id}`}
                  className="group flex flex-col gap-4 rounded-[var(--r-lg)] bg-white p-5 ring-1 ring-[var(--line)] transition-shadow hover:shadow-[0_20px_45px_-28px_rgba(14,16,15,0.28)] sm:flex-row sm:items-center sm:justify-between sm:p-6"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={record.status} />
                      {playbook ? <Pill tone="neutral">{playbook.label}</Pill> : null}
                    </div>
                    <h2 className="mt-3 truncate display text-lg font-bold tracking-[-0.02em] text-[var(--ink)]">
                      {record.facts?.payerName.value ?? "Unread denial"}
                      {record.facts?.claimNumber.value ? (
                        <span className="text-[var(--text-3)]">
                          {" "}
                          · {record.facts.claimNumber.value}
                        </span>
                      ) : null}
                    </h2>
                    <p className="mt-1 text-[12.5px] text-[var(--text-3)]">
                      {record.documents.length} document
                      {record.documents.length === 1 ? "" : "s"} ·{" "}
                      {new Date(record.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-5">
                    {record.deadline ? (
                      <div className="text-right">
                        <p className="text-[11px] tracking-wide text-[var(--text-3)] uppercase">
                          Deadline
                        </p>
                        <p
                          className={cn(
                            "display text-[15px] font-bold tracking-[-0.02em]",
                            remaining !== null && remaining < 14
                              ? "text-[var(--risk-red)]"
                              : "text-[var(--ink)]",
                          )}
                        >
                          {remaining !== null && remaining >= 0
                            ? `${remaining} days`
                            : record.deadline}
                        </p>
                      </div>
                    ) : null}
                    <ArrowUpRight className="h-4 w-4 text-[var(--text-3)] transition-colors group-hover:text-[var(--ink)]" />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-8 text-[12px] leading-relaxed text-[var(--text-3)]">
        {persisted
          ? "Cases are written to disk, so they survive a restart. Deleting one removes the documents and everything derived from them."
          : "Cases are held in this server process only, so they clear when it restarts or moves instance."}
        Durable storage is the next thing to wire in.
      </p>
    </div>
  );
}
