"use client";

import { AlertTriangle, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import type { EventLevelId } from "@/lib/constants";

type EventLevelCardProps = {
  label: string;
  level: EventLevelId;
  onSelect: (level: EventLevelId) => void;
  coverageDisplay: string;
  premiumDisplay: string;
  selected: boolean;
};

export function EventLevelCard({
  label,
  level,
  onSelect,
  coverageDisplay,
  premiumDisplay,
  selected,
}: EventLevelCardProps) {
  const isCritical = level === "CRITICAL_EVENT";
  const selectedClassName =
    level === "CRITICAL_EVENT"
      ? "border-amber/45 bg-amber/10 shadow-[0_16px_40px_rgba(255,176,32,0.08)]"
      : level === "EXTREME_EVENT"
        ? "border-cyan/45 bg-cyan/10 shadow-[0_16px_40px_rgba(0,229,255,0.08)]"
        : "border-cyan/35 bg-cyan/10 shadow-[0_16px_40px_rgba(0,229,255,0.08)]";
  const hoverClassName =
    level === "CRITICAL_EVENT" ? "hover:border-amber/40" : "hover:border-cyan/40";
  const Icon = isCritical ? AlertTriangle : ShieldCheck;

  return (
    <motion.button
      animate={{ opacity: 1, y: 0 }}
      className={[
        "rounded-xl border p-5 text-left transition",
        selected
          ? selectedClassName
          : `border-white/10 bg-white/[0.03] ${hoverClassName}`,
      ].join(" ")}
      initial={{ opacity: 0, y: 8 }}
      onClick={() => onSelect(level)}
      type="button"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <Icon
            className={isCritical ? "h-5 w-5 text-amber" : "h-5 w-5 text-cyan"}
          />
          <h3 className="mt-3 font-semibold text-text">{label}</h3>
        </div>
        <span className="rounded-md border border-white/10 px-2 py-1 text-xs text-muted">
          {premiumDisplay}
        </span>
      </div>
      <p className="mt-3 text-sm text-muted">
        {premiumDisplay} → Coverage Payout {coverageDisplay}
      </p>
    </motion.button>
  );
}

export type { EventLevelId as EventLevel };
