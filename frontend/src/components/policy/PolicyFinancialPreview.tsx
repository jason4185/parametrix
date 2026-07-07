import { Coins } from "lucide-react";
import { DataRow } from "@/components/ui/DataRow";
import { SectionCard } from "@/components/ui/SectionCard";
import { PREMIUM_AND_COVERAGE } from "@/lib/constants";

type PolicyFinancialPreviewProps = {
  action?: React.ReactNode;
  durationDays: number;
  eventLevel: string;
  thresholdPreview?: {
    threshold: number;
    unit: string;
  };
};

export function PolicyFinancialPreview({
  action,
  durationDays,
  eventLevel,
  thresholdPreview,
}: PolicyFinancialPreviewProps) {
  const selectedOption =
    PREMIUM_AND_COVERAGE.find((option) => option.level === eventLevel) ??
    PREMIUM_AND_COVERAGE[0];

  return (
    <SectionCard className="p-6">
      <div className="flex items-center gap-3">
        <span className="rounded-lg border border-cyan/25 bg-cyan/10 p-2 text-cyan">
          <Coins className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan/80">
            5. Review
          </p>
          <h3 className="text-lg font-semibold text-text">
            Purchase Summary
          </h3>
          <p className="text-sm text-muted">
            Review your premium and payout before purchase.
          </p>
        </div>
      </div>
      <dl className="mt-6">
        <DataRow label="Premium" value={`${selectedOption.premiumGen} GEN`} />
        <DataRow
          label="Coverage Payout"
          value={selectedOption.coverageDisplay}
        />
        <DataRow
          label="Trigger Threshold"
          value={
            thresholdPreview
              ? `${thresholdPreview.threshold}${thresholdPreview.unit === "°C" ? "" : " "}${thresholdPreview.unit}`
              : "--"
          }
        />
        <DataRow label="Coverage Period" value={`${durationDays} days`} />
      </dl>
      {action ? <div className="mt-6">{action}</div> : null}
    </SectionCard>
  );
}
