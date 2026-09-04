import Link from "next/link";
import { Logo } from "@/components/site/logo";

const columns = [
  {
    heading: "Product",
    links: [
      { label: "How it works", href: "/#how-it-works" },
      { label: "Use cases", href: "/#use-cases" },
      { label: "Pricing", href: "/#pricing" },
      { label: "Start a case", href: "/cases/new" },
    ],
  },
  {
    heading: "Denial types",
    links: [
      { label: "Medical necessity", href: "/#use-cases" },
      { label: "Prior authorization", href: "/#use-cases" },
      { label: "Out of network", href: "/#use-cases" },
      { label: "Coding errors", href: "/#use-cases" },
    ],
  },
  {
    heading: "Trust",
    links: [
      { label: "Safeguards", href: "/#safeguards" },
      { label: "How we handle data", href: "/#safeguards" },
      { label: "Agent audit trail", href: "/#safeguards" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Terms", href: "/#safeguards" },
      { label: "Privacy", href: "/#safeguards" },
      { label: "Disclaimer", href: "/#safeguards" },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="px-3 pb-5 sm:px-5">
      <div className="mx-auto max-w-6xl rounded-shell bg-white p-7 ring-1 ring-ink-200/70 sm:p-10">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-4 text-[13px] leading-relaxed text-ink-500">
              An AI appeals desk for denied claims and incorrect medical bills.
              Drafted by agents, verified against sources, filed by you.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.heading}>
              <h3 className="text-[12px] font-semibold tracking-[0.1em] text-ink-900 uppercase">
                {col.heading}
              </h3>
              <ul className="mt-4 flex flex-col gap-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-[13px] text-ink-500 transition-colors hover:text-ink-900"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-ink-200/70 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12px] text-ink-400">
            © {new Date().getFullYear()} Overturn. Not a law firm, insurer, or
            medical provider.
          </p>
          <p className="text-[12px] text-ink-400">
            Built for the AI Builders Hackathon.
          </p>
        </div>
      </div>
    </footer>
  );
}
