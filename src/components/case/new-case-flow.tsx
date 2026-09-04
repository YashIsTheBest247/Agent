"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, FileText, Trash2, TriangleAlert, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";
import { AgentTimeline } from "@/components/case/agent-timeline";
import type { TraceEvent } from "@/lib/agents/trace";
import type { CaseRecord } from "@/lib/domain/case";
import { cn } from "@/lib/utils";

const ACCEPT = ".pdf,.png,.jpg,.jpeg,.webp,.heic,.txt";
const MAX_FILES = 6;

type Phase = "collecting" | "running" | "finished";

export function NewCaseFlow({ configured }: { configured: boolean }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<File[]>([]);
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
    if (files.length === 0) return;

    setPhase("running");
    setError(null);
    setEvents([]);

    const form = new FormData();
    for (const file of files) form.append("files", file);

    let response: Response;
    try {
      response = await fetch("/api/cases", { method: "POST", body: form });
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

    // Newline-delimited JSON: each line is a full case snapshot.
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let finalRecord: CaseRecord | null = null;

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
            finalRecord = message.record as CaseRecord;
            setEvents(finalRecord.trace);
          }
          if (message.type === "error") setError(message.error);
        } catch {
          /* a partial frame; the next chunk completes it */
        }
      }
    }

    setPhase("finished");
    if (finalRecord) router.push(`/cases/${finalRecord.id}`);
  }, [files, router]);

  if (phase !== "collecting") {
    return (
      <div className="rounded-[var(--r-lg)] bg-white p-6 ring-1 ring-[var(--line)] sm:p-8">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-trace-pulse rounded-full bg-[var(--lime)]" />
          <h2 className="display text-lg font-bold tracking-[-0.02em] text-[var(--ink)]">
            {phase === "running" ? "The agents are working" : "Run complete"}
          </h2>
        </div>
        <p className="mt-2 text-[13px] leading-relaxed text-[var(--text-2)]">
          Nine specialists, each with one job. You can watch each one as it goes
          — and read afterwards exactly why it concluded what it did.
        </p>

        {error ? (
          <div className="mt-5 flex gap-3 rounded-[var(--r-md)] bg-[var(--risk-red-wash)] p-4 ring-1 ring-[var(--risk-red)]/25">
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
        <div className="flex gap-3 rounded-[var(--r-md)] bg-[var(--risk-amber-wash)] p-5 ring-1 ring-[var(--risk-amber)]/25">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[var(--risk-amber)]" />
          <div>
            <p className="text-[13px] font-semibold text-[var(--ink)]">
              No Gemini key on the server
            </p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--text-2)]">
              Add <code className="rounded bg-white px-1 py-0.5">GEMINI_API_KEY</code>{" "}
              to <code className="rounded bg-white px-1 py-0.5">.env.local</code> and
              restart the dev server. Uploads will be rejected until then.
            </p>
          </div>
        </div>
      ) : null}

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
          "rounded-[var(--r-lg)] border border-dashed p-8 text-center transition-colors sm:p-12",
          dragging
            ? "border-[var(--lime-deep)] bg-[var(--lime-wash)]"
            : "border-[var(--text-3)] bg-white hover:border-[var(--text-2)]",
        )}
      >
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--lime-wash)] text-[var(--ok-deep)]">
          <Upload className="h-5 w-5" />
        </span>
        <h2 className="mt-4 display text-lg font-bold tracking-[-0.02em] text-[var(--ink)]">
          Drop the denial letter here
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-[var(--text-2)]">
          A phone photo is fine. Add your plan documents and any clinical records
          too — the more the agents can quote, the stronger the appeal.
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

      {files.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {files.map((file) => (
            <li
              key={`${file.name}-${file.size}`}
              className="flex items-center gap-3 rounded-[var(--r-md)] bg-white p-4 ring-1 ring-[var(--line)]"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--paper)] text-[var(--text-2)] ring-1 ring-[var(--line)]">
                <FileText className="h-4 w-4" />
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
                onClick={() =>
                  setFiles((current) => current.filter((f) => f !== file))
                }
                className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-3)] transition-colors hover:bg-[var(--paper-2)] hover:text-[var(--risk-red)]"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {error ? (
        <div className="flex gap-3 rounded-[var(--r-md)] bg-[var(--risk-red-wash)] p-4 ring-1 ring-[var(--risk-red)]/25">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[var(--risk-red)]" />
          <p className="text-[13px] leading-relaxed text-[var(--text)]">{error}</p>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <Pill tone="neutral">
          {files.length} of {MAX_FILES} files
        </Pill>
        <Button
          variant="ink"
          size="lg"
          disabled={files.length === 0}
          onClick={start}
        >
          Run the appeal team
          <ArrowUpRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
