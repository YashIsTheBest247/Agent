import { Nav } from "@/components/site/nav";
import { Hero } from "@/components/site/hero";
import { Gap } from "@/components/site/gap";
import { Desks } from "@/components/site/desks";
import { Method } from "@/components/site/method";
import { Safeguards } from "@/components/site/safeguards";
import { Cta } from "@/components/site/cta";

export default function HomePage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Gap />
        <Desks />
        <Method />
        <Safeguards />
        <Cta />
      </main>
    </>
  );
}
