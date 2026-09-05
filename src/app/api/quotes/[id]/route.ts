import { NextResponse } from "next/server";
import { quoteStore } from "@/lib/store";
import { ownedBy, requireApiUser } from "@/lib/auth/guard";

export const runtime = "nodejs";

export async function GET(
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
  return NextResponse.json({ record });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireApiUser();
  if (!guard.ok) return guard.response;

  const { id } = await params;
  // Only delete what the caller owns; a stranger's id is a silent no-op.
  if (ownedBy(await quoteStore.get(id), guard.user)) await quoteStore.remove(id);
  return NextResponse.json({ ok: true });
}
