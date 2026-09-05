import { describe, expect, it } from "vitest";
import { moneyToCents, parseCsv, toList, toNumber } from "./csv";

describe("parseCsv", () => {
  it("reads a simple sheet", () => {
    expect(parseCsv("name,cost\nPaint,18.50")).toEqual([
      { name: "Paint", cost: "18.50" },
    ]);
  });

  // Exports from accounting software routinely contain all three of these.
  it("keeps commas inside quoted fields", () => {
    const rows = parseCsv('name,cost\n"Paint, exterior, satin",18.50');
    expect(rows[0].name).toBe("Paint, exterior, satin");
    expect(rows[0].cost).toBe("18.50");
  });

  it("handles escaped quotes", () => {
    const rows = parseCsv('name\n"Board 8"" x 4"""');
    expect(rows[0].name).toBe('Board 8" x 4"');
  });

  it("handles a newline inside a quoted field", () => {
    const rows = parseCsv('name,note\n"Paint","two\ncoats"');
    expect(rows).toHaveLength(1);
    expect(rows[0].note).toBe("two\ncoats");
  });

  it("accepts CRLF line endings", () => {
    expect(parseCsv("name,cost\r\nPaint,18.50\r\n")).toHaveLength(1);
  });

  // The same column arrives named a dozen ways across different systems.
  it("normalises header names", () => {
    const rows = parseCsv("Unit Cost,Min. Order\n18.50,10");
    expect(rows[0].unitcost).toBe("18.50");
    expect(rows[0].minorder).toBe("10");
  });

  it("returns nothing for a header with no rows", () => {
    expect(parseCsv("name,cost")).toEqual([]);
  });
});

describe("moneyToCents", () => {
  it.each([
    ["18.50", 1850],
    ["£1,284.50", 128450],
    ["1284.5", 128450],
    ["0.05", 5],
  ])("reads %s as %i", (input, expected) => {
    expect(moneyToCents(input)).toBe(expected);
  });

  it("returns null for anything unreadable", () => {
    expect(moneyToCents("")).toBeNull();
    expect(moneyToCents("POA")).toBeNull();
  });
});

describe("toList and toNumber", () => {
  it("splits aliases on pipes and semicolons", () => {
    expect(toList("t&e | twin and earth; 6242y")).toEqual([
      "t&e",
      "twin and earth",
      "6242y",
    ]);
  });

  it("falls back when a number cannot be read", () => {
    expect(toNumber("", 5)).toBe(5);
    expect(toNumber("12", 5)).toBe(12);
  });
});
