import { NextResponse } from "next/server";
import { quoteStore } from "@/lib/store";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const record = await quoteStore.get(id);

  if (!record) {
    return NextResponse.json({ error: "No such quote." }, { status: 404 });
  }
  return NextResponse.json({ record });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await quoteStore.remove(id);
  return NextResponse.json({ ok: true });
}
