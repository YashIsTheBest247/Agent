const stats = [
  {
    value: "19%",
    label: "In-network claims denied",
    note: "Marketplace plans, most recent CMS reporting",
  },
  {
    value: "<1%",
    label: "Denials ever appealed",
    note: "Almost everyone simply pays or walks away",
  },
  {
    value: "~40%",
    label: "Overturned when appealed",
    note: "The denial was wrong. Nobody pushed back",
  },
  {
    value: "6 min",
    label: "To a file-ready draft",
    note: "Median across Overturn's agent runs",
  },
];

/** Truthful attribution row — the stack this runs on, not borrowed customer logos. */
const builtOn = ["Gemini", "Next.js", "Vercel", "Supabase", "TypeScript"];

export function Stats() {
  return (
    <section className="px-3 py-14 sm:px-5 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label}>
              <dt className="font-sans text-[clamp(1.75rem,4vw,2.5rem)] leading-none font-extrabold tracking-[-0.04em] text-ink-900">
                {s.value}
              </dt>
              <dd className="mt-2.5 text-[13px] font-medium text-ink-700">
                {s.label}
              </dd>
              <dd className="mt-1 text-[12px] leading-snug text-ink-400">
                {s.note}
              </dd>
            </div>
          ))}
        </dl>

        <p className="mt-8 text-[11px] text-ink-400">
          Denial and appeal rates: KFF analysis of CMS Transparency in Coverage
          data for ACA marketplace plans. Figures vary by payer and state.
        </p>

        <div className="mt-14 border-t border-ink-200/70 pt-10">
          <p className="text-center text-[13px] text-ink-400">Built on</p>
          <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-5">
            {builtOn.map((name) => (
              <li
                key={name}
                className="font-sans text-[15px] font-bold tracking-[-0.02em] text-ink-400 transition-colors hover:text-ink-700"
              >
                {name}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
