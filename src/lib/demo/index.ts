import appeal from "./fixtures/appeal.json";
import quote from "./fixtures/quote.json";
import order from "./fixtures/order.json";
import blocked from "./fixtures/blocked.json";
import type { CaseRecord } from "@/lib/domain/case";
import type { QuoteRecord } from "@/lib/desks/quotes/record";
import type { OrderRecord } from "@/lib/desks/orders/record";

/**
 * Recorded runs, shipped with the app.
 *
 * These are real runs against the live API, saved verbatim — not mock-ups and
 * not hand-written. They exist so the product can be understood without an API
 * key, without an account, and without spending anyone's quota, and so a demo
 * does not depend on the network behaving on the day.
 *
 * They are rendered by exactly the same components as a live run. The only
 * difference is that nothing can be approved or deleted.
 */
export type DemoDesk = "appeal" | "quote" | "order" | "blocked";

export type DemoMeta = {
  slug: DemoDesk;
  desk: string;
  title: string;
  /** What this particular run demonstrates, in one line. */
  shows: string;
  href: string;
  liveHref: string;
};

export const demoMeta: Record<DemoDesk, DemoMeta> = {
  appeal: {
    slug: "appeal",
    desk: "Appeals",
    title: "A denied MRI, overturned on the payer's own exception",
    shows:
      "Seven citations, every one verified against the uploaded documents. The desk found an exception in Section 4 of the plan's own policy — and caught the denial's stated reason being factually wrong.",
    href: "/demo/appeal",
    liveHref: "/cases/new",
  },
  quote: {
    slug: "quote",
    desk: "Quoting",
    title: "An exterior repaint, priced from a spoken walkthrough",
    shows:
      "Fifteen lines, every one resolved to the contractor's price book. No agent produced a single figure — the totals were computed in code, and they reconcile.",
    href: "/demo/quote",
    liveHref: "/quotes/new",
  },
  blocked: {
    slug: "blocked",
    desk: "Orders",
    title: "An order the desk refused to confirm",
    shows:
      "The gate holding everything back. The account is on stop, so not one of the three lines was confirmed — and the reason is on the page rather than buried in a log. Refusing is a valid outcome here, not a failure.",
    href: "/demo/blocked",
    liveHref: "/orders/new",
  },
  order: {
    slug: "order",
    desk: "Orders",
    title: "A purchase order with three problems in it",
    shows:
      "One line confirmed, three held: a price from a superseded list, a quantity below the minimum, and a product nobody stocks. Each with the reason attached.",
    href: "/demo/order",
    liveHref: "/orders/new",
  },
};

export const demoList = Object.values(demoMeta);

// The fixtures are runs of exactly these shapes; the JSON import loses that.
export const demoAppeal = appeal as unknown as CaseRecord;
export const demoQuote = quote as unknown as QuoteRecord;
export const demoOrder = order as unknown as OrderRecord;
export const demoBlocked = blocked as unknown as OrderRecord;

export function isDemoDesk(value: string): value is DemoDesk {
  return (
    value === "appeal" ||
    value === "quote" ||
    value === "order" ||
    value === "blocked"
  );
}
