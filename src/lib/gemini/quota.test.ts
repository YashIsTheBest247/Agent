import { afterEach, describe, expect, it } from "vitest";
import { isDailyQuotaExhausted } from "./client";

/**
 * Taken from a real free-tier failure during an end-to-end run: the daily cap
 * was reached mid-pipeline and the generic retry path made it look like a
 * transient fault.
 */
const DAILY = `{"error":{"code":429,"message":"You exceeded your current quota. * Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 20, model: gemini-3.6-flash","status":"RESOURCE_EXHAUSTED","details":[{"quotaId":"GenerateRequestsPerDayPerProjectPerModel-FreeTier"}]}}`;

const PER_MINUTE = `{"error":{"code":429,"message":"Resource has been exhausted (e.g. check quota).","status":"RESOURCE_EXHAUSTED","details":[{"quotaId":"GenerateRequestsPerMinutePerProjectPerModel"}]}}`;

describe("isDailyQuotaExhausted", () => {
  it("recognises a daily cap, which backoff cannot clear", () => {
    expect(isDailyQuotaExhausted(DAILY)).toBe(true);
  });

  it("leaves a per-minute limit to the retry path", () => {
    expect(isDailyQuotaExhausted(PER_MINUTE)).toBe(false);
  });

  it("does not fire on an unrelated failure", () => {
    expect(isDailyQuotaExhausted("This model is currently experiencing high demand.")).toBe(false);
  });
});

describe("modelChain", () => {
  const env = { ...process.env };
  afterEach(() => { process.env = { ...env }; });

  it("puts the tier's primary first, then the fallbacks", async () => {
    process.env.GEMINI_MODEL_REASONING = "model-a";
    process.env.GEMINI_MODEL_FALLBACKS = "model-b, model-c";
    const { modelChain } = await import("./client");

    expect(modelChain("reasoning")).toEqual(["model-a", "model-b", "model-c"]);
  });

  it("never repeats the primary in the fallbacks", async () => {
    process.env.GEMINI_MODEL_FAST = "model-b";
    process.env.GEMINI_MODEL_FALLBACKS = "model-b,model-c";
    const { modelChain } = await import("./client");

    expect(modelChain("fast")).toEqual(["model-b", "model-c"]);
  });

  it("falls back to sensible defaults when nothing is configured", async () => {
    delete process.env.GEMINI_MODEL_FALLBACKS;
    const { modelChain } = await import("./client");

    expect(modelChain("reasoning").length).toBeGreaterThan(1);
  });
});
