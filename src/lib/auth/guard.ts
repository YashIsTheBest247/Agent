import "server-only";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { currentUser } from "./session";
import type { User } from "./users";

/**
 * The two ways a caller is admitted.
 *
 * Pages redirect to the sign-in screen; API routes get a 401. Both go through
 * `currentUser`, so there is one place where a session becomes an identity.
 */
export async function requireUser(returnTo?: string): Promise<User> {
  const user = await currentUser();
  if (user) return user;

  const next = returnTo ? `?next=${encodeURIComponent(returnTo)}` : "";
  redirect(`/signin${next}`);
}

export type ApiGuard =
  | { ok: true; user: User }
  | { ok: false; response: NextResponse };

export async function requireApiUser(): Promise<ApiGuard> {
  const user = await currentUser();
  if (user) return { ok: true, user };

  return {
    ok: false,
    response: NextResponse.json(
      { error: "Sign in to continue." },
      { status: 401 },
    ),
  };
}

/**
 * Ownership check for a single record.
 *
 * Returns null for both "does not exist" and "belongs to someone else", so a
 * URL cannot be used to discover which record ids are real.
 */
export function ownedBy<T extends { userId: string }>(
  record: T | null,
  user: User,
): T | null {
  if (!record) return null;
  return record.userId === user.id ? record : null;
}

/** Simple in-process throttle for the sign-in and sign-up endpoints. */
const attempts = new Map<string, { count: number; first: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

export function tooManyAttempts(key: string): boolean {
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || now - entry.first > WINDOW_MS) {
    attempts.set(key, { count: 1, first: now });
    return false;
  }

  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

export function clearAttempts(key: string): void {
  attempts.delete(key);
}
