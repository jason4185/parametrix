import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SectionCard } from "@/components/ui/SectionCard";

type EmptyStateProps = {
  actionHref?: string;
  actionLabel?: string;
  body: string;
  icon?: React.ComponentType<{ className?: string }>;
  onAction?: () => void;
  title: string;
};

export function EmptyState({
  actionHref,
  actionLabel,
  body,
  icon: Icon = ShieldCheck,
  onAction,
  title,
}: EmptyStateProps) {
  return (
    <SectionCard className="p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan/20 bg-cyan/10 text-cyan">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-xl font-semibold text-text">{title}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              {body}
            </p>
          </div>
        </div>
        {actionLabel ? (
          <Button
            className="shrink-0 justify-center"
            href={actionHref}
            onClick={onAction}
            variant="secondary"
          >
            {actionLabel}
          </Button>
        ) : null}
      </div>
    </SectionCard>
  );
}
