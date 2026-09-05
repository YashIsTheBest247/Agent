/**
 * A small, correct CSV reader.
 *
 * Price books and catalogues arrive as exports from accounting software, which
 * means quoted fields containing commas, escaped quotes, and whatever line
 * endings the exporting machine used. A `split(",")` mangles all three, and a
 * parser library is a dependency for eighty lines of work.
 */
export type CsvRow = Record<string, string>;

function parseLine(line: string): string[] {
  const cells: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (quoted) {
      if (char === '"') {
        // A doubled quote inside a quoted field is a literal quote.
        if (line[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') quoted = true;
    else if (char === ",") {
      cells.push(cell);
      cell = "";
    } else cell += char;
  }

  cells.push(cell);
  return cells.map((c) => c.trim());
}

/** Splits on newlines that are not inside a quoted field. */
function splitRecords(text: string): string[] {
  const records: string[] = [];
  let current = "";
  let quoted = false;

  const normalised = text.replace(/\r\n?/g, "\n");
  for (let i = 0; i < normalised.length; i += 1) {
    const char = normalised[i];
    if (char === '"') {
      quoted = normalised[i + 1] === '"' && quoted ? quoted : !quoted;
      current += char;
      if (normalised[i + 1] === '"') {
        current += '"';
        i += 1;
      }
      continue;
    }
    if (char === "\n" && !quoted) {
      records.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  if (current.trim()) records.push(current);

  return records.filter((r) => r.trim().length > 0);
}

/**
 * Parses CSV into rows keyed by header.
 *
 * Headers are lowercased and stripped of spaces and punctuation, so
 * "Unit Cost", "unit_cost" and "unitcost" all reach the same field — people
 * export these from a dozen different systems.
 */
export function parseCsv(text: string): CsvRow[] {
  const records = splitRecords(text);
  if (records.length < 2) return [];

  const headers = parseLine(records[0]).map((h) =>
    h.toLowerCase().replace(/[^a-z0-9]/g, ""),
  );

  return records.slice(1).map((record) => {
    const cells = parseLine(record);
    const row: CsvRow = {};
    headers.forEach((header, i) => {
      if (header) row[header] = cells[i] ?? "";
    });
    return row;
  });
}

/** Reads a money column into integer minor units. "1,284.50" -> 128450. */
export function moneyToCents(value: string): number | null {
  const cleaned = value.replace(/[^0-9.\-]/g, "");
  if (!cleaned) return null;
  const amount = Number(cleaned);
  if (!Number.isFinite(amount)) return null;
  return Math.round(amount * 100);
}

export function toNumber(value: string, fallback: number): number {
  // Number("") is 0, which would silently turn an empty stock column into
  // "none in stock" rather than "not stated". An empty cell falls back.
  const cleaned = value.replace(/[^0-9.\-]/g, "");
  if (!cleaned) return fallback;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/** Splits a delimited alias cell: "t&e|twin and earth" or "a; b; c". */
export function toList(value: string): string[] {
  return value
    .split(/[|;]/)
    .map((v) => v.trim())
    .filter(Boolean);
}
