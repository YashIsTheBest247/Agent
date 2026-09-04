import { NextResponse } from "next/server";
import { runQuotePipeline, type QuoteUpload } from "@/lib/desks/quotes/orchestrator";
import { emptyQuote, type QuoteFileRef } from "@/lib/desks/quotes/record";
import { defaultPriceBookId, priceBooks } from "@/lib/desks/quotes/price-books";
import { isGeminiConfigured } from "@/lib/gemini/client";
import { newQuoteId, quoteStore } from "@/lib/store";

export const runtime = "nodejs";
/** Eight stages plus revision rounds. */
export const maxDuration = 300;

const MAX_FILES = 10;
const MAX_FILE_BYTES = 25 * 1024 * 1024;

/** A site walk arrives as talking and photographs, so audio is first-class. */
const ACCEPTED = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/m4a",
  "audio/x-m4a",
  "audio/aac",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/heic",
  "application/pdf",
  "text/plain",
];

export async function GET() {
  const quotes = await quoteStore.list();
  return NextResponse.json({
    quotes: quotes.map((q) => ({
      id: q.id,
      createdAt: q.createdAt,
      status: q.status,
      customerName: q.customerName,
      totalCents: q.math?.totalCents ?? null,
      fileCount: q.files.length,
    })),
  });
}

/** Creates a quote and streams the run back as it happens. */
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
  const typedNotes = String(form.get("notes") ?? "").slice(0, 8000);
  const customerName = String(form.get("customer") ?? "").slice(0, 200).trim();
  const priceBookId = String(form.get("priceBook") ?? defaultPriceBookId);

  if (incoming.length === 0 && !typedNotes) {
    return NextResponse.json(
      { error: "Record a walkthrough, add photographs, or type what you saw." },
      { status: 400 },
    );
  }
  if (incoming.length > MAX_FILES) {
    return NextResponse.json(
      { error: `At most ${MAX_FILES} files per quote.` },
      { status: 400 },
    );
  }
  if (!priceBooks[priceBookId]) {
    return NextResponse.json(
      { error: "That price book does not exist." },
      { status: 400 },
    );
  }

  const uploads: QuoteUpload[] = [];
  const refs: QuoteFileRef[] = [];

  for (const file of incoming) {
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: `${file.name} is larger than 25MB.` },
        { status: 413 },
      );
    }
    const mimeType = file.type || "application/octet-stream";
    if (!ACCEPTED.includes(mimeType)) {
      return NextResponse.json(
        {
          error: `${file.name} is a ${mimeType}. Upload a voice recording, photographs, or a PDF.`,
        },
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

  const record = emptyQuote(
    newQuoteId(),
    priceBookId,
    customerName || "Unnamed job",
    refs,
  );
  await quoteStore.put(record);

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      // Newline-delimited JSON: each line is a complete snapshot, so a client
      // that joins late or drops a frame still converges on the truth.
      const send = (payload: unknown) => {
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(payload)}\n`));
        } catch {
          /* client went away */
        }
      };

      send({ type: "created", id: record.id });

      try {
        const finished = await runQuotePipeline(record, uploads, {
          typedNotes,
          onUpdate: (snapshot) => {
            void quoteStore.put(snapshot);
            send({ type: "update", record: snapshot });
          },
        });
        await quoteStore.put(finished);
        send({ type: "done", record: finished });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "The run failed unexpectedly.";
        const failed = { ...record, status: "failed" as const, error: message };
        await quoteStore.put(failed);
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
      "x-quote-id": record.id,
    },
  });
}
