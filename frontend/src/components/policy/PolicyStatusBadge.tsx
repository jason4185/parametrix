import { StatusBadge } from "@/components/ui/StatusBadge";
import type { PolicyStatus } from "@/lib/constants";

type PolicyStatusBadgeProps = {
  status: PolicyStatus;
};

export function PolicyStatusBadge({ status }: PolicyStatusBadgeProps) {
  return <StatusBadge status={status} />;
}

export type { PolicyStatus };
