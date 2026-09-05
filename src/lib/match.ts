/**
 * Fuzzy text matching shared by every desk's hard gate.
 *
 * The appeals desk uses it to confirm a quoted sentence really appears in a
 * source document. The quoting desk uses it to resolve a described line item to
 * a real entry in a price book. Both are the same question — does this string
 * correspond to something that actually exists — and both must be answered by
 * code rather than by asking a model whether it was telling the truth.
 */

/**
 * Collapses the differences that survive copying text out of a PDF or typing a
 * product name from memory: smart quotes, ligatured dashes, soft hyphens and
 * reflowed whitespace. Anything beyond that is a real difference and must count
 * against the match.
 */
export function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/[‘’‚‛′]/g, "'")
    .replace(/[“”„‟″]/g, '"')
    .replace(/[‐-―−]/g, "-")
    .replace(/­/g, "")
    .replace(/ /g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Levenshtein distance with a rolling pair of rows. */
export function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  let current = new Array<number>(b.length + 1);

  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i;
    const aChar = a.charCodeAt(i - 1);
    for (let j = 1; j <= b.length; j += 1) {
      const cost = aChar === b.charCodeAt(j - 1) ? 0 : 1;
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + cost,
      );
    }
    [previous, current] = [current, previous];
  }

  return previous[b.length];
}

/** 1 for identical strings, 0 for nothing in common. Operates on raw input. */
export function similarity(a: string, b: string): number {
  const longest = Math.max(a.length, b.length);
  if (longest === 0) return 1;
  return 1 - editDistance(a, b) / longest;
}

/**
 * Picks the distinctive words to use as search anchors, so a scan compares a
 * handful of plausible windows rather than every offset in a long document.
 */
export function anchorsFor(text: string): string[] {
  return [...new Set(text.split(" "))]
    .filter((token) => token.length >= 5)
    .sort((a, b) => b.length - a.length)
    .slice(0, 4);
}

export type FuzzyHit = { score: number; text: string };

export type FuzzyOptions = {
  /** Comparison is capped so a pathological input cannot stall a run. */
  maxChars?: number;
  maxWindows?: number;
};

/** Best-scoring window of `haystack` against `needle`. Both must be normalised. */
export function bestFuzzyMatch(
  needle: string,
  haystack: string,
  options: FuzzyOptions = {},
): FuzzyHit | null {
  const { maxChars = 400, maxWindows = 48 } = options;
  const probe = needle.slice(0, maxChars);
  const width = probe.length;
  if (haystack.length === 0 || width === 0) return null;

  const offsets = new Set<number>();
  for (const anchor of anchorsFor(probe)) {
    const anchorAt = probe.indexOf(anchor);
    let from = 0;
    while (offsets.size < maxWindows) {
      const found = haystack.indexOf(anchor, from);
      if (found === -1) break;
      offsets.add(Math.max(0, found - anchorAt));
      from = found + anchor.length;
    }
  }

  // No distinctive anchor landed: sweep coarsely rather than give up.
  if (offsets.size === 0) {
    const stride = Math.max(1, Math.floor(width / 2));
    for (let i = 0; i < haystack.length && offsets.size < maxWindows; i += stride) {
      offsets.add(i);
    }
  }

  let best: FuzzyHit | null = null;
  for (const offset of offsets) {
    const window = haystack.slice(offset, offset + width);
    if (window.length === 0) continue;
    const score = similarity(probe, window);
    if (!best || score > best.score) best = { score, text: window };
  }

  return best;
}

/**
 * Resolves a free-text description against a set of named candidates — the
 * shape a price-book lookup takes. Compares the whole string rather than
 * scanning windows, because both sides are short labels.
 */
export function bestCandidate<T>(
  query: string,
  candidates: T[],
  namesOf: (candidate: T) => string[],
): { candidate: T; score: number; matchedOn: string } | null {
  const needle = normalise(query);
  if (!needle) return null;

  // Descriptions routinely carry a parenthetical the catalogue does not:
  // "double socket white (per each)", "MCB type B 16A (10 pack)". Stripping it
  // lets an otherwise exact name score as exact, instead of flagging every
  // correct line for review — a warning on everything is a warning on nothing.
  const bare = normalise(query.replace(/\([^)]*\)/g, " "));
  const forms = bare && bare !== needle ? [needle, bare] : [needle];

  let best: { candidate: T; score: number; matchedOn: string } | null = null;

  for (const candidate of candidates) {
    for (const raw of namesOf(candidate)) {
      const name = normalise(raw);
      if (!name) continue;

      for (const form of forms) {
        // A described item often contains the catalogue name plus extra words
        // ("2 coats of the exterior acrylic, satin"), so containment counts as
        // a strong signal rather than being punished by the length difference.
        const contained = form.includes(name) || name.includes(form);
        const score =
          form === name
            ? 1
            : contained
              ? Math.max(0.92, similarity(form, name))
              : similarity(form, name);

        if (!best || score > best.score) {
          best = { candidate, score, matchedOn: raw };
        }
      }
    }
  }

  return best;
}
