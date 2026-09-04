import Link from "next/link";
import { ArrowUpRight, FolderOpen } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { StatusBadge } from "@/components/case/status-badge";
import { Pill } from "@/components/ui/pill";
import { playbookFor } from "@/lib/domain/taxonomy";
import { caseStore } from "@/lib/store";
import { cn, daysUntil } from "@/lib/utils";

export const metadata = { title: "My cases" };
export const dynamic = "force-dynamic";

export default async function CasesPage() {
  const cases = await caseStore.list();

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-sans text-3xl font-extrabold tracking-[-0.03em] text-ink-900">
            My cases
          </h1>
          <p className="mt-2 text-[14px] text-ink-500">
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
                  className="group flex flex-col gap-4 rounded-card-lg bg-white p-5 ring-1 ring-ink-200/70 transition-shadow hover:shadow-[0_20px_45px_-28px_rgba(30,58,14,0.4)] sm:flex-row sm:items-center sm:justify-between sm:p-6"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={record.status} />
                      {playbook ? <Pill tone="neutral">{playbook.label}</Pill> : null}
                    </div>
                    <h2 className="mt-3 truncate font-sans text-lg font-bold tracking-[-0.02em] text-ink-900">
                      {record.facts?.payerName.value ?? "Unread denial"}
                      {record.facts?.claimNumber.value ? (
                        <span className="text-ink-400">
                          {" "}
                          · {record.facts.claimNumber.value}
                        </span>
                      ) : null}
                    </h2>
                    <p className="mt-1 text-[12.5px] text-ink-400">
                      {record.documents.length} document
                      {record.documents.length === 1 ? "" : "s"} ·{" "}
                      {new Date(record.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-5">
                    {record.deadline ? (
                      <div className="text-right">
                        <p className="text-[11px] tracking-wide text-ink-400 uppercase">
                          Deadline
                        </p>
                        <p
                          className={cn(
                            "font-sans text-[15px] font-bold tracking-[-0.02em]",
                            remaining !== null && remaining < 14
                              ? "text-flag-500"
                              : "text-ink-900",
                          )}
                        >
                          {remaining !== null && remaining >= 0
                            ? `${remaining} days`
                            : record.deadline}
                        </p>
                      </div>
                    ) : null}
                    <ArrowUpRight className="h-4 w-4 text-ink-300 transition-colors group-hover:text-ink-900" />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-8 text-[12px] leading-relaxed text-ink-400">
        Cases are held in this server process, so they clear when it restarts.
        Durable storage is the next thing to wire in.
      </p>
    </div>
  );
}
