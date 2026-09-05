import { NextResponse } from "next/server";
import { caseStore } from "@/lib/store";
import { ownedBy, requireApiUser } from "@/lib/auth/guard";

export const runtime = "nodejs";

/**
 * Records the user's approval. It marks the draft as one the user has read and
 * signed off — it does not transmit anything to a payer, and nothing in this
 * codebase does.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireApiUser();
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const record = ownedBy(await caseStore.get(id), guard.user);

  if (!record) {
    return NextResponse.json({ error: "No such case." }, { status: 404 });
  }
  if (record.status !== "needs_review") {
    return NextResponse.json(
      { error: `A case with status "${record.status}" cannot be approved.` },
      { status: 409 },
    );
  }

  const approved = {
    ...record,
    status: "approved" as const,
    approvedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await caseStore.put(approved);

  return NextResponse.json({ record: approved });
}
