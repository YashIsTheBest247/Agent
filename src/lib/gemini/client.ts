import "server-only";
import { GoogleGenAI } from "@google/genai";
import type { GeminiSchema } from "./schema";

/**
 * Two tiers rather than one model everywhere.
 *
 * Extraction and classification are mechanical and run on every page of every
 * upload, so they go to the fast model. Strategy, drafting and adversarial
 * review are where the appeal is won or lost, so they get the reasoning model.
 */
export type ModelTier = "reasoning" | "fast";

export class GeminiConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeminiConfigError";
  }
}

export class GeminiRequestError extends Error {
  readonly status: number | undefined;
  readonly retryable: boolean;

  constructor(message: string, status: number | undefined, retryable: boolean) {
    super(message);
    this.name = "GeminiRequestError";
    this.status = status;
    this.retryable = retryable;
  }
}

let cachedClient: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (cachedClient) return cachedClient;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new GeminiConfigError(
      "GEMINI_API_KEY is not set. Copy .env.example to .env.local and add your key.",
    );
  }

  cachedClient = new GoogleGenAI({ apiKey });
  return cachedClient;
}

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

/**
 * Defaults are Flash on both tiers because a free Gemini key has no Pro
 * quota — Pro returns 429 immediately. Point GEMINI_MODEL_REASONING at a Pro
 * model if your key has the quota for it; the tier split is real either way,
 * since the reasoning tier gets a newer and slower model.
 */
export function modelFor(tier: ModelTier): string {
  return tier === "reasoning"
    ? (process.env.GEMINI_MODEL_REASONING ?? "gemini-3.6-flash")
    : (process.env.GEMINI_MODEL_FAST ?? "gemini-3.5-flash");
}

/**
 * The models to try, in order, for one tier.
 *
 * Free-tier quota is counted per model per day, so a spent allowance on the
 * primary is not a spent allowance overall. Falling through to the next model
 * turns a run that would have died mid-pipeline into one that finishes on a
 * slightly different model — which is a far better outcome than a half-built
 * appeal against a deadline.
 */
export function modelChain(tier: ModelTier): string[] {
  const primary = modelFor(tier);
  const configured = process.env.GEMINI_MODEL_FALLBACKS?.trim();
  const fallbacks = (
    configured ? configured.split(",") : ["gemini-3.5-flash", "gemini-3.1-flash-lite"]
  )
    .map((m) => m.trim())
    .filter(Boolean);

  return [primary, ...fallbacks.filter((m) => m !== primary)];
}

export type TokenUsage = {
  input: number;
  output: number;
  total: number;
};

export type GenerateResult = {
  text: string;
  model: string;
  usage: TokenUsage;
  latencyMs: number;
  attempts: number;
};

/** A user upload passed to the model directly — a scan, a photo, or a PDF. */
export type Attachment = {
  mimeType: string;
  /** Base64 payload without a data: prefix. */
  data: string;
};

export type GenerateOptions = {
  tier: ModelTier;
  system: string;
  prompt: string;
  schema: GeminiSchema;
  /** Sent before the prompt, which is the ordering the model reads best. */
  attachments?: Attachment[];
  temperature?: number;
  maxOutputTokens?: number;
  signal?: AbortSignal;
  /**
   * Transient-failure retries, on top of the first attempt. The free tier
   * returns 503 "high demand" often enough that this needs headroom.
   */
  maxRetries?: number;
};

const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);

/**
 * A 429 is usually a burst to be waited out, but a *daily* quota is not — no
 * amount of backoff clears it before midnight. Retrying one burns four rounds
 * of sleep and buries the real cause under a generic failure, so it is
 * detected and surfaced as-is.
 */
export function isDailyQuotaExhausted(message: string): boolean {
  return /PerDay|per day|generate_content_free_tier_requests/i.test(message);
}

/** Turns Google's quota payload into something a person can act on. */
function quotaAdvice(message: string): string {
  const model = /model:\s*([\w.-]+)/.exec(message)?.[1];
  const limit = /limit:\s*(\d+)/.exec(message)?.[1];
  return [
    "Daily Gemini quota exhausted",
    model ? ` for ${model}` : "",
    limit ? ` (free tier allows ${limit} requests a day)` : "",
    ". Runs will work again tomorrow, or immediately on a key with paid quota.",
  ].join("");
}

function describeError(error: unknown): {
  message: string;
  status: number | undefined;
} {
  if (error instanceof Error) {
    // The SDK surfaces HTTP status either as a property or inside the message.
    const status =
      (error as { status?: number }).status ??
      Number(/\b(4\d{2}|5\d{2})\b/.exec(error.message)?.[1]) ??
      undefined;
    return {
      message: error.message,
      status: Number.isFinite(status) ? status : undefined,
    };
  }
  return { message: String(error), status: undefined };
}

const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * One structured call to Gemini, retried on transient failures only.
 *
 * Schema violations are not retried here — the caller repairs those with the
 * validation error in hand, which works far better than a blind retry.
 */
export async function generateStructured(
  options: GenerateOptions,
): Promise<GenerateResult> {
  const {
    tier,
    system,
    prompt,
    schema,
    attachments,
    temperature = tier === "reasoning" ? 0.35 : 0.1,
    maxOutputTokens = 8192,
    signal,
    maxRetries = 4,
  } = options;

  const ai = getClient();
  const chain = modelChain(tier);
  const startedAt = Date.now();

  const contents = attachments?.length
    ? [
        {
          role: "user",
          parts: [
            ...attachments.map((a) => ({
              inlineData: { mimeType: a.mimeType, data: a.data },
            })),
            { text: prompt },
          ],
        },
      ]
    : prompt;

  let lastError: GeminiRequestError | null = null;

  // Outer loop walks the model chain; inner loop retries transient failures on
  // the current model. Only an exhausted daily quota advances the chain.
  for (const model of chain) {
   for (let attempt = 1; attempt <= maxRetries + 1; attempt += 1) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction: system,
          responseMimeType: "application/json",
          responseSchema: schema,
          temperature,
          maxOutputTokens,
          abortSignal: signal,
        },
      });

      const text = response.text;
      if (!text) {
        throw new GeminiRequestError(
          "Gemini returned an empty response body.",
          undefined,
          true,
        );
      }

      const usageMeta = response.usageMetadata;
      return {
        text,
        model,
        usage: {
          input: usageMeta?.promptTokenCount ?? 0,
          output: usageMeta?.candidatesTokenCount ?? 0,
          total: usageMeta?.totalTokenCount ?? 0,
        },
        latencyMs: Date.now() - startedAt,
        attempts: attempt,
      };
    } catch (error) {
      if (signal?.aborted) throw error;

      const { message, status } = describeError(error);

      if (status === 429 && isDailyQuotaExhausted(message)) {
        // No backoff clears a daily cap. Move to the next model in the chain;
        // if this was the last one, the error stands.
        lastError = new GeminiRequestError(quotaAdvice(message), 429, false);
        break;
      }

      const retryable =
        error instanceof GeminiRequestError
          ? error.retryable
          : status === undefined || RETRYABLE_STATUS.has(status);

      lastError = new GeminiRequestError(message, status, retryable);
      if (!retryable || attempt > maxRetries) break;

      // 0.8s, 2.4s, 7.2s, 21.6s, with jitter so parallel agents that hit the
      // same capacity wall do not retry in lockstep and collide again.
      const backoff = 800 * 3 ** (attempt - 1);
      await sleep(backoff + Math.random() * backoff * 0.25);
    }
   }

   // A non-retryable failure that is not a quota wall applies to every model.
   if (lastError && !lastError.retryable && lastError.status !== 429) break;
  }

  throw (
    lastError ??
    new GeminiRequestError("Gemini request failed for an unknown reason.", undefined, false)
  );
}
