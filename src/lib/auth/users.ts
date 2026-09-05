import "server-only";
import { createStore, newId } from "@/lib/store";
import { hashPassword, verifyPassword } from "./passwords";

/**
 * The user record.
 *
 * Deliberately small. The product needs to know who owns a case and what to
 * call them, and nothing else — so nothing else is collected, and there is
 * nothing else to lose.
 */
export type User = {
  id: string;
  createdAt: string;
  updatedAt: string;
  /** Normalised: trimmed and lowercased. The display form is not kept. */
  email: string;
  name: string;
  passwordHash: string;
  lastSeenAt: string;
};

/** What may cross into a page or a client. Never the hash. */
export type PublicUser = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
};

export const userStore = createStore<User>("users");

export function publicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
  };
}

export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Good enough to catch a typo, deliberately not a full RFC 5322 parser —
 * over-strict email validation rejects real addresses.
 */
export function isPlausibleEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 320;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const target = normaliseEmail(email);
  const all = await userStore.list();
  return all.find((u) => u.email === target) ?? null;
}

export type CreateUserResult =
  | { ok: true; user: User }
  | { ok: false; reason: string };

export async function createUser(input: {
  email: string;
  name: string;
  password: string;
}): Promise<CreateUserResult> {
  const email = normaliseEmail(input.email);
  const name = input.name.trim().slice(0, 120);

  if (!isPlausibleEmail(email)) {
    return { ok: false, reason: "That does not look like an email address." };
  }
  if (name.length === 0) {
    return { ok: false, reason: "Tell us what to call you." };
  }
  if (await findUserByEmail(email)) {
    return { ok: false, reason: "An account with that email already exists." };
  }

  const now = new Date().toISOString();
  const user: User = {
    id: newId("user"),
    createdAt: now,
    updatedAt: now,
    lastSeenAt: now,
    email,
    name,
    passwordHash: await hashPassword(input.password),
  };

  await userStore.put(user);
  return { ok: true, user };
}

/**
 * Verifies credentials.
 *
 * When the email is unknown a hash is still computed against a dummy value, so
 * a wrong email and a wrong password take about the same time. Otherwise the
 * response time tells an attacker which addresses have accounts.
 */
const DUMMY_HASH =
  "scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

export async function authenticate(
  email: string,
  password: string,
): Promise<User | null> {
  const user = await findUserByEmail(email);
  const ok = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !ok) return null;

  const seen = { ...user, lastSeenAt: new Date().toISOString() };
  await userStore.put(seen);
  return seen;
}
