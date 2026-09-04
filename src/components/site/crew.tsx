import Image from "next/image";

type Member = {
  n: string;
  name: string;
  tier: "Fast" | "Reasoning" | "Code";
  job: string;
};

const crew: Member[] = [
  {
    n: "01",
    name: "Intake",
    tier: "Fast",
    job: "Transcribes the upload literally, then pulls out the claim number, the codes, the amounts and the deadline — each with the line it came from.",
  },
  {
    n: "02",
    name: "Classifier",
    tier: "Fast",
    job: "Collapses the payer's prose onto one of twelve canonical denial reasons. Everything downstream is chosen from this answer.",
  },
  {
    n: "03",
    name: "Coverage",
    tier: "Reasoning",
    job: "Finds the clauses in your own plan that govern the claim, and quotes the payer's criteria back at them.",
  },
  {
    n: "04",
    name: "Evidence",
    tier: "Reasoning",
    job: "Assembles the clinical case, holding the line between what your records prove and what is merely standard practice.",
  },
  {
    n: "05",
    name: "Strategy",
    tier: "Reasoning",
    job: "Picks the appeal level, works the deadline backwards, and prunes to the two or three arguments actually worth making.",
  },
  {
    n: "06",
    name: "Drafter",
    tier: "Reasoning",
    job: "Writes the letter in the register a claims reviewer reads, quoting only from the verified citation pool.",
  },
  {
    n: "07",
    name: "Adversary",
    tier: "Reasoning",
    job: "Reads the draft as the payer's reviewer and hunts for the one sentence that would let them uphold the denial.",
  },
  {
    n: "08",
    name: "Auditor",
    tier: "Code",
    job: "Re-opens each source document and confirms every quote is really there. Not a model — a model grading another model's citations can agree with a quote that does not exist.",
  },
  {
    n: "09",
    name: "Filing",
    tier: "Fast",
    job: "Turns it into actions: where to send it, what to attach, which dates to keep, and what to say if you phone them.",
  },
];

/** Which model tier the agent runs on. "Code" means no model at all. */
const tierTone: Record<Member["tier"], string> = {
  Fast: "border-[var(--line)] text-[var(--text-3)]",
  Reasoning:
    "border-[var(--lime-deep)] bg-[var(--lime-wash)] text-[var(--ok-deep)]",
  Code: "border-[var(--ink)] bg-[var(--ink)] text-white",
};

export function Crew() {
  return (
    <section id="crew" className="mx-auto max-w-[1240px] px-5 pb-20 sm:pb-28">
      <div className="grid gap-10 lg:grid-cols-[200px_1fr]">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="eyebrow">The crew</div>
          <h2 className="mt-3 text-[30px] sm:text-[34px]">
            <span className="display">Nine </span>
            <span className="script text-[var(--ok-deep)]">specialists</span>
          </h2>
          <p className="mt-4 text-[13px] leading-relaxed text-[var(--text-2)]">
            Not one chatbot with nine instructions. Each has a narrow job and a
            typed output, and two of them — the adversary and the auditor —
            exist only to catch the others being wrong.
          </p>

          <div className="mt-6 overflow-hidden rounded-[var(--r-md)]">
            <Image
              src="/img/paperwork.jpg"
              alt="Insurance and tax forms spread across a white desk"
              width={640}
              height={420}
              className="h-44 w-full object-cover"
            />
          </div>
        </div>

        <ul className="border-t border-[var(--line)]">
          {crew.map((member) => (
            <li
              key={member.n}
              className="grid grid-cols-[2.5rem_1fr] gap-x-4 border-b border-[var(--line)] py-5 sm:grid-cols-[3rem_9rem_1fr] sm:gap-x-6"
            >
              <span className="font-mono text-[11px] tracking-[0.14em] text-[var(--text-3)]">
                {member.n}
              </span>

              <div className="flex flex-wrap items-center gap-2 sm:block">
                <h3 className="display text-[17px] tracking-[-0.015em]">
                  {member.name}
                </h3>
                <span
                  className={`mt-1.5 inline-flex rounded-full border px-2 py-0.5 font-mono text-[9px] tracking-[0.12em] uppercase ${tierTone[member.tier]}`}
                >
                  {member.tier}
                </span>
              </div>

              <p className="col-span-2 mt-2 text-[13px] leading-relaxed text-[var(--text-2)] sm:col-span-1 sm:mt-0">
                {member.job}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
