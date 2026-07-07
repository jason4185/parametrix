import { getUtcDateDaysAgo, isValidDateString } from "./date";
import { createParametrixCronClient } from "./genlayerClient";
import { logger } from "./logger";
import type {
  ContractRecord,
  Env,
  PolicySettlementResult,
  SettlementCronOptions,
  SettlementCronSummary,
  SettlementReadiness
} from "./types";

const CONTRACT_READ_METHODS = {
  GET_ACTIVE_POLICIES: "get_active_policies",
  GET_POLICY: "get_policy",
  GET_SETTLEMENT_READINESS: "get_settlement_readiness"
} as const;

const CONTRACT_WRITE_METHODS = {
  SETTLE_POLICY_DAY: "settle_policy_day"
} as const;

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function parseBoolean(value: string | undefined, fallback: boolean) {
  if (value === undefined || value === "") {
    return fallback;
  }

  return value.toLowerCase() === "true";
}

function parsePositiveInteger(
  value: string | undefined,
  fallback: number,
  minimum = 1
) {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);

  return Number.isFinite(parsed) && parsed >= minimum ? parsed : fallback;
}

function parseJsonSafely(value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
    return value;
  }

  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return value;
  }
}

function asRecord(value: unknown): ContractRecord | null {
  const parsed = parseJsonSafely(value);

  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    return parsed as ContractRecord;
  }

  return null;
}

function normalizePolicyIds(value: unknown): string[] {
  const parsed = parseJsonSafely(value);
  const source =
    parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as ContractRecord).policy_ids ??
        (parsed as ContractRecord).policyIds ??
        (parsed as ContractRecord).active_policies ??
        (parsed as ContractRecord).activePolicies ??
        (parsed as ContractRecord).policies ??
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

function parseSettlementHistory(value: unknown): ContractRecord[] {
  const parsed = parseJsonSafely(value);

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed.filter(
    (item): item is ContractRecord =>
      item !== null && typeof item === "object" && !Array.isArray(item)
  );
}

function policySettlementHistory(policy: ContractRecord | null) {
  if (!policy) {
    return [];
  }

  return parseSettlementHistory(
    policy.settlement_history ??
      policy.settlementHistory ??
      policy.settlement_records ??
      policy.settlementRecords ??
      policy.history
  );
}

function recordSettlementDate(record: ContractRecord) {
  return String(record.settlement_date ?? record.settlementDate ?? record.date ?? "");
}

function statusFromPolicy(policy: ContractRecord | null) {
  if (!policy) {
    return undefined;
  }

  const status = policy.status ?? policy.policy_status ?? policy.policyStatus;
  return status === undefined || status === null ? undefined : String(status);
}

function lastSettledDate(policy: ContractRecord | null) {
  if (!policy) {
    return undefined;
  }

  const value = policy.last_settled_date ?? policy.lastSettledDate;
  return value === undefined || value === null || value === "" ? undefined : String(value);
}

function readinessIsReady(readiness: SettlementReadiness | null) {
  return readiness?.is_ready === true || readiness?.can_settle === true;
}

function readinessReason(readiness: SettlementReadiness | null) {
  const reason = readiness?.reason;
  return reason === undefined || reason === null || reason === ""
    ? "Not ready"
    : String(reason);
}

function errorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function isRateLimitError(error: unknown) {
  const message = errorMessage(error).toLowerCase();
  return (
    message.includes("rate limit") ||
    message.includes("gen_call") ||
    message.includes("exceeded")
  );
}

async function withRateLimitRetry<T>(label: string, task: () => Promise<T>) {
  try {
    return await task();
  } catch (error) {
    if (!isRateLimitError(error)) {
      throw error;
    }

    logger.warn("rate_limit_retry", {
      label,
      message: errorMessage(error)
    });
    await wait(5000);
    return task();
  }
}

function getSettlementDate(env: Env, options: SettlementCronOptions) {
  if (options.settlementDate) {
    if (!isValidDateString(options.settlementDate)) {
      throw new Error("Invalid settlement_date. Use YYYY-MM-DD.");
    }

    return options.settlementDate;
  }

  const daysAgo = parsePositiveInteger(env.SETTLEMENT_DAYS_AGO, 1);
  return getUtcDateDaysAgo(daysAgo);
}

function validateEnv(env: Env) {
  const missing = [
    "PARAMETRIX_CONTRACT_ADDRESS",
    "GENLAYER_RPC_URL",
    "GENLAYER_NETWORK",
    "OPERATOR_PRIVATE_KEY"
  ].filter((key) => !env[key as keyof Env]);

  if (missing.length > 0) {
    throw new Error(`Missing required env: ${missing.join(", ")}.`);
  }
}

async function verifySettlement({
  client,
  policyId,
  settlementDate
}: {
  client: ReturnType<typeof createParametrixCronClient>;
  policyId: string;
  settlementDate: string;
}) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    if (attempt > 0) {
      await wait(1500);
    }

    const policy = asRecord(
      await withRateLimitRetry("get_policy", () =>
        client.readContract(CONTRACT_READ_METHODS.GET_POLICY, [policyId])
      )
    );
    const status = statusFromPolicy(policy);
    const history = policySettlementHistory(policy);

    if (
      lastSettledDate(policy) === settlementDate ||
      status === "TRIGGERED" ||
      status === "EXPIRED" ||
      history.some((record) => recordSettlementDate(record) === settlementDate)
    ) {
      return {
        policy,
        verified: true
      };
    }
  }

  return {
    policy: null,
    verified: false
  };
}

async function processPolicy({
  client,
  dryRun,
  policyId,
  settlementDate
}: {
  client: ReturnType<typeof createParametrixCronClient>;
  dryRun: boolean;
  policyId: string;
  settlementDate: string;
}): Promise<PolicySettlementResult> {
  try {
    const readiness = asRecord(
      await withRateLimitRetry("get_settlement_readiness", () =>
        client.readContract(CONTRACT_READ_METHODS.GET_SETTLEMENT_READINESS, [
          policyId,
          settlementDate
        ])
      )
    ) as SettlementReadiness | null;
    const reason = readinessReason(readiness);

    if (!readinessIsReady(readiness)) {
      logger.info("policy_skipped", {
        policy_id: policyId,
        readiness_reason: reason,
        settlement_date: settlementDate
      });

      return {
        action: "skipped",
        policy_id: policyId,
        readiness_reason: reason,
        settlement_date: settlementDate
      };
    }

    if (dryRun) {
      logger.info("policy_skipped", {
        dry_run: true,
        policy_id: policyId,
        readiness_reason: reason,
        settlement_date: settlementDate
      });

      return {
        action: "dry_run",
        policy_id: policyId,
        readiness_reason: reason,
        settlement_date: settlementDate
      };
    }

    await withRateLimitRetry("settle_policy_day", () =>
      client.writeContract(CONTRACT_WRITE_METHODS.SETTLE_POLICY_DAY, [
        policyId,
        settlementDate
      ])
    );
    logger.info("policy_settlement_submitted", {
      policy_id: policyId,
      settlement_date: settlementDate
    });

    const verification = await verifySettlement({
      client,
      policyId,
      settlementDate
    });
    const statusAfter = statusFromPolicy(verification.policy);

    if (!verification.verified) {
      logger.warn("policy_failed", {
        error: "Settlement write was accepted but verification was delayed.",
        policy_id: policyId,
        settlement_date: settlementDate
      });

      return {
        action: "failed",
        error: "Settlement was submitted, but latest policy state could not be verified yet.",
        policy_id: policyId,
        readiness_reason: reason,
        settlement_date: settlementDate,
        status_after: statusAfter
      };
    }

    logger.info("policy_settlement_verified", {
      policy_id: policyId,
      settlement_date: settlementDate,
      status_after: statusAfter
    });

    return {
      action: "settled",
      policy_id: policyId,
      readiness_reason: reason,
      settlement_date: settlementDate,
      status_after: statusAfter
    };
  } catch (error) {
    logger.error("policy_failed", {
      error: errorMessage(error),
      policy_id: policyId,
      settlement_date: settlementDate
    });

    return {
      action: "failed",
      error: errorMessage(error),
      policy_id: policyId,
      settlement_date: settlementDate
    };
  }
}

export async function runSettlementCron(
  env: Env,
  options: SettlementCronOptions = {}
): Promise<SettlementCronSummary> {
  validateEnv(env);

  const settlementDate = getSettlementDate(env, options);
  const maxPolicies = parsePositiveInteger(env.MAX_POLICIES_PER_RUN, 25);
  const dryRun = options.dryRun ?? parseBoolean(env.DRY_RUN, false);
  const client = createParametrixCronClient(env);

  logger.info("cron_start", {
    dry_run: dryRun,
    max_policies: maxPolicies,
    operator: client.operatorAddress,
    settlement_date: settlementDate,
    source: options.source ?? "cron"
  });

  const activePolicyIds = normalizePolicyIds(
    await withRateLimitRetry("get_active_policies", () =>
      client.readContract(CONTRACT_READ_METHODS.GET_ACTIVE_POLICIES, [])
    )
  );
  const policyIdsToProcess = activePolicyIds.slice(0, maxPolicies);

  if (activePolicyIds.length === 0) {
    const emptySummary: SettlementCronSummary = {
      active_count: 0,
      dry_run: dryRun,
      failed: 0,
      ok: true,
      processed: 0,
      results: [],
      settlement_date: settlementDate,
      settled: 0,
      skipped: 0
    };

    logger.info("cron_complete", emptySummary);
    return emptySummary;
  }

  const results: PolicySettlementResult[] = [];

  for (const [index, policyId] of policyIdsToProcess.entries()) {
    if (index > 0) {
      await wait(500);
    }

    results.push(
      await processPolicy({
        client,
        dryRun,
        policyId,
        settlementDate
      })
    );
  }

  const summary: SettlementCronSummary = {
    active_count: activePolicyIds.length,
    dry_run: dryRun,
    failed: results.filter((result) => result.action === "failed").length,
    ok: true,
    processed: results.length,
    results,
    settlement_date: settlementDate,
    settled: results.filter((result) => result.action === "settled").length,
    skipped: results.filter(
      (result) => result.action === "skipped" || result.action === "dry_run"
    ).length
  };

  logger.info("cron_complete", summary);
  return summary;
}
