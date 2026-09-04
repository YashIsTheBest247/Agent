import { describe, expect, it } from "vitest";
import { z } from "zod";
import { toGeminiSchema } from "./schema";
import { denialFacts, denialClassification } from "@/lib/domain/denial";
import {
  appealDraft,
  appealStrategy,
  coverageFinding,
  reviewVerdict,
} from "@/lib/domain/appeal";

describe("toGeminiSchema", () => {
  it("uppercases primitive types and preserves descriptions", () => {
    const result = toGeminiSchema(
      z.object({ name: z.string().describe("the payer") }),
    );

    expect(result.type).toBe("OBJECT");
    expect(result.properties?.name).toEqual({
      type: "STRING",
      description: "the payer",
    });
  });

  it("distinguishes integers from numbers", () => {
    const result = toGeminiSchema(
      z.object({ page: z.number().int(), ratio: z.number() }),
    );

    expect(result.properties?.page.type).toBe("INTEGER");
    expect(result.properties?.ratio.type).toBe("NUMBER");
  });

  it("collapses a nullable union into the nullable flag", () => {
    const result = toGeminiSchema(z.object({ claim: z.string().nullable() }));

    expect(result.properties?.claim).toMatchObject({
      type: "STRING",
      nullable: true,
    });
    expect(result.properties?.claim).not.toHaveProperty("anyOf");
  });

  it("renders enums as string enums", () => {
    const result = toGeminiSchema(
      z.object({ level: z.enum(["low", "high"]) }),
    );

    expect(result.properties?.level.type).toBe("STRING");
    expect(result.properties?.level.enum).toEqual(["low", "high"]);
  });

  it("carries array item shapes through", () => {
    const result = toGeminiSchema(
      z.object({ codes: z.array(z.object({ code: z.string() })) }),
    );

    expect(result.properties?.codes.type).toBe("ARRAY");
    expect(result.properties?.codes.items?.properties?.code.type).toBe("STRING");
  });

  it("emits property ordering so long objects come back in a stable shape", () => {
    const result = toGeminiSchema(
      z.object({ first: z.string(), second: z.string(), third: z.string() }),
    );

    expect(result.propertyOrdering).toEqual(["first", "second", "third"]);
    expect(result.required).toEqual(["first", "second", "third"]);
  });

  it("inlines repeated sub-schemas rather than emitting $ref", () => {
    const inner = z.object({ quote: z.string(), page: z.number().int() });
    const result = toGeminiSchema(
      z.object({ a: inner, b: inner, c: inner }),
    );

    const serialised = JSON.stringify(result);
    expect(serialised).not.toContain("$ref");
    expect(serialised).not.toContain("$defs");
    expect(result.properties?.b.properties?.quote.type).toBe("STRING");
  });

  it("strips JSON Schema keywords Gemini rejects", () => {
    const serialised = JSON.stringify(
      toGeminiSchema(z.object({ name: z.string() })),
    );

    expect(serialised).not.toContain("$schema");
    expect(serialised).not.toContain("additionalProperties");
  });

  it("refuses a union it cannot express, instead of failing at request time", () => {
    expect(() =>
      toGeminiSchema(z.object({ value: z.union([z.string(), z.number()]) })),
    ).toThrow(/union of multiple types/i);
  });

  // The real contracts are the ones that matter: if any agent's output schema
  // cannot be expressed, that agent is dead on arrival at runtime.
  it.each([
    ["denialFacts", denialFacts],
    ["denialClassification", denialClassification],
    ["coverageFinding", coverageFinding],
    ["appealStrategy", appealStrategy],
    ["appealDraft", appealDraft],
    ["reviewVerdict", reviewVerdict],
  ])("converts the %s agent contract", (_name, schema) => {
    const result = toGeminiSchema(schema);

    expect(result.type).toBe("OBJECT");
    expect(Object.keys(result.properties ?? {}).length).toBeGreaterThan(0);
    expect(JSON.stringify(result)).not.toContain("$ref");
  });

  it("keeps nested extracted-field shapes intact on denialFacts", () => {
    const result = toGeminiSchema(denialFacts);
    const claimNumber = result.properties?.claimNumber;

    expect(claimNumber?.type).toBe("OBJECT");
    expect(claimNumber?.properties?.value).toMatchObject({
      type: "STRING",
      nullable: true,
    });
    expect(claimNumber?.properties?.confidence.enum).toEqual([
      "high",
      "medium",
      "low",
    ]);
  });
});
