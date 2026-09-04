/**
 * The editorial statement of the problem — one long paragraph where the first
 * sentence carries full contrast and the rest drops back, so the eye gets the
 * claim immediately and the argument on a second pass.
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
            A denial letter is written to be difficult to argue with, and to
            arrive when you have the least energy to try.
          </span>{" "}
          <span className="text-[var(--text-3)]">
            It names no specific plan provision. It cites criteria it does not
            enclose. It gives you a window measured in weeks, buried in a
            paragraph on the reverse. Appealing means reading a policy document
            you have never opened, matching it against a clinical record you do
            not hold, and writing a letter in a register you have never had to
            use. Almost nobody does it. Of the people who do, a great many win.
          </span>
        </p>
      </div>
    </section>
  );
}
