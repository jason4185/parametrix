import {
  THRESHOLD_REGISTRY_URL,
  type EventLevelId,
  type PolicyTypeId,
} from "@/lib/constants";

type RegistryPolicyTerms = {
  display_name?: string;
  events?: Partial<Record<EventLevelId, number>>;
  unit?: string;
  weather_variable?: string;
};

type RegistryLocation = {
  country?: string;
  location_id?: string;
  name?: string;
  policies?: Partial<Record<PolicyTypeId, RegistryPolicyTerms>>;
};

type ThresholdRegistry = {
  locations?: Record<string, RegistryLocation>;
  version?: string;
};

export type RegistrySelection = {
  eventLevel: EventLevelId | string;
  locationId: string;
  policyType: PolicyTypeId | string;
};

export type RegistryValidationResult = {
  errors: string[];
  location?: RegistryLocation;
  ok: boolean;
  terms?: RegistryPolicyTerms & {
    threshold?: number;
  };
};

const EXPECTED_POLICY_METADATA = {
  RAINFALL_INDEX: {
    unit: "mm",
    weatherVariable: "precipitation_sum",
  },
  TEMPERATURE_INDEX: {
    unit: "\u00B0C",
    weatherVariable: "temperature_2m_max",
  },
} as const satisfies Record<
  PolicyTypeId,
  {
    unit: string;
    weatherVariable: string;
  }
>;

export async function fetchThresholdRegistry(): Promise<ThresholdRegistry> {
  const response = await fetch(THRESHOLD_REGISTRY_URL, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Unable to load the official threshold registry.");
  }

  const data: unknown = await response.json();

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("The official threshold registry response is invalid.");
  }

  return data as ThresholdRegistry;
}

export async function getRegistryLocation(
  locationId: string,
  registry?: ThresholdRegistry,
) {
  const thresholdRegistry = registry ?? (await fetchThresholdRegistry());

  return thresholdRegistry.locations?.[locationId] ?? null;
}

export async function getRegistryPolicyTerms(
  locationId: string,
  policyType: PolicyTypeId,
  eventLevel: EventLevelId,
  registry?: ThresholdRegistry,
) {
  const location = await getRegistryLocation(locationId, registry);
  const terms = location?.policies?.[policyType];
  const threshold = terms?.events?.[eventLevel];

  if (!terms || threshold === undefined) {
    return null;
  }

  return {
    ...terms,
    threshold,
  };
}

export function validateFrontendSelectionAgainstRegistry(
  selection: RegistrySelection,
  registry: ThresholdRegistry,
): RegistryValidationResult {
  const errors: string[] = [];
  const location = registry.locations?.[selection.locationId];

  if (!location) {
    errors.push(
      "Selected policy terms are not available in the official threshold registry.",
    );
    return {
      errors,
      ok: false,
    };
  }

  const policyType = selection.policyType as PolicyTypeId;
  const eventLevel = selection.eventLevel as EventLevelId;
  const terms = location.policies?.[policyType];

  if (!terms) {
    errors.push(
      "Selected policy terms are not available in the official threshold registry.",
    );
    return {
      errors,
      location,
      ok: false,
    };
  }

  const threshold = terms.events?.[eventLevel];

  if (threshold === undefined) {
    errors.push(
      "Selected policy terms are not available in the official threshold registry.",
    );
  }

  const expected = EXPECTED_POLICY_METADATA[policyType];

  if (!expected) {
    errors.push(
      "Selected policy terms are not available in the official threshold registry.",
    );
  } else {
    if (terms.weather_variable !== expected.weatherVariable) {
      errors.push(
        "Selected policy terms are not available in the official threshold registry.",
      );
    }

    if (terms.unit !== expected.unit) {
      errors.push(
        "Selected policy terms are not available in the official threshold registry.",
      );
    }
  }

  return {
    errors,
    location,
    ok: errors.length === 0,
    terms:
      threshold === undefined
        ? terms
        : {
            ...terms,
            threshold,
          },
  };
}
