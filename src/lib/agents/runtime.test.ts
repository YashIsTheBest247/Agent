import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

const generateStructured = vi.fn();

vi.mock("@/lib/gemini/client", () => ({
  generateStructured: (...args: unknown[]) => generateStructured(...args),
}));

const { defineAgent, runAgent, AgentFailure } = await import("./runtime");
const { Trace } = await import("./trace");

const usage = { input: 10, output: 5, total: 15 };

function reply(payload: unknown) {
  return {
    text: typeof payload === "string" ? payload : JSON.stringify(payload),
    model: "gemini-test",
    usage,
    latencyMs: 1,
    attempts: 1,
  };
}

const agent = defineAgent({
  id: "test_agent",
  name: "Test agent",
  role: "Proves the runtime contract",
  tier: "fast" as const,
  system: "You are a test.",
  output: z.object({
    verdict: z.enum(["yes", "no"]),
    score: z.number().int(),
  }),
  prompt: (input: { question: string }) => `Question: ${input.question}`,
});

describe("runAgent", () => {
  beforeEach(() => {
    generateStructured.mockReset();
  });

  it("returns validated output and records the run on the trace", async () => {
    generateStructured.mockResolvedValueOnce(
      reply({ verdict: "yes", score: 3 }),
    );

    const trace = new Trace();
    const outcome = await runAgent(agent, { question: "ok?" }, { trace });

    expect(outcome.output).toEqual({ verdict: "yes", score: 3 });
    expect(outcome.repairs).toBe(0);
    expect(outcome.usage.total).toBe(15);

    const types = trace.all().map((e) => e.type);
    expect(types).toEqual(["agent_started", "agent_finished"]);
  });

  it("asks the model to correct output that violates the contract", async () => {
    generateStructured
      .mockResolvedValueOnce(reply({ verdict: "maybe", score: 3 }))
      .mockResolvedValueOnce(reply({ verdict: "no", score: 4 }));

    const trace = new Trace();
    const outcome = await runAgent(agent, { question: "ok?" }, { trace });

    expect(outcome.output.verdict).toBe("no");
    expect(outcome.repairs).toBe(1);
    // Usage accumulates across the repair rather than reporting only the last call.
    expect(outcome.usage.total).toBe(30);

    const repairPrompt = generateStructured.mock.calls[1][0].prompt as string;
    expect(repairPrompt).toContain("previous response was rejected");
    expect(repairPrompt).toContain("verdict");

    expect(trace.all().map((e) => e.type)).toContain("agent_repaired");
  });

  it("recovers a fenced JSON body instead of spending a repair round", async () => {
    generateStructured.mockResolvedValueOnce(
      reply('```json\n{"verdict":"yes","score":1}\n```'),
    );

    const trace = new Trace();
    const outcome = await runAgent(agent, { question: "ok?" }, { trace });

    expect(outcome.output.score).toBe(1);
    expect(outcome.repairs).toBe(0);
    expect(generateStructured).toHaveBeenCalledTimes(1);
  });

  it("fails the agent once repairs are exhausted", async () => {
    generateStructured.mockResolvedValue(reply({ verdict: "maybe", score: 1 }));

    const trace = new Trace();
    await expect(
      runAgent(agent, { question: "ok?" }, { trace }),
    ).rejects.toBeInstanceOf(AgentFailure);

    // One initial attempt plus the default single repair.
    expect(generateStructured).toHaveBeenCalledTimes(2);
    expect(trace.failures()).toHaveLength(1);
  });

  it("does not retry a transport failure — the client owns that", async () => {
    generateStructured.mockRejectedValue(new Error("network down"));

    const trace = new Trace();
    await expect(
      runAgent(agent, { question: "ok?" }, { trace }),
    ).rejects.toThrow(/network down/);

    expect(generateStructured).toHaveBeenCalledTimes(1);
  });
});

describe("Trace", () => {
  it("replays history to a late subscriber, then streams", () => {
    const trace = new Trace();
    trace.push({ type: "run_started", message: "started" });

    const seen: string[] = [];
    const unsubscribe = trace.subscribe((e) => seen.push(e.message));
    trace.push({ type: "note", message: "during" });
    unsubscribe();
    trace.push({ type: "run_finished", message: "after" });

    expect(seen).toEqual(["started", "during"]);
  });

  it("totals token usage across every event that reported it", () => {
    const trace = new Trace();
    trace.push({ type: "agent_finished", message: "a", usage });
    trace.push({ type: "note", message: "no usage here" });
    trace.push({ type: "agent_finished", message: "b", usage });

    expect(trace.totalUsage()).toEqual({ input: 20, output: 10, total: 30 });
  });

  it("survives a listener that throws", () => {
    const trace = new Trace();
    trace.subscribe(() => {
      throw new Error("bad listener");
    });

    expect(() => trace.push({ type: "note", message: "still fine" })).not.toThrow();
    expect(trace.all()).toHaveLength(1);
  });
});
