"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Sign in and sign up are the same form with one extra field, so they share a
 * component rather than drifting apart.
 */
export function AuthForm({
  mode,
  next,
}: {
  mode: "signin" | "signup";
  next: string;
}) {
  const router = useRouter();
  const isSignUp = mode === "signup";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          isSignUp ? { name, email, password } : { email, password },
        ),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setError(payload?.error ?? "That did not work. Try again.");
        return;
      }

      router.push(next);
      router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setPending(false);
    }
  };

  const field =
    "mt-2 w-full rounded-[var(--r-sm)] border border-[var(--line)] bg-[var(--white)] px-3.5 py-2.5 text-[14px] text-[var(--text)] placeholder:text-[var(--text-3)] focus:border-[var(--lime-deep)] focus:outline-none";

  return (
    <form onSubmit={submit} className="card p-6 sm:p-8">
      {isSignUp ? (
        <label className="block">
          <span className="eyebrow">Your name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            required
            placeholder="Kate Norbury"
            className={field}
          />
        </label>
      ) : null}

      <label className={isSignUp ? "mt-5 block" : "block"}>
        <span className="eyebrow">Email</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
          placeholder="you@example.com"
          className={field}
        />
      </label>

      <label className="mt-5 block">
        <span className="eyebrow">Password</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={isSignUp ? "new-password" : "current-password"}
          required
          minLength={isSignUp ? 10 : undefined}
          placeholder={isSignUp ? "At least 10 characters" : ""}
          className={field}
        />
        {isSignUp ? (
          <span className="mt-2 block text-[12px] leading-relaxed text-[var(--text-3)]">
            Length beats cleverness. A short phrase you will remember is
            stronger than a short word with symbols in it.
          </span>
        ) : null}
      </label>

      {error ? (
        <div className="mt-5 flex gap-3 rounded-[var(--r-sm)] border border-[var(--risk-red)]/25 bg-[var(--risk-red-wash)] p-3.5">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[var(--risk-red)]" />
          <p className="text-[13px] leading-relaxed text-[var(--text)]">{error}</p>
        </div>
      ) : null}

      <Button
        type="submit"
        variant="lime"
        size="lg"
        disabled={pending}
        className="mt-7 w-full"
      >
        {pending
          ? isSignUp
            ? "Creating…"
            : "Signing in…"
          : isSignUp
            ? "Create account"
            : "Sign in"}
      </Button>

      <p className="mt-5 text-center text-[13px] text-[var(--text-2)]">
        {isSignUp ? "Already have an account? " : "No account yet? "}
        <Link
          href={
            isSignUp
              ? `/signin?next=${encodeURIComponent(next)}`
              : `/signup?next=${encodeURIComponent(next)}`
          }
          className="underline hover:text-[var(--ink)]"
        >
          {isSignUp ? "Sign in" : "Create one"}
        </Link>
      </p>
    </form>
  );
}
