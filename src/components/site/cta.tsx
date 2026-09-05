import Image from "next/image";
import Link from "next/link";

export function Cta() {
  return (
    // Paper above the panel, so the dark safeguards section ends before this
    // one begins rather than the two reading as a single black mass.
    <section className="px-3 pt-20 pb-3 sm:px-5 sm:pt-28 sm:pb-5">
      <div className="relative overflow-hidden rounded-[var(--r-xl)] bg-[var(--deep)]">
        <div className="absolute inset-0">
          <Image
            src="/img/paperwork.jpg"
            alt="Insurance forms and a calculator spread across a desk"
            fill
            sizes="100vw"
            className="object-cover object-[center_60%]"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(160deg, rgba(6,47,42,0.92) 0%, rgba(7,66,58,0.78) 55%, rgba(4,26,23,0.92) 100%)",
            }}
          />
        </div>

        <div className="relative flex flex-col gap-8 px-6 py-16 sm:px-14 sm:py-20 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <div className="eyebrow text-white/50">Start</div>
            <h2 className="mt-3 text-[clamp(1.9rem,4.6vw,3.2rem)] leading-[1.02]">
              <span className="display text-[var(--lime)]">Pick the problem you actually </span>
              <span className="script text-white">have</span>
            </h2>
            <p className="mt-5 text-[14px] leading-relaxed text-white/80">
              A denial letter, a site walk, or an order buried in a thread. Each
              desk takes what you already have and gives back something you can
              read, check and sign.
            </p>
          </div>

          <Link href="/#desks" className="press pill pill-lime shrink-0">
            Pick a desk
          </Link>
        </div>
      </div>
    </section>
  );
}
