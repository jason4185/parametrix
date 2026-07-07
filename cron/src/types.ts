export type Env = {
  CRON_SECRET?: string;
  DRY_RUN?: string;
  GENLAYER_NETWORK?: string;
  GENLAYER_RPC_URL?: string;
  MAX_POLICIES_PER_RUN?: string;
  OPERATOR_PRIVATE_KEY?: string;
  PARAMETRIX_CONTRACT_ADDRESS?: string;
  SETTLEMENT_DAYS_AGO?: string;
};

export type ContractArg =
  | bigint
  | boolean
  | null
  | number
  | string
  | ContractArg[]
  | { [key: string]: ContractArg };

export type ContractRecord = Record<string, unknown>;

export type CronSource = "cron" | "manual";

export type SettlementCronOptions = {
  dryRun?: boolean;
  settlementDate?: string;
  source?: CronSource;
};

export type SettlementReadiness = ContractRecord & {
  can_settle?: boolean;
  is_ready?: boolean;
  reason?: string;
};

export type PolicySettlementResult = {
  action: "dry_run" | "failed" | "settled" | "skipped";
  error?: string;
  policy_id: string;
  readiness_reason?: string;
  settlement_date: string;
  status_after?: string;
};

export type SettlementCronSummary = {
  active_count: number;
  dry_run: boolean;
  failed: number;
  ok: boolean;
  processed: number;
  results: PolicySettlementResult[];
  settlement_date: string;
  settled: number;
  skipped: number;
};
