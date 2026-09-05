import { notFound } from "next/navigation";
import { QuoteDetail } from "@/components/quote/quote-detail";
import { ownedBy, requireUser } from "@/lib/auth/guard";
import { quoteStore } from "@/lib/store";

export const dynamic = "force-dynamic";
export const metadata = { title: "Quote" };

export default async function QuotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser(`/quotes/${id}`);
  // notFound for someone else's record too, so an id cannot be probed.
  const record = ownedBy(await quoteStore.get(id), user);
  if (!record) notFound();

  return <QuoteDetail record={record} />;
}
