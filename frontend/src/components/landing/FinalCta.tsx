import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SectionCard } from "@/components/ui/SectionCard";
import { homepageContent } from "@/lib/content";

export function FinalCta() {
  return (
    <section className="bg-base px-5 pb-24 pt-12 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl border-t border-white/10 pt-12">
        <SectionCard className="flex flex-col justify-between gap-6 p-8 lg:flex-row lg:items-center">
          <div>
            <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-cyan/80">
              <ShieldCheck className="h-4 w-4" />
              My Policies
            </div>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold text-text">
              {homepageContent.finalCtaTitle}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
              {homepageContent.finalCtaBody}
            </p>
          </div>
          <Button href="/app">Launch App</Button>
        </SectionCard>
      </div>
    </section>
  );
}
