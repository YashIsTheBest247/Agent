import { z } from "zod";

/**
 * Gemini accepts a constrained dialect of OpenAPI schema, not JSON Schema.
 *
 * Zod is the single source of truth for every agent contract, so this converts
 * one to the other: uppercase type names, `nullable` instead of a null union,
 * inlined `$ref`s, and unsupported keywords dropped rather than passed through
 * (the API rejects the whole request on an unknown key).
 */
export type GeminiSchema = {
  type: "STRING" | "NUMBER" | "INTEGER" | "BOOLEAN" | "ARRAY" | "OBJECT";
  description?: string;
  nullable?: boolean;
  enum?: string[];
  items?: GeminiSchema;
  properties?: Record<string, GeminiSchema>;
  required?: string[];
  /** Field order materially improves output quality on long objects. */
  propertyOrdering?: string[];
};

type JsonSchema = Record<string, unknown>;

const typeMap: Record<string, GeminiSchema["type"]> = {
  string: "STRING",
  number: "NUMBER",
  integer: "INTEGER",
  boolean: "BOOLEAN",
  array: "ARRAY",
  object: "OBJECT",
};

/** Follows a local `#/$defs/Name` pointer. */
function deref(node: JsonSchema, root: JsonSchema): JsonSchema {
  let current = node;
  const seen = new Set<string>();

  while (typeof current.$ref === "string") {
    const ref = current.$ref;
    if (seen.has(ref)) {
      throw new Error(`Cyclic $ref in agent schema: ${ref}`);
    }
    seen.add(ref);

    const path = ref.replace(/^#\//, "").split("/");
    let target: unknown = root;
    for (const segment of path) {
      target = (target as JsonSchema | undefined)?.[
        segment.replace(/~1/g, "/").replace(/~0/g, "~")
      ];
    }
    if (!target || typeof target !== "object") {
      throw new Error(`Unresolvable $ref in agent schema: ${ref}`);
    }
    // Sibling keys alongside $ref (description, mostly) survive the hop.
    const { $ref: _dropped, ...siblings } = current;
    current = { ...(target as JsonSchema), ...siblings };
  }

  return current;
}

/**
 * Collapses the two ways `.nullable()` can arrive — `type: ["string", "null"]`
 * and `anyOf: [X, {type: "null"}]` — into the branch plus a nullable flag.
 *
 * A union of two real types cannot be expressed at all, so it is rejected here
 * with an actionable message rather than by the API mid-run.
 */
function unwrapNullable(node: JsonSchema): {
  schema: JsonSchema;
  nullable: boolean;
} {
  // Form 1: a type array. Zod 4 emits this for nullable primitives.
  if (Array.isArray(node.type)) {
    const types = (node.type as string[]).filter((t) => t !== "null");
    if (types.length !== 1) {
      throw new Error(
        "Gemini response schemas cannot express a union of multiple types. " +
          "Model the choice as an enum plus optional fields instead.",
      );
    }
    return {
      schema: { ...node, type: types[0] },
      nullable: (node.type as string[]).includes("null"),
    };
  }

  // Form 2: an explicit union, which Zod uses for nullable objects and arrays.
  const union = (node.anyOf ?? node.oneOf) as JsonSchema[] | undefined;
  if (!Array.isArray(union)) return { schema: node, nullable: false };

  const nulls = union.filter((b) => b?.type === "null");
  const rest = union.filter((b) => b?.type !== "null");

  if (rest.length !== 1) {
    throw new Error(
      "Gemini response schemas cannot express a union of multiple types. " +
        "Model the choice as an enum plus optional fields instead.",
    );
  }

  const { anyOf: _a, oneOf: _o, ...carried } = node;
  const merged = { ...rest[0], ...carried };
  // The branch itself may still be in type-array form.
  const inner = unwrapNullable(merged);
  return {
    schema: inner.schema,
    nullable: nulls.length > 0 || inner.nullable,
  };
}

function convertNode(input: JsonSchema, root: JsonSchema): GeminiSchema {
  const resolved = deref(input, root);
  const { schema: node, nullable } = unwrapNullable(resolved);
  const settled = deref(node, root);

  // `const` is a one-member enum as far as the API is concerned.
  const enumValues =
    (settled.enum as unknown[] | undefined) ??
    (settled.const !== undefined ? [settled.const] : undefined);

  let type = typeMap[settled.type as string];
  if (!type && enumValues) type = "STRING";
  if (!type) {
    throw new Error(
      `Unsupported schema node in agent contract: ${JSON.stringify(settled).slice(0, 160)}`,
    );
  }

  const out: GeminiSchema = { type };
  if (typeof settled.description === "string") {
    out.description = settled.description;
  }
  if (nullable) out.nullable = true;
  if (enumValues) out.enum = enumValues.map(String);

  if (type === "ARRAY") {
    const items = settled.items;
    if (!items || typeof items !== "object" || Array.isArray(items)) {
      throw new Error("Array schemas must declare a single `items` shape.");
    }
    out.items = convertNode(items as JsonSchema, root);
  }

  if (type === "OBJECT") {
    const props = (settled.properties ?? {}) as Record<string, JsonSchema>;
    const keys = Object.keys(props);
    out.properties = Object.fromEntries(
      keys.map((k) => [k, convertNode(props[k], root)]),
    );
    out.propertyOrdering = keys;
    // Everything a schema declares is required: a missing key and a null value
    // are different failures, and only the second one is recoverable.
    const required = (settled.required as string[] | undefined) ?? keys;
    out.required = required.filter((k) => keys.includes(k));
  }

  return out;
}

/** Converts a Zod schema into the response schema Gemini will enforce. */
export function toGeminiSchema(schema: z.ZodType): GeminiSchema {
  const json = z.toJSONSchema(schema, {
    io: "output",
    reused: "inline",
    unrepresentable: "any",
  }) as JsonSchema;

  return convertNode(json, json);
}
