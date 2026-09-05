import { DeskHeader } from "@/components/site/desk-header";
import { requireUser } from "@/lib/auth/guard";

export default async function CasesLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Guarding the layout covers every page beneath it, so a new route under
  // /cases cannot be added unprotected by accident.
  const user = await requireUser("/cases");

  return (
    <div className="min-h-dvh">
      <DeskHeader
        desk="Appeals desk"
        listHref="/cases"
        listLabel="My cases"
        newHref="/cases/new"
        newLabel="New case"
        userName={user.name}
      />
      <main className="px-5 py-12 sm:py-16">{children}</main>
    </div>
  );
}
