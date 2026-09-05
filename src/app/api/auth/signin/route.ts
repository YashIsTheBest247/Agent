import { NextResponse } from "next/server";
import { authenticate, publicUser } from "@/lib/auth/users";
import { createSession, setSessionCookie } from "@/lib/auth/session";
import { clearAttempts, tooManyAttempts } from "@/lib/auth/guard";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  if (tooManyAttempts(`signin:${ip}`)) {
    return NextResponse.json(
      { error: "Too many attempts. Wait a few minutes." },
      { status: 429 },
    );
  }

  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Expected JSON." }, { status: 400 });
  }

  const user = await authenticate(String(body.email ?? ""), String(body.password ?? ""));

  // One message for both a wrong email and a wrong password: saying which is
  // wrong tells an attacker which addresses have accounts.
  if (!user) {
    return NextResponse.json(
      { error: "That email and password do not match an account." },
      { status: 401 },
    );
  }

  await setSessionCookie(await createSession(user.id));
  clearAttempts(`signin:${ip}`);

  return NextResponse.json({ user: publicUser(user) });
}
