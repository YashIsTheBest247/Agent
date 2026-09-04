import { Check } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const tiers = [
  {
    name: "Self-serve",
    blurb: "For one bill you refuse to just pay",
    price: "Free",
    cadence: "one case",
    href: "/cases/new" as const,
    featured: false,
    features: [
      "Full nine-agent appeal run",
      "Citation-verified draft letter",
      "Deadline tracking and reminders",
      "Export as PDF or DOCX",
      "You file it yourself",
    ],
  },
  {
    name: "Advocate",
    blurb: "For a fight that goes more than one round",
    price: "$39",
    cadence: "per case",
    href: "/cases/new" as const,
    featured: true,
    features: [
      "Everything in Self-serve",
      "Level 2 and external review escalation",
      "Payer-specific submission routing",
      "Agent status calls to the payer",
      "Unlimited revisions on the draft",
      "Human review before filing",
    ],
  },
  {
    name: "Clinic",
    blurb: "For a billing team with a denial worklist",
    price: "$499",
    cadence: "per month",
    href: "/#contact" as const,
    featured: false,
    features: [
      "Batch intake from your worklist",
      "Shared exception queue and assignment",
      "Per-payer templates and rules",
      "API access and webhooks",
      "Audit log for every agent decision",
    ],
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="px-3 py-16 sm:px-5 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-sans text-[clamp(2rem,5vw,3.25rem)] leading-[1.02] font-extrabold tracking-[-0.035em] text-ink-900">
            Cheaper than giving up
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-ink-500">
            The first case is free because the point is to find out whether your
            denial was wrong. Most of them are.
          </p>
        </div>

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {tiers.map((tier) => (
            <article
              key={tier.name}
              className={cn(
                "flex flex-col rounded-card-lg p-6 sm:p-7",
                tier.featured
                  ? "bg-leaf-500 text-ink-900 shadow-[0_30px_70px_-30px_rgba(95,170,40,0.85)] ring-1 ring-leaf-600/40 lg:-my-3 lg:py-10"
                  : "bg-ink-900 text-white ring-1 ring-ink-800",
              )}
            >
              <p
                className={cn(
                  "text-[11px] font-semibold tracking-[0.12em] uppercase",
                  tier.featured ? "text-leaf-900/70" : "text-ink-400",
                )}
              >
                What you get
              </p>

              <ul className="mt-4 flex flex-1 flex-col gap-2.5">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-[13px]">
                    <span
                      className={cn(
                        "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
                        tier.featured
                          ? "bg-ink-900/15 text-ink-900"
                          : "bg-leaf-500/20 text-leaf-400",
                      )}
                    >
                      <Check className="h-2.5 w-2.5" strokeWidth={3} />
                    </span>
                    <span
                      className={
                        tier.featured ? "text-leaf-900/85" : "text-white/75"
                      }
                    >
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              <div
                className={cn(
                  "mt-8 border-t pt-6",
                  tier.featured ? "border-ink-900/15" : "border-white/10",
                )}
              >
                <h3 className="font-sans text-xl font-bold tracking-[-0.02em]">
                  {tier.name}
                </h3>
                <p
                  className={cn(
                    "mt-1 text-[12px]",
                    tier.featured ? "text-leaf-900/65" : "text-ink-400",
                  )}
                >
                  {tier.blurb}
                </p>

                <p className="mt-5 flex items-baseline gap-1.5">
                  <span className="font-sans text-4xl font-extrabold tracking-[-0.04em]">
                    {tier.price}
                  </span>
                  <span
                    className={cn(
                      "text-[12px]",
                      tier.featured ? "text-leaf-900/65" : "text-ink-400",
                    )}
                  >
                    / {tier.cadence}
                  </span>
                </p>

                <ButtonLink
                  href={tier.href}
                  variant={tier.featured ? "ink" : "white"}
                  size="md"
                  className="mt-5 w-full"
                >
                  Get started
                </ButtonLink>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
