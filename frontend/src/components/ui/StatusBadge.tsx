import type { PolicyStatus } from "@/lib/constants";
import { statusLabel } from "@/lib/format";

type StatusBadgeProps = {
  className?: string;
  status?: PolicyStatus | string | null;
  tone?: "success" | "warning" | "danger" | "neutral" | "info";
};

const statusTone: Record<PolicyStatus, StatusBadgeProps["tone"]> = {
  ACTIVE: "info",
  CANCELLED: "danger",
  EXPIRED: "neutral",
  PAID: "success",
  TRIGGERED: "warning",
};

const toneClasses = {
  danger: "border-coral/30 bg-coral/10 text-coral",
  info: "border-cyan/30 bg-cyan/10 text-cyan",
  neutral: "border-white/12 bg-white/[0.06] text-slate-200",
  success: "border-cyan/25 bg-cyan/10 text-cyan",
  warning: "border-amber/35 bg-amber/10 text-amber",
};

const dotClasses = {
  danger: "bg-coral",
  info: "bg-cyan",
  neutral: "bg-slate-400",
  success: "bg-cyan",
  warning: "bg-amber",
};

export function StatusBadge({
  className = "",
  status,
  tone,
}: StatusBadgeProps) {
  const resolvedTone =
    tone ?? statusTone[status as PolicyStatus] ?? "neutral";

  return (
    <span
      className={[
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
        toneClasses[resolvedTone],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className={["h-1.5 w-1.5 rounded-full", dotClasses[resolvedTone]].join(" ")} />
      {statusLabel(status)}
    </span>
  );
}
