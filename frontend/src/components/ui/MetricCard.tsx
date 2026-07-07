import { SectionCard } from "@/components/ui/SectionCard";

type MetricCardProps = {
  action?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  meta?: string;
  value: React.ReactNode;
};

export function MetricCard({
  action,
  icon: Icon,
  label,
  meta,
  value,
}: MetricCardProps) {
  return (
    <SectionCard className="flex min-h-[168px] flex-col justify-between p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted">{label}</p>
          <div className="mt-3 text-3xl font-semibold tracking-tight text-text">
            {value}
          </div>
        </div>
        {Icon ? (
          <span className="rounded-lg border border-white/10 bg-white/[0.04] p-2 text-cyan">
            <Icon className="h-5 w-5" />
          </span>
        ) : null}
      </div>
      <div className="mt-5">
        {action ? action : meta ? <p className="text-xs text-muted">{meta}</p> : null}
      </div>
    </SectionCard>
  );
}
