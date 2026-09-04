import { Nav } from "@/components/site/nav";
import { Hero } from "@/components/site/hero";
import { Gap } from "@/components/site/gap";
import { Numbers } from "@/components/site/numbers";
import { Crew } from "@/components/site/crew";
import { HowItWorks } from "@/components/site/how-it-works";
import { Results } from "@/components/site/results";
import { Safeguards } from "@/components/site/safeguards";
import { Cta } from "@/components/site/cta";

export default function HomePage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Gap />
        <Numbers />
        <Crew />
        <HowItWorks />
        <Results />
        <Safeguards />
        <Cta />
      </main>
    </>
  );
}
