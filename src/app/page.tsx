import { Nav } from "@/components/site/nav";
import { currentUser } from "@/lib/auth/session";
import { Hero } from "@/components/site/hero";
import { Gap } from "@/components/site/gap";
import { Desks } from "@/components/site/desks";
import { Method } from "@/components/site/method";
import { Evidence } from "@/components/site/evidence";
import { Safeguards } from "@/components/site/safeguards";
import { Cta } from "@/components/site/cta";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await currentUser();

  return (
    <>
      <Nav signedIn={Boolean(user)} userName={user?.name} />
      <main>
        <Hero />
        <Gap />
        <Desks />
        <Method />
        <Evidence />
        <Safeguards />
        <Cta />
      </main>
    </>
  );
}
