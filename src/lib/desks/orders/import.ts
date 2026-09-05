import { moneyToCents, parseCsv, toList, toNumber } from "@/lib/csv";
import type { Catalog, CatalogItem } from "./domain";

export type ImportResult<T> =
  | { ok: true; value: T; warnings: string[] }
  | { ok: false; errors: string[] };

export const catalogTemplate = `sku,name,unit,price,stock,leadtime,minorder,aliases
CBL-TE-2.5,Twin and earth cable 2.5mm 100m,drum,134.00,18,3,1,2.5mm t&e|6242y 2.5
SKT-2G-WH,Double socket white,each,3.40,800,1,10,2 gang socket|twin socket`;

/**
 * Turns a distributor's stock export into a catalogue.
 *
 * Stock and price are required, because the gate's whole job is answering "is
 * this in stock at the agreed price" — a row missing either cannot be gated and
 * so cannot be confirmed.
 */
export function importCatalog(
  csv: string,
  base: Catalog,
  meta: { id: string; name: string },
): ImportResult<Catalog> {
  const rows = parseCsv(csv);
  if (rows.length === 0) {
    return { ok: false, errors: ["No rows found. The first line must be a header."] };
  }

  const items: CatalogItem[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];

  rows.forEach((row, i) => {
    const line = i + 2;
    const name = row.name ?? row.description ?? row.item ?? "";
    if (!name) {
      warnings.push(`Line ${line}: no name, skipped.`);
      return;
    }

    const price = moneyToCents(row.price ?? row.listprice ?? row.cost ?? "");
    if (price === null || price <= 0) {
      errors.push(`Line ${line} ("${name}"): price could not be read.`);
      return;
    }

    const stock = toNumber(row.stock ?? row.stockonhand ?? row.qty ?? "", -1);
    if (stock < 0) {
      errors.push(`Line ${line} ("${name}"): stock could not be read. The gate cannot confirm a line whose availability is unknown.`);
      return;
    }

    items.push({
      sku: row.sku || name.toUpperCase().replace(/[^A-Z0-9]+/g, "-").slice(0, 32),
      name,
      aliases: toList(row.aliases ?? row.alias ?? ""),
      unit: row.unit || "each",
      listPriceCents: price,
      stockOnHand: stock,
      leadTimeDays: toNumber(row.leadtime ?? row.leadtimedays ?? "", 5),
      minOrderQty: toNumber(row.minorder ?? row.minimumorder ?? row.moq ?? "", 1),
    });
  });

  if (errors.length > 0) return { ok: false, errors };
  if (items.length === 0) {
    return { ok: false, errors: ["No usable rows. Check the header row names."] };
  }

  // Customers and terms come from the worked example until there is a UI for
  // them; the catalogue is the half people actually need to replace first.
  return {
    ok: true,
    warnings,
    value: { ...base, id: meta.id, name: meta.name, items },
  };
}
