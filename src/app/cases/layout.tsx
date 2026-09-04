import { DeskHeader } from "@/components/site/desk-header";

export default function CasesLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-dvh">
      <DeskHeader
        desk="Appeals desk"
        listHref="/cases"
        listLabel="My cases"
        newHref="/cases/new"
        newLabel="New case"
      />
      <main className="px-5 py-12 sm:py-16">{children}</main>
    </div>
  );
}
