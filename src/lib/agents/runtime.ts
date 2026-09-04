import "server-only";
import { z } from "zod";
import {
  generateStructured,
  type ModelTier,
  type TokenUsage,
} from "@/lib/gemini/client";
import { toGeminiSchema, type GeminiSchema } from "@/lib/gemini/schema";
import type { Trace } from "./trace";

/**
 * An agent is a narrow, typed, single-purpose call.
 *
 * Everything an agent is allowed to do is declared here — which model tier it
 * gets, what it must return, and the prompt it builds. There is deliberately no
 * tool loop and no free-running conversation: each of the nine agents does one
 * job with a checkable output, which is what makes the pipeline auditable.
 */
export type AgentDefinition<TInput, TOutput> = {
  id: string;
  /** Shown in the trace timeline. */
  name: string;
  /** One line explaining the job, also shown to the user. */
  role: string;
  tier: ModelTier;
  system: string;
  output: z.ZodType<TOutput>;
  prompt: (input: TInput) => string;
  temperature?: number;
  maxOutputTokens?: number;
  /** Schema-repair attempts before the agent is declared failed. */
  maxRepairs?: number;
};

export function defineAgent<TInput, TOutput>(
  def: AgentDefinition<TInput, TOutput>,
): AgentDefinition<TInput, TOutput> {
  return def;
}

export class AgentFailure extends Error {
  readonly agentId: string;
  readonly cause: unknown;

  constructor(agentId: string, message: string, cause?: unknown) {
    super(message);
    this.name = "AgentFailure";
    this.agentId = agentId;
    this.cause = cause;
  }
}

export type RunContext = {
  trace: Trace;
  signal?: AbortSignal;
};

export type AgentOutcome<TOutput> = {
  output: TOutput;
  usage: TokenUsage;
  durationMs: number;
  /** Repair rounds needed. Non-zero is worth surfacing — it signals a shaky contract. */
  repairs: number;
};

// Schema conversion is pure and non-trivial; do it once per agent definition.
const schemaCache = new WeakMap<z.ZodType, GeminiSchema>();

function geminiSchemaFor(schema: z.ZodType): GeminiSchema {
  const hit = schemaCache.get(schema);
  if (hit) return hit;
  const converted = toGeminiSchema(schema);
  schemaCache.set(schema, converted);
  return converted;
}

/** Turns a Zod failure into instructions a model can act on. */
function describeValidation(error: z.ZodError): string {
  return error.issues
    .slice(0, 12)
    .map((issue) => {
      const path = issue.path.length ? issue.path.join(".") : "(root)";
      return `- ${path}: ${issue.message}`;
    })
    .join("\n");
}

function sumUsage(a: TokenUsage, b: TokenUsage): TokenUsage {
  return {
    input: a.input + b.input,
    output: a.output + b.output,
    total: a.total + b.total,
  };
}

/**
 * Runs one agent to a validated result.
 *
 * Gemini enforces the response schema server-side, but enforcement is not
 * validation: enums drift, required strings come back empty, numbers arrive as
 * strings. So the output is parsed through Zod as well, and a failure is fed
 * back to the model as a correction rather than retried blindly.
 */
export async function runAgent<TInput, TOutput>(
  def: AgentDefinition<TInput, TOutput>,
  input: TInput,
  ctx: RunContext,
): Promise<AgentOutcome<TOutput>> {
  const startedAt = Date.now();
  const maxRepairs = def.maxRepairs ?? 1;
  const schema = geminiSchemaFor(def.output);
  const basePrompt = def.prompt(input);

  ctx.trace.push({
    type: "agent_started",
    agentId: def.id,
    agentName: def.name,
    message: def.role,
  });

  let usage: TokenUsage = { input: 0, output: 0, total: 0 };
  let prompt = basePrompt;
  let lastProblem = "";

  for (let round = 0; round <= maxRepairs; round += 1) {
    let raw: string;

    try {
      const result = await generateStructured({
        tier: def.tier,
        system: def.system,
        prompt,
        schema,
        temperature: def.temperature,
        maxOutputTokens: def.maxOutputTokens,
        signal: ctx.signal,
      });
      usage = sumUsage(usage, result.usage);
      raw = result.text;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown Gemini failure";
      ctx.trace.push({
        type: "agent_failed",
        agentId: def.id,
        agentName: def.name,
        message: `Could not reach the model: ${message}`,
        usage,
        durationMs: Date.now() - startedAt,
      });
      throw new AgentFailure(def.id, message, error);
    }

    const parsed = safeParseJson(raw);
    if (!parsed.ok) {
      lastProblem = `The response was not valid JSON: ${parsed.error}`;
    } else {
      const validated = def.output.safeParse(parsed.value);
      if (validated.success) {
        const outcome: AgentOutcome<TOutput> = {
          output: validated.data,
          usage,
          durationMs: Date.now() - startedAt,
          repairs: round,
        };
        ctx.trace.push({
          type: "agent_finished",
          agentId: def.id,
          agentName: def.name,
          message: `${def.name} finished`,
          usage,
          durationMs: outcome.durationMs,
          detail: round > 0 ? { repairs: round } : undefined,
        });
        return outcome;
      }
      lastProblem = `The response did not satisfy the contract:\n${describeValidation(validated.error)}`;
    }

    if (round < maxRepairs) {
      ctx.trace.push({
        type: "agent_repaired",
        agentId: def.id,
        agentName: def.name,
        message: `${def.name} returned an invalid result and is being asked to correct it`,
        detail: { problem: lastProblem },
      });
      prompt = `${basePrompt}

---
Your previous response was rejected.

${lastProblem}

Return the corrected JSON only. Do not explain the correction, and do not change any value that was already valid.`;
    }
  }

  ctx.trace.push({
    type: "agent_failed",
    agentId: def.id,
    agentName: def.name,
    message: `${def.name} could not produce a valid result`,
    detail: { problem: lastProblem },
    usage,
    durationMs: Date.now() - startedAt,
  });
  throw new AgentFailure(def.id, lastProblem);
}

type JsonParse =
  | { ok: true; value: unknown }
  | { ok: false; error: string };

/**
 * Structured mode returns bare JSON, but a model that has been asked to repair
 * itself sometimes wraps the object in a fence or a sentence. Recover from that
 * rather than burning another round on it.
 */
function safeParseJson(raw: string): JsonParse {
  const attempt = (text: string): JsonParse => {
    try {
      return { ok: true, value: JSON.parse(text) };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  };

  const direct = attempt(raw.trim());
  if (direct.ok) return direct;

  const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(raw);
  if (fenced) {
    const inner = attempt(fenced[1].trim());
    if (inner.ok) return inner;
  }

  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start !== -1 && end > start) {
    const sliced = attempt(raw.slice(start, end + 1));
    if (sliced.ok) return sliced;
  }

  return direct;
}
