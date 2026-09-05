import { describe, expect, it } from "vitest";
import { importPriceBook, priceBookTemplate } from "./import";

const meta = { id: "pb_test", name: "Test", currency: "GBP" };

describe("importPriceBook", () => {
  it("imports the template it offers", () => {
    const result = importPriceBook(priceBookTemplate, meta);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.items).toHaveLength(3);
    expect(result.value.labour).toHaveLength(1);
    expect(result.value.labour[0].hourlyCents).toBe(3200);
  });

  it("routes labour rows to the trades, not the catalogue", () => {
    const result = importPriceBook("name,kind,unit,cost\nDecorator,labour,hour,32.00", meta);
    if (!result.ok) throw new Error("expected success");

    expect(result.value.items).toHaveLength(0);
    expect(result.value.labour[0].trade).toBe("Decorator");
  });

  // A zero cost here becomes a quote the contractor loses money on, so it is
  // a rejection rather than a warning.
  it("refuses a row whose cost cannot be read", () => {
    const result = importPriceBook("name,cost\nPaint,POA", meta);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0]).toMatch(/loses money/i);
  });

  it("derives a SKU when the sheet has none", () => {
    const result = importPriceBook("name,cost\nExterior masonry paint,18.50", meta);
    if (!result.ok) throw new Error("expected success");

    expect(result.value.items[0].sku).toBe("EXTERIOR-MASONRY-PAINT");
  });

  it("rejects a sheet with no usable rows", () => {
    expect(importPriceBook("name,cost", meta).ok).toBe(false);
  });
});
