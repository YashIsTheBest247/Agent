import Image from "next/image";
import Link from "next/link";

/**
 * Photograph, deep wash, then the headline in two voices — heavy grotesk for
 * the frame, italic serif for the two words that carry the meaning.
 *
 * The panel is pinned to the viewport (`100svh` less the surrounding inset) and
 * lays its content out as a column that pushes the headline to the top and the
 * agent strip to the bottom. Nothing here is sized to "roughly fit": the
 * container owns the height, so the first screen is always exactly one screen.
 */
export function Hero() {
  return (
    <section id="top" className="px-3 pt-3 sm:px-5 sm:pt-5">
      <div className="relative flex min-h-[calc(100svh-1.5rem)] flex-col overflow-hidden rounded-[var(--r-xl)] bg-[var(--deep)] sm:min-h-[calc(100svh-2.5rem)]">
        <div className="absolute inset-0">
          <Image
            src="/img/hero-desk.jpg"
            alt="A desk of insurance forms, a calculator and a cup of coffee, shot from above"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[center_45%]"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(176deg, rgba(7,66,58,0.88) 0%, rgba(6,47,42,0.66) 42%, rgba(4,26,23,0.90) 100%)",
            }}
          />
        </div>

        {/* Column: headline block sits under the nav, agent strip pins to the floor. */}
        <div className="relative flex flex-1 flex-col justify-between px-6 pt-24 pb-7 sm:px-14 sm:pb-9">
          <div>
            <h1 className="max-w-[min(100%,52rem)] [overflow-wrap:anywhere]">
              <span className="block text-[clamp(1.8rem,min(5vw,8.2vh),4rem)] leading-[0.98]">
                <span className="display text-[var(--lime)]">Where a </span>
                <span className="script text-white">denial</span>
              </span>
              <span className="block text-[clamp(1.8rem,min(5vw,8.2vh),4rem)] leading-[0.98]">
                <span className="display text-[var(--lime)]">meets an </span>
                <span className="script text-white">argument</span>
              </span>
            </h1>

            <p className="mt-5 max-w-lg text-[13.5px] leading-relaxed text-white/85 sm:mt-6 sm:text-[15px]">
              Insurers deny first and count on you giving up. Overturn reads your
              denial letter, finds the policy language that contradicts it, and
              drafts a citation-verified appeal — reviewed by you before a word
              is sent.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3 sm:mt-7">
              <Link href="/cases/new" className="press pill pill-lime">
                Appeal a denial
              </Link>
              <Link
                href="/#how"
                className="press inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/10 px-4 py-2.5 font-mono text-[10px] tracking-[0.16em] text-white uppercase backdrop-blur-sm hover:border-white/70"
              >
                See how it works
              </Link>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
            <div className="max-w-xs">
              <p className="text-[clamp(1.75rem,3vw,2.25rem)] leading-none text-white">
                <span className="script">Nine</span>
                <span className="display ml-2 text-[0.82em] tracking-[-0.02em]">
                  agents
                </span>
              </p>
              <p className="mt-2.5 text-[12.5px] leading-relaxed text-white/80">
                Eight of them build the appeal. The auditor is not a model at
                all — it re-opens each source document and blocks the draft if a
                single quote cannot be found.
              </p>
            </div>

            <div className="flex items-center gap-3.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--lime)]">
                <span className="flex gap-[2px]">
                  {["#ffffff", "#fbe58f", "#aecbf5", "#a9dcb6"].map((c) => (
                    <span
                      key={c}
                      className="block h-4 w-[3px] rounded-[1px] border border-black/15"
                      style={{ background: c }}
                    />
                  ))}
                </span>
              </span>
              <div className="flex flex-col gap-1">
                <span className="font-mono text-[10px] tracking-[0.12em] text-white/85 uppercase">
                  Nothing is ever sent
                </span>
                <span className="font-mono text-[10px] tracking-[0.12em] text-white/85 uppercase">
                  You sign, not the agent
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
