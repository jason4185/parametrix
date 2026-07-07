import { CoverageTypes } from "@/components/landing/CoverageTypes";
import { FinalCta } from "@/components/landing/FinalCta";
import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorks } from "@/components/landing/HowItWorks";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-base text-text">
      <HeroSection />
      <HowItWorks />
      <CoverageTypes />
      <FinalCta />
    </main>
  );
}
