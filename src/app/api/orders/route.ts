import { NextResponse } from "next/server";
import { runOrderPipeline, type OrderUpload } from "@/lib/desks/orders/orchestrator";
import { emptyOrder, type OrderFileRef } from "@/lib/desks/orders/record";
import { catalogs, defaultCatalogId } from "@/lib/desks/orders/catalogs";
import { isGeminiConfigured } from "@/lib/gemini/client";
import { newOrderId, orderStore } from "@/lib/store";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_FILES = 8;
const MAX_FILE_BYTES = 20 * 1024 * 1024;

/** Orders arrive as prose, PDFs, spreadsheets and photographs of paper. */
const ACCEPTED = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/heic",
  "text/plain",
  "text/csv",
];

export async function GET() {
  const orders = await orderStore.list();
  return NextResponse.json({
    orders: orders.map((o) => ({
      id: o.id,
      createdAt: o.createdAt,
      status: o.status,
      buyer: o.resolved?.customer?.name ?? o.parsed?.buyerName ?? null,
      poNumber: o.parsed?.poNumber ?? null,
      confirmable: o.resolved?.confirmable.length ?? 0,
      lines: o.resolved?.lines.length ?? 0,
      subtotalCents: o.resolved?.confirmedSubtotalCents ?? null,
    })),
  });
}

export async function POST(request: Request) {
  if (!isGeminiConfigured()) {
    return NextResponse.json(
      {
        error:
          "GEMINI_API_KEY is not set on the server. Add it to .env.local and restart.",
      },
      { status: 503 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected a multipart form upload." },
      { status: 400 },
    );
  }

  const incoming = form.getAll("files").filter((f): f is File => f instanceof File);
  const emailText = String(form.get("email") ?? "").slice(0, 40_000);
  const catalogId = String(form.get("catalog") ?? defaultCatalogId);

  if (incoming.length === 0 && !emailText.trim()) {
    return NextResponse.json(
      { error: "Paste the order email, or attach the purchase order." },
      { status: 400 },
    );
  }
  if (incoming.length > MAX_FILES) {
    return NextResponse.json(
      { error: `At most ${MAX_FILES} files per order.` },
      { status: 400 },
    );
  }
  if (!catalogs[catalogId]) {
    return NextResponse.json(
      { error: "That catalogue does not exist." },
      { status: 400 },
    );
  }

  const uploads: OrderUpload[] = [];
  const refs: OrderFileRef[] = [];

  for (const file of incoming) {
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: `${file.name} is larger than 20MB.` },
        { status: 413 },
      );
    }
    const mimeType = file.type || "application/octet-stream";
    if (!ACCEPTED.includes(mimeType)) {
      return NextResponse.json(
        { error: `${file.name} is a ${mimeType}. Attach a PDF, an image, or a text file.` },
        { status: 415 },
      );
    }
    uploads.push({
      filename: file.name,
      mimeType,
      data: Buffer.from(await file.arrayBuffer()).toString("base64"),
    });
    refs.push({ filename: file.name, mimeType, bytes: file.size });
  }

  const record = emptyOrder(newOrderId(), catalogId, emailText, refs);
  await orderStore.put(record);

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (payload: unknown) => {
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(payload)}\n`));
        } catch {
          /* client went away */
        }
      };

      send({ type: "created", id: record.id });

      try {
        const finished = await runOrderPipeline(record, uploads, {
          onUpdate: (snapshot) => {
            void orderStore.put(snapshot);
            send({ type: "update", record: snapshot });
          },
        });
        await orderStore.put(finished);
        send({ type: "done", record: finished });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "The run failed unexpectedly.";
        const failed = { ...record, status: "failed" as const, error: message };
        await orderStore.put(failed);
        send({ type: "error", error: message, record: failed });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-store, no-transform",
      "x-order-id": record.id,
    },
  });
}
