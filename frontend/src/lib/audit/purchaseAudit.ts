import {
  DURATIONS,
  EVENT_LEVELS,
  PAYABLE_PREMIUM_WEI_BY_EVENT_LEVEL,
  POLICY_TYPES,
  SUPPORTED_LOCATIONS,
  type DurationDays,
  type EventLevelId,
  type PolicyTypeId,
} from "@/lib/constants";

type PurchaseSelection = {
  durationDays: number;
  eventLevel: string;
  locationId: string;
  policyType: string;
};

export function auditPurchaseSelection(selection: PurchaseSelection) {
  const errors: string[] = [];
  const locationIds = SUPPORTED_LOCATIONS.map((location) => location.id);
  const policyTypes = POLICY_TYPES.map((policyType) => policyType.id);
  const eventLevels = EVENT_LEVELS.map((eventLevel) => eventLevel.id);
  const durations = [...DURATIONS];

  if (!locationIds.includes(selection.locationId as (typeof locationIds)[number])) {
    errors.push("Selected location is not supported by Parametrix.");
  }

  if (!policyTypes.includes(selection.policyType as PolicyTypeId)) {
    errors.push("Selected policy type is not supported by Parametrix.");
  }

  if (!eventLevels.includes(selection.eventLevel as EventLevelId)) {
    errors.push("Selected event level is not supported by Parametrix.");
  }

  if (!durations.includes(selection.durationDays as DurationDays)) {
    errors.push("Selected coverage duration is not supported by Parametrix.");
  }

  const payableWeiByEventLevel: Partial<Record<string, string>> =
    PAYABLE_PREMIUM_WEI_BY_EVENT_LEVEL;
  const payableWei = payableWeiByEventLevel[selection.eventLevel] ?? "0";

  if (payableWei === "0") {
    errors.push("Selected event level does not have a payable premium.");
  }

  return {
    contractArgs: {
      duration_days: selection.durationDays,
      event_level: selection.eventLevel,
      location_id: selection.locationId,
      policy_type: selection.policyType,
    },
    errors,
    ok: errors.length === 0,
    payableWei,
  };
}
