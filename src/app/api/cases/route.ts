import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/guard";
import { runAppealPipeline, type UploadedFile } from "@/lib/agents/orchestrator";
import { emptyCase } from "@/lib/domain/case";
import { isGeminiConfigured } from "@/lib/gemini/client";
import { caseStore, newCaseId } from "@/lib/store";

export const runtime = "nodejs";
/** The full pipeline is nine model calls plus revision rounds. */
export const maxDuration = 300;

const MAX_FILES = 6;
const MAX_FILE_BYTES = 12 * 1024 * 1024;
const ACCEPTED = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/heic",
  "text/plain",
];

export async function GET() {
  const guard = await requireApiUser();
  if (!guard.ok) return guard.response;

  const all = await caseStore.list();
  const cases = all.filter((r) => r.userId === guard.user.id);
  return NextResponse.json({
    cases: cases.map((c) => ({
      id: c.id,
      createdAt: c.createdAt,
      status: c.status,
      payer: c.facts?.payerName.value ?? null,
      category: c.classification?.category ?? null,
      deadline: c.deadline,
      documentCount: c.documents.length,
    })),
  });
}

/**
 * Creates a case and streams the run back as it happens.
 *
 * One request does the work and reports on it, rather than a job queue plus
 * polling. It keeps the connection open for the length of the run, which is
 * also exactly what the user is watching on screen.
 */
export async function POST(request: Request) {
  const guard = await requireApiUser();
  if (!guard.ok) return guard.response;

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

  const uploads = form.getAll("files").filter((f): f is File => f instanceof File);

  if (uploads.length === 0) {
    return NextResponse.json(
      { error: "Attach at least the denial letter." },
      { status: 400 },
    );
  }
  if (uploads.length > MAX_FILES) {
    return NextResponse.json(
      { error: `At most ${MAX_FILES} files per case.` },
      { status: 400 },
    );
  }

  const files: UploadedFile[] = [];
  for (const upload of uploads) {
    if (upload.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: `${upload.name} is larger than 12MB.` },
        { status: 413 },
      );
    }
    const mimeType = upload.type || "application/octet-stream";
    if (!ACCEPTED.includes(mimeType)) {
      return NextResponse.json(
        {
          error: `${upload.name} is a ${mimeType}. Upload a PDF, a photo, or a text file.`,
        },
        { status: 415 },
      );
    }
    files.push({
      filename: upload.name,
      mimeType,
      data: Buffer.from(await upload.arrayBuffer()).toString("base64"),
    });
  }

  const record = emptyCase(newCaseId(), guard.user.id, []);
  await caseStore.put(record);

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      // Newline-delimited JSON: each line is a complete case snapshot, so a
      // client that joins late or drops a frame still converges on the truth.
      const send = (payload: unknown) => {
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(payload)}\n`));
        } catch {
          /* client went away */
        }
      };

      send({ type: "created", id: record.id });

      try {
        const finished = await runAppealPipeline(record, files, {
          onUpdate: (snapshot) => {
            void caseStore.put(snapshot);
            send({ type: "update", record: snapshot });
          },
        });
        await caseStore.put(finished);
        send({ type: "done", record: finished });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "The run failed unexpectedly.";
        const failed = { ...record, status: "failed" as const, error: message };
        await caseStore.put(failed);
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
      "x-case-id": record.id,
    },
  });
}
