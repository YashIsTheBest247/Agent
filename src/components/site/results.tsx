const deliverables = [
  {
    n: "01",
    title: "The appeal letter",
    body: "Addressed, formatted for the level it is filed at, and written in the register a claims reviewer reads. Every quotation is marked inline and clicks through to the line it came from.",
    facets: ["Citation markers", "Payer's own criteria", "Bracketed gaps you fill"],
  },
  {
    n: "02",
    title: "The citation audit",
    body: "Each quote re-checked against the source document by string search, not by a second opinion. Verified, drifted, not found, or citing a document you never uploaded — and a draft carrying either of the last two never reaches you.",
    facets: ["Per-quote status", "Nearest real text", "Hard block on failure"],
  },
  {
    n: "03",
    title: "The reasoning",
    body: "Why this appeal level, why these two or three arguments and not the other five, and what the payer's reviewer would say back. Including the weaknesses the adversary found and the drafter fixed.",
    facets: ["Argument ranking", "Adversarial verdict", "Full agent trace"],
  },
  {
    n: "04",
    title: "The filing packet",
    body: "Where to send it, what to attach, the dates to keep, and a short script for the phone call — because a perfect letter nobody posts is still a loss.",
    facets: ["Submission route", "Deadline reminders", "Call script"],
  },
];

export function Results() {
  return (
    <section id="results" className="mx-auto max-w-[1240px] px-5 py-20 sm:py-28">
      <div className="max-w-2xl">
        <div className="eyebrow">What comes back</div>
        <h2 className="mt-3 text-[clamp(2rem,5vw,3.4rem)]">
          <span className="display">What you get </span>
          <span className="script text-[var(--ok-deep)]">back</span>
        </h2>
      </div>

      <div className="mt-12 border-t border-[var(--line)]">
        {deliverables.map((item) => (
          <article
            key={item.n}
            className="grid gap-4 border-b border-[var(--line)] py-8 lg:grid-cols-[4rem_1fr_20rem] lg:gap-8"
          >
            <div className="font-mono text-[11px] tracking-[0.14em] text-[var(--text-3)]">
              / {item.n}
            </div>

            <div>
              <h3 className="display text-[clamp(1.3rem,3vw,1.9rem)] tracking-[-0.025em]">
                {item.title}
              </h3>
              <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed text-[var(--text-2)]">
                {item.body}
              </p>
            </div>

            <ul className="flex flex-col gap-2 lg:pt-2">
              {item.facets.map((facet) => (
                <li
                  key={facet}
                  className="flex items-center gap-2.5 font-mono text-[10px] tracking-[0.12em] text-[var(--text-3)] uppercase"
                >
                  <span className="h-1 w-1 shrink-0 rounded-full bg-[var(--lime-deep)]" />
                  {facet}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
