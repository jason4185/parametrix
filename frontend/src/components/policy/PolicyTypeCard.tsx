"use client";

import { CloudRain, ThermometerSun } from "lucide-react";
import { motion } from "motion/react";
import { POLICY_TYPES, type PolicyTypeId } from "@/lib/constants";

type PolicyTypeCardProps = {
  onSelect: (type: PolicyTypeId) => void;
  selected: boolean;
  type: PolicyTypeId;
};

const typeContent = {
  RAINFALL_INDEX: {
    description:
      POLICY_TYPES.find((policyType) => policyType.id === "RAINFALL_INDEX")
        ?.description ?? "",
    icon: CloudRain,
    label: "Rainfall Coverage",
  },
  TEMPERATURE_INDEX: {
    description:
      POLICY_TYPES.find((policyType) => policyType.id === "TEMPERATURE_INDEX")
        ?.description ?? "",
    icon: ThermometerSun,
    label: "Temperature Coverage",
  },
} satisfies Record<
  PolicyTypeId,
  {
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
  }
>;

export function PolicyTypeCard({
  onSelect,
  selected,
  type,
}: PolicyTypeCardProps) {
  const content = typeContent[type];
  const Icon = content.icon;

  return (
    <motion.button
      animate={{ opacity: 1, y: 0 }}
      className={[
        "rounded-xl border p-5 text-left transition",
        selected
          ? "border-cyan/45 bg-cyan/10 shadow-[0_16px_40px_rgba(0,229,255,0.10)]"
          : "border-white/10 bg-white/[0.03] hover:border-cyan/30",
      ].join(" ")}
      initial={{ opacity: 0, y: 8 }}
      onClick={() => onSelect(type)}
      type="button"
    >
      <Icon className={selected ? "h-6 w-6 text-cyan" : "h-6 w-6 text-muted"} />
      <h3 className="mt-4 font-semibold text-text">{content.label}</h3>
      <p className="mt-2 text-sm leading-6 text-muted">{content.description}</p>
    </motion.button>
  );
}

export type { PolicyTypeId as PolicyType };
