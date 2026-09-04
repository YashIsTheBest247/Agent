import Image from "next/image";

const safeguards = [
  {
    title: "No unverifiable claims",
    body: "Quotes are re-checked against the source before you see them. A citation that cannot be resolved blocks the draft instead of shipping inside it.",
  },
  {
    title: "You sign, not the agent",
    body: "Overturn drafts, verifies and prepares. Filing is an action you take deliberately, on a document you have read.",
  },
  {
    title: "Every decision is inspectable",
    body: "Each case keeps a full trace: which agent ran, what it read, what it concluded, and where it disagreed with another.",
  },
  {
    title: "Your documents, and a way to remove them",
    body: "Uploads go to the Gemini API to be read and are held only for the life of the case. Deleting a case removes the documents and everything derived from them.",
  },
];

export function Safeguards() {
  return (
    <section
      id="safeguards"
      className="border-y border-[var(--line-ink)] bg-[var(--ink)]"
    >
      <div className="mx-auto max-w-[1240px] px-5 py-20 sm:py-28">
        <div className="grid gap-12 lg:grid-cols-[1fr_1fr]">
          <div>
            <div className="eyebrow text-[var(--text-3)]">Safeguards</div>
            <h2 className="mt-3 text-[clamp(1.9rem,4.5vw,3rem)]">
              <span className="display text-[var(--lime)]">The boring part that makes it </span>
              <span className="script text-white">trustworthy</span>
            </h2>
            <p className="mt-5 max-w-md text-[13.5px] leading-relaxed text-white/70">
              A confident letter full of invented citations is worse than no
              letter — it gets the appeal dismissed and costs you the deadline.
              Most of the engineering here went into refusing to produce one.
            </p>

            <div className="mt-8 overflow-hidden rounded-[var(--r-md)]">
              <Image
                src="/img/hospital.jpg"
                alt="The entrance canopy of a hospital building"
                width={900}
                height={600}
                className="h-52 w-full object-cover"
              />
            </div>
          </div>

          <ul className="border-t border-[var(--line-ink)]">
            {safeguards.map((s) => (
              <li key={s.title} className="border-b border-[var(--line-ink)] py-6">
                <h3 className="display text-[16px] tracking-[-0.015em] text-white">
                  {s.title}
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-white/65">
                  {s.body}
                </p>
              </li>
            ))}
            <li className="pt-6">
              <p className="font-mono text-[10px] leading-relaxed tracking-[0.1em] text-[var(--text-3)] uppercase">
                Overturn is not a law firm, an insurer, or a medical provider.
                Nothing it produces is legal or medical advice.
              </p>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
