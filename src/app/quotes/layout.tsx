import { DeskHeader } from "@/components/site/desk-header";

export default function QuotesLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-dvh">
      <DeskHeader
        desk="Quoting desk"
        listHref="/quotes"
        listLabel="My quotes"
        newHref="/quotes/new"
        newLabel="New quote"
      />
      <main className="px-5 py-12 sm:py-16">{children}</main>
    </div>
  );
}
