"use client";

import { Clock } from "lucide-react";
import { DURATIONS } from "@/lib/constants";

type DurationSelectorProps = {
  onChange: (duration: 7 | 14 | 30) => void;
  value: number;
};

export function DurationSelector({ onChange, value }: DurationSelectorProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center gap-3">
        <Clock className="h-5 w-5 text-cyan" />
        <h3 className="font-semibold text-text">Coverage Period</h3>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {DURATIONS.map((duration) => (
          <button
            key={duration}
            className={[
              "rounded-lg border px-3 py-3 text-sm font-semibold transition",
              value === duration
                ? "border-cyan/45 bg-cyan/10 text-cyan"
                : "border-white/10 bg-white/[0.03] text-muted hover:text-text",
            ].join(" ")}
            onClick={() => onChange(duration)}
            type="button"
          >
            {duration} days
          </button>
        ))}
      </div>
    </div>
  );
}
