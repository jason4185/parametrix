import { Activity, DatabaseZap, Gauge, ShieldCheck } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { homepageContent } from "@/lib/content";

const steps = [
  {
    body: "The policyholder selects a supported location, policy type, event level, and coverage period.",
    icon: ShieldCheck,
    title: "Choose policy terms",
  },
  {
    body: "Settlement automation compares Open-Meteo weather data with the stored threshold for each covered day.",
    icon: DatabaseZap,
    title: "Weather is checked daily",
  },
  {
    body: "If the threshold is met, the policy can move to payout available status and the eligible payout can be claimed.",
    icon: Gauge,
    title: "Trigger and payout",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-base px-5 py-24 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan/80">
            How it works
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-text sm:text-4xl">
            {homepageContent.howItWorksTitle}
          </h2>
          <p className="mt-3 text-base leading-7 text-slate-300">
            {homepageContent.howItWorksSubtitle}
          </p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <SectionCard key={step.title} className="p-6">
                <div className="flex items-center justify-between gap-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-cyan/25 bg-cyan/10 text-sm font-semibold text-cyan">
                    0{index + 1}
                  </span>
                  <Icon className="h-5 w-5 text-cyan" />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-text">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-muted">
                  {step.body}
                </p>
              </SectionCard>
            );
          })}
        </div>
        <div className="mt-8 flex items-center gap-3 text-sm text-muted">
          <Activity className="h-4 w-4 text-cyan" />
          Transparent thresholds and automated settlement are built around clear
          policy terms.
        </div>
      </div>
    </section>
  );
}
