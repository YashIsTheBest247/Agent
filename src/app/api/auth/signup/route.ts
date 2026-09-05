import { NextResponse } from "next/server";
import { checkPasswordStrength } from "@/lib/auth/passwords";
import { createUser, publicUser } from "@/lib/auth/users";
import { createSession, setSessionCookie } from "@/lib/auth/session";
import { clearAttempts, tooManyAttempts } from "@/lib/auth/guard";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  if (tooManyAttempts(`signup:${ip}`)) {
    return NextResponse.json(
      { error: "Too many attempts. Wait a few minutes." },
      { status: 429 },
    );
  }

  let body: { email?: string; name?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Expected JSON." }, { status: 400 });
  }

  const email = String(body.email ?? "");
  const name = String(body.name ?? "");
  const password = String(body.password ?? "");

  const strength = checkPasswordStrength(password);
  if (!strength.ok) {
    return NextResponse.json({ error: strength.reason }, { status: 400 });
  }

  const result = await createUser({ email, name, password });
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 409 });
  }

  await setSessionCookie(await createSession(result.user.id));
  clearAttempts(`signup:${ip}`);

  return NextResponse.json({ user: publicUser(result.user) }, { status: 201 });
}
