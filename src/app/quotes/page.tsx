import Link from "next/link";
import { ArrowUpRight, Ruler } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { priceBookById } from "@/lib/desks/quotes/price-books";
import { quoteStore, isPersistent } from "@/lib/store";
import { requireUser } from "@/lib/auth/guard";
import { formatMoney } from "@/lib/utils";

export const metadata = { title: "My quotes" };
export const dynamic = "force-dynamic";

export default async function QuotesPage() {
  const user = await requireUser("/quotes");
  const all = await quoteStore.list();
  const quotes = all.filter((r) => r.userId === user.id);
  const persisted = isPersistent();

  return (
    <div className="mx-auto max-w-[1240px]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow">Quoting desk</div>
          <h1 className="mt-3 text-[clamp(1.9rem,4vw,2.6rem)]">
            <span className="display">My </span>
            <span className="script text-[var(--ok-deep)]">quotes</span>
          </h1>
          <p className="mt-3 text-[13.5px] text-[var(--text-2)]">
            Every site visit you have handed over, and where each quote stands.
          </p>
        </div>
        {quotes.length > 0 ? (
          <ButtonLink href="/quotes/new" variant="lime" size="md">
            New quote
          </ButtonLink>
        ) : null}
      </div>

      {quotes.length === 0 ? (
        <div className="card mt-8 flex flex-col items-center px-6 py-20 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--lime-wash)] text-[var(--ok-deep)]">
            <Ruler className="h-6 w-6" />
          </span>
          <h2 className="display mt-5 text-lg tracking-[-0.02em]">
            No quotes yet
          </h2>
          <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-[var(--text-2)]">
            Record yourself walking a site and photograph what matters. The desk
            turns it into a priced quote you can check line by line.
          </p>
          <ButtonLink href="/quotes/new" variant="lime" size="md" className="mt-6">
            Start a quote
          </ButtonLink>
        </div>
      ) : (
        <ul className="mt-8 flex flex-col gap-3">
          {quotes.map((quote) => {
            const book = priceBookById(quote.priceBookId);
            return (
              <li key={quote.id}>
                <Link
                  href={`/quotes/${quote.id}`}
                  className="card group flex flex-col gap-4 p-5 transition-shadow hover:shadow-[0_20px_45px_-28px_rgba(14,16,15,0.28)] sm:flex-row sm:items-center sm:justify-between sm:p-6"
                >
                  <div className="min-w-0">
                    <StatusBadge status={quote.status} />
                    <h2 className="display mt-3 truncate text-lg tracking-[-0.02em]">
                      {quote.customerName}
                    </h2>
                    <p className="mt-1 text-[12.5px] text-[var(--text-3)]">
                      {quote.files.length} file
                      {quote.files.length === 1 ? "" : "s"} ·{" "}
                      {new Date(quote.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-5">
                    {quote.math?.passed ? (
                      <div className="text-right">
                        <p className="font-mono text-[9.5px] tracking-[0.12em] text-[var(--text-3)] uppercase">
                          Total
                        </p>
                        <p className="display text-[17px] tracking-[-0.02em]">
                          {formatMoney(quote.math.totalCents, {
                            currency: book.currency,
                          })}
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

      <p className="mt-8 font-mono text-[10px] leading-relaxed tracking-[0.1em] text-[var(--text-3)] uppercase">
        {persisted
          ? "Quotes are written to disk, so they survive a restart. Deleting one removes the documents and everything derived from them."
          : "Quotes are held in this server process only, so they clear when it restarts or moves instance."}
      </p>
    </div>
  );
}
