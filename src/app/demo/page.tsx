import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Pill } from "@/components/ui/pill";
import { demoList } from "@/lib/demo";

export const metadata = { title: "Recorded runs" };

export default function DemoIndexPage() {
  return (
    <div className="mx-auto max-w-[900px]">
      <div className="eyebrow">Recorded runs</div>
      <h1 className="mt-3 text-[clamp(1.9rem,4vw,2.6rem)]">
        <span className="display">See it work, </span>
        <span className="script text-[var(--ok-deep)]">first</span>
      </h1>
      <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-[var(--text-2)]">
        Three real runs against the live API, saved exactly as they came out —
        not mock-ups, not screenshots. Rendered by the same components a live run
        uses. No account, no API key, nothing to spend.
      </p>

      <ul className="mt-10 flex flex-col gap-3">
        {demoList.map((demo) => (
          <li key={demo.slug}>
            <Link
              href={demo.href}
              className="card group flex flex-col gap-4 p-6 transition-shadow hover:shadow-[0_20px_45px_-28px_rgba(14,16,15,0.28)] sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <Pill tone="neutral">{demo.desk} desk</Pill>
                <h2 className="display mt-3 text-lg tracking-[-0.02em]">
                  {demo.title}
                </h2>
                <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-[var(--text-2)]">
                  {demo.shows}
                </p>
              </div>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-[var(--text-3)] transition-colors group-hover:text-[var(--ink)]" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
