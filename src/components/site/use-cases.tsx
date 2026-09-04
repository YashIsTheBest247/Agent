import { Grain, Scene } from "@/components/art/scene";
import { Pill } from "@/components/ui/pill";

const cases = [
  {
    tag: "For patients",
    variant: "canopy" as const,
    title: "The bill that felt wrong",
    body: "You were told it was covered. The letter says otherwise, in language written to be argued with. Upload it and get a filed-ready appeal the same evening.",
    points: [
      "Prior-authorization and medical-necessity denials",
      "Out-of-network and surprise-billing disputes",
      "Coding and duplicate-charge errors on an EOB",
    ],
  },
  {
    tag: "For clinics",
    variant: "valley" as const,
    title: "The queue nobody gets to",
    body: "Billing teams write off denials they know are wrong, because appealing costs more staff time than the claim is worth. Overturn changes that arithmetic.",
    points: [
      "Batch intake from your denial worklist",
      "Payer-specific formats and submission routes",
      "Exception queue for anything the agents won't sign off on",
    ],
  },
];

export function UseCases() {
  return (
    <section id="use-cases" className="px-3 py-16 sm:px-5 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-sans text-[clamp(2rem,5vw,3.25rem)] leading-[1.02] font-extrabold tracking-[-0.035em] text-ink-900">
            Built for both sides
            <br />
            <span className="text-gradient-leaf">of the same letter</span>
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-ink-500">
            The person who received the denial, and the team that has to fight
            two hundred of them a week.
          </p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2">
          {cases.map((c, i) => (
            <article
              key={c.title}
              className="group relative overflow-hidden rounded-card-lg ring-1 ring-leaf-900/10"
            >
              <div className="absolute inset-0">
                <Scene variant={c.variant} seed={20 + i} />
                <Grain />
                <div className="absolute inset-0 bg-gradient-to-t from-leaf-900/80 via-leaf-900/25 to-transparent" />
              </div>

              <div className="relative flex min-h-[26rem] flex-col justify-between p-6 sm:p-7">
                <Pill tone="glass" className="w-fit">
                  <span className="h-1.5 w-1.5 rounded-full bg-leaf-500" />
                  {c.tag}
                </Pill>

                <div>
                  <h3 className="font-sans text-2xl font-extrabold tracking-[-0.03em] text-white">
                    {c.title}
                  </h3>
                  <p className="mt-2.5 max-w-md text-[13px] leading-relaxed text-white/80">
                    {c.body}
                  </p>
                  <ul className="mt-5 flex flex-col gap-2">
                    {c.points.map((p) => (
                      <li
                        key={p}
                        className="flex items-start gap-2.5 text-[13px] text-white/90"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-leaf-400" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
