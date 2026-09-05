import Image from "next/image";

const steps = [
  {
    n: "01",
    title: "Agents propose",
    body: "Specialists with one job each and a typed output. They read the documents, work out what is being asked, and say what they think should happen. None of them is trusted with the part that has to be true.",
    meta: "Narrow jobs, typed contracts",
  },
  {
    n: "02",
    title: "Code decides what is real",
    body: "The claim gets checked against the source. Not by a second model — a model asked whether a quote is real can agree with one that is not. By searching the document, the price book, the catalogue.",
    meta: "Deterministic, not a second opinion",
  },
  {
    n: "03",
    title: "Anything unproven is held",
    body: "A quotation nobody can find. A line item with no price behind it. A product that is not stocked. Each one stops the work rather than travelling inside it, and you are told which and why.",
    meta: "Refusing is a valid outcome",
  },
  {
    n: "04",
    title: "You read it and sign",
    body: "The desk drafts, verifies and prepares. Sending is an act you perform yourself, on a document you have read, in the system that owns it.",
    meta: "Your signature, not ours",
  },
];

const gates = [
  {
    desk: "Appeals",
    check: "Does this sentence appear in the policy?",
    method: "String search over the transcribed source",
  },
  {
    desk: "Quoting",
    check: "Does this line have a price behind it?",
    method: "Resolution against the contractor's own book",
  },
  {
    desk: "Orders",
    check: "Is this in stock at the agreed price?",
    method: "Catalogue, stock and terms lookup",
  },
];

export function Method() {
  return (
    <section
      id="method"
      className="border-y border-[var(--line)] bg-[var(--paper-2)]"
    >
      <div className="mx-auto max-w-[1240px] px-5 py-20 sm:py-28">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="eyebrow">The method</div>
            <h2 className="mt-3 text-[30px] sm:text-[38px]">
              <span className="display">The same shape, </span>
              <span className="script text-[var(--ok-deep)]">three times</span>
            </h2>
          </div>
          <p className="max-w-sm text-[13px] leading-relaxed text-[var(--text-2)]">
            Four steps, one of which is the whole point: something that is not a
            model has to agree before the work reaches you.
          </p>
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-4">
          {steps.map((step) => (
            <article
              key={step.n}
              className="card flex flex-col justify-between p-5 sm:p-6"
            >
              <div>
                <span className="font-mono text-[11px] tracking-[0.14em] text-[var(--text-3)]">
                  {step.n}
                </span>
                <h3 className="display mt-4 text-[19px] tracking-[-0.02em]">
                  {step.title}
                </h3>
                <p className="mt-3 text-[13px] leading-relaxed text-[var(--text-2)]">
                  {step.body}
                </p>
              </div>
              <p className="mt-6 border-t border-[var(--line)] pt-3 font-mono text-[9.5px] tracking-[0.14em] text-[var(--text-3)] uppercase">
                {step.meta}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.25fr]">
          <div className="relative overflow-hidden rounded-[var(--r-md)]">
            <Image
              src="/img/warehouse-aisle.jpg"
              alt="A long aisle of racking in a distribution warehouse"
              width={900}
              height={1200}
              className="h-full min-h-[18rem] w-full object-cover"
            />
            <div className="absolute inset-x-4 bottom-4 rounded-[var(--r-sm)] bg-white/92 px-4 py-3 backdrop-blur-sm">
              <p className="display text-[15px] tracking-[-0.015em]">
                A confident invention is worse than nothing
              </p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--text-2)]">
                It gets an appeal dismissed, a quote disputed, a delivery
                returned — and by then the deadline has gone with it.
              </p>
            </div>
          </div>

          <div className="card p-6 sm:p-8">
            <div className="eyebrow">What the code actually checks</div>
            <ul className="mt-5 border-t border-[var(--line)]">
              {gates.map((gate) => (
                <li
                  key={gate.desk}
                  className="grid gap-1 border-b border-[var(--line)] py-4 sm:grid-cols-[7rem_1fr] sm:gap-4"
                >
                  <span className="display text-[14px] tracking-[-0.015em]">
                    {gate.desk}
                  </span>
                  <div>
                    <p className="text-[13.5px] leading-snug text-[var(--text)]">
                      {gate.check}
                    </p>
                    <p className="mt-1 font-mono text-[9.5px] tracking-[0.1em] text-[var(--text-3)] uppercase">
                      {gate.method}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-[12.5px] leading-relaxed text-[var(--text-2)]">
              All three run on the same matcher. Whether a string corresponds to
              something that exists is one question, and it has an answer that
              does not depend on anybody&apos;s judgement.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
