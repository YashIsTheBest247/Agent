import type {
  AuditReport,
  Citation,
  CitationStatus,
  VerifiedCitation,
} from "@/lib/domain/appeal";
import type { SourceDocument } from "@/lib/domain/documents";
import { bestFuzzyMatch, normalise, type FuzzyHit } from "@/lib/match";

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
