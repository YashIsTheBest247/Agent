import { describe, expect, it } from "vitest";
import { resolveLine, resolveOrder } from "./resolve";
import { electricalCatalog } from "./catalogs";
import type { Catalog, ParsedOrder } from "./domain";

const catalog = electricalCatalog;
const norbury = catalog.customers.find((c) => c.id === "cust_norbury")!;
const halden = catalog.customers.find((c) => c.id === "cust_halden")!;
const pike = catalog.customers.find((c) => c.id === "cust_pike")!;

function line(partial: Partial<ParsedOrder["lines"][number]> = {}) {
  return {
    id: "n1",
    description: "Double socket white",
    quantity: 50,
    unit: "each",
    statedUnitPriceCents: 0,
    verbatim: "50 x double socket white",
    ...partial,
  };
}

function order(partial: Partial<ParsedOrder> = {}): ParsedOrder {
  return {
    buyerName: "Norbury Electrical Contractors",
    buyerEmail: "orders@norburyelec.co.uk",
    poNumber: "PO-8841",
    requestedDate: "2026-10-01",
    deliveryAddress: "Unit 4, Brayford Way",
    lines: [line()],
    instructions: [],
    unclear: [],
    ...partial,
  };
}

describe("resolveLine", () => {
  it("resolves an exact catalogue name and applies the agreed discount", () => {
    const result = resolveLine(line(), catalog, norbury);

    expect(result.sku).toBe("SKT-2G-WH");
    expect(result.confirmable).toBe(true);
    // 340 list less 22% = 265 (rounded), x 50
    expect(result.unitPriceCents).toBe(265);
    expect(result.lineTotalCents).toBe(13_250);
  });

  it("resolves through a trade alias", () => {
    const result = resolveLine(
      line({ description: "2 gang socket", quantity: 20 }),
      catalog,
      norbury,
    );

    expect(result.sku).toBe("SKT-2G-WH");
    expect(result.confirmable).toBe(true);
  });

  it("prices at list when the sender is not a known account", () => {
    const result = resolveLine(line(), catalog, null);

    expect(result.unitPriceCents).toBe(340);
  });

  // The case the gate exists for: a plausible product nobody stocks.
  it("refuses a line the catalogue does not contain", () => {
    const result = resolveLine(
      line({ description: "Smart dimmer module Zigbee" }),
      catalog,
      norbury,
    );

    expect(result.confirmable).toBe(false);
    expect(result.sku).toBeNull();
    expect(result.exceptions[0].code).toBe("unknown_item");
  });

  it("flags an approximate match without blocking it", () => {
    const result = resolveLine(
      line({ description: "double sockett white" }),
      catalog,
      norbury,
    );

    expect(result.confirmable).toBe(true);
    expect(result.exceptions.map((e) => e.code)).toContain("ambiguous_item");
  });

  it("blocks a quantity below the minimum order", () => {
    const result = resolveLine(
      line({ description: "MCB type B 16A", quantity: 4 }),
      catalog,
      norbury,
    );

    expect(result.confirmable).toBe(false);
    expect(result.exceptions.map((e) => e.code)).toContain("below_minimum");
  });

  it("blocks a nonsensical quantity", () => {
    expect(resolveLine(line({ quantity: 0 }), catalog, norbury).confirmable).toBe(false);
    expect(resolveLine(line({ quantity: -5 }), catalog, norbury).confirmable).toBe(false);
  });

  it("allows a short-stocked line through as a backorder when the book permits it", () => {
    const result = resolveLine(
      line({ description: "Emergency exit sign LED", quantity: 20 }),
      catalog,
      norbury,
    );

    expect(result.confirmable).toBe(true);
    expect(result.availableNow).toBe(8);
    expect(result.exceptions.map((e) => e.code)).toContain("insufficient_stock");
  });

  it("blocks a short-stocked line when backorders are off", () => {
    const strict: Catalog = {
      ...catalog,
      settings: { ...catalog.settings, backorderAllowed: false },
    };
    const result = resolveLine(
      line({ description: "Emergency exit sign LED", quantity: 20 }),
      strict,
      norbury,
    );

    expect(result.confirmable).toBe(false);
  });

  // Ordering at last year's price is the commonest cause of a disputed invoice.
  it("blocks a line ordered at a price the customer no longer has", () => {
    const result = resolveLine(
      line({ statedUnitPriceCents: 210 }),
      catalog,
      norbury,
    );

    expect(result.confirmable).toBe(false);
    expect(result.exceptions.map((e) => e.code)).toContain("price_mismatch");
  });

  it("accepts a stated price inside the tolerance", () => {
    const result = resolveLine(
      line({ statedUnitPriceCents: 266 }),
      catalog,
      norbury,
    );

    expect(result.confirmable).toBe(true);
  });
});

describe("resolveOrder", () => {
  it("confirms a clean order end to end", () => {
    const resolved = resolveOrder(order(), catalog);

    expect(resolved.customer?.id).toBe("cust_norbury");
    expect(resolved.clean).toBe(true);
    expect(resolved.confirmable).toHaveLength(1);
    expect(resolved.confirmedSubtotalCents).toBe(13_250);
  });

  it("matches the account on email even when the name is written differently", () => {
    const resolved = resolveOrder(
      order({ buyerName: "Norbury Elec." }),
      catalog,
    );

    expect(resolved.customer?.id).toBe("cust_norbury");
  });

  // The demo: most lines clear, the rest go to a person.
  it("confirms what it can and holds the rest", () => {
    const resolved = resolveOrder(
      order({
        lines: [
          line({ id: "n1" }),
          line({ id: "n2", description: "Light switch 1 gang 2 way", quantity: 30 }),
          line({ id: "n3", description: "Smart dimmer module Zigbee", quantity: 5 }),
        ],
      }),
      catalog,
    );

    expect(resolved.confirmable.map((l) => l.id)).toEqual(["n1", "n2"]);
    expect(resolved.held.map((l) => l.id)).toEqual(["n3"]);
    expect(resolved.anythingConfirmable).toBe(true);
    expect(resolved.clean).toBe(false);
  });

  it("holds everything for a customer on stop", () => {
    const resolved = resolveOrder(
      order({ buyerName: pike.name, buyerEmail: pike.emails[0] }),
      catalog,
    );

    expect(resolved.confirmable).toHaveLength(0);
    expect(resolved.exceptions.map((e) => e.code)).toContain("customer_on_hold");
  });

  it("holds an order that would breach the credit limit", () => {
    // Halden has 58,000 of headroom; 100 panels well exceeds it.
    const resolved = resolveOrder(
      order({
        buyerName: halden.name,
        buyerEmail: halden.emails[0],
        lines: [line({ description: "LED panel 600x600 40W", quantity: 30 })],
      }),
      catalog,
    );

    expect(resolved.exceptions.map((e) => e.code)).toContain("credit_limit");
    expect(resolved.confirmable).toHaveLength(0);
    expect(resolved.confirmedSubtotalCents).toBe(0);
  });

  it("flags an unrecognised sender rather than guessing their terms", () => {
    const resolved = resolveOrder(
      order({ buyerName: "Someone Else Ltd", buyerEmail: "bob@nowhere.test" }),
      catalog,
    );

    expect(resolved.customer).toBeNull();
    expect(resolved.exceptions.map((e) => e.code)).toContain("unknown_customer");
    expect(resolved.confirmable).toHaveLength(0);
  });

  it("routes a large but otherwise clean order to a person without blocking it", () => {
    // Three lines, each inside stock and above its minimum, totalling roughly
    // £6,900 net — over the £5,000 threshold and inside Norbury's credit.
    const resolved = resolveOrder(
      order({
        lines: [
          line({ id: "n1", description: "Twin and earth cable 1.5mm 100m", quantity: 42 }),
          line({ id: "n2", description: "Twin and earth cable 2.5mm 100m", quantity: 18 }),
          line({ id: "n3", description: "Double socket white", quantity: 800 }),
        ],
      }),
      catalog,
    );

    expect(resolved.confirmedSubtotalCents).toBeGreaterThan(
      catalog.settings.manualReviewAboveCents,
    );
    expect(resolved.exceptions.map((e) => e.code)).toEqual([
      "manual_review_threshold",
    ]);
    // Flagged for a signature, but nothing is blocked.
    expect(resolved.confirmable).toHaveLength(3);
    expect(resolved.held).toHaveLength(0);
  });

  it("reports an order with no lines rather than calling it clean", () => {
    const resolved = resolveOrder(order({ lines: [] }), catalog);

    expect(resolved.clean).toBe(false);
    expect(resolved.anythingConfirmable).toBe(false);
  });
});
