import { Grain, Scene } from "@/components/art/scene";

const features = [
  {
    variant: "valley" as const,
    title: "Every quote is checked",
    body: "A citation auditor re-opens each source document and confirms the quoted text exists, word for word. If a line can't be found, the draft is held back rather than handed to you.",
  },
  {
    variant: "ridge" as const,
    title: "Deadlines that hold",
    body: "Appeal windows are short and unforgiving. Overturn reads the clock off your denial letter, works backwards from it, and escalates to external review before the door closes.",
  },
];

export function Features() {
  return (
    <section className="px-3 pb-4 sm:px-5">
      <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-2">
        {features.map((f, i) => (
          <article
            key={f.title}
            className="overflow-hidden rounded-card-lg bg-white ring-1 ring-ink-200/70"
          >
            <div className="relative m-2 aspect-[16/9] overflow-hidden rounded-card">
              <Scene variant={f.variant} seed={10 + i} />
              <Grain />
            </div>
            <div className="px-6 pt-4 pb-7">
              <h3 className="font-sans text-lg font-bold tracking-[-0.02em] text-ink-900">
                {f.title}
              </h3>
              <p className="mt-2.5 text-[13px] leading-relaxed text-ink-500">
                {f.body}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
