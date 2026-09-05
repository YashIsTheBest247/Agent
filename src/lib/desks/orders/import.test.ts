import { describe, expect, it } from "vitest";
import { importCatalog, catalogTemplate } from "./import";
import { electricalCatalog } from "./catalogs";

const meta = { id: "cat_test", name: "Test" };

describe("importCatalog", () => {
  it("imports the template it offers", () => {
    const result = importCatalog(catalogTemplate, electricalCatalog, meta);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.items).toHaveLength(2);
    expect(result.value.items[0].listPriceCents).toBe(13400);
    expect(result.value.items[1].aliases).toContain("2 gang socket");
  });

  // The gate answers "in stock at the agreed price"; a row missing either
  // cannot be gated, so it cannot be confirmed.
  it("refuses a row with unreadable stock", () => {
    const result = importCatalog("name,price,stock\nSocket,3.40,unknown", electricalCatalog, meta);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0]).toMatch(/availability is unknown/i);
  });

  it("refuses a row with an unreadable price", () => {
    expect(importCatalog("name,price,stock\nSocket,POA,10", electricalCatalog, meta).ok).toBe(false);
  });

  it("keeps the customer file from the base catalogue", () => {
    const result = importCatalog(catalogTemplate, electricalCatalog, meta);
    if (!result.ok) throw new Error("expected success");

    expect(result.value.customers).toBe(electricalCatalog.customers);
  });
});
