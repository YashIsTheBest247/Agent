import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { createStore } from "@/lib/store";
import { userStore, type User } from "./users";

/**
 * Server-side sessions in a cookie.
 *
 * The cookie carries a random token; the store holds only its SHA-256. Someone
 * who reads the stored records therefore cannot mint a session from them, and
 * a session can be revoked by deleting one row — neither of which is true of a
 * self-contained signed token.
 */
export const SESSION_COOKIE = "sc_session";

const SESSION_DAYS = 30;
const SESSION_MS = SESSION_DAYS * 24 * 60 * 60 * 1000;

export type Session = {
  /** The SHA-256 of the token, which is also the storage key. */
  id: string;
  createdAt: string;
  userId: string;
  expiresAt: string;
};

const sessionStore = createStore<Session>("sessions");

function tokenToId(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Creates a session and returns the raw token, which is never stored. */
export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const now = Date.now();

  await sessionStore.put({
    id: tokenToId(token),
    createdAt: new Date(now).toISOString(),
    userId,
    expiresAt: new Date(now + SESSION_MS).toISOString(),
  });

  return token;
}

export async function setSessionCookie(token: string): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

/** Resolves the caller from their cookie, or null. Expired sessions are dropped. */
export async function currentUser(): Promise<User | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await sessionStore.get(tokenToId(token));
  if (!session) return null;

  if (Date.parse(session.expiresAt) < Date.now()) {
    await sessionStore.remove(session.id);
    return null;
  }

  const user = await userStore.get(session.userId);
  // A session outliving its user is a dangling row, not a login.
  if (!user) {
    await sessionStore.remove(session.id);
    return null;
  }

  return user;
}

export async function destroyCurrentSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await sessionStore.remove(tokenToId(token));
  await clearSessionCookie();
}

/** Removes every session belonging to a user — used when an account is deleted. */
export async function destroySessionsFor(userId: string): Promise<void> {
  const all = await sessionStore.list();
  await Promise.all(
    all.filter((s) => s.userId === userId).map((s) => sessionStore.remove(s.id)),
  );
}
