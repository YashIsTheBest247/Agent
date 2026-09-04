import { FileText, Info, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";

export const metadata = { title: "Start a case" };

const documents = [
  {
    name: "Denial letter or EOB",
    required: true,
    hint: "The document that says what was denied and why.",
  },
  {
    name: "Plan documents",
    required: false,
    hint: "Your Summary of Benefits or full policy, if you have it.",
  },
  {
    name: "Clinical records",
    required: false,
    hint: "Notes or test results supporting medical necessity.",
  },
];

export default function NewCasePage() {
  return (
    <div className="mx-auto max-w-3xl">
      <Pill tone="leaf">Step 1 of 3</Pill>
      <h1 className="mt-4 font-sans text-3xl font-extrabold tracking-[-0.03em] text-ink-900">
        Upload the denial
      </h1>
      <p className="mt-2 text-[14px] leading-relaxed text-ink-500">
        A photo of the letter is fine. The intake agent reads scans, PDFs and
        phone pictures, and will tell you if something is unreadable.
      </p>

      <div className="mt-8 flex flex-col gap-3">
        {documents.map((doc) => (
          <div
            key={doc.name}
            className="flex items-center gap-4 rounded-card bg-white p-5 ring-1 ring-ink-200/70"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-muted text-ink-500 ring-1 ring-ink-200/70">
              <FileText className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-[14px] font-semibold text-ink-900">
                {doc.name}
                {doc.required ? (
                  <Pill tone="neutral">Required</Pill>
                ) : (
                  <Pill tone="neutral">Optional</Pill>
                )}
              </p>
              <p className="mt-0.5 text-[12px] text-ink-500">{doc.hint}</p>
            </div>
            <Button variant="outline" size="sm" disabled>
              <Upload className="h-3.5 w-3.5" />
              Upload
            </Button>
          </div>
        ))}
      </div>

      <div className="mt-6 flex gap-3 rounded-card bg-leaf-50 p-5 ring-1 ring-leaf-200">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-leaf-700" />
        <p className="text-[13px] leading-relaxed text-leaf-900/80">
          Uploads and the agent pipeline land in the next build. The design
          system, routing and marketing surface are in place first so the
          workflow has somewhere to live.
        </p>
      </div>
    </div>
  );
}
