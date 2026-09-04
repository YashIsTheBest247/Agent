import { ArrowUpRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Grain, Scene } from "@/components/art/scene";

export function Cta() {
  return (
    <section className="px-3 pb-16 sm:px-5 sm:pb-24">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-shell ring-1 ring-leaf-900/10">
        <div className="absolute inset-0">
          <Scene variant="dawn" seed={30} />
          <Grain />
          <div className="absolute inset-0 bg-gradient-to-br from-leaf-900/70 via-leaf-900/35 to-transparent" />
        </div>

        <div className="relative flex flex-col items-start gap-7 p-8 sm:p-14 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <h2 className="font-sans text-[clamp(1.875rem,4.5vw,3rem)] leading-[1.02] font-extrabold tracking-[-0.035em] text-white">
              You have a deadline.
              <br />
              It is shorter than you think.
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-white/80">
              Most internal appeal windows close within 180 days of the denial —
              some in 60. Upload the letter and find out where you stand in
              about six minutes.
            </p>
          </div>

          <ButtonLink
            href="/cases/new"
            variant="leaf"
            size="lg"
            className="shrink-0"
          >
            Start a case — free
            <ArrowUpRight className="h-4 w-4" />
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
