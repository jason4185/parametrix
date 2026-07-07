export const THRESHOLD_REGISTRY_URL =
  "https://parametrix-thresholds.netlify.app/thresholds/v1.json";

export const POLICY_TYPES = [
  {
    id: "RAINFALL_INDEX",
    label: "Rainfall Coverage",
    shortLabel: "Rainfall",
    description:
      "Covers rainfall accumulation events measured against your selected trigger.",
  },
  {
    id: "TEMPERATURE_INDEX",
    label: "Temperature Coverage",
    shortLabel: "Temperature",
    description:
      "Covers high-temperature events measured against your selected trigger.",
  },
] as const;

export const EVENT_LEVELS = [
  {
    id: "SEVERE_EVENT",
    label: "Severe Event",
    shortLabel: "Severe",
  },
  {
    id: "EXTREME_EVENT",
    label: "Extreme Event",
    shortLabel: "Extreme",
  },
  {
    id: "CRITICAL_EVENT",
    label: "Critical Event",
    shortLabel: "Critical",
  },
] as const;

export const DURATIONS = [7, 14, 30] as const;

export const POLICY_STATUSES = [
  "ACTIVE",
  "TRIGGERED",
  "PAID",
  "EXPIRED",
  "CANCELLED",
] as const;

export const SUPPORTED_LOCATIONS = [
  {
    id: "lagos_ng",
    label: "Lagos, Nigeria",
    country: "Nigeria",
  },
  {
    id: "abuja_ng",
    label: "Abuja, Nigeria",
    country: "Nigeria",
  },
  {
    id: "kano_ng",
    label: "Kano, Nigeria",
    country: "Nigeria",
  },
  {
    id: "new_york_us",
    label: "New York, United States",
    country: "United States",
  },
  {
    id: "los_angeles_us",
    label: "Los Angeles, United States",
    country: "United States",
  },
  {
    id: "miami_us",
    label: "Miami, United States",
    country: "United States",
  },
  {
    id: "london_gb",
    label: "London, United Kingdom",
    country: "United Kingdom",
  },
  {
    id: "manchester_gb",
    label: "Manchester, United Kingdom",
    country: "United Kingdom",
  },
  {
    id: "birmingham_gb",
    label: "Birmingham, United Kingdom",
    country: "United Kingdom",
  },
] as const;

export const PREMIUM_AND_COVERAGE = [
  {
    coveragePayoutGen: 3,
    level: "SEVERE_EVENT",
    label: "Severe Event",
    payableWei: "1000000000000000000",
    premiumGen: 1,
    shortLabel: "Severe",
    premiumDisplay: "Pay 1 GEN",
    coverageDisplay: "3 GEN",
    payoutDisplay: "3 GEN",
  },
  {
    coveragePayoutGen: 6,
    level: "EXTREME_EVENT",
    label: "Extreme Event",
    payableWei: "2000000000000000000",
    premiumGen: 2,
    shortLabel: "Extreme",
    premiumDisplay: "Pay 2 GEN",
    coverageDisplay: "6 GEN",
    payoutDisplay: "6 GEN",
  },
  {
    coveragePayoutGen: 10,
    level: "CRITICAL_EVENT",
    label: "Critical Event",
    payableWei: "3000000000000000000",
    premiumGen: 3,
    shortLabel: "Critical",
    premiumDisplay: "Pay 3 GEN",
    coverageDisplay: "10 GEN",
    payoutDisplay: "10 GEN",
  },
] as const;

export const PAYABLE_PREMIUM_WEI_BY_EVENT_LEVEL = {
  CRITICAL_EVENT: "3000000000000000000",
  EXTREME_EVENT: "2000000000000000000",
  SEVERE_EVENT: "1000000000000000000",
} as const satisfies Record<
  (typeof EVENT_LEVELS)[number]["id"],
  string
>;

export const CONTRACT_READ_METHODS = {
  GET_ACTIVE_POLICIES: "get_active_policies",
  GET_MY_POLICIES: "get_my_policies",
  GET_OWNER: "get_owner",
  GET_POLICY: "get_policy",
  GET_POLICY_FINANCIALS: "get_policy_financials",
  GET_POLICY_OWNER: "get_policy_owner",
  GET_POLICY_SETTLEMENT_HISTORY: "get_policy_settlement_history",
  GET_POLICY_SETTLEMENT_STATUS: "get_policy_settlement_status",
  GET_POLICY_SUMMARY: "get_policy_summary",
  GET_POOL_STATUS: "get_pool_status",
  GET_SETTLEMENT_READINESS: "get_settlement_readiness",
} as const;

export const CONTRACT_WRITE_METHODS = {
  ADD_POOL_FUNDS: "add_pool_funds",
  CANCEL_POLICY: "cancel_policy",
  CLAIM_PAYOUT: "claim_payout",
  PURCHASE_POLICY: "purchase_policy",
  SETTLE_POLICY_DAY: "settle_policy_day",
  WITHDRAW_FROM_POOL: "withdraw_from_pool",
} as const;

export type PolicyTypeId = (typeof POLICY_TYPES)[number]["id"];
export type EventLevelId = (typeof EVENT_LEVELS)[number]["id"];
export type DurationDays = (typeof DURATIONS)[number];
export type PolicyStatus = (typeof POLICY_STATUSES)[number];
