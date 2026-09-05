import { notFound } from "next/navigation";
import { CaseDetail } from "@/components/case/case-detail";
import { ownedBy, requireUser } from "@/lib/auth/guard";
import { caseStore } from "@/lib/store";

export const dynamic = "force-dynamic";
export const metadata = { title: "Case" };

export default async function CasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser(`/cases/${id}`);
  // notFound for someone else's record too, so an id cannot be probed.
  const record = ownedBy(await caseStore.get(id), user);
  if (!record) notFound();

  return <CaseDetail record={record} />;
}
