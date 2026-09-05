import { NextResponse } from "next/server";
import { quoteStore } from "@/lib/store";
import { ownedBy, requireApiUser } from "@/lib/auth/guard";

export const runtime = "nodejs";

/**
 * Records that the contractor has read and accepted the quote. It does not
 * send anything to their customer — that stays a deliberate act they perform
 * with the document in front of them.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireApiUser();
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const record = ownedBy(await quoteStore.get(id), guard.user);

  if (!record) {
    return NextResponse.json({ error: "No such quote." }, { status: 404 });
  }
  if (record.status !== "needs_review") {
    return NextResponse.json(
      { error: `A quote with status "${record.status}" cannot be approved.` },
      { status: 409 },
    );
  }

  const approved = {
    ...record,
    status: "approved" as const,
    approvedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await quoteStore.put(approved);

  return NextResponse.json({ record: approved });
}
