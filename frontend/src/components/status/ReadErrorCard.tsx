import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SectionCard } from "@/components/ui/SectionCard";
import {
  readableReadErrorMessage,
  readableReadErrorTitle,
} from "@/lib/errors";

type ReadErrorCardProps = {
  error: unknown;
  onRetry?: () => void;
};

export function ReadErrorCard({ error, onRetry }: ReadErrorCardProps) {
  return (
    <SectionCard className="p-6">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 text-amber" />
        <h2 className="text-xl font-semibold text-text">
          {readableReadErrorTitle(error)}
        </h2>
      </div>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
        {readableReadErrorMessage(error)}
      </p>
      {onRetry ? (
        <Button className="mt-5" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </SectionCard>
  );
}
