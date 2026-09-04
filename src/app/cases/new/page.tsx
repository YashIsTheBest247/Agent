import { Pill } from "@/components/ui/pill";
import { NewCaseFlow } from "@/components/case/new-case-flow";
import { isGeminiConfigured } from "@/lib/gemini/client";

export const metadata = { title: "Start a case" };
export const dynamic = "force-dynamic";

export default function NewCasePage() {
  return (
    <div className="mx-auto max-w-3xl">
      <Pill tone="leaf">New case</Pill>
      <h1 className="mt-4 font-sans text-3xl font-extrabold tracking-[-0.03em] text-ink-900">
        Upload the denial
      </h1>
      <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-ink-500">
        Nothing is sent to your insurer at any point. The agents read, research
        and draft; you decide whether a word of it ever leaves this screen.
      </p>

      <div className="mt-8">
        <NewCaseFlow configured={isGeminiConfigured()} />
      </div>
    </div>
  );
}
