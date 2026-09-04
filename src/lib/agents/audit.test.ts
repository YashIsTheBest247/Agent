import { describe, expect, it } from "vitest";
import { auditCitations, verifyCitation } from "./audit";
import { normalise } from "@/lib/match";
import type { Citation } from "@/lib/domain/appeal";
import type { SourceDocument } from "@/lib/domain/documents";

const POLICY_TEXT =
  "Coverage is provided for services that are medically necessary as determined " +
  "by the Plan. Prior authorization is required for advanced imaging, including " +
  "MRI and CT of the lumbar spine, except when performed in an emergency department.";

const docs: SourceDocument[] = [
  {
    id: "doc_policy",
    kind: "policy",
    filename: "plan.pdf",
    mimeType: "application/pdf",
    uploadedAt: "2026-01-01T00:00:00.000Z",
    pages: [
      { page: 1, text: "Summary of Benefits and Coverage. Effective January 1." },
      { page: 2, text: POLICY_TEXT },
    ],
  },
];

function cite(partial: Partial<Citation>): Citation {
  return {
    id: "c1",
    documentId: "doc_policy",
    page: 2,
    quote: "Prior authorization is required for advanced imaging",
    supports: "Authorization requirement",
    ...partial,
  };
}

describe("normalise", () => {
  it("flattens the artefacts of copying text out of a PDF", () => {
    expect(normalise("“Medically   Necessary”\nas  determined")).toBe(
      '"medically necessary" as determined',
    );
  });

  it("treats en, em and minus dashes as the same character", () => {
    expect(normalise("pre–authorisation")).toBe(normalise("pre-authorisation"));
  });
});

describe("verifyCitation", () => {
  it("verifies an exact quote", () => {
    const result = verifyCitation(cite({}), docs);

    expect(result.status).toBe("verified");
    expect(result.similarity).toBe(1);
  });

  it("verifies across whitespace and smart-quote differences", () => {
    const result = verifyCitation(
      cite({ quote: "Prior   authorization\nis required for advanced imaging" }),
      docs,
    );

    expect(result.status).toBe("verified");
  });

  it("still verifies when the page number is wrong", () => {
    const result = verifyCitation(cite({ page: 1 }), docs);

    expect(result.status).toBe("verified");
  });

  it("accepts a near match with minor OCR drift", () => {
    const result = verifyCitation(
      cite({ quote: "Prior authorizatlon is required for advanced imaging" }),
      docs,
    );

    expect(result.status).toBe("near_match");
    expect(result.similarity).toBeGreaterThan(0.9);
  });

  // The case the whole system exists to catch.
  it("rejects a plausible sentence that is not in the document", () => {
    const result = verifyCitation(
      cite({
        quote:
          "Prior authorization is waived for all imaging when ordered by a specialist",
      }),
      docs,
    );

    expect(result.status).toBe("not_found");
    expect(result.matchedText).not.toBeNull();
  });

  it("rejects a quote whose meaning is inverted", () => {
    const result = verifyCitation(
      cite({ quote: "Prior authorization is not required for advanced imaging" }),
      docs,
    );

    expect(result.status).toBe("not_found");
  });

  it("flags a citation to a document that was never uploaded", () => {
    const result = verifyCitation(cite({ documentId: "doc_ghost" }), docs);

    expect(result.status).toBe("missing_document");
  });

  it("refuses to verify a quote too short to prove anything", () => {
    const result = verifyCitation(cite({ quote: "the Plan" }), docs);

    expect(result.status).toBe("not_found");
  });
});

describe("auditCitations", () => {
  it("passes when every citation resolves", () => {
    const report = auditCitations([cite({})], docs, ["c1"]);

    expect(report.passed).toBe(true);
    expect(report.blocking).toHaveLength(0);
  });

  it("blocks the draft when any citation is fabricated", () => {
    const report = auditCitations(
      [cite({}), cite({ id: "c2", quote: "The Plan covers all denied services" })],
      docs,
      ["c1", "c2"],
    );

    expect(report.passed).toBe(false);
    expect(report.blocking.map((c) => c.id)).toEqual(["c2"]);
  });

  it("catches a draft citing an id no agent ever produced", () => {
    const report = auditCitations([cite({})], docs, ["c1", "c9"]);

    expect(report.passed).toBe(false);
    expect(report.danglingIds).toEqual(["c9"]);
  });

  it("passes a near match rather than blocking on wording drift", () => {
    const report = auditCitations(
      [cite({ quote: "Prior authorizatlon is required for advanced imaging" })],
      docs,
      ["c1"],
    );

    expect(report.passed).toBe(true);
    expect(report.checked[0].status).toBe("near_match");
  });
});
