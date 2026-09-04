import { Nav } from "@/components/site/nav";
import { Hero } from "@/components/site/hero";
import { Stats } from "@/components/site/stats";
import { HowItWorks } from "@/components/site/how-it-works";
import { Features } from "@/components/site/features";
import { UseCases } from "@/components/site/use-cases";
import { Pricing } from "@/components/site/pricing";
import { Safeguards } from "@/components/site/safeguards";
import { Cta } from "@/components/site/cta";
import { Footer } from "@/components/site/footer";

export default function HomePage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Stats />
        <HowItWorks />
        <Features />
        <UseCases />
        <Pricing />
        <Safeguards />
        <Cta />
      </main>
      <Footer />
    </>
  );
}
