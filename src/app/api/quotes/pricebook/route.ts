import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/guard";
import { importPriceBook } from "@/lib/desks/quotes/import";
import {
  clearUserPriceBook,
  getUserPriceBook,
  saveUserPriceBook,
} from "@/lib/desks/user-data";

export const runtime = "nodejs";

const MAX_CSV_BYTES = 2 * 1024 * 1024;

export async function GET() {
  const guard = await requireApiUser();
  if (!guard.ok) return guard.response;

  const book = await getUserPriceBook(guard.user.id);
  return NextResponse.json({
    book: book
      ? { name: book.name, items: book.items.length, labour: book.labour.length }
      : null,
  });
}

export async function POST(request: Request) {
  const guard = await requireApiUser();
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => null);
  const csv = String(body?.csv ?? "");
  const name = String(body?.name ?? "My price book").slice(0, 120);
  const currency = String(body?.currency ?? "GBP").slice(0, 3).toUpperCase();

  if (!csv.trim()) {
    return NextResponse.json({ error: "Paste or upload a CSV." }, { status: 400 });
  }
  if (csv.length > MAX_CSV_BYTES) {
    return NextResponse.json({ error: "That file is over 2MB." }, { status: 413 });
  }

  const result = importPriceBook(csv, {
    id: `pb_${guard.user.id}`,
    name,
    currency,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.errors.join("\n") }, { status: 422 });
  }

  await saveUserPriceBook(guard.user.id, result.value);

  return NextResponse.json({
    ok: true,
    warnings: result.warnings,
    items: result.value.items.length,
    labour: result.value.labour.length,
  });
}

export async function DELETE() {
  const guard = await requireApiUser();
  if (!guard.ok) return guard.response;

  await clearUserPriceBook(guard.user.id);
  return NextResponse.json({ ok: true });
}
