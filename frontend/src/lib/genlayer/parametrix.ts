import type { Address, EIP1193Provider } from "viem";
import {
  CONTRACT_READ_METHODS,
  CONTRACT_WRITE_METHODS,
  PAYABLE_PREMIUM_WEI_BY_EVENT_LEVEL,
} from "@/lib/constants";
import {
  getGenLayerReadClient,
  PARAMETRIX_CONTRACT_ADDRESS,
} from "@/lib/genlayer/client";
import {
  cachedGenLayerRead,
  clearGenLayerReadCache,
  clearGenLayerMethodCache,
  createReadCacheKey,
} from "@/lib/genlayer/readCache";
import { parseGenToWei } from "@/lib/format";
import type {
  DurationDays,
  EventLevelId,
  PolicyStatus,
  PolicyTypeId,
} from "@/lib/constants";

type ContractArg =
  | bigint
  | boolean
  | null
  | number
  | string
  | ContractArg[]
  | { [key: string]: ContractArg };

type ContractReadOptions = {
  account?: Address;
  cacheTtlMs?: number;
  forceFresh?: boolean;
  forceRefresh?: boolean;
  provider?: EIP1193Provider;
};

type ContractWriteOptions = {
  account: Address;
  provider?: EIP1193Provider;
};

type ContractRecord = Record<string, unknown>;

export type ParametrixPolicyId = string;

export type ParametrixPolicySummary = ContractRecord & {
  coverage_end?: string;
  coverage_start?: string;
  duration_days?: number | string;
  event_level?: EventLevelId | string;
  id?: string | number;
  last_settled_date?: string;
  location_id?: string;
  policy_id?: string | number;
  policy_type?: PolicyTypeId | string;
  status?: PolicyStatus | string;
};

export type ParametrixPolicyFinancials = ContractRecord & {
  coverage_limit_wei?: bigint | number | string;
  is_claimable?: boolean;
  paid_at?: string;
  payout_amount_wei?: bigint | number | string;
  premium_paid_wei?: bigint | number | string;
  reserved_liability_wei?: bigint | number | string;
};

export type ParametrixSettlementStatus = ContractRecord & {
  covered_days_checked?: number | string;
  is_claimable?: boolean;
  last_settled_date?: string;
  next_settlement_date?: string;
  status?: PolicyStatus | string;
  triggered?: boolean;
};

export type ParametrixSettlementRecord = ContractRecord & {
  settlement_date?: string;
  settlementDate?: string;
  threshold?: number | string;
  threshold_scaled?: number | string;
  triggered?: boolean;
  unit?: string;
  weather_value?: number | string;
  weatherValue?: number | string;
};

export type ParametrixPoolStatus = ContractRecord & {
  available_capacity_wei?: bigint | number | string;
  capital_pool_wei?: bigint | number | string;
  reserved_liability_wei?: bigint | number | string;
  total_pool_wei?: bigint | number | string;
};

export type ParametrixSettlementReadiness = ContractRecord & {
  can_settle?: boolean;
  reason?: string;
  settlement_date?: string;
};

export type PurchasePolicyInput = ContractWriteOptions & {
  durationDays: DurationDays;
  eventLevel: EventLevelId;
  locationId: string;
  policyType: PolicyTypeId;
};

export const PREMIUM_WEI_BY_EVENT_LEVEL = {
  CRITICAL_EVENT: BigInt(PAYABLE_PREMIUM_WEI_BY_EVENT_LEVEL.CRITICAL_EVENT),
  EXTREME_EVENT: BigInt(PAYABLE_PREMIUM_WEI_BY_EVENT_LEVEL.EXTREME_EVENT),
  SEVERE_EVENT: BigInt(PAYABLE_PREMIUM_WEI_BY_EVENT_LEVEL.SEVERE_EVENT),
} satisfies Record<EventLevelId, bigint>;

function getContractAddress() {
  if (!PARAMETRIX_CONTRACT_ADDRESS) {
    throw new Error(
      "Missing NEXT_PUBLIC_PARAMETRIX_CONTRACT_ADDRESS. Add the deployed Parametrix contract address to .env.local.",
    );
  }

  return PARAMETRIX_CONTRACT_ADDRESS as Address;
}

function getClient(options?: ContractReadOptions) {
  return getGenLayerReadClient(options);
}

function serializedArgsFragment(args: ContractArg[]) {
  return `:${JSON.stringify(args)}`;
}

function parseContractValue<T>(
  value: unknown,
  context: string,
  emptyValue: T,
): T | unknown {
  if (value === null || value === undefined || value === "") {
    return emptyValue;
  }

  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return emptyValue;
  }

  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
    return value;
  }

  try {
    return JSON.parse(trimmed) as T;
  } catch (error) {
    throw new Error(
      `Unable to parse ${context} response from the Parametrix contract as JSON: ${
        error instanceof Error ? error.message : "unknown parse error"
      }`,
    );
  }
}

function asRecord<T extends ContractRecord>(
  value: unknown,
  context: string,
): T | null {
  const parsed = parseContractValue<T | null>(value, context, null);

  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return null;
  }

  return parsed as T;
}

function asRecords<T extends ContractRecord>(
  value: unknown,
  context: string,
): T[] {
  const parsed = parseContractValue<T[]>(value, context, []);

  if (Array.isArray(parsed)) {
    return parsed as T[];
  }

  if (parsed && typeof parsed === "object") {
    return Object.values(parsed as ContractRecord).filter(
      (item): item is T =>
        item !== null && typeof item === "object" && !Array.isArray(item),
    );
  }

  return [];
}

function normalizePolicyIds(value: unknown, context: string): string[] {
  const parsed = parseContractValue<unknown>(value, context, []);
  const source =
    parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as ContractRecord).policy_ids ??
        (parsed as ContractRecord).policyIds ??
        (parsed as ContractRecord).policies ??
        (parsed as ContractRecord).active_policies ??
        (parsed as ContractRecord).ids ??
        parsed
      : parsed;

  if (!Array.isArray(source)) {
    if (source === null || source === undefined || source === "") {
      return [];
    }

    return [String(source)];
  }

  return source
    .map((item) => {
      if (item && typeof item === "object") {
        const record = item as ContractRecord;
        return record.policy_id ?? record.policyId ?? record.id;
      }

      return item;
    })
    .filter((item): item is bigint | number | string => {
      return ["bigint", "number", "string"].includes(typeof item);
    })
    .map(String);
}

async function readContract(
  functionName: string,
  args: ContractArg[] = [],
  options?: ContractReadOptions,
) {
  const client = getClient(options);
  const address = getContractAddress();
  const key = createReadCacheKey({
    account: options?.account,
    args,
    contractAddress: address,
    methodName: functionName,
  });

  return cachedGenLayerRead({
    cacheTtlMs: options?.cacheTtlMs,
    forceFresh: options?.forceFresh ?? options?.forceRefresh,
    key,
    task: () =>
      client.readContract({
        address,
        args,
        functionName,
      }),
  });
}

async function writeContract(
  functionName: string,
  args: ContractArg[],
  value: bigint,
  options: ContractWriteOptions,
) {
  const client = getClient(options);

  return client.writeContract({
    address: getContractAddress(),
    args,
    functionName,
    value,
  });
}

export function getPremiumWeiForEventLevel(eventLevel: EventLevelId) {
  return PREMIUM_WEI_BY_EVENT_LEVEL[eventLevel];
}

export function clearParametrixReadCache(methodName?: string) {
  if (methodName) {
    clearGenLayerMethodCache(methodName);
    return;
  }

  clearGenLayerReadCache();
}

export function clearParametrixPolicyReadCache(
  policyId: ParametrixPolicyId,
  settlementDate?: string,
) {
  const policyArg = serializedArgsFragment([policyId]);
  const readinessArg = settlementDate
    ? serializedArgsFragment([policyId, settlementDate])
    : undefined;

  clearGenLayerReadCache((key) => {
    if (
      key.includes(`:${CONTRACT_READ_METHODS.GET_POLICY}:`) ||
      key.includes(`:${CONTRACT_READ_METHODS.GET_POLICY_SUMMARY}:`) ||
      key.includes(`:${CONTRACT_READ_METHODS.GET_POLICY_FINANCIALS}:`) ||
      key.includes(`:${CONTRACT_READ_METHODS.GET_POLICY_SETTLEMENT_STATUS}:`) ||
      key.includes(`:${CONTRACT_READ_METHODS.GET_POLICY_SETTLEMENT_HISTORY}:`)
    ) {
      return key.endsWith(policyArg);
    }

    if (key.includes(`:${CONTRACT_READ_METHODS.GET_SETTLEMENT_READINESS}:`)) {
      return readinessArg ? key.endsWith(readinessArg) : key.includes(`"${policyId}"`);
    }

    return false;
  });
}

export async function readPoolStatus(options?: ContractReadOptions) {
  return asRecord<ParametrixPoolStatus>(
    await readContract(CONTRACT_READ_METHODS.GET_POOL_STATUS, [], options),
    CONTRACT_READ_METHODS.GET_POOL_STATUS,
  );
}

export async function readMyPolicies(options?: ContractReadOptions) {
  return normalizePolicyIds(
    await readContract(CONTRACT_READ_METHODS.GET_MY_POLICIES, [], options),
    CONTRACT_READ_METHODS.GET_MY_POLICIES,
  );
}

export async function readPolicy(
  policyId: ParametrixPolicyId,
  options?: ContractReadOptions,
) {
  return asRecord<ContractRecord>(
    await readContract(CONTRACT_READ_METHODS.GET_POLICY, [policyId], options),
    CONTRACT_READ_METHODS.GET_POLICY,
  );
}

export async function readPolicySummary(
  policyId: ParametrixPolicyId,
  options?: ContractReadOptions,
) {
  return asRecord<ParametrixPolicySummary>(
    await readContract(
      CONTRACT_READ_METHODS.GET_POLICY_SUMMARY,
      [policyId],
      options,
    ),
    CONTRACT_READ_METHODS.GET_POLICY_SUMMARY,
  );
}

export async function readPolicySettlementStatus(
  policyId: ParametrixPolicyId,
  options?: ContractReadOptions,
) {
  return asRecord<ParametrixSettlementStatus>(
    await readContract(
      CONTRACT_READ_METHODS.GET_POLICY_SETTLEMENT_STATUS,
      [policyId],
      options,
    ),
    CONTRACT_READ_METHODS.GET_POLICY_SETTLEMENT_STATUS,
  );
}

export async function readPolicyFinancials(
  policyId: ParametrixPolicyId,
  options?: ContractReadOptions,
) {
  return asRecord<ParametrixPolicyFinancials>(
    await readContract(
      CONTRACT_READ_METHODS.GET_POLICY_FINANCIALS,
      [policyId],
      options,
    ),
    CONTRACT_READ_METHODS.GET_POLICY_FINANCIALS,
  );
}

export async function readPolicySettlementHistory(
  policyId: ParametrixPolicyId,
  options?: ContractReadOptions,
) {
  return asRecords<ParametrixSettlementRecord>(
    await readContract(
      CONTRACT_READ_METHODS.GET_POLICY_SETTLEMENT_HISTORY,
      [policyId],
      options,
    ),
    CONTRACT_READ_METHODS.GET_POLICY_SETTLEMENT_HISTORY,
  );
}

export async function readActivePolicies(options?: ContractReadOptions) {
  return normalizePolicyIds(
    await readContract(CONTRACT_READ_METHODS.GET_ACTIVE_POLICIES, [], options),
    CONTRACT_READ_METHODS.GET_ACTIVE_POLICIES,
  );
}

export async function readSettlementReadiness(
  policyId: ParametrixPolicyId,
  settlementDate: string,
  options?: ContractReadOptions,
) {
  return asRecord<ParametrixSettlementReadiness>(
    await readContract(
      CONTRACT_READ_METHODS.GET_SETTLEMENT_READINESS,
      [policyId, settlementDate],
      options,
    ),
    CONTRACT_READ_METHODS.GET_SETTLEMENT_READINESS,
  );
}

export async function readOwner(options?: ContractReadOptions) {
  const value = await readContract(CONTRACT_READ_METHODS.GET_OWNER, [], options);
  const parsed = parseContractValue<string | null>(
    value,
    CONTRACT_READ_METHODS.GET_OWNER,
    null,
  );

  return parsed === null ? null : String(parsed);
}

export async function readPolicyOwner(
  policyId: ParametrixPolicyId,
  options?: ContractReadOptions,
) {
  const value = await readContract(
    CONTRACT_READ_METHODS.GET_POLICY_OWNER,
    [policyId],
    options,
  );
  const parsed = parseContractValue<string | null>(
    value,
    CONTRACT_READ_METHODS.GET_POLICY_OWNER,
    null,
  );

  return parsed === null ? null : String(parsed);
}

export async function purchasePolicy({
  account,
  durationDays,
  eventLevel,
  locationId,
  policyType,
  provider,
}: PurchasePolicyInput) {
  return writeContract(
    CONTRACT_WRITE_METHODS.PURCHASE_POLICY,
    [locationId, policyType, eventLevel, durationDays],
    getPremiumWeiForEventLevel(eventLevel),
    { account, provider },
  );
}

export async function claimPayout(
  policyId: ParametrixPolicyId,
  options: ContractWriteOptions,
) {
  return writeContract(
    CONTRACT_WRITE_METHODS.CLAIM_PAYOUT,
    [policyId],
    BigInt(0),
    options,
  );
}

export async function cancelPolicy(
  policyId: ParametrixPolicyId,
  options: ContractWriteOptions,
) {
  return writeContract(
    CONTRACT_WRITE_METHODS.CANCEL_POLICY,
    [policyId],
    BigInt(0),
    options,
  );
}

export async function settlePolicyDay(
  policyId: ParametrixPolicyId,
  settlementDate: string,
  options: ContractWriteOptions,
) {
  return writeContract(
    CONTRACT_WRITE_METHODS.SETTLE_POLICY_DAY,
    [policyId, settlementDate],
    BigInt(0),
    options,
  );
}

export async function addPoolFunds(
  amountGen: string,
  options: ContractWriteOptions,
) {
  return writeContract(
    CONTRACT_WRITE_METHODS.ADD_POOL_FUNDS,
    [],
    parseGenToWei(amountGen),
    options,
  );
}

export async function withdrawFromPool(
  amountGen: string,
  options: ContractWriteOptions,
) {
  const wholeGenAmount = Number(amountGen);

  if (!Number.isInteger(wholeGenAmount) || wholeGenAmount <= 0) {
    throw new Error("Withdraw amount must be a positive whole GEN amount.");
  }

  return writeContract(
    CONTRACT_WRITE_METHODS.WITHDRAW_FROM_POOL,
    [wholeGenAmount],
    BigInt(0),
    options,
  );
}
