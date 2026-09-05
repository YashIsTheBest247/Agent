import { moneyToCents, parseCsv, toList, toNumber } from "@/lib/csv";
import type { LineKind, PriceBook, PriceBookItem, LabourRate } from "./domain";

/**
 * Turns a contractor's exported price list into a price book.
 *
 * Forgiving about column names and strict about money: a row whose cost cannot
 * be read is reported rather than silently priced at zero, because a zero here
 * becomes a quote the contractor loses money on.
 */
export type ImportResult<T> =
  | { ok: true; value: T; warnings: string[] }
  | { ok: false; errors: string[] };

const KINDS: LineKind[] = ["material", "labour", "plant", "subcontract"];

export const priceBookTemplate = `name,kind,unit,cost,aliases
Exterior masonry paint,material,litre,18.50,masonry paint|smooth masonry
Scaffold tower hire,plant,day,65.00,tower hire
Decorator,labour,hour,32.00,painter
Plasterer day rate,subcontract,day,240.00,plasterer`;

export function importPriceBook(
  csv: string,
  meta: { id: string; name: string; currency: string },
): ImportResult<PriceBook> {
  const rows = parseCsv(csv);
  if (rows.length === 0) {
    return { ok: false, errors: ["No rows found. The first line must be a header."] };
  }

  const items: PriceBookItem[] = [];
  const labour: LabourRate[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];

  rows.forEach((row, i) => {
    const line = i + 2; // header is line 1
    const name = row.name ?? row.item ?? row.description ?? "";
    if (!name) {
      warnings.push(`Line ${line}: no name, skipped.`);
      return;
    }

    const cost = moneyToCents(row.cost ?? row.unitcost ?? row.price ?? row.rate ?? "");
    if (cost === null || cost <= 0) {
      errors.push(`Line ${line} ("${name}"): cost could not be read. A price book with a missing cost produces a quote that loses money.`);
      return;
    }

    const rawKind = (row.kind ?? row.type ?? "material").toLowerCase();
    const kind = (KINDS.find((k) => rawKind.startsWith(k.slice(0, 4))) ??
      "material") as LineKind;
    const aliases = toList(row.aliases ?? row.alias ?? row.alsoknownas ?? "");

    if (kind === "labour") {
      labour.push({ trade: name, aliases, hourlyCents: cost });
    } else {
      items.push({
        sku: row.sku || name.toUpperCase().replace(/[^A-Z0-9]+/g, "-").slice(0, 32),
        name,
        aliases,
        unit: row.unit || "each",
        unitCostCents: cost,
        kind,
      });
    }
  });

  if (errors.length > 0) return { ok: false, errors };
  if (items.length === 0 && labour.length === 0) {
    return { ok: false, errors: ["No usable rows. Check the header row names."] };
  }

  return {
    ok: true,
    warnings,
    value: {
      id: meta.id,
      name: meta.name,
      currency: meta.currency,
      items,
      labour,
      settings: {
        taxRatePct: 20,
        targetMarginPct: 28,
        minMarginPct: 15,
        contingencyPct: 10,
        calloutMinimumCents: 18000,
      },
    },
  };
}
