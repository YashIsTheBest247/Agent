import Link from "next/link";
import { ArrowUpRight, Inbox } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Pill } from "@/components/ui/pill";
import { orderStore, storageKind } from "@/lib/store";
import { requireUser } from "@/lib/auth/guard";
import { formatMoney } from "@/lib/utils";

export const metadata = { title: "My orders" };
export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const user = await requireUser("/orders");
  const all = await orderStore.list();
  const orders = all.filter((r) => r.userId === user.id);
  const storage = storageKind();

  return (
    <div className="mx-auto max-w-[1240px]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow">Orders desk</div>
          <h1 className="mt-3 text-[clamp(1.9rem,4vw,2.6rem)]">
            <span className="display">The </span>
            <span className="script text-[var(--ok-deep)]">worklist</span>
          </h1>
          <p className="mt-3 text-[13.5px] text-[var(--text-2)]">
            Every order that came in, what cleared, and what is waiting on a
            person.
          </p>
        </div>
        {orders.length > 0 ? (
          <ButtonLink href="/orders/new" variant="lime" size="md">
            New order
          </ButtonLink>
        ) : null}
      </div>

      {orders.length === 0 ? (
        <div className="card mt-8 flex flex-col items-center px-6 py-20 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--lime-wash)] text-[var(--ok-deep)]">
            <Inbox className="h-6 w-6" />
          </span>
          <h2 className="display mt-5 text-lg tracking-[-0.02em]">
            Nothing in the worklist
          </h2>
          <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-[var(--text-2)]">
            Paste an order in and watch what clears. There are three worked
            examples on the next page if you would rather not write one.
          </p>
          <ButtonLink href="/orders/new" variant="lime" size="md" className="mt-6">
            Process an order
          </ButtonLink>
        </div>
      ) : (
        <ul className="mt-8 flex flex-col gap-3">
          {orders.map((order) => {
            const total = order.resolved?.lines.length ?? 0;
            const ok = order.resolved?.confirmable.length ?? 0;
            return (
              <li key={order.id}>
                <Link
                  href={`/orders/${order.id}`}
                  className="card group flex flex-col gap-4 p-5 transition-shadow hover:shadow-[0_20px_45px_-28px_rgba(14,16,15,0.28)] sm:flex-row sm:items-center sm:justify-between sm:p-6"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={order.status} />
                      {total > 0 ? (
                        <Pill tone={ok === total ? "lime" : "amber"}>
                          {ok} of {total} lines clear
                        </Pill>
                      ) : null}
                    </div>
                    <h2 className="display mt-3 truncate text-lg tracking-[-0.02em]">
                      {order.resolved?.customer?.name ??
                        order.parsed?.buyerName ??
                        "Unread order"}
                    </h2>
                    <p className="mt-1 text-[12.5px] text-[var(--text-3)]">
                      {order.parsed?.poNumber
                        ? `Ref ${order.parsed.poNumber} · `
                        : ""}
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-5">
                    {order.resolved && order.resolved.confirmedSubtotalCents > 0 ? (
                      <div className="text-right">
                        <p className="font-mono text-[9.5px] tracking-[0.12em] text-[var(--text-3)] uppercase">
                          Confirmed
                        </p>
                        <p className="display text-[17px] tracking-[-0.02em]">
                          {formatMoney(order.resolved.confirmedSubtotalCents, {
                            currency: order.currency,
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
        {storage === "supabase"
          ? "Orders are stored durably and survive restarts and redeploys. Deleting one removes the documents and everything derived from them."
          : storage === "disk"
            ? "Orders are written to disk on this machine, so they survive a restart."
            : "Orders are held in this server process only, so they clear when it restarts or moves instance."}
      </p>
    </div>
  );
}
