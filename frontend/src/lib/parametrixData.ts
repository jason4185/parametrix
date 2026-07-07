import { POLICY_STATUSES, type PolicyStatus } from "@/lib/constants";
import { formatGenAmount } from "@/lib/format";

export type ParametrixRecord = Record<string, unknown>;

const nestedRecordKeys = [
  "policy",
  "summary",
  "terms",
  "policy_terms",
  "policyTerms",
  "financials",
  "settlement",
  "settlement_status",
  "settlementStatus",
  "status_details",
  "statusDetails",
  "data",
];

function asRecord(value: unknown): ParametrixRecord | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as ParametrixRecord)
    : undefined;
}

export function valueFrom(
  record: ParametrixRecord | null | undefined,
  keys: string[],
): unknown | undefined {
  if (!record) {
    return undefined;
  }

  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null && record[key] !== "") {
      return record[key];
    }
  }

  for (const nestedKey of nestedRecordKeys) {
    const nested = asRecord(record[nestedKey]);

    if (!nested) {
      continue;
    }

    const value = valueFrom(nested, keys);

    if (value !== undefined) {
      return value;
    }
  }

  return undefined;
}

export function arrayField<T = unknown>(
  record: ParametrixRecord | null | undefined,
  keys: string[],
): T[] {
  const value = valueFrom(record, keys);

  if (Array.isArray(value)) {
    return value as T[];
  }

  return [];
}

export function stringField(
  record: ParametrixRecord | null | undefined,
  keys: string[],
  fallback = "--",
) {
  const value = valueFrom(record, keys);

  return value === undefined ? fallback : String(value);
}

export function numberField(
  record: ParametrixRecord | null | undefined,
  keys: string[],
) {
  const value = valueFrom(record, keys);
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : undefined;
}

export function booleanField(
  record: ParametrixRecord | null | undefined,
  keys: string[],
) {
  const value = valueFrom(record, keys);

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }

  return Boolean(value);
}

export function bigintField(
  record: ParametrixRecord | null | undefined,
  keys: string[],
) {
  const value = valueFrom(record, keys);

  if (value === undefined) {
    return undefined;
  }

  try {
    return typeof value === "bigint"
      ? value
      : BigInt(typeof value === "number" ? Math.trunc(value) : String(value));
  } catch {
    return undefined;
  }
}

export function isPolicyStatus(status?: unknown): status is PolicyStatus {
  return POLICY_STATUSES.includes(status as PolicyStatus);
}

export function statusFrom(
  ...records: Array<ParametrixRecord | null | undefined>
) {
  for (const record of records) {
    const status = valueFrom(record, ["status", "policy_status", "policyStatus"]);

    if (isPolicyStatus(status)) {
      return status;
    }
  }

  return undefined;
}

export function genAmountFromRecord(
  record: ParametrixRecord | null | undefined,
  keys: string[],
) {
  const matchedKey = keys.find((key) => valueFrom(record, [key]) !== undefined);

  if (!matchedKey) {
    return "--";
  }

  const value = valueFrom(record, [matchedKey]);
  return formatGenAmount(value as bigint | number | string);
}

export function weatherNumber(
  record: ParametrixRecord | null | undefined,
  primaryKeys: string[],
  scaledKeys: string[] = [],
) {
  const direct = numberField(record, primaryKeys);

  if (direct !== undefined) {
    return direct;
  }

  const scaled = numberField(record, scaledKeys);

  return scaled === undefined ? undefined : scaled / 10;
}
