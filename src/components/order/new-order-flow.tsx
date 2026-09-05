"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, FileText, Paperclip, Trash2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgentTimeline } from "@/components/case/agent-timeline";
import type { TraceEvent } from "@/lib/agents/trace";
import type { OrderRecord } from "@/lib/desks/orders/record";
import { sampleOrders } from "@/lib/desks/orders/samples";
import { cn } from "@/lib/utils";

const ACCEPT = ".pdf,.png,.jpg,.jpeg,.webp,.heic,.txt,.csv";
const MAX_FILES = 8;

type Phase = "collecting" | "running" | "finished";

export function NewOrderFlow({ configured }: { configured: boolean }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState("");
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
    if (!email.trim() && files.length === 0) return;

    setPhase("running");
    setError(null);
    setEvents([]);

    const form = new FormData();
    for (const file of files) form.append("files", file);
    form.append("email", email);

    let response: Response;
    try {
      response = await fetch("/api/orders", { method: "POST", body: form });
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
    let finalRecord: OrderRecord | null = null;

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
            finalRecord = message.record as OrderRecord;
            setEvents(finalRecord.trace);
          }
          if (message.type === "error") setError(message.error);
        } catch {
          /* a partial frame; the next chunk completes it */
        }
      }
    }

    setPhase("finished");
    if (finalRecord) router.push(`/orders/${finalRecord.id}`);
  }, [email, files, router]);

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
          The agent reads the order; code decides what is real, in stock and at
          the agreed price. Nothing else gets confirmed.
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
              restart. Orders will be rejected until then.
            </p>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <span className="eyebrow mr-1">Try one</span>
        {sampleOrders.map((sample) => (
          <button
            key={sample.id}
            type="button"
            onClick={() => {
              setEmail(sample.body);
              setError(null);
            }}
            title={sample.tests}
            className="press pill pill-ghost"
          >
            {sample.label}
          </button>
        ))}
      </div>

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
        className={cn("card overflow-hidden transition-colors", dragging && "bg-[var(--lime-wash)]")}
      >
        <div className="border-b border-[var(--line)] px-5 py-3">
          <span className="eyebrow">The order, as it arrived</span>
        </div>
        <textarea
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          rows={16}
          spellCheck={false}
          placeholder={`Paste the email, forwarded thread, or typed order.

From: orders@example.co.uk
Subject: PO 4471

Can we get 40 x double socket white and 6 drums of 2.5mm t&e away for Friday.`}
          className="w-full resize-y bg-transparent p-5 font-mono text-[12.5px] leading-relaxed text-[var(--text)] placeholder:text-[var(--text-3)] focus:outline-none"
        />
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] bg-[var(--paper)] px-5 py-3">
          <span className="font-mono text-[10px] tracking-[0.14em] text-[var(--text-3)] uppercase">
            Or attach the PO — PDF, scan, photograph
          </span>
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
          <Button variant="ghost" size="sm" onClick={() => inputRef.current?.click()}>
            <Paperclip className="h-3.5 w-3.5" />
            Attach
          </Button>
        </div>
      </div>

      {files.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {files.map((file) => (
            <li
              key={`${file.name}-${file.size}`}
              className="card flex items-center gap-3 p-4"
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
                onClick={() => setFiles((c) => c.filter((f) => f !== file))}
                className="press flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-3)] transition-colors hover:bg-[var(--paper-2)] hover:text-[var(--risk-red)]"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {error ? (
        <div className="flex gap-3 rounded-[var(--r-md)] border border-[var(--risk-red)]/25 bg-[var(--risk-red-wash)] p-4">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[var(--risk-red)]" />
          <p className="text-[13px] leading-relaxed text-[var(--text)]">{error}</p>
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button
          variant="lime"
          size="lg"
          disabled={!email.trim() && files.length === 0}
          onClick={start}
        >
          Process the order
          <ArrowUpRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
