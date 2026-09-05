import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

/**
 * The store is configured from the environment at module load, so each case
 * points it at a fresh temp directory and imports it anew.
 */
async function freshStore(dir: string, persist = "1") {
  vi.resetModules();
  process.env.SECOND_CHAIR_DATA_DIR = dir;
  process.env.SECOND_CHAIR_PERSIST = persist;
  // Module-level caches hang off globalThis to survive hot reloads; clear them
  // so each test starts from disk rather than a previous test's index.
  const g = globalThis as Record<string, unknown>;
  delete g.__secondChairStores;
  delete g.__secondChairLoaded;
  return import("./store");
}

type Row = { id: string; createdAt: string; label?: string };

const original = { ...process.env };

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  process.env = { ...original };
});

describe("record store", () => {
  it("round-trips a record through memory", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "sc-store-"));
    const { caseStore } = await freshStore(dir);

    await caseStore.put({ id: "case_1", createdAt: "2026-01-01" } as never);

    expect((await caseStore.get("case_1")) as Row | null).toMatchObject({
      id: "case_1",
    });
  });

  // The point of the change: a run survives the dev server restarting.
  it("survives a process restart by reading back from disk", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "sc-store-"));

    const first = await freshStore(dir);
    await first.quoteStore.put({
      id: "quote_a",
      createdAt: "2026-02-02",
      label: "kept",
    } as never);

    // A brand new module instance with an empty index, as after a restart.
    const second = await freshStore(dir);
    const recovered = (await second.quoteStore.get("quote_a")) as Row | null;

    expect(recovered?.label).toBe("kept");
  });

  it("keeps each desk in its own namespace", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "sc-store-"));
    const { caseStore, orderStore } = await freshStore(dir);

    await caseStore.put({ id: "case_x", createdAt: "2026-01-01" } as never);
    await orderStore.put({ id: "order_x", createdAt: "2026-01-01" } as never);

    // Neither desk can see the other's record...
    expect(await caseStore.get("order_x")).toBeNull();
    expect(await orderStore.get("case_x")).toBeNull();
    // ...but each still has its own.
    expect(await caseStore.get("case_x")).not.toBeNull();
    expect(await orderStore.get("order_x")).not.toBeNull();
    expect((await readdir(dir)).sort()).toEqual(["cases", "orders"]);
  });

  it("lists newest first", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "sc-store-"));
    const { orderStore } = await freshStore(dir);

    await orderStore.put({ id: "order_old", createdAt: "2026-01-01" } as never);
    await orderStore.put({ id: "order_new", createdAt: "2026-06-01" } as never);

    expect(((await orderStore.list()) as Row[]).map((r) => r.id)).toEqual([
      "order_new",
      "order_old",
    ]);
  });

  it("deletes from the index and the disk together", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "sc-store-"));
    const { caseStore } = await freshStore(dir);

    await caseStore.put({ id: "case_gone", createdAt: "2026-01-01" } as never);
    await caseStore.remove("case_gone");

    expect(await caseStore.get("case_gone")).toBeNull();
    expect(await readdir(path.join(dir, "cases"))).toEqual([]);

    const restarted = await freshStore(dir);
    expect(await restarted.caseStore.get("case_gone")).toBeNull();
  });

  it("leaves no temp files behind after a write", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "sc-store-"));
    const { caseStore } = await freshStore(dir);

    await caseStore.put({ id: "case_1", createdAt: "2026-01-01" } as never);

    const files = await readdir(path.join(dir, "cases"));
    expect(files).toEqual(["case_1.json"]);
  });

  // A half-written or hand-edited file must not take a whole desk down.
  it("skips a corrupt file rather than failing the whole namespace", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "sc-store-"));
    await mkdir(path.join(dir, "cases"), { recursive: true });
    await writeFile(path.join(dir, "cases", "case_ok.json"),
      JSON.stringify({ id: "case_ok", createdAt: "2026-01-01" }), "utf8");
    await writeFile(path.join(dir, "cases", "case_bad.json"), "{ not json", "utf8");

    const { caseStore } = await freshStore(dir);

    expect(((await caseStore.list()) as Row[]).map((r) => r.id)).toEqual(["case_ok"]);
  });

  it("stays in memory when persistence is switched off", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "sc-store-"));
    const { caseStore, isPersistent } = await freshStore(dir, "0");

    expect(isPersistent()).toBe(false);
    await caseStore.put({ id: "case_1", createdAt: "2026-01-01" } as never);

    expect(await caseStore.get("case_1")).not.toBeNull();
    await expect(readdir(path.join(dir, "cases"))).rejects.toThrow();
  });

  it("writes readable JSON a human can inspect", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "sc-store-"));
    const { caseStore } = await freshStore(dir);

    await caseStore.put({
      id: "case_1",
      createdAt: "2026-01-01",
      label: "readable",
    } as never);

    const raw = await readFile(path.join(dir, "cases", "case_1.json"), "utf8");
    expect(raw).toContain("\n  ");
    expect(JSON.parse(raw).label).toBe("readable");
  });

  it("refuses an id that would escape the namespace directory", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "sc-store-"));
    const { caseStore } = await freshStore(dir);

    await caseStore.put({
      id: "../../escape",
      createdAt: "2026-01-01",
    } as never);

    // Held in the index, but never written outside the namespace.
    expect(await caseStore.get("../../escape")).not.toBeNull();
    await expect(readdir(path.join(dir, "cases"))).rejects.toThrow();
  });
});
