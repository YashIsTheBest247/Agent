import { describe, expect, it } from "vitest";
import {
  checkPasswordStrength,
  hashPassword,
  verifyPassword,
  MIN_PASSWORD_LENGTH,
} from "./passwords";

describe("checkPasswordStrength", () => {
  it("accepts a long passphrase", () => {
    expect(checkPasswordStrength("correct horse battery staple").ok).toBe(true);
  });

  it("rejects anything under the minimum", () => {
    const result = checkPasswordStrength("a".repeat(MIN_PASSWORD_LENGTH - 1));
    expect(result.ok).toBe(false);
  });

  it("rejects whitespace pretending to be a password", () => {
    expect(checkPasswordStrength("            ").ok).toBe(false);
  });

  // scrypt is memory-hard by design, so an unbounded input is a way to
  // exhaust the server rather than a stronger password.
  it("rejects an absurdly long input", () => {
    expect(checkPasswordStrength("x".repeat(5000)).ok).toBe(false);
  });
});

describe("hashPassword / verifyPassword", () => {
  it("verifies the password it hashed", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(await verifyPassword("correct horse battery staple", hash)).toBe(true);
  });

  it("rejects the wrong password", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(await verifyPassword("correct horse battery stapl", hash)).toBe(false);
  });

  it("never stores the password itself", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(hash).not.toContain("correct");
    expect(hash).not.toContain("staple");
  });

  // Same password, different salt: a stolen file must not reveal that two
  // accounts share a password.
  it("produces a different hash each time", async () => {
    const a = await hashPassword("correct horse battery staple");
    const b = await hashPassword("correct horse battery staple");
    expect(a).not.toBe(b);
    expect(await verifyPassword("correct horse battery staple", b)).toBe(true);
  });

  it("records its cost parameters in the hash", async () => {
    const hash = await hashPassword("correct horse battery staple");
    const [scheme, n, r, p] = hash.split("$");
    expect(scheme).toBe("scrypt");
    expect(Number(n)).toBeGreaterThanOrEqual(16384);
    expect(Number(r)).toBe(8);
    expect(Number(p)).toBe(1);
  });

  // A hash made with older parameters must keep working after they are raised.
  it("verifies against the parameters stored with the hash", async () => {
    const hash = await hashPassword("correct horse battery staple");
    const [, , , , salt, key] = hash.split("$");
    expect(salt.length).toBeGreaterThan(0);
    expect(key.length).toBeGreaterThan(0);
    expect(await verifyPassword("correct horse battery staple", hash)).toBe(true);
  });

  it("treats equivalent unicode forms as the same password", async () => {
    // "café" composed vs decomposed — the same typed password on two platforms.
    const hash = await hashPassword("café passphrase here");
    expect(await verifyPassword("café passphrase here", hash)).toBe(true);
  });

  // A corrupt or hand-edited user record must not become a way in.
  it.each([
    ["empty", ""],
    ["not a hash", "hunter2"],
    ["wrong scheme", "md5$16384$8$1$AAAA$BBBB"],
    ["missing parts", "scrypt$16384$8"],
    ["empty salt and key", "scrypt$16384$8$1$$"],
  ])("fails closed on a %s stored value", async (_label, stored) => {
    expect(await verifyPassword("anything at all", stored)).toBe(false);
  });
});
