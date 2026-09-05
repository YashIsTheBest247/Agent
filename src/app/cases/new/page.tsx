import Link from "next/link";
import { NewCaseFlow } from "@/components/case/new-case-flow";
import { isGeminiConfigured } from "@/lib/gemini/client";

export const metadata = { title: "Start a case" };
export const dynamic = "force-dynamic";

export default function NewCasePage() {
  return (
    <div className="mx-auto max-w-[900px]">
      <div className="eyebrow">Step one</div>
      <h1 className="mt-3 text-[clamp(1.9rem,4vw,2.6rem)]">
        <span className="display">Hand over the </span>
        <span className="script text-[var(--ok-deep)]">denial</span>
      </h1>
      <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-[var(--text-2)]">
        Nothing is sent to your insurer at any point. The agents read, research
        and draft; you decide whether a word of it ever leaves this screen.
      </p>

      <p className="mt-4 text-[13px] text-[var(--text-2)]">
        Would rather see a finished one first?{" "}
        <Link href="/demo/appeal" className="underline hover:text-[var(--ink)]">
          Open a recorded run
        </Link>
        .
      </p>

      <div className="mt-8">
        <NewCaseFlow configured={isGeminiConfigured()} />
      </div>
    </div>
  );
}
