import { DeskHeader } from "@/components/site/desk-header";

export default function OrdersLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-dvh">
      <DeskHeader
        desk="Orders desk"
        listHref="/orders"
        listLabel="My orders"
        newHref="/orders/new"
        newLabel="New order"
      />
      <main className="px-5 py-12 sm:py-16">{children}</main>
    </div>
  );
}
