import type {
  AuditReport,
  Citation,
  CitationStatus,
  VerifiedCitation,
} from "@/lib/domain/appeal";
import type { SourceDocument } from "@/lib/domain/documents";

/**
 * Citation verification is deliberately not an agent.
 *
 * Asking a second model whether a first model's quote is real just moves the
 * hallucination one step down the chain — it can agree with a quote that does
 * not exist. So this re-opens the source text and looks for the string. A quote
 * either appears in the document or it does not, and that is a question about
 * bytes rather than a question of judgement.
 */

/** Accept small OCR-grade deviations; reject anything that changes meaning. */
const NEAR_MATCH_THRESHOLD = 0.9;

/** Below this length a "quote" matches by accident and proves nothing. */
const MIN_QUOTE_CHARS = 12;

/** Fuzzy comparison is capped so a pathological quote cannot stall a run. */
const MAX_FUZZY_CHARS = 400;
const MAX_CANDIDATE_WINDOWS = 48;

/**
 * Collapses the differences that survive copying text out of a PDF: smart
 * quotes, ligatured dashes, soft hyphens, and reflowed whitespace. Anything
 * beyond that is a real difference and must count against the match.
 */
export function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/[‘’‚‛′]/g, "'")
    .replace(/[“”„‟″]/g, '"')
    .replace(/[‐-―−]/g, "-")
    .replace(/­/g, "")
    .replace(/ /g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Levenshtein distance with a rolling pair of rows. */
function editDistance(a: string, b: string): number {
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

function similarity(a: string, b: string): number {
  const longest = Math.max(a.length, b.length);
  if (longest === 0) return 1;
  return 1 - editDistance(a, b) / longest;
}

/**
 * Picks the distinctive words in the quote to use as search anchors, so the
 * fuzzy pass compares a handful of plausible windows rather than every offset.
 */
function anchorsFor(quote: string): string[] {
  return [...new Set(quote.split(" "))]
    .filter((token) => token.length >= 5)
    .sort((a, b) => b.length - a.length)
    .slice(0, 4);
}

type FuzzyHit = { score: number; text: string };

function bestFuzzyMatch(quote: string, haystack: string): FuzzyHit | null {
  const probe = quote.slice(0, MAX_FUZZY_CHARS);
  const width = probe.length;
  if (haystack.length === 0) return null;

  const offsets = new Set<number>();
  for (const anchor of anchorsFor(probe)) {
    const anchorAt = probe.indexOf(anchor);
    let from = 0;
    while (offsets.size < MAX_CANDIDATE_WINDOWS) {
      const found = haystack.indexOf(anchor, from);
      if (found === -1) break;
      offsets.add(Math.max(0, found - anchorAt));
      from = found + anchor.length;
    }
  }

  // No distinctive anchor landed: sweep coarsely rather than give up.
  if (offsets.size === 0) {
    const stride = Math.max(1, Math.floor(width / 2));
    for (
      let i = 0;
      i <= haystack.length - 1 && offsets.size < MAX_CANDIDATE_WINDOWS;
      i += stride
    ) {
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

export type VerifyOptions = {
  nearMatchThreshold?: number;
};

/** Checks one citation against the documents it claims to come from. */
export function verifyCitation(
  citation: Citation,
  documents: SourceDocument[],
  options: VerifyOptions = {},
): VerifiedCitation {
  const threshold = options.nearMatchThreshold ?? NEAR_MATCH_THRESHOLD;
  const doc = documents.find((d) => d.id === citation.documentId);

  const base = { ...citation };

  if (!doc) {
    return {
      ...base,
      status: "missing_document" satisfies CitationStatus,
      similarity: 0,
      matchedText: null,
    };
  }

  const quote = normalise(citation.quote);
  if (quote.length < MIN_QUOTE_CHARS) {
    return {
      ...base,
      status: "not_found",
      similarity: 0,
      matchedText: null,
    };
  }

  // Search the cited page first, then everything else — a right quote with a
  // wrong page number is a citation worth keeping, not a fabrication.
  const ordered = [...doc.pages].sort((a, b) => {
    if (a.page === citation.page) return -1;
    if (b.page === citation.page) return 1;
    return a.page - b.page;
  });

  let best: FuzzyHit | null = null;

  for (const page of ordered) {
    const haystack = normalise(page.text);
    if (haystack.includes(quote)) {
      return {
        ...base,
        status: "verified",
        similarity: 1,
        matchedText: null,
      };
    }
    const hit = bestFuzzyMatch(quote, haystack);
    if (hit && (!best || hit.score > best.score)) best = hit;
  }

  if (best && best.score >= threshold) {
    return {
      ...base,
      status: "near_match",
      similarity: Number(best.score.toFixed(3)),
      matchedText: best.text,
    };
  }

  return {
    ...base,
    status: "not_found",
    similarity: best ? Number(best.score.toFixed(3)) : 0,
    matchedText: best?.text ?? null,
  };
}

/**
 * Audits every citation behind a draft.
 *
 * `passed` is the gate the pipeline enforces: a draft that cites text nobody
 * can find is worse than no draft, because it gets the appeal dismissed and
 * burns the filing deadline.
 */
export function auditCitations(
  citations: Citation[],
  documents: SourceDocument[],
  referencedIds: string[] = [],
  options: VerifyOptions = {},
): AuditReport {
  const checked = citations.map((c) => verifyCitation(c, documents, options));
  const blocking = checked.filter(
    (c) => c.status === "not_found" || c.status === "missing_document",
  );

  const known = new Set(citations.map((c) => c.id));
  const danglingIds = [...new Set(referencedIds)].filter((id) => !known.has(id));

  return {
    passed: blocking.length === 0 && danglingIds.length === 0,
    checked,
    blocking,
    danglingIds,
  };
}

/** Human-readable summary used in the trace and in the repair prompt. */
export function describeAudit(report: AuditReport): string {
  if (report.passed) {
    const near = report.checked.filter((c) => c.status === "near_match").length;
    return near > 0
      ? `All ${report.checked.length} citations resolve (${near} with minor wording drift).`
      : `All ${report.checked.length} citations resolve exactly.`;
  }

  const lines: string[] = [];
  for (const c of report.blocking) {
    if (c.status === "missing_document") {
      lines.push(`- [${c.id}] cites document "${c.documentId}", which was never uploaded.`);
    } else {
      const nearest = c.matchedText
        ? ` Closest text in the source: "${c.matchedText.slice(0, 160)}"`
        : " No comparable passage exists in that document.";
      lines.push(
        `- [${c.id}] quote does not appear in the source (best similarity ${c.similarity}).${nearest}`,
      );
    }
  }
  for (const id of report.danglingIds) {
    lines.push(`- The draft cites [${id}], but no such citation was ever produced.`);
  }
  return lines.join("\n");
}
