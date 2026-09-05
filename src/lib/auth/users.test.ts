import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

/** Each case gets its own data directory and a fresh module graph. */
async function freshAuth() {
  const dir = await mkdtemp(path.join(tmpdir(), "sc-auth-"));
  vi.resetModules();
  process.env.SECOND_CHAIR_DATA_DIR = dir;
  process.env.SECOND_CHAIR_PERSIST = "1";
  const g = globalThis as Record<string, unknown>;
  delete g.__secondChairStores;
  delete g.__secondChairLoaded;
  return import("./users");
}

const original = { ...process.env };

beforeEach(() => vi.resetModules());
afterEach(() => {
  process.env = { ...original };
});

const PASSWORD = "correct horse battery staple";

describe("createUser", () => {
  it("creates an account and normalises the email", async () => {
    const { createUser, findUserByEmail } = await freshAuth();

    const result = await createUser({
      email: "  Kate@Norbury.CO.UK ",
      name: "  Kate Norbury  ",
      password: PASSWORD,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.user.email).toBe("kate@norbury.co.uk");
    expect(result.user.name).toBe("Kate Norbury");
    expect(await findUserByEmail("KATE@NORBURY.CO.UK")).not.toBeNull();
  });

  it("never keeps the password", async () => {
    const { createUser } = await freshAuth();
    const result = await createUser({
      email: "a@b.com",
      name: "A",
      password: PASSWORD,
    });

    if (!result.ok) throw new Error("expected success");
    expect(JSON.stringify(result.user)).not.toContain("horse");
  });

  it("refuses a duplicate email regardless of case", async () => {
    const { createUser } = await freshAuth();
    await createUser({ email: "a@b.com", name: "A", password: PASSWORD });

    const second = await createUser({
      email: "A@B.com",
      name: "Someone else",
      password: PASSWORD,
    });

    expect(second.ok).toBe(false);
  });

  it("refuses an implausible email and an empty name", async () => {
    const { createUser } = await freshAuth();

    expect((await createUser({ email: "nope", name: "A", password: PASSWORD })).ok).toBe(false);
    expect((await createUser({ email: "a@b.com", name: "   ", password: PASSWORD })).ok).toBe(false);
  });
});

describe("authenticate", () => {
  it("accepts the right password", async () => {
    const { createUser, authenticate } = await freshAuth();
    await createUser({ email: "a@b.com", name: "A", password: PASSWORD });

    expect(await authenticate("a@b.com", PASSWORD)).not.toBeNull();
  });

  it("accepts a differently-cased email", async () => {
    const { createUser, authenticate } = await freshAuth();
    await createUser({ email: "a@b.com", name: "A", password: PASSWORD });

    expect(await authenticate("  A@B.COM ", PASSWORD)).not.toBeNull();
  });

  it("rejects the wrong password", async () => {
    const { createUser, authenticate } = await freshAuth();
    await createUser({ email: "a@b.com", name: "A", password: PASSWORD });

    expect(await authenticate("a@b.com", "wrong password entirely")).toBeNull();
  });

  it("rejects an unknown account", async () => {
    const { authenticate } = await freshAuth();
    expect(await authenticate("nobody@nowhere.test", PASSWORD)).toBeNull();
  });

  // An unknown email must not return faster than a wrong password, or the
  // response time reveals which addresses have accounts.
  it("does not answer an unknown email noticeably faster", async () => {
    const { createUser, authenticate } = await freshAuth();
    await createUser({ email: "a@b.com", name: "A", password: PASSWORD });

    const t0 = performance.now();
    await authenticate("a@b.com", "wrong password entirely");
    const wrongPassword = performance.now() - t0;

    const t1 = performance.now();
    await authenticate("nobody@nowhere.test", PASSWORD);
    const unknownEmail = performance.now() - t1;

    // Both do a full scrypt derivation, so neither should be trivially quick.
    expect(unknownEmail).toBeGreaterThan(wrongPassword * 0.25);
  });

  it("records when the account was last seen", async () => {
    const { createUser, authenticate } = await freshAuth();
    const created = await createUser({ email: "a@b.com", name: "A", password: PASSWORD });
    if (!created.ok) throw new Error("expected success");

    await new Promise((r) => setTimeout(r, 5));
    const signedIn = await authenticate("a@b.com", PASSWORD);

    expect(signedIn!.lastSeenAt >= created.user.lastSeenAt).toBe(true);
  });
});

describe("publicUser", () => {
  it("strips the password hash before anything leaves the server", async () => {
    const { createUser, publicUser } = await freshAuth();
    const result = await createUser({ email: "a@b.com", name: "A", password: PASSWORD });
    if (!result.ok) throw new Error("expected success");

    const shape = publicUser(result.user);

    expect(shape).toEqual({
      id: result.user.id,
      email: "a@b.com",
      name: "A",
      createdAt: result.user.createdAt,
    });
    expect(JSON.stringify(shape)).not.toContain("scrypt");
  });
});
