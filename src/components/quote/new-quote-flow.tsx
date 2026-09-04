"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  FileAudio,
  FileText,
  ImageIcon,
  Trash2,
  TriangleAlert,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgentTimeline } from "@/components/case/agent-timeline";
import type { TraceEvent } from "@/lib/agents/trace";
import type { QuoteRecord } from "@/lib/desks/quotes/record";
import { cn } from "@/lib/utils";

const ACCEPT =
  ".m4a,.mp3,.wav,.webm,.ogg,.mp4,.aac,.png,.jpg,.jpeg,.webp,.heic,.pdf,.txt";
const MAX_FILES = 10;

type Phase = "collecting" | "running" | "finished";

function iconFor(type: string) {
  if (type.startsWith("audio/")) return FileAudio;
  if (type.startsWith("image/")) return ImageIcon;
  return FileText;
}

export function NewQuoteFlow({ configured }: { configured: boolean }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [customer, setCustomer] = useState("");
  const [notes, setNotes] = useState("");
  const [phase, setPhase] = useState<Phase>("collecting");
  const [events, setEvents] = useState<TraceEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const addFiles = useCallback((incoming: FileList | null) => {
    if (!incoming) return;
    setError(null);
    setFiles((current) => {
      const merged = [...current];
      for (const file of Array.from(incoming)) {
        const duplicate = merged.some(
          (f) => f.name === file.name && f.size === file.size,
        );
        if (!duplicate && merged.length < MAX_FILES) merged.push(file);
      }
      return merged;
    });
  }, []);

  const start = useCallback(async () => {
    if (files.length === 0 && !notes.trim()) return;

    setPhase("running");
    setError(null);
    setEvents([]);

    const form = new FormData();
    for (const file of files) form.append("files", file);
    form.append("notes", notes);
    form.append("customer", customer);

    let response: Response;
    try {
      response = await fetch("/api/quotes", { method: "POST", body: form });
    } catch {
      setError("Could not reach the server. Is the dev server still running?");
      setPhase("collecting");
      return;
    }

    if (!response.ok || !response.body) {
      const payload = await response.json().catch(() => null);
      setError(payload?.error ?? "The run could not be started.");
      setPhase("collecting");
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let finalRecord: QuoteRecord | null = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const message = JSON.parse(line);
          if (message.record) {
            finalRecord = message.record as QuoteRecord;
            setEvents(finalRecord.trace);
          }
          if (message.type === "error") setError(message.error);
        } catch {
          /* a partial frame; the next chunk completes it */
        }
      }
    }

    setPhase("finished");
    if (finalRecord) router.push(`/quotes/${finalRecord.id}`);
  }, [files, notes, customer, router]);

  if (phase !== "collecting") {
    return (
      <div className="card p-6 sm:p-8">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-trace-pulse rounded-full bg-[var(--lime-deep)]" />
          <h2 className="display text-lg tracking-[-0.02em]">
            {phase === "running" ? "The desk is working" : "Run complete"}
          </h2>
        </div>
        <p className="mt-2 text-[13px] leading-relaxed text-[var(--text-2)]">
          Eight specialists. None of them is allowed to name a price — the
          figures come from your price book at the end.
        </p>

        {error ? (
          <div className="mt-5 flex gap-3 rounded-[var(--r-md)] border border-[var(--risk-red)]/25 bg-[var(--risk-red-wash)] p-4">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[var(--risk-red)]" />
            <p className="text-[13px] leading-relaxed text-[var(--text)]">{error}</p>
          </div>
        ) : null}

        <div className="mt-7">
          <AgentTimeline events={events} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {!configured ? (
        <div className="flex gap-3 rounded-[var(--r-md)] border border-[var(--risk-amber)]/25 bg-[var(--risk-amber-wash)] p-5">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[var(--risk-amber)]" />
          <div>
            <p className="text-[13px] font-semibold text-[var(--ink)]">
              No Gemini key on the server
            </p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--text-2)]">
              Add <code className="rounded bg-white px-1 py-0.5">GEMINI_API_KEY</code>{" "}
              to <code className="rounded bg-white px-1 py-0.5">.env.local</code> and
              restart. Uploads will be rejected until then.
            </p>
          </div>
        </div>
      ) : null}

      <div className="card overflow-hidden">
        <label className="block border-b border-[var(--line)] px-5 py-4">
          <span className="eyebrow">Job or customer</span>
          <input
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            placeholder="14 Elm Road — exterior repaint"
            className="mt-2 w-full bg-transparent text-[14px] text-[var(--text)] placeholder:text-[var(--text-3)] focus:outline-none"
          />
        </label>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            addFiles(e.dataTransfer.files);
          }}
          className={cn(
            "border-b border-[var(--line)] px-5 py-10 text-center transition-colors",
            dragging && "bg-[var(--lime-wash)]",
          )}
        >
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--lime-wash)] text-[var(--ok-deep)]">
            <Upload className="h-5 w-5" />
          </span>
          <h2 className="display mt-4 text-lg tracking-[-0.02em]">
            Drop the walkthrough here
          </h2>
          <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-[var(--text-2)]">
            A voice recording of you walking the site, and photographs of
            anything that affects the price. Talk the way you would to a mate —
            it is transcribed, not marked.
          </p>

          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ACCEPT}
            className="sr-only"
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <Button
            variant="ghost"
            size="md"
            className="mt-5"
            onClick={() => inputRef.current?.click()}
          >
            Choose files
          </Button>
        </div>

        <label className="block px-5 py-4">
          <span className="eyebrow">Anything you did not say out loud</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Front elevation approx 6m x 2.4m, render sound. Rear is the problem — flaking to about a third, and the gutter needs clearing before we go near it."
            className="mt-2 w-full resize-y bg-transparent font-mono text-[12.5px] leading-relaxed text-[var(--text)] placeholder:text-[var(--text-3)] focus:outline-none"
          />
        </label>
      </div>

      {files.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {files.map((file) => {
            const Icon = iconFor(file.type);
            return (
              <li
                key={`${file.name}-${file.size}`}
                className="card flex items-center gap-3 p-4"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--paper)] text-[var(--text-2)] ring-1 ring-[var(--line)]">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-[var(--ink)]">
                    {file.name}
                  </p>
                  <p className="text-[11.5px] text-[var(--text-3)]">
                    {(file.size / 1024).toFixed(0)} KB
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={`Remove ${file.name}`}
                  onClick={() => setFiles((c) => c.filter((f) => f !== file))}
                  className="press flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-3)] transition-colors hover:bg-[var(--paper-2)] hover:text-[var(--risk-red)]"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {error ? (
        <div className="flex gap-3 rounded-[var(--r-md)] border border-[var(--risk-red)]/25 bg-[var(--risk-red-wash)] p-4">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[var(--risk-red)]" />
          <p className="text-[13px] leading-relaxed text-[var(--text)]">{error}</p>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <span className="font-mono text-[10px] tracking-[0.14em] text-[var(--text-3)] uppercase">
          {files.length} of {MAX_FILES} files
        </span>
        <Button
          variant="lime"
          size="lg"
          disabled={files.length === 0 && !notes.trim()}
          onClick={start}
        >
          Build the quote
          <ArrowUpRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
