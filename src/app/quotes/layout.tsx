import { DeskHeader } from "@/components/site/desk-header";
import { requireUser } from "@/lib/auth/guard";

export default async function QuotesLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Guarding the layout covers every page beneath it, so a new route under
  // /quotes cannot be added unprotected by accident.
  const user = await requireUser("/quotes");

  return (
    <div className="min-h-dvh">
      <DeskHeader
        desk="Quoting desk"
        listHref="/quotes"
        listLabel="My quotes"
        newHref="/quotes/new"
        newLabel="New quote"
        dataHref="/quotes/pricebook"
        dataLabel="Price book"
        userName={user.name}
      />
      <main className="px-5 py-12 sm:py-16">{children}</main>
    </div>
  );
}
