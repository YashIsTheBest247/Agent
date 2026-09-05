/**
 * The editorial statement of the problem — the first sentence at full
 * contrast, the argument dropped back, so the claim lands on the first pass
 * and the reasoning on the second.
 */
export function Gap() {
  return (
    <section className="mx-auto max-w-[1240px] px-5 py-20 sm:py-28">
      <div className="grid gap-10 lg:grid-cols-[200px_1fr]">
        <div>
          <p className="text-[13px]">
            <span className="display text-[13px] tracking-[0.02em]">The </span>
            <span className="script text-[15px] text-[var(--ok-deep)]">gap</span>
          </p>
        </div>
        <p className="max-w-3xl text-[clamp(1.35rem,2.6vw,2rem)] leading-[1.32] tracking-[-0.01em]">
          <span className="text-[var(--text)]">
            Between something arriving and someone answering it properly sits
            work that nobody has automated, because getting it wrong is
            expensive and getting it right is dull.
          </span>{" "}
          <span className="text-[var(--text-3)]">
            A denial letter written to be difficult to argue with. A site visit
            that has to become a number you are bound to by Friday. A purchase
            order three replies down a thread, which somebody will rekey by
            hand. Each ends in a document a person has to sign, where a
            plausible invention costs more than an honest gap — which is exactly
            the shape of work that general-purpose AI does worst, and the reason
            every desk here is built around something that is not a model.
          </span>
        </p>
      </div>
    </section>
  );
}
