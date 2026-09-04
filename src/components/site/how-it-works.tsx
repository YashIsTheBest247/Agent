import {
  FileSearch,
  GitBranch,
  Gavel,
  Library,
  PenLine,
  ScanLine,
  Send,
  ShieldAlert,
  Stethoscope,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Pill } from "@/components/ui/pill";

type Agent = { name: string; role: string; icon: LucideIcon };

type Stage = {
  index: string;
  title: string;
  summary: string;
  agents: Agent[];
};

const stages: Stage[] = [
  {
    index: "01",
    title: "Understand the denial",
    summary:
      "Denial letters are deliberately vague. Three agents turn yours into structured, checkable facts.",
    agents: [
      {
        name: "Intake",
        role: "Pulls claim number, codes, dates and amounts out of scans and PDFs",
        icon: ScanLine,
      },
      {
        name: "Classifier",
        role: "Maps the payer's wording to a canonical denial reason",
        icon: GitBranch,
      },
      {
        name: "Coverage",
        role: "Finds the clauses in your own policy that govern this claim",
        icon: Library,
      },
    ],
  },
  {
    index: "02",
    title: "Build the argument",
    summary:
      "The strongest appeal quotes the payer's own criteria back at them. Three agents assemble that case.",
    agents: [
      {
        name: "Strategy",
        role: "Picks the appeal level, the deadline, and the arguments worth making",
        icon: FileSearch,
      },
      {
        name: "Evidence",
        role: "Gathers clinical criteria and guidelines supporting necessity",
        icon: Stethoscope,
      },
      {
        name: "Drafter",
        role: "Writes the letter in the format that payer actually accepts",
        icon: PenLine,
      },
    ],
  },
  {
    index: "03",
    title: "Attack it before they do",
    summary:
      "This is the part most AI tools skip. Nothing reaches you until it has survived review.",
    agents: [
      {
        name: "Adversary",
        role: "Plays the insurance reviewer and tries to reject your own draft",
        icon: Gavel,
      },
      {
        name: "Auditor",
        role: "Blocks the draft if any quote fails to resolve to real source text",
        icon: ShieldAlert,
      },
      {
        name: "Filing",
        role: "Tracks the deadline and the next escalation after you approve",
        icon: Send,
      },
    ],
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="px-3 py-16 sm:px-5 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <Pill tone="leaf">How it works</Pill>
          <h2 className="mt-5 font-sans text-[clamp(2rem,5vw,3.25rem)] leading-[1.02] font-extrabold tracking-[-0.035em] text-ink-900">
            What is Overturn?
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-ink-500">
            An appeals desk that runs as nine specialist agents instead of one
            chatbot. Each has a narrow job, and the last three exist only to
            catch the first six being wrong.
          </p>
        </div>

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {stages.map((stage) => (
            <article
              key={stage.index}
              className="relative flex flex-col rounded-card-lg bg-white p-6 ring-1 ring-ink-200/70 transition-shadow duration-300 hover:shadow-[0_28px_60px_-32px_rgba(30,58,14,0.35)]"
            >
              <div className="flex items-baseline gap-3">
                <span className="font-sans text-[13px] font-bold tracking-[0.12em] text-leaf-600">
                  {stage.index}
                </span>
                <h3 className="font-sans text-lg font-bold tracking-[-0.02em] text-ink-900">
                  {stage.title}
                </h3>
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-ink-500">
                {stage.summary}
              </p>

              <ul className="mt-6 flex flex-1 flex-col gap-2.5">
                {stage.agents.map((agent) => (
                  <li
                    key={agent.name}
                    className="flex gap-3 rounded-2xl bg-surface-muted p-3.5 ring-1 ring-ink-200/50"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-leaf-700 ring-1 ring-ink-200/70">
                      <agent.icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-ink-900">
                        {agent.name}
                      </p>
                      <p className="mt-0.5 text-[12px] leading-snug text-ink-500">
                        {agent.role}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <p className="mx-auto mt-10 max-w-2xl text-center text-[13px] leading-relaxed text-ink-500">
          <span className="font-semibold text-ink-800">
            Overturn never sends anything on its own.
          </span>{" "}
          Every letter waits for your signature, and every claim it makes is
          traceable to a line in a document you can open.
        </p>
      </div>
    </section>
  );
}
