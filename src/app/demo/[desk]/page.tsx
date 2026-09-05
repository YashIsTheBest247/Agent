import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, Clapperboard } from "lucide-react";
import { CaseDetail } from "@/components/case/case-detail";
import { QuoteDetail } from "@/components/quote/quote-detail";
import { OrderDetail } from "@/components/order/order-detail";
import { ButtonLink } from "@/components/ui/button";
import {
  demoAppeal,
  demoBlocked,
  demoMeta,
  demoOrder,
  demoQuote,
  isDemoDesk,
} from "@/lib/demo";

export function generateStaticParams() {
  return [
    { desk: "appeal" },
    { desk: "quote" },
    { desk: "order" },
    { desk: "blocked" },
  ];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ desk: string }>;
}) {
  const { desk } = await params;
  return { title: isDemoDesk(desk) ? demoMeta[desk].desk + " — recorded run" : "Demo" };
}

export default async function DemoPage({
  params,
}: {
  params: Promise<{ desk: string }>;
}) {
  const { desk } = await params;
  if (!isDemoDesk(desk)) notFound();

  const meta = demoMeta[desk];

  return (
    <div className="mx-auto flex max-w-[1240px] flex-col gap-5">
      {/* Said plainly, so nobody mistakes a recording for a live run. */}
      <div data-print="hide" className="flex flex-col gap-4 rounded-[var(--r-lg)] border border-[var(--lime-deep)] bg-[#f7f9ee] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex gap-3">
          <Clapperboard className="mt-0.5 h-5 w-5 shrink-0 text-[var(--ok-deep)]" />
          <div>
            <p className="display text-[15px] tracking-[-0.015em]">
              A recorded run — {meta.desk.toLowerCase()} desk
            </p>
            <p className="mt-1 max-w-xl text-[12.5px] leading-relaxed text-[var(--text-2)]">
              {meta.shows} Saved verbatim from a real run and shown here by the
              same components a live one uses. Nothing on this page can be
              approved or deleted.
            </p>
          </div>
        </div>
        <ButtonLink href={meta.liveHref} variant="lime" size="md" className="shrink-0">
          Run your own
          <ArrowUpRight className="h-4 w-4" />
        </ButtonLink>
      </div>

      {desk === "appeal" ? <CaseDetail record={demoAppeal} readOnly /> : null}
      {desk === "quote" ? <QuoteDetail record={demoQuote} readOnly /> : null}
      {desk === "order" ? <OrderDetail record={demoOrder} readOnly /> : null}
      {desk === "blocked" ? <OrderDetail record={demoBlocked} readOnly /> : null}

      <p className="pb-4 text-center text-[12px] text-[var(--text-3)]">
        <Link href="/demo" className="underline hover:text-[var(--text)]">
          See the other two desks
        </Link>
      </p>
    </div>
  );
}
