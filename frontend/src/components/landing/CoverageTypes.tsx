import { CloudRain, ThermometerSun } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { SectionCard } from "@/components/ui/SectionCard";
import { coverageTypeContent, homepageContent } from "@/lib/content";

const levels = ["Severe", "Extreme", "Critical"];
const icons = {
  RAINFALL_INDEX: CloudRain,
  TEMPERATURE_INDEX: ThermometerSun,
};

export function CoverageTypes() {
  return (
    <section className="bg-base px-5 py-24 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan/80">
              Coverage types
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-text sm:text-4xl">
              {homepageContent.coverageTitle}
            </h2>
            <p className="mt-3 text-base leading-7 text-slate-300">
              {homepageContent.coverageSubtitle}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {levels.map((level) => (
              <Badge
                key={level}
                variant={level === "Critical" ? "amber" : "cyan"}
              >
                {level}
              </Badge>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {coverageTypeContent.map((type) => {
            const Icon = icons[type.id];

            return (
              <SectionCard key={type.title} className="p-7">
                <div className="flex items-center justify-between gap-4">
                  <div className="h-px w-24 bg-gradient-to-r from-cyan/70 to-white/10" />
                  <span className="rounded-lg border border-cyan/25 bg-cyan/10 p-2 text-cyan">
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
                <h3 className="mt-7 text-2xl font-semibold text-text">
                  {type.title}
                </h3>
                <p className="mt-4 text-sm leading-6 text-muted">
                  {type.description}
                </p>
              </SectionCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}
