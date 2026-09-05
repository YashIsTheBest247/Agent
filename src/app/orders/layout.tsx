import { DeskHeader } from "@/components/site/desk-header";
import { requireUser } from "@/lib/auth/guard";

export default async function OrdersLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Guarding the layout covers every page beneath it, so a new route under
  // /orders cannot be added unprotected by accident.
  const user = await requireUser("/orders");

  return (
    <div className="min-h-dvh">
      <DeskHeader
        desk="Orders desk"
        listHref="/orders"
        listLabel="My orders"
        newHref="/orders/new"
        newLabel="New order"
        userName={user.name}
      />
      <main className="px-5 py-12 sm:py-16">{children}</main>
    </div>
  );
}
