import { notFound } from "next/navigation";
import { OrderDetail } from "@/components/order/order-detail";
import { ownedBy, requireUser } from "@/lib/auth/guard";
import { orderStore } from "@/lib/store";

export const dynamic = "force-dynamic";
export const metadata = { title: "Order" };

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser(`/orders/${id}`);
  // notFound for someone else's record too, so an id cannot be probed.
  const record = ownedBy(await orderStore.get(id), user);
  if (!record) notFound();

  return <OrderDetail record={record} />;
}
