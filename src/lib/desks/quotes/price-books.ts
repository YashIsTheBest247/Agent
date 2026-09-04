import type { PriceBook } from "./domain";

/**
 * A worked example price book.
 *
 * Real contractors bring their own — that is the whole point of pricing from a
 * book rather than from a model's idea of what things cost. This one exists so
 * the desk is usable before anyone has uploaded theirs, and so the pricing gate
 * has something concrete to refuse against.
 *
 * Costs are the contractor's buy price in minor units, before margin.
 */
export const decoratorBook: PriceBook = {
  id: "pb_decorator",
  name: "Painting and decorating — worked example",
  currency: "GBP",
  items: [
    // --- Paint and coatings ---
    { sku: "PAINT-EXT-SATIN", name: "Exterior acrylic satin", aliases: ["exterior satin", "outdoor satin"], unit: "litre", unitCostCents: 2400, kind: "material" },
    { sku: "PAINT-EXT-MASONRY", name: "Exterior masonry paint", aliases: ["masonry paint", "smooth masonry"], unit: "litre", unitCostCents: 1850, kind: "material" },
    { sku: "PAINT-INT-EMULSION", name: "Interior vinyl matt emulsion", aliases: ["emulsion", "matt emulsion", "wall paint"], unit: "litre", unitCostCents: 1150, kind: "material" },
    { sku: "PAINT-INT-EGGSHELL", name: "Interior eggshell", aliases: ["eggshell", "woodwork paint"], unit: "litre", unitCostCents: 1950, kind: "material" },
    { sku: "PRIMER-MULTI", name: "Multi-surface primer", aliases: ["primer", "undercoat"], unit: "litre", unitCostCents: 1650, kind: "material" },
    { sku: "STAIN-BLOCK", name: "Stain block", aliases: ["stain blocker", "damp seal"], unit: "litre", unitCostCents: 2200, kind: "material" },

    // --- Preparation and sundries ---
    { sku: "FILLER-INT", name: "Interior filler", aliases: ["filler", "wall filler"], unit: "tub", unitCostCents: 850, kind: "material" },
    { sku: "FILLER-EXT", name: "Exterior filler", aliases: ["exterior filler tub", "outdoor filler"], unit: "tub", unitCostCents: 1150, kind: "material" },
    { sku: "CAULK", name: "Decorators caulk", aliases: ["caulk", "sealant"], unit: "tube", unitCostCents: 320, kind: "material" },
    { sku: "ABRASIVE", name: "Abrasive paper pack", aliases: ["sandpaper", "abrasives"], unit: "pack", unitCostCents: 780, kind: "material" },
    { sku: "MASKING", name: "Masking tape and film", aliases: ["masking", "tape"], unit: "roll", unitCostCents: 640, kind: "material" },
    { sku: "DUSTSHEET", name: "Dust sheet", aliases: ["dust sheets", "sheeting"], unit: "each", unitCostCents: 950, kind: "material" },

    // --- Plant and access ---
    { sku: "SCAFF-TOWER", name: "Scaffold tower hire", aliases: ["tower hire", "access tower"], unit: "day", unitCostCents: 6500, kind: "plant" },
    { sku: "SCAFF-FIXED", name: "Fixed scaffold hire", aliases: ["scaffolding", "scaffold"], unit: "week", unitCostCents: 42000, kind: "plant" },
    { sku: "SPRAY-RIG", name: "Airless sprayer hire", aliases: ["sprayer", "airless"], unit: "day", unitCostCents: 5400, kind: "plant" },
    { sku: "DEHUMIDIFIER", name: "Dehumidifier hire", aliases: ["dehumidifier"], unit: "day", unitCostCents: 2800, kind: "plant" },

    // --- Disposal ---
    { sku: "WASTE-SKIP", name: "Skip hire and disposal", aliases: ["skip", "waste removal", "disposal"], unit: "each", unitCostCents: 28000, kind: "subcontract" },

    // --- Subcontract ---
    { sku: "SUB-PLASTER", name: "Plasterer day rate", aliases: ["plasterer", "plastering"], unit: "day", unitCostCents: 24000, kind: "subcontract" },
    { sku: "SUB-ELECTRIC", name: "Electrician day rate", aliases: ["electrician", "sparks"], unit: "day", unitCostCents: 32000, kind: "subcontract" },
  ],
  labour: [
    { trade: "Decorator", aliases: ["painter", "painter and decorator"], hourlyCents: 3200 },
    { trade: "Senior decorator", aliases: ["foreman", "lead decorator"], hourlyCents: 3900 },
    { trade: "Labourer", aliases: ["general labour", "mate"], hourlyCents: 2100 },
  ],
  settings: {
    taxRatePct: 20,
    targetMarginPct: 28,
    minMarginPct: 15,
    contingencyPct: 10,
    calloutMinimumCents: 18000,
  },
};

export const priceBooks: Record<string, PriceBook> = {
  [decoratorBook.id]: decoratorBook,
};

export const defaultPriceBookId = decoratorBook.id;

export function priceBookById(id: string): PriceBook {
  return priceBooks[id] ?? decoratorBook;
}
