import "server-only";
import {
  randomBytes,
  scrypt,
  timingSafeEqual,
  type ScryptOptions,
} from "node:crypto";
import { promisify } from "node:util";

// promisify picks the three-argument overload, which drops the cost options we
// need to record alongside each hash.
const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: ScryptOptions,
) => Promise<Buffer>;

/**
 * Password hashing with scrypt from Node's own crypto module.
 *
 * Deliberately no dependency and no third-party service: scrypt is a memory-
 * hard KDF designed for exactly this, and shipping it ourselves means there is
 * nothing to pay for and nothing to leak a password to.
 *
 * Parameters are stored inside the hash rather than assumed, so raising the
 * cost later does not invalidate every existing account — an old hash still
 * verifies against the parameters it was made with.
 */
const KEY_LENGTH = 64;
const PARAMS = { N: 16384, r: 8, p: 1 } as const;

/** Long enough to matter, short enough that scrypt is not a denial of service. */
export const MIN_PASSWORD_LENGTH = 10;
export const MAX_PASSWORD_LENGTH = 200;

export type PasswordProblem = { ok: false; reason: string };
export type PasswordOk = { ok: true };

/** Checked before hashing, so a hopeless password never reaches the KDF. */
export function checkPasswordStrength(
  password: string,
): PasswordOk | PasswordProblem {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      ok: false,
      reason: `Use at least ${MIN_PASSWORD_LENGTH} characters. Length beats cleverness.`,
    };
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return { ok: false, reason: `Keep it under ${MAX_PASSWORD_LENGTH} characters.` };
  }
  if (/^\s+$/.test(password)) {
    return { ok: false, reason: "That is only whitespace." };
  }
  return { ok: true };
}

/** Unicode-normalised so the same typed password matches across platforms. */
function normalise(password: string): string {
  return password.normalize("NFKC");
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = (await scryptAsync(normalise(password), salt, KEY_LENGTH, {
    ...PARAMS,
    // Node caps scrypt memory at 32MB by default, below what N=16384 needs.
    maxmem: 64 * 1024 * 1024,
  }));

  return [
    "scrypt",
    PARAMS.N,
    PARAMS.r,
    PARAMS.p,
    salt.toString("base64url"),
    key.toString("base64url"),
  ].join("$");
}

/**
 * Verifies a password against a stored hash.
 *
 * Comparison is timing-safe, and any malformed stored value fails closed
 * rather than throwing — a corrupt user record must not be a way in.
 */
export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  try {
    const [scheme, n, r, p, saltB64, keyB64] = stored.split("$");
    if (scheme !== "scrypt") return false;

    const salt = Buffer.from(saltB64, "base64url");
    const expected = Buffer.from(keyB64, "base64url");
    if (salt.length === 0 || expected.length === 0) return false;

    const actual = (await scryptAsync(normalise(password), salt, expected.length, {
      N: Number(n),
      r: Number(r),
      p: Number(p),
      maxmem: 64 * 1024 * 1024,
    }));

    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
