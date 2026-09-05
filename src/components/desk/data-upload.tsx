"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Paperclip, TriangleAlert, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Uploading the data a desk prices against.
 *
 * The seeded examples make the desks work out of the box, but a quote priced
 * from someone else's book is a demo. This is the step that makes it a tool.
 */
export function DataUpload({
  endpoint,
  noun,
  template,
  columns,
  current,
}: {
  /** e.g. "/api/quotes/pricebook" */
  endpoint: string;
  /** "price book" or "catalogue" */
  noun: string;
  template: string;
  columns: { name: string; required: boolean; note: string }[];
  current: { name: string; items: number } | null;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [csv, setCsv] = useState("");
  const [name, setName] = useState(current?.name ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const readFile = async (file: File) => {
    setError(null);
    setCsv(await file.text());
    if (!name) setName(file.name.replace(/\.[^.]+$/, ""));
  };

  const submit = async () => {
    setPending(true);
    setError(null);
    setDone(null);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ csv, name: name || `My ${noun}` }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setError(payload?.error ?? "That could not be imported.");
        return;
      }
      setDone(`Imported ${payload.items} items${payload.labour ? ` and ${payload.labour} labour rates` : ""}.`);
      router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setPending(false);
    }
  };

  const remove = async () => {
    setPending(true);
    try {
      await fetch(endpoint, { method: "DELETE" });
      setDone(null);
      setCsv("");
      router.refresh();
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {current ? (
        <div className="card flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="flex gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--ok-deep)]" />
            <div>
              <p className="text-[13.5px] font-semibold text-[var(--ink)]">
                Using your own {noun}: {current.name}
              </p>
              <p className="mt-0.5 text-[12.5px] text-[var(--text-2)]">
                {current.items} items. Every run prices against this.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            className="press inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.14em] text-[var(--text-3)] uppercase hover:text-[var(--risk-red)]"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Revert to the example
          </button>
        </div>
      ) : (
        <div className="card p-5">
          <p className="text-[13.5px] text-[var(--text-2)]">
            You are using the worked example {noun}. Upload your own and every
            run will price against it instead.
          </p>
        </div>
      )}

      <div className="card overflow-hidden">
        <label className="block border-b border-[var(--line)] px-5 py-4">
          <span className="eyebrow">Name it</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={`My ${noun}`}
            className="mt-2 w-full bg-transparent text-[14px] text-[var(--text)] placeholder:text-[var(--text-3)] focus:outline-none"
          />
        </label>

        <div className="border-b border-[var(--line)] px-5 py-3">
          <span className="eyebrow">Paste the CSV, or attach a file</span>
        </div>
        <textarea
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          rows={12}
          spellCheck={false}
          placeholder={template}
          className="w-full resize-y bg-transparent p-5 font-mono text-[12px] leading-relaxed text-[var(--text)] placeholder:text-[var(--text-3)] focus:outline-none"
        />
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] bg-[var(--paper)] px-5 py-3">
          <button
            type="button"
            onClick={() => setCsv(template)}
            className="press font-mono text-[10px] tracking-[0.14em] text-[var(--text-3)] uppercase hover:text-[var(--ink)]"
          >
            Fill with the template
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv,text/plain"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void readFile(file);
              e.target.value = "";
            }}
          />
          <Button variant="ghost" size="sm" onClick={() => fileRef.current?.click()}>
            <Paperclip className="h-3.5 w-3.5" />
            Attach CSV
          </Button>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="display text-[14px] tracking-[-0.015em]">Columns</h2>
        <p className="mt-1 text-[12.5px] text-[var(--text-2)]">
          Header names are matched loosely — <code>Unit Cost</code>,{" "}
          <code>unit_cost</code> and <code>unitcost</code> all work.
        </p>
        <ul className="mt-4 flex flex-col gap-2">
          {columns.map((c) => (
            <li key={c.name} className="flex flex-wrap items-baseline gap-2">
              <code className="rounded bg-[var(--paper)] px-1.5 py-0.5 font-mono text-[11.5px] text-[var(--ink)]">
                {c.name}
              </code>
              <span
                className={
                  c.required
                    ? "font-mono text-[9.5px] tracking-[0.12em] text-[#8f1f1f] uppercase"
                    : "font-mono text-[9.5px] tracking-[0.12em] text-[var(--text-3)] uppercase"
                }
              >
                {c.required ? "required" : "optional"}
              </span>
              <span className="text-[12.5px] text-[var(--text-2)]">{c.note}</span>
            </li>
          ))}
        </ul>
      </div>

      {error ? (
        <div className="flex gap-3 rounded-[var(--r-md)] border border-[var(--risk-red)]/25 bg-[var(--risk-red-wash)] p-4">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[var(--risk-red)]" />
          <p className="text-[13px] leading-relaxed whitespace-pre-line text-[var(--text)]">
            {error}
          </p>
        </div>
      ) : null}

      {done ? (
        <div className="flex gap-3 rounded-[var(--r-md)] border border-[var(--lime-deep)] bg-[#f7f9ee] p-4">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ok-deep)]" />
          <p className="text-[13px] leading-relaxed text-[var(--text)]">{done}</p>
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button variant="lime" size="lg" disabled={pending || !csv.trim()} onClick={submit}>
          {pending ? "Importing…" : `Use this ${noun}`}
        </Button>
      </div>
    </div>
  );
}
