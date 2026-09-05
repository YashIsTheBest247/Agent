import Link from "next/link";
import { NewQuoteFlow } from "@/components/quote/new-quote-flow";
import { isGeminiConfigured } from "@/lib/gemini/client";

export const metadata = { title: "New quote" };
export const dynamic = "force-dynamic";

export default function NewQuotePage() {
  return (
    <div className="mx-auto max-w-[900px]">
      <div className="eyebrow">Step one</div>
      <h1 className="mt-3 text-[clamp(1.9rem,4vw,2.6rem)]">
        <span className="display">Walk the </span>
        <span className="script text-[var(--ok-deep)]">site</span>
      </h1>
      <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-[var(--text-2)]">
        Talk through what you saw and photograph what matters. Nothing is sent to
        your customer — you read the quote and decide whether it goes out.
      </p>

      <p className="mt-4 text-[13px] text-[var(--text-2)]">
        Would rather see a finished one first?{" "}
        <Link href="/demo/quote" className="underline hover:text-[var(--ink)]">
          Open a recorded run
        </Link>
        .
      </p>

      <div className="mt-8">
        <NewQuoteFlow configured={isGeminiConfigured()} />
      </div>
    </div>
  );
}
