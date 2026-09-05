import { NextResponse } from "next/server";
import { orderStore } from "@/lib/store";

export const runtime = "nodejs";

/**
 * Records that a person has read the draft reply and accepted the confirmed
 * lines. It sends no email and commits no stock — both stay deliberate acts
 * performed in the systems that own them.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const record = await orderStore.get(id);

  if (!record) {
    return NextResponse.json({ error: "No such order." }, { status: 404 });
  }
  if (record.status !== "needs_review") {
    return NextResponse.json(
      { error: `An order with status "${record.status}" cannot be approved.` },
      { status: 409 },
    );
  }

  const approved = {
    ...record,
    status: "approved" as const,
    approvedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await orderStore.put(approved);

  return NextResponse.json({ record: approved });
}
