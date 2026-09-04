import { Eye, FileLock2, HandHeart, Quote } from "lucide-react";

const safeguards = [
  {
    icon: Quote,
    title: "No unverifiable claims",
    body: "Quotes are re-checked against the source document before you ever see them. Unresolvable citations block the draft instead of shipping inside it.",
  },
  {
    icon: HandHeart,
    title: "You sign, not the agent",
    body: "Overturn drafts, tracks and prepares. Filing is an action you take deliberately, on a document you have read.",
  },
  {
    icon: Eye,
    title: "Every decision is inspectable",
    body: "Each case keeps a full trace: which agent ran, what it read, what it concluded, and where it disagreed with another agent.",
  },
  {
    icon: FileLock2,
    title: "Your documents stay yours",
    body: "Uploads are scoped to your case, never used to train models, and deletable in one action along with everything derived from them.",
  },
];

export function Safeguards() {
  return (
    <section id="safeguards" className="px-3 pb-16 sm:px-5 sm:pb-24">
      <div className="mx-auto max-w-6xl rounded-shell bg-white p-7 ring-1 ring-ink-200/70 sm:p-12">
        <div className="max-w-2xl">
          <h2 className="font-sans text-[clamp(1.75rem,4vw,2.5rem)] leading-[1.05] font-extrabold tracking-[-0.035em] text-ink-900">
            The boring part that makes it trustworthy
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-ink-500">
            A confident letter full of invented citations is worse than no
            letter — it gets your appeal dismissed and costs you the deadline.
            So most of the engineering here went into refusing to produce one.
          </p>
        </div>

        <div className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2">
          {safeguards.map((s) => (
            <div key={s.title} className="flex gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-leaf-100 text-leaf-700">
                <s.icon className="h-[18px] w-[18px]" />
              </span>
              <div>
                <h3 className="font-sans text-[15px] font-bold tracking-[-0.015em] text-ink-900">
                  {s.title}
                </h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-500">
                  {s.body}
                </p>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-10 border-t border-ink-200/70 pt-6 text-[12px] leading-relaxed text-ink-400">
          Overturn is not a law firm, an insurance broker, or a medical
          provider, and nothing it produces is legal or medical advice. It
          prepares documents for you to review, edit and file yourself.
        </p>
      </div>
    </section>
  );
}
