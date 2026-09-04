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

export function modelFor(tier: ModelTier): string {
  return tier === "reasoning"
    ? (process.env.GEMINI_MODEL_REASONING ?? "gemini-2.5-pro")
    : (process.env.GEMINI_MODEL_FAST ?? "gemini-2.5-flash");
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
  /** Transient-failure retries, on top of the first attempt. */
  maxRetries?: number;
};

const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);

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
    maxRetries = 2,
  } = options;

  const ai = getClient();
  const model = modelFor(tier);
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
      const retryable =
        error instanceof GeminiRequestError
          ? error.retryable
          : status === undefined || RETRYABLE_STATUS.has(status);

      lastError = new GeminiRequestError(message, status, retryable);
      if (!retryable || attempt > maxRetries) break;

      // 0.6s, 1.8s — enough to clear a rate-limit burst without stalling a run.
      await sleep(600 * 3 ** (attempt - 1));
    }
  }

  throw (
    lastError ??
    new GeminiRequestError("Gemini request failed for an unknown reason.", undefined, false)
  );
}
