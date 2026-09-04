import { describe, expect, it } from "vitest";
import { priceLine, priceTakeoff } from "./pricing";
import type { PriceBook, TakeoffLine } from "./domain";

const book: PriceBook = {
  id: "pb_test",
  name: "Test decorator",
  currency: "GBP",
  items: [
    {
      sku: "PAINT-EXT-SATIN",
      name: "Exterior acrylic satin",
      aliases: ["exterior satin", "outdoor satin paint"],
      unit: "litre",
      unitCostCents: 2400,
      kind: "material",
    },
    {
      sku: "FILLER-EXT",
      name: "Exterior filler",
      aliases: ["exterior filler tub"],
      unit: "tub",
      unitCostCents: 1150,
      kind: "material",
    },
    {
      sku: "SCAFF-TOWER",
      name: "Scaffold tower hire",
      aliases: ["tower hire", "access tower"],
      unit: "day",
      unitCostCents: 6500,
      kind: "plant",
    },
  ],
  labour: [
    { trade: "Decorator", aliases: ["painter"], hourlyCents: 3200 },
    { trade: "Labourer", aliases: ["general labour"], hourlyCents: 2100 },
  ],
  settings: {
    taxRatePct: 20,
    targetMarginPct: 25,
    minMarginPct: 12,
    contingencyPct: 10,
    calloutMinimumCents: 15000,
  },
};

function line(partial: Partial<TakeoffLine>): TakeoffLine {
  return {
    id: "l1",
    taskId: "t1",
    description: "Exterior acrylic satin",
    kind: "material",
    quantity: 10,
    unit: "litre",
    basis: "18 m2 at two coats",
    ...partial,
  };
}

describe("priceLine", () => {
  it("resolves an exact catalogue name", () => {
    const result = priceLine(line({}), book);

    expect(result.resolution).toBe("exact");
    expect(result.sku).toBe("PAINT-EXT-SATIN");
    expect(result.unitCostCents).toBe(2400);
    expect(result.lineCostCents).toBe(24_000);
  });

  it("resolves through a trade alias", () => {
    const result = priceLine(
      line({ description: "outdoor satin paint", quantity: 5 }),
      book,
    );

    expect(result.sku).toBe("PAINT-EXT-SATIN");
    expect(result.lineCostCents).toBe(12_000);
  });

  it("resolves labour against the trade rates", () => {
    const result = priceLine(
      line({ description: "Painter", kind: "labour", quantity: 6, unit: "hour" }),
      book,
    );

    expect(result.sku).toBe("LABOUR:Decorator");
    expect(result.lineCostCents).toBe(19_200);
  });

  it("rounds a fractional quantity once, to whole minor units", () => {
    const result = priceLine(
      line({ description: "Decorator", kind: "labour", quantity: 3.5 }),
      book,
    );

    expect(result.lineCostCents).toBe(11_200);
    expect(Number.isInteger(result.lineCostCents)).toBe(true);
  });

  // The case the gate exists for: a plausible product that is not stocked.
  it("refuses to price an item the book does not contain", () => {
    const result = priceLine(
      line({ description: "Anti-graffiti clear coat" }),
      book,
    );

    expect(result.resolution).toBe("unresolved");
    expect(result.lineCostCents).toBeNull();
    expect(result.note).toMatch(/no price-book entry/i);
  });

  it("flags an approximate match rather than pricing it silently", () => {
    const result = priceLine(line({ description: "exterior fillar" }), book);

    expect(result.resolution).toBe("near");
    expect(result.sku).toBe("FILLER-EXT");
    expect(result.note).toMatch(/confirm/i);
  });

  it("rejects a nonsensical quantity", () => {
    expect(priceLine(line({ quantity: 0 }), book).resolution).toBe("unresolved");
    expect(priceLine(line({ quantity: -4 }), book).resolution).toBe("unresolved");
  });
});

describe("priceTakeoff", () => {
  const goodLines = [
    line({ id: "l1", description: "Exterior acrylic satin", quantity: 10 }),
    line({
      id: "l2",
      description: "Decorator",
      kind: "labour",
      quantity: 16,
      unit: "hour",
    }),
  ];

  it("computes the whole quote in integer minor units", () => {
    const math = priceTakeoff(goodLines, book);

    // 10 x 2400 = 24000, 16 x 3200 = 51200
    expect(math.costSubtotalCents).toBe(75_200);
    expect(math.contingencyCents).toBe(7_520); // 10%
    expect(math.marginCents).toBe(20_680); // 25% of 82720
    expect(math.netCents).toBe(103_400);
    expect(math.taxCents).toBe(20_680); // 20%
    expect(math.totalCents).toBe(124_080);
    expect(math.passed).toBe(true);
  });

  it("keeps every figure a whole number of minor units", () => {
    const math = priceTakeoff(
      [line({ description: "Decorator", kind: "labour", quantity: 7.33 })],
      book,
    );

    for (const value of [
      math.costSubtotalCents,
      math.contingencyCents,
      math.marginCents,
      math.netCents,
      math.taxCents,
      math.totalCents,
    ]) {
      expect(Number.isInteger(value)).toBe(true);
    }
  });

  it("totals reconcile — net is cost plus contingency plus margin", () => {
    const math = priceTakeoff(goodLines, book);

    expect(math.netCents).toBe(
      math.costSubtotalCents + math.contingencyCents + math.marginCents,
    );
    expect(math.totalCents).toBe(math.netCents + math.taxCents);
  });

  it("blocks the quote when any line cannot be priced", () => {
    const math = priceTakeoff(
      [...goodLines, line({ id: "l3", description: "Anti-graffiti clear coat" })],
      book,
    );

    expect(math.passed).toBe(false);
    expect(math.unresolved.map((l) => l.id)).toEqual(["l3"]);
    expect(math.blocking.join(" ")).toMatch(/anti-graffiti/i);
  });

  it("blocks an empty takeoff instead of quoting zero", () => {
    const math = priceTakeoff([], book);

    expect(math.passed).toBe(false);
    expect(math.blocking.join(" ")).toMatch(/no lines/i);
  });

  it("applies a contingency the risk agent argued for", () => {
    const math = priceTakeoff(goodLines, book, { contingencyPct: 25 });

    expect(math.contingencyPct).toBe(25);
    expect(math.contingencyCents).toBe(18_800);
  });

  it("lifts a tiny job to the call-out minimum and says so", () => {
    const math = priceTakeoff(
      [line({ description: "Exterior filler", quantity: 1, unit: "tub" })],
      book,
    );

    expect(math.netCents).toBe(book.settings.calloutMinimumCents);
    expect(math.warnings.join(" ")).toMatch(/call-out minimum/i);
  });

  // A margin floor is what stops the desk quoting a job the contractor
  // would lose money doing.
  it("blocks a quote that would fall below the margin floor", () => {
    const thinBook: PriceBook = {
      ...book,
      settings: {
        ...book.settings,
        targetMarginPct: 4,
        minMarginPct: 12,
        contingencyPct: 0,
        calloutMinimumCents: 0,
      },
    };

    const math = priceTakeoff(goodLines, thinBook);

    expect(math.passed).toBe(false);
    expect(math.blocking.join(" ")).toMatch(/loses money/i);
  });

  it("passes a near match but surfaces it as a warning", () => {
    const math = priceTakeoff(
      [line({ description: "exterior fillar", quantity: 2, unit: "tub" })],
      book,
    );

    expect(math.passed).toBe(true);
    expect(math.warnings.join(" ")).toMatch(/confirm/i);
  });
});
