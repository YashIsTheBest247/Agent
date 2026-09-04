import { z } from "zod";

/**
 * What a user hands us. Kind matters because it changes what the intake agent
 * looks for: a denial letter carries the deadline, an EOB carries the money,
 * a policy carries the language we will quote back at the payer.
 */
export const documentKind = z.enum([
  "denial_letter",
  "eob",
  "policy",
  "clinical_record",
  "correspondence",
  "other",
]);
export type DocumentKind = z.infer<typeof documentKind>;

export const documentKindLabels: Record<DocumentKind, string> = {
  denial_letter: "Denial letter",
  eob: "Explanation of benefits",
  policy: "Plan documents",
  clinical_record: "Clinical record",
  correspondence: "Correspondence",
  other: "Other document",
};

/** One page of extracted text. Page numbers are what make a citation checkable. */
export const documentPage = z.object({
  page: z.number().int().min(1),
  text: z.string(),
});
export type DocumentPage = z.infer<typeof documentPage>;

export const sourceDocument = z.object({
  id: z.string(),
  kind: documentKind,
  filename: z.string(),
  mimeType: z.string(),
  /** Full extracted text, page-delimited. The auditor searches this, not the model's memory. */
  pages: z.array(documentPage),
  uploadedAt: z.string(),
});
export type SourceDocument = z.infer<typeof sourceDocument>;

/** Concatenates a document's pages with markers the model can cite by. */
export function renderDocument(doc: SourceDocument): string {
  const header = `### ${documentKindLabels[doc.kind]} — ${doc.filename} (id: ${doc.id})`;
  const body = doc.pages
    .map((p) => `[page ${p.page}]\n${p.text.trim()}`)
    .join("\n\n");
  return `${header}\n\n${body}`;
}

export function renderDocuments(docs: SourceDocument[]): string {
  if (docs.length === 0) return "(no documents provided)";
  return docs.map(renderDocument).join("\n\n---\n\n");
}

/** Every page of every document, flattened — the corpus the citation auditor searches. */
export function documentIndex(
  docs: SourceDocument[],
): { documentId: string; page: number; text: string }[] {
  return docs.flatMap((doc) =>
    doc.pages.map((p) => ({
      documentId: doc.id,
      page: p.page,
      text: p.text,
    })),
  );
}
