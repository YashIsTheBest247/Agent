import Image from "next/image";

const stages = [
  {
    n: "01",
    title: "Hand over the denial",
    body: "Upload the letter — a phone photograph is fine. Add your plan documents and any clinical records if you have them; the more the agents can quote, the less the appeal has to assert.",
    meta: "PDF · photo · text",
  },
  {
    n: "02",
    title: "The desk goes to work",
    body: "Transcription, then facts, then classification. Coverage and evidence run side by side. Every proposed quote is checked against the source before a single sentence of the letter is written.",
    meta: "One pass, start to finish",
  },
  {
    n: "03",
    title: "The draft gets attacked",
    body: "The adversary reads it as the payer's reviewer and looks for grounds to uphold. Anything it finds goes back for revision, up to twice, before you ever see the letter.",
    meta: "Up to two revisions",
  },
  {
    n: "04",
    title: "You read it and decide",
    body: "Every quote in the letter is clickable and opens the line it came from. Nothing is transmitted to your insurer at any point — filing stays an act you perform yourself.",
    meta: "Your signature, not ours",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="border-y border-[var(--line)] bg-[var(--paper-2)]">
      <div className="mx-auto max-w-[1240px] px-5 py-20 sm:py-28">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="eyebrow">How it works</div>
            <h2 className="mt-3 text-[30px] sm:text-[38px]">
              <span className="display">From letter to </span>
              <span className="script text-[var(--ok-deep)]">filed</span>
            </h2>
          </div>
          <p className="max-w-sm text-[13px] leading-relaxed text-[var(--text-2)]">
            Four steps, one of which is the whole point: the draft has to
            survive a hostile read before it reaches you.
          </p>
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-4">
          {stages.map((stage) => (
            <article
              key={stage.n}
              className="card flex flex-col justify-between p-5 sm:p-6"
            >
              <div>
                <span className="font-mono text-[11px] tracking-[0.14em] text-[var(--text-3)]">
                  {stage.n}
                </span>
                <h3 className="display mt-4 text-[19px] tracking-[-0.02em]">
                  {stage.title}
                </h3>
                <p className="mt-3 text-[13px] leading-relaxed text-[var(--text-2)]">
                  {stage.body}
                </p>
              </div>
              <p className="mt-6 border-t border-[var(--line)] pt-3 font-mono text-[9.5px] tracking-[0.14em] text-[var(--text-3)] uppercase">
                {stage.meta}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="relative overflow-hidden rounded-[var(--r-md)]">
            <Image
              src="/img/signing.jpg"
              alt="A person signing a document at a desk"
              width={1200}
              height={800}
              className="h-full min-h-[16rem] w-full object-cover"
            />
            <div className="absolute inset-x-4 bottom-4 rounded-[var(--r-sm)] bg-white/92 px-4 py-3 backdrop-blur-sm">
              <p className="display text-[15px] tracking-[-0.015em]">
                Overturn never contacts your insurer
              </p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--text-2)]">
                It drafts, verifies and prepares. Sending is a deliberate act you
                take, with the letter in front of you.
              </p>
            </div>
          </div>

          <div className="card flex flex-col justify-center p-6 sm:p-8">
            <div className="eyebrow">The gate</div>
            <p className="mt-3 text-[clamp(1.15rem,2vw,1.5rem)] leading-[1.3] tracking-[-0.01em]">
              <span className="text-[var(--text)]">
                If a quote cannot be found in the document it cites, the draft is
                held back rather than handed over.
              </span>{" "}
              <span className="text-[var(--text-3)]">
                An appeal citing text a reviewer cannot locate is dismissed, and
                the filing deadline usually goes with it. A confident invention
                is worse than no letter at all.
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
