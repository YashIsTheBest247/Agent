import Link from "next/link";
import { NewOrderFlow } from "@/components/order/new-order-flow";
import { isGeminiConfigured } from "@/lib/gemini/client";

export const metadata = { title: "New order" };
export const dynamic = "force-dynamic";

export default function NewOrderPage() {
  return (
    <div className="mx-auto max-w-[900px]">
      <div className="eyebrow">Step one</div>
      <h1 className="mt-3 text-[clamp(1.9rem,4vw,2.6rem)]">
        <span className="display">Hand over the </span>
        <span className="script text-[var(--ok-deep)]">order</span>
      </h1>
      <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-[var(--text-2)]">
        Paste it however it arrived. What resolves cleanly is confirmed; what
        does not goes to a queue with the reason attached.
      </p>

      <p className="mt-4 text-[13px] text-[var(--text-2)]">
        Would rather see a finished one first?{" "}
        <Link href="/demo/order" className="underline hover:text-[var(--ink)]">
          Open a recorded run
        </Link>
        .
      </p>

      <div className="mt-8">
        <NewOrderFlow configured={isGeminiConfigured()} />
      </div>
    </div>
  );
}
