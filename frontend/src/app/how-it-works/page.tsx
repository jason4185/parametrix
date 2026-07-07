import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  CloudRain,
  Coins,
  DatabaseZap,
  Gauge,
  Home,
  ShieldCheck,
  ThermometerSun,
} from "lucide-react";
import { ParametrixLogo } from "@/components/brand/ParametrixLogo";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { coverageTypeContent, howItWorksContent } from "@/lib/content";
import { PREMIUM_AND_COVERAGE } from "@/lib/constants";

const stepIcons = [
  ShieldCheck,
  Coins,
  DatabaseZap,
  AlertTriangle,
  CheckCircle2,
];

const coverageIcons = {
  RAINFALL_INDEX: CloudRain,
  TEMPERATURE_INDEX: ThermometerSun,
};

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-base text-text">
      <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <ParametrixLogo />
          <div className="flex flex-wrap items-center gap-3">
            <Link
              className="inline-flex h-11 items-center gap-2 rounded-md border border-white/15 bg-white/[0.04] px-4 text-sm font-semibold text-muted transition hover:border-cyan/40 hover:text-text"
              href="/"
            >
              <Home className="h-4 w-4" />
              Home
            </Link>
            <Button href="/app">Launch App</Button>
          </div>
        </header>

        <section className="py-20">
          <PageHeader
            eyebrow="How it works"
            subtitle={howItWorksContent.intro}
            title="Clear coverage for measurable weather events"
          />
        </section>

        <section className="grid gap-5 lg:grid-cols-5">
          {howItWorksContent.steps.map((step, index) => {
            const Icon = stepIcons[index] ?? ShieldCheck;

            return (
              <SectionCard key={step.title} className="p-5">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-semibold text-cyan">
                    0{index + 1}
                  </span>
                  <Icon className="h-5 w-5 text-cyan" />
                </div>
                <h2 className="mt-5 text-lg font-semibold text-text">
                  {step.title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-muted">
                  {step.body}
                </p>
              </SectionCard>
            );
          })}
        </section>

        <section className="grid gap-5 py-16 lg:grid-cols-2">
          {coverageTypeContent.map((coverage) => {
            const Icon = coverageIcons[coverage.id];

            return (
              <SectionCard key={coverage.id} className="p-6">
                <Icon className="h-6 w-6 text-cyan" />
                <h2 className="mt-5 text-2xl font-semibold text-text">
                  {coverage.title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-muted">
                  {coverage.description}
                </p>
              </SectionCard>
            );
          })}
        </section>

        <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <SectionCard className="p-6">
            <div className="flex items-center gap-3">
              <Gauge className="h-5 w-5 text-cyan" />
              <h2 className="text-xl font-semibold text-text">
                Event levels
              </h2>
            </div>
            <div className="mt-5 space-y-3">
              {PREMIUM_AND_COVERAGE.map((option) => (
                <div
                  key={option.level}
                  className="rounded-md border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-semibold text-text">
                      {option.label}
                    </span>
                    <Badge
                      variant={
                        option.level === "CRITICAL_EVENT" ? "amber" : "cyan"
                      }
                    >
                      {option.shortLabel}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted">
                    {option.premiumDisplay} → Coverage Payout{" "}
                    {option.coverageDisplay}
                  </p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard className="p-6">
            <div className="flex items-center gap-3">
              <DatabaseZap className="h-5 w-5 text-cyan" />
              <h2 className="text-xl font-semibold text-text">
                Settlement updates
              </h2>
            </div>
            <p className="mt-4 text-sm leading-6 text-muted">
              {howItWorksContent.settlement}
            </p>
            <p className="mt-3 text-sm leading-6 text-muted">
              Parametrix checks Open-Meteo weather data during settlement and
              compares each value with the selected threshold terms.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button href="/app">Launch App</Button>
              <Button href="/buy" variant="secondary">
                Buy Coverage
              </Button>
            </div>
          </SectionCard>
        </section>
      </div>
    </main>
  );
}
