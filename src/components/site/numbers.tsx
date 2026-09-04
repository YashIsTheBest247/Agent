import Image from "next/image";
import Link from "next/link";

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-white/88 px-2.5 py-1 font-mono text-[9.5px] tracking-[0.1em] text-[var(--ink)] uppercase backdrop-blur-sm">
      {children}
    </span>
  );
}

/**
 * The numbers that make the case, carried on photographs rather than charts.
 * Figures are footnoted below the grid; nothing here is asserted without a
 * source the reader can go and check.
 */
export function Numbers() {
  return (
    <section className="mx-auto max-w-[1240px] px-5 pb-20 sm:pb-28">
      <div className="grid gap-4 lg:grid-cols-4">
        {/* Column one — the headline number and a photograph. */}
        <div className="flex flex-col justify-between lg:col-span-1">
          <div>
            <div className="display text-[clamp(3.4rem,7vw,5.2rem)] leading-[0.86] tracking-[-0.04em]">
              9
            </div>
            <p className="mt-2 text-[13px] leading-snug text-[var(--text-2)]">
              Agents on the desk, each standing in for a job a real appeals team
              would do.
            </p>
          </div>
          <div className="mt-6 overflow-hidden rounded-[var(--r-md)]">
            <div className="relative">
              <Image
                src="/img/clinician.jpg"
                alt="A clinician in a white coat holding a phone"
                width={640}
                height={430}
                className="h-56 w-full object-cover"
              />
              <div className="absolute inset-x-3 bottom-3 flex flex-wrap gap-1.5">
                <Tag>Coverage</Tag>
                <Tag>Evidence</Tag>
              </div>
            </div>
          </div>
        </div>

        {/* Column two — the mechanism, on a lime-washed card. */}
        <div className="lg:col-span-1">
          <div className="flex h-full flex-col items-center justify-between rounded-[var(--r-md)] border border-[var(--line)] bg-[#f7f9ee] p-6">
            <Image
              src="/img/stethoscope.jpg"
              alt="A stethoscope arranged on a white surface"
              width={520}
              height={340}
              className="w-full rounded-[var(--r-sm)] object-cover"
            />
            <p className="mt-5 text-center text-[13px] leading-relaxed text-[var(--text-2)]">
              Typed contracts between every stage, so no agent downstream has to
              re-read another one&apos;s prose.
            </p>
            <Link href="/#how" className="press pill pill-lime mt-5">
              How it works
            </Link>
          </div>
        </div>

        {/* Column three — the money, over a wide photograph. */}
        <div className="lg:col-span-2">
          <div className="relative h-full overflow-hidden rounded-[var(--r-md)]">
            <Image
              src="/img/corridor.jpg"
              alt="Clinicians walking away down a bright hospital corridor"
              width={1200}
              height={800}
              className="h-full min-h-[19rem] w-full object-cover"
            />
            <div className="absolute inset-x-4 top-4 flex flex-wrap gap-1.5">
              <Tag>Medical necessity</Tag>
              <Tag>Prior authorization</Tag>
              <Tag>Out of network</Tag>
            </div>
            <div className="absolute inset-x-4 bottom-4 rounded-[var(--r-sm)] bg-white/92 px-4 py-3 backdrop-blur-sm">
              <div className="display text-[clamp(2rem,4vw,3rem)] leading-none tracking-[-0.03em]">
                Under 1%
              </div>
              <p className="mt-1 text-[12.5px] text-[var(--text-2)]">
                Share of denied marketplace claims that are ever appealed —
                against an overturn rate, for those that are, of roughly four in
                ten.
              </p>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-6 font-mono text-[10px] leading-relaxed tracking-[0.08em] text-[var(--text-3)] uppercase">
        Denial and appeal rates: KFF analysis of CMS Transparency in Coverage
        data for ACA marketplace plans. Figures vary by payer and state.
      </p>
    </section>
  );
}
