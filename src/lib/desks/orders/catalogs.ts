import type { Catalog } from "./domain";

/**
 * A worked example catalogue and customer file.
 *
 * Real distributors bring their own — that is the point of resolving against a
 * catalogue rather than against a model's idea of what a product is. This one
 * exists so the desk is usable before anyone connects theirs, and so the gate
 * has something concrete to refuse against.
 *
 * Stock levels and credit are deliberately tight in places, because an order
 * book where nothing ever goes wrong does not exercise the exception queue.
 */
export const electricalCatalog: Catalog = {
  id: "cat_electrical",
  name: "Electrical wholesale — worked example",
  items: [
    { sku: "CBL-TE-1.5-100", name: "Twin and earth cable 1.5mm 100m", aliases: ["1.5mm t&e", "twin and earth 1.5", "6242y 1.5"], unit: "drum", listPriceCents: 8900, stockOnHand: 42, leadTimeDays: 3, minOrderQty: 1 },
    { sku: "CBL-TE-2.5-100", name: "Twin and earth cable 2.5mm 100m", aliases: ["2.5mm t&e", "twin and earth 2.5", "6242y 2.5"], unit: "drum", listPriceCents: 13400, stockOnHand: 18, leadTimeDays: 3, minOrderQty: 1 },
    { sku: "CBL-SWA-4C-6", name: "SWA armoured cable 4 core 6mm", aliases: ["armoured 4 core 6mm", "swa 6mm 4c"], unit: "metre", listPriceCents: 740, stockOnHand: 300, leadTimeDays: 5, minOrderQty: 25 },

    { sku: "CU-10WAY-MAIN", name: "Consumer unit 10 way dual RCD", aliases: ["consumer unit 10 way", "fuse board 10 way", "cu 10way"], unit: "each", listPriceCents: 9850, stockOnHand: 12, leadTimeDays: 7, minOrderQty: 1 },
    { sku: "MCB-B16", name: "MCB type B 16A", aliases: ["16 amp mcb", "b16 breaker"], unit: "each", listPriceCents: 620, stockOnHand: 240, leadTimeDays: 2, minOrderQty: 10 },
    { sku: "MCB-B32", name: "MCB type B 32A", aliases: ["32 amp mcb", "b32 breaker"], unit: "each", listPriceCents: 680, stockOnHand: 180, leadTimeDays: 2, minOrderQty: 10 },
    { sku: "RCBO-B20", name: "RCBO type B 20A", aliases: ["rcbo 20a", "20 amp rcbo"], unit: "each", listPriceCents: 1890, stockOnHand: 64, leadTimeDays: 4, minOrderQty: 5 },

    { sku: "SKT-2G-WH", name: "Double socket white", aliases: ["2 gang socket", "double socket", "twin socket"], unit: "each", listPriceCents: 340, stockOnHand: 800, leadTimeDays: 1, minOrderQty: 10 },
    { sku: "SKT-2G-BR", name: "Double socket brushed steel", aliases: ["2 gang brushed steel", "steel double socket"], unit: "each", listPriceCents: 890, stockOnHand: 96, leadTimeDays: 4, minOrderQty: 5 },
    { sku: "SW-1G-2W", name: "Light switch 1 gang 2 way", aliases: ["1 gang switch", "single light switch"], unit: "each", listPriceCents: 285, stockOnHand: 520, leadTimeDays: 1, minOrderQty: 10 },

    { sku: "BB-35-SQ", name: "Back box 35mm metal", aliases: ["35mm back box", "metal back box"], unit: "each", listPriceCents: 120, stockOnHand: 1400, leadTimeDays: 1, minOrderQty: 25 },
    { sku: "CON-20-PVC", name: "PVC conduit 20mm 3m", aliases: ["20mm conduit", "pvc conduit"], unit: "length", listPriceCents: 410, stockOnHand: 260, leadTimeDays: 2, minOrderQty: 10 },
    { sku: "TRUNK-50", name: "Mini trunking 50x50 3m", aliases: ["50mm trunking", "mini trunking"], unit: "length", listPriceCents: 980, stockOnHand: 88, leadTimeDays: 3, minOrderQty: 5 },

    { sku: "LED-PANEL-600", name: "LED panel 600x600 40W", aliases: ["600 led panel", "led ceiling panel"], unit: "each", listPriceCents: 2450, stockOnHand: 34, leadTimeDays: 6, minOrderQty: 2 },
    { sku: "LED-DL-8W", name: "LED downlight 8W fire rated", aliases: ["fire rated downlight", "8w downlight"], unit: "each", listPriceCents: 890, stockOnHand: 410, leadTimeDays: 2, minOrderQty: 10 },
    { sku: "EM-EXIT-LED", name: "Emergency exit sign LED", aliases: ["exit sign", "emergency exit light"], unit: "each", listPriceCents: 3200, stockOnHand: 8, leadTimeDays: 12, minOrderQty: 1 },

    { sku: "GLND-20-BR", name: "Brass cable gland 20mm", aliases: ["20mm gland", "brass gland"], unit: "each", listPriceCents: 190, stockOnHand: 640, leadTimeDays: 1, minOrderQty: 20 },
    { sku: "TAPE-PVC-BLK", name: "PVC insulating tape black", aliases: ["insulating tape", "electrical tape"], unit: "roll", listPriceCents: 95, stockOnHand: 900, leadTimeDays: 1, minOrderQty: 20 },
  ],
  customers: [
    {
      id: "cust_norbury",
      name: "Norbury Electrical Contractors",
      emails: ["orders@norburyelec.co.uk", "kate@norburyelec.co.uk"],
      agreedDiscountPct: 22,
      creditLimitCents: 1_500_000,
      creditUsedCents: 430_000,
      onHold: false,
    },
    {
      id: "cust_halden",
      name: "Halden Facilities Group",
      emails: ["purchasing@halden-fm.com"],
      agreedDiscountPct: 15,
      creditLimitCents: 800_000,
      creditUsedCents: 742_000,
      onHold: false,
    },
    {
      id: "cust_pike",
      name: "Pike & Sons Ltd",
      emails: ["accounts@pikeandsons.co.uk"],
      agreedDiscountPct: 10,
      creditLimitCents: 250_000,
      creditUsedCents: 61_000,
      onHold: true,
    },
  ],
  settings: {
    currency: "GBP",
    priceTolerancePct: 2,
    backorderAllowed: true,
    manualReviewAboveCents: 500_000,
  },
};

export const catalogs: Record<string, Catalog> = {
  [electricalCatalog.id]: electricalCatalog,
};

export const defaultCatalogId = electricalCatalog.id;

export function catalogById(id: string): Catalog {
  return catalogs[id] ?? electricalCatalog;
}
