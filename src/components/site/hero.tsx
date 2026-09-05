import Image from "next/image";
import Link from "next/link";

const desks = [
  { name: "Appeals", href: "/cases" },
  { name: "Quoting", href: "/quotes" },
  { name: "Orders", href: "/orders" },
] as const;

/**
 * Photograph, deep wash, then the headline in two voices — heavy grotesk for
 * the frame, italic serif for the words that carry the meaning.
 *
 * The panel is pinned to the viewport and lays its content out as a column, so
 * the first screen is always exactly one screen on any window.
 */
export function Hero() {
  return (
    <section id="top" className="px-3 pt-3 sm:px-5 sm:pt-5">
      <div className="relative flex min-h-[calc(100svh-1.5rem)] flex-col overflow-hidden rounded-[var(--r-xl)] bg-[var(--deep)] sm:min-h-[calc(100svh-2.5rem)]">
        <div className="absolute inset-0">
          <Image
            src="/img/signing.jpg"
            alt="A person signing a document at a desk"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[center_40%]"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(176deg, rgba(7,66,58,0.90) 0%, rgba(6,47,42,0.70) 42%, rgba(4,26,23,0.92) 100%)",
            }}
          />
        </div>

        <div className="relative flex flex-1 flex-col justify-between px-6 pt-24 pb-7 sm:px-14 sm:pb-9">
          <div>
            <h1 className="max-w-[min(100%,52rem)] [overflow-wrap:anywhere]">
              <span className="block text-[clamp(1.8rem,min(5vw,8.2vh),4rem)] leading-[0.98]">
                <span className="display text-[var(--lime)]">We do the </span>
                <span className="script text-white">preparation</span>
              </span>
              <span className="block text-[clamp(1.8rem,min(5vw,8.2vh),4rem)] leading-[0.98]">
                <span className="display text-[var(--lime)]">You do the </span>
                <span className="script text-white">signing</span>
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-[13.5px] leading-relaxed text-white/85 sm:mt-6 sm:text-[15px]">
              Three desks of agents for the work that sits between something
              arriving and someone having to answer it properly. Each one
              prepares a document. None of them is allowed to send it, and none
              of them is trusted with the part that has to be true.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3 sm:mt-7">
              <Link href="/#desks" className="press pill pill-lime">
                Pick a desk
              </Link>
              <Link
                href="/demo"
                className="press inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/10 px-4 py-2.5 font-mono text-[10px] tracking-[0.16em] text-white uppercase backdrop-blur-sm hover:border-white/70"
              >
                See a real run
              </Link>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
            <div className="max-w-sm">
              <p className="text-[clamp(1.75rem,3vw,2.25rem)] leading-none text-white">
                <span className="script">Three</span>
                <span className="display ml-2 text-[0.82em] tracking-[-0.02em]">
                  desks
                </span>
              </p>
              <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                {desks.map((d) => (
                  <li key={d.name}>
                    <Link
                      href={d.href}
                      className="press font-mono text-[10px] tracking-[0.14em] text-white/70 uppercase transition-colors hover:text-[var(--lime)]"
                    >
                      {d.name}
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[12.5px] leading-relaxed text-white/80">
                A denied insurance claim. A site walk that has to become a price.
                A purchase order buried in an email thread.
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
                  Every fact checked by code
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
