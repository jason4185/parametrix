import { statusLabel } from "@/lib/format";
import { type ParametrixRecord, valueFrom } from "@/lib/parametrixData";

export type SettlementHistoryRecord = ParametrixRecord;

const settlementHistoryKeys = [
  "settlement_history",
  "settlementHistory",
  "settlement_records",
  "settlementRecords",
  "history",
];

function isRecord(value: unknown): value is ParametrixRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function looksLikeSettlementRecord(record: ParametrixRecord) {
  return [
    "settlement_date",
    "settlementDate",
    "weather_value",
    "weatherValue",
    "weather_value_scaled",
    "weatherValueScaled",
    "threshold",
    "threshold_scaled",
    "thresholdScaled",
    "triggered",
    "final_status",
    "finalStatus",
  ].some((key) => record[key] !== undefined && record[key] !== null);
}

export function parseSettlementHistory(value: unknown): SettlementHistoryRecord[] {
  if (value === null || value === undefined || value === "") {
    return [];
  }

  if (Array.isArray(value)) {
    return value.filter(isRecord);
  }

  if (typeof value !== "string") {
    return [];
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return [];
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    return parseSettlementHistory(parsed);
  } catch {
    return [];
  }
}

export function parseSettlementRecord(
  value: unknown,
): SettlementHistoryRecord | null {
  if (isRecord(value)) {
    if (looksLikeSettlementRecord(value)) {
      return value;
    }

    for (const key of ["settlement", "settlement_record", "settlementRecord", "data"]) {
      const nested = parseSettlementRecord(value[key]);

      if (nested) {
        return nested;
      }
    }

    return null;
  }

  if (Array.isArray(value)) {
    return value.find(isRecord) ?? null;
  }

  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  try {
    return parseSettlementRecord(JSON.parse(value) as unknown);
  } catch {
    return null;
  }
}

export function settlementHistoryFromPolicy(
  policy: ParametrixRecord | null | undefined,
) {
  return parseSettlementHistory(valueFrom(policy, settlementHistoryKeys));
}

export function settlementRecordDate(record: ParametrixRecord) {
  return String(
    valueFrom(record, ["settlement_date", "settlementDate", "date"]) ?? "",
  );
}

export function settlementRecordStatus(
  record: ParametrixRecord,
  fallbackStatus?: string,
) {
  const status = valueFrom(record, [
    "final_status",
    "finalStatus",
    "status_after_check",
    "statusAfterCheck",
    "status",
  ]);

  const value = status ?? fallbackStatus;

  return value ? statusLabel(String(value)) : "--";
}
