"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type SettlementPoint = {
  settlementDate: string;
  threshold: number;
  triggered: boolean;
  unit: string;
  weatherValue: number;
};

type SettlementHistoryChartProps = {
  data: SettlementPoint[];
  policyType: "RAINFALL_INDEX" | "TEMPERATURE_INDEX";
};

export function SettlementHistoryChart({
  data,
  policyType,
}: SettlementHistoryChartProps) {
  const weatherLabel =
    policyType === "RAINFALL_INDEX" ? "Rainfall" : "Temperature";

  return (
    <div className="h-[320px] rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <ResponsiveContainer height="100%" width="100%">
        <LineChart data={data} margin={{ bottom: 8, left: 0, right: 16, top: 8 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
          <XAxis
            dataKey="settlementDate"
            stroke="#94A3B8"
            tick={{ fill: "#94A3B8", fontSize: 12 }}
            tickLine={false}
          />
          <YAxis
            stroke="#94A3B8"
            tick={{ fill: "#94A3B8", fontSize: 12 }}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "#0D1B1E",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "8px",
              color: "#F8FAFC",
            }}
            formatter={(value, name, item) => {
              const unit = item.payload?.unit ?? "";
              return [`${value} ${unit}`, name];
            }}
            labelStyle={{ color: "#94A3B8" }}
          />
          <Line
            dataKey="weatherValue"
            dot={{ fill: "#00E5FF", r: 3, stroke: "#071013", strokeWidth: 2 }}
            name={weatherLabel}
            stroke="#00E5FF"
            strokeWidth={3}
            type="monotone"
          />
          <Line
            dataKey="threshold"
            dot={false}
            name="Threshold"
            stroke="#FFB020"
            strokeDasharray="6 6"
            strokeWidth={2}
            type="monotone"
          />
          {data
            .filter((point) => point.triggered)
            .map((point) => (
              <ReferenceDot
                key={`${point.settlementDate}-${point.weatherValue}`}
                fill="#FFB020"
                r={6}
                stroke="#071013"
                strokeWidth={2}
                x={point.settlementDate}
                y={point.weatherValue}
              />
            ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
