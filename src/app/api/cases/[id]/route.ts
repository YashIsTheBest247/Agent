import { NextResponse } from "next/server";
import { caseStore } from "@/lib/store";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const record = await caseStore.get(id);

  if (!record) {
    return NextResponse.json({ error: "No such case." }, { status: 404 });
  }
  return NextResponse.json({ record });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await caseStore.remove(id);
  return NextResponse.json({ ok: true });
}
