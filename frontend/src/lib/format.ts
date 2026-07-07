import { formatUnits, parseUnits } from "viem";
import {
  EVENT_LEVELS,
  POLICY_TYPES,
  PREMIUM_AND_COVERAGE,
  SUPPORTED_LOCATIONS,
  type DurationDays,
  type EventLevelId,
  type PolicyStatus,
  type PolicyTypeId,
} from "@/lib/constants";

export function formatAddress(address?: string | null) {
  if (!address) {
    return "--";
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatGenFromWei(value?: bigint | number | string | null) {
  if (value === null || value === undefined || value === "") {
    return "--";
  }

  try {
    const wei =
      typeof value === "bigint"
        ? value
        : BigInt(typeof value === "number" ? Math.trunc(value) : value);
    const formatted = formatUnits(wei, 18);
    const [whole, fraction = ""] = formatted.split(".");
    const trimmedFraction = fraction.slice(0, 4).replace(/0+$/, "");

    return `${trimmedFraction ? `${whole}.${trimmedFraction}` : whole} GEN`;
  } catch {
    return "--";
  }
}

export function formatGenAmount(value?: bigint | number | string | null) {
  return formatGenFromWei(value);
}

export function parseGenToWei(value: string | number | bigint) {
  if (typeof value === "bigint") {
    return value;
  }

  return parseUnits(String(value), 18);
}

export function formatDate(dateString?: string | number | null) {
  if (!dateString) {
    return "--";
  }

  const date = new Date(String(dateString));

  if (Number.isNaN(date.getTime())) {
    return String(dateString);
  }

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function statusLabel(status?: PolicyStatus | string | null) {
  const labels: Record<PolicyStatus, string> = {
    ACTIVE: "Coverage Active",
    CANCELLED: "Cancelled",
    EXPIRED: "Coverage Ended",
    PAID: "Payout Paid",
    TRIGGERED: "Payout Available",
  };

  return labels[status as PolicyStatus] ?? String(status ?? "--");
}

export function policyTypeLabel(policyType?: PolicyTypeId | string | null) {
  return (
    POLICY_TYPES.find((item) => item.id === policyType)?.label ??
    String(policyType ?? "--")
  );
}

export function policyTypeShortLabel(policyType?: PolicyTypeId | string | null) {
  const labels: Record<PolicyTypeId, string> = {
    RAINFALL_INDEX: "Rainfall",
    TEMPERATURE_INDEX: "Temperature",
  };

  return labels[policyType as PolicyTypeId] ?? policyTypeLabel(policyType);
}

export function eventLevelLabel(eventLevel?: EventLevelId | string | null) {
  return (
    EVENT_LEVELS.find((item) => item.id === eventLevel)?.label ??
    String(eventLevel ?? "--")
  );
}

export function durationLabel(durationDays?: DurationDays | number | string | null) {
  if (!durationDays) {
    return "--";
  }

  return `${durationDays} days`;
}

export function locationLabel(locationId?: string | null) {
  return (
    SUPPORTED_LOCATIONS.find((item) => item.id === locationId)?.label ??
    String(locationId ?? "--")
  );
}

export function locationShortLabel(locationId?: string | null) {
  return locationLabel(locationId).split(",")[0] || "--";
}

export function policyCoverageTitle(
  locationId?: string | null,
  policyType?: PolicyTypeId | string | null,
) {
  const location = locationShortLabel(locationId);
  const type = policyTypeShortLabel(policyType);

  if (location === "--" && type === "--") {
    return "Weather Coverage";
  }

  return `${location} ${type} Coverage`;
}

export function premiumDisplayForEventLevel(eventLevel?: EventLevelId | string | null) {
  return (
    PREMIUM_AND_COVERAGE.find((item) => item.level === eventLevel)
      ?.premiumDisplay ?? "--"
  );
}

export function coverageDisplayForEventLevel(eventLevel?: EventLevelId | string | null) {
  return (
    PREMIUM_AND_COVERAGE.find((item) => item.level === eventLevel)
      ?.coverageDisplay ?? "--"
  );
}
