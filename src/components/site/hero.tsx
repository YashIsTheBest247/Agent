import { ArrowUpRight, CalendarClock, Play, ShieldCheck, Sparkles } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";
import { Grain, Scene } from "@/components/art/scene";

export function Hero() {
  return (
    <section className="relative px-3 pt-10 pb-6 sm:px-5 sm:pt-16">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center text-center">
          <Pill tone="glass" icon={<Sparkles className="h-3.5 w-3.5 text-leaf-600" />}>
            Nine agents. One appeal.
          </Pill>

          <h1 className="mt-6 max-w-4xl font-sans text-[clamp(2.5rem,7vw,4.75rem)] leading-[0.98] font-extrabold tracking-[-0.035em] text-ink-900">
            Get Back What
            <br />
            <span className="text-gradient-leaf">You&apos;re Owed</span>
          </h1>

          <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-ink-500 sm:text-base">
            Insurers deny first and count on you giving up. Overturn reads your
            denial letter, finds the policy language that contradicts it, and
            drafts a citation-backed appeal — reviewed by you before a word is
            sent.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
            <ButtonLink href="/cases/new" variant="ink" size="lg">
              Start a case — free
              <ArrowUpRight className="h-4 w-4" />
            </ButtonLink>
            <ButtonLink href="/#how-it-works" variant="ghost" size="lg">
              See how it works
            </ButtonLink>
          </div>
        </div>

        {/* ---- Landscape panel with floating status cards ---- */}
        <div className="relative mt-12 sm:mt-16">
          <div className="relative overflow-hidden rounded-shell shadow-[0_40px_90px_-40px_rgba(30,58,14,0.55)] ring-1 ring-leaf-900/10">
            <div className="relative aspect-[16/10] w-full sm:aspect-[2.1/1]">
              <Scene variant="dawn" seed={1} />
              <Grain />
            </div>

            {/* Bottom-left: the demo card */}
            <div className="absolute bottom-4 left-4 w-[min(19rem,72%)] animate-rise-in rounded-card bg-white/85 p-3 ring-1 ring-white/70 backdrop-blur-xl sm:bottom-6 sm:left-6">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink-900 text-white">
                  <Play className="h-4 w-4 fill-current" />
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] leading-snug font-semibold text-ink-900">
                    Watch a real denial get overturned
                  </p>
                  <p className="mt-0.5 text-[11px] text-ink-500">
                    90 seconds · prior-auth denial, appeal filed
                  </p>
                </div>
              </div>
            </div>

            {/* Top-right: overturn odds */}
            <div
              className="absolute top-5 right-4 w-[min(15rem,60%)] animate-float-soft rounded-card bg-white/85 p-4 ring-1 ring-white/70 backdrop-blur-xl sm:top-8 sm:right-8"
              style={{ animationDelay: "0.4s" }}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[11px] font-medium tracking-wide text-ink-500 uppercase">
                    Overturn odds
                  </p>
                  <p className="mt-1 font-sans text-2xl font-extrabold tracking-[-0.03em] text-ink-900">
                    Strong
                  </p>
                </div>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-leaf-100 text-leaf-700">
                  <ShieldCheck className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-[11px] leading-snug text-ink-500">
                Payer&apos;s own criteria met on 3 of 3 clinical points.
              </p>
            </div>

            {/* Mid-right: deadline clock */}
            <div
              className="absolute right-4 bottom-6 hidden w-[min(17rem,64%)] animate-float-soft rounded-card bg-white/85 p-4 ring-1 ring-white/70 backdrop-blur-xl sm:block sm:right-8 sm:bottom-10"
              style={{ animationDelay: "1.2s" }}
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-caution-100 text-caution-500">
                  <CalendarClock className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[13px] font-semibold text-ink-900">
                    31 days to file
                  </p>
                  <p className="text-[11px] text-ink-500">
                    Internal appeal · deadline tracked
                  </p>
                </div>
              </div>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
                <div className="h-full w-[42%] rounded-full bg-leaf-500" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
