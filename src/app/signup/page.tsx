import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { Logo } from "@/components/site/logo";
import { currentUser } from "@/lib/auth/session";

export const metadata = { title: "Create an account" };
export const dynamic = "force-dynamic";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const target = next?.startsWith("/") && !next.startsWith("//") ? next : "/";

  if (await currentUser()) redirect(target);

  return (
    <div className="mx-auto flex min-h-dvh max-w-[26rem] flex-col justify-center px-5 py-16">
      <Link href="/" className="press mx-auto">
        <Logo />
      </Link>

      <h1 className="mt-8 text-center text-[clamp(1.6rem,4vw,2.2rem)]">
        <span className="display">Open a </span>
        <span className="script text-[var(--ok-deep)]">desk</span>
      </h1>
      <p className="mt-2 text-center text-[13.5px] leading-relaxed text-[var(--text-2)]">
        Free, and we ask for nothing beyond a name, an email and a password.
      </p>

      <div className="mt-8">
        <AuthForm mode="signup" next={target} />
      </div>
    </div>
  );
}
