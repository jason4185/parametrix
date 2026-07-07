"use client";

import { FormEvent, useState } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { Activity, AlertTriangle, Clock3, Landmark, ShieldCheck } from "lucide-react";
import { useAccount } from "wagmi";
import { AppShell } from "@/components/layout/AppShell";
import { ReadErrorCard } from "@/components/status/ReadErrorCard";
import {
  TransactionStatusModal,
  type TransactionActionType,
  type TransactionStage,
} from "@/components/status/TransactionStatusModal";
import { Button } from "@/components/ui/Button";
import { DataRow } from "@/components/ui/DataRow";
import { SectionCard } from "@/components/ui/SectionCard";
import { WalletConnectButton } from "@/components/wallet/WalletConnectButton";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import {
  useActivePolicies,
  usePoolStatus,
  useSettlementReadiness,
  parametrixQueryKeys,
  ADMIN_READ_STALE_TIME,
} from "@/hooks/useParametrixReads";
import { CONTRACT_READ_METHODS } from "@/lib/constants";
import { adminPageContent } from "@/lib/content";
import {
  useAddPoolFunds,
  useSettlePolicyDay,
  useWithdrawFromPool,
} from "@/hooks/useParametrixWrites";
import {
  formatAddress,
  formatDate,
  policyCoverageTitle,
  statusLabel,
} from "@/lib/format";
import {
  clearParametrixPolicyReadCache,
  clearParametrixReadCache,
  readPolicy,
  readPoolStatus,
} from "@/lib/genlayer/parametrix";
import {
  booleanField,
  bigintField,
  genAmountFromRecord,
  statusFrom,
  stringField,
  type ParametrixRecord,
} from "@/lib/parametrixData";
import {
  settlementHistoryFromPolicy,
  parseSettlementRecord,
  settlementRecordDate,
  settlementRecordStatus,
} from "@/lib/settlement";

function Field({
  label,
  children,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <label className="block text-sm font-semibold text-text">
      {label}
      {children}
    </label>
  );
}

const inputClassName =
  "mt-2 w-full rounded-lg border border-white/10 bg-base px-4 py-3 text-sm text-text outline-none transition focus:border-cyan/60";

function humanizeReason(reason?: unknown) {
  if (!reason) {
    return "--";
  }

  return String(reason)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function capitalPoolValue(poolStatus: Record<string, unknown> | null | undefined) {
  return (
    bigintField(poolStatus, [
      "capital_pool_wei",
      "capitalPoolWei",
      "total_pool_wei",
      "totalPoolWei",
      "capital_pool",
      "capitalPool",
    ]) ?? BigInt(0)
  );
}

function activePolicyTitle(policyId: string, policy?: ParametrixRecord | null) {
  if (!policy) {
    return `Internal ID ${policyId}`;
  }

  return `${policyCoverageTitle(
    stringField(policy, ["location_id", "locationId"]),
    stringField(policy, ["policy_type", "policyType"]),
  )} · Internal ID ${policyId}`;
}

const CRON_HEALTH_URL =
  "https://parametrix-settlement-cron.jxson-parametrix.workers.dev/health";

type CronHealth = {
  checkedAt: string;
  health: "Failed" | "OK";
  worker: "Online" | "Unavailable";
};

function stringFromPayload(
  payload: Record<string, unknown>,
  keys: string[],
) {
  for (const key of keys) {
    const value = payload[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function formatHealthTimestamp(value: string | null) {
  if (!value) {
    return "Just checked";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "short",
    timeZone: "UTC",
    timeZoneName: "short",
    year: "numeric",
  }).format(date);
}

async function fetchCronHealth(): Promise<CronHealth> {
  const response = await fetch(CRON_HEALTH_URL, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Cron health unavailable");
  }

  let payload: Record<string, unknown> = {};

  try {
    const parsed = (await response.json()) as unknown;
    payload =
      parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : {};
  } catch {
    payload = {};
  }

  const status = stringFromPayload(payload, [
    "health",
    "status",
    "state",
    "ok",
  ]);
  const failedStatus =
    status && ["down", "error", "failed", "fail", "unavailable"].includes(
      status.toLowerCase(),
    );
  const timestamp = stringFromPayload(payload, [
    "checked_at",
    "checkedAt",
    "last_health_check",
    "lastHealthCheck",
    "timestamp",
    "time",
  ]);

  return {
    checkedAt: formatHealthTimestamp(timestamp),
    health: failedStatus ? "Failed" : "OK",
    worker: "Online",
  };
}

function AccessCard({
  action,
  body,
}: {
  action?: React.ReactNode;
  body: string;
}) {
  return (
    <SectionCard className="p-6">
      <p className="max-w-2xl text-sm leading-6 text-muted">{body}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </SectionCard>
  );
}

function CronStatusCard() {
  const cronHealth = useQuery({
    enabled: true,
    queryFn: fetchCronHealth,
    queryKey: ["parametrix", "cron-health"] as const,
    refetchOnReconnect: false,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retry: 0,
    staleTime: 45_000,
  });
  const data = cronHealth.data;
  const unavailable = cronHealth.isError;

  return (
    <SectionCard className="p-6">
      <div className="flex items-center gap-3">
        <Clock3 className="h-5 w-5 text-cyan" />
        <h2 className="text-lg font-semibold text-text">Cron Status</h2>
      </div>
      {unavailable ? (
        <p className="mt-5 text-sm text-muted">Cron health unavailable</p>
      ) : (
        <dl className="mt-5">
          <DataRow
            label="Cron Worker"
            value={cronHealth.isLoading ? "Checking..." : data?.worker ?? "Online"}
          />
          <DataRow label="Schedule" value="Daily at 01:00 UTC" />
          <DataRow label="Mode" value="Live" />
          <DataRow
            label="Last health check"
            value={cronHealth.isLoading ? "Checking..." : data?.checkedAt ?? "Just checked"}
          />
          <DataRow
            label="Health"
            value={cronHealth.isLoading ? "Checking..." : data?.health ?? "OK"}
          />
        </dl>
      )}
    </SectionCard>
  );
}

export function AdminContent() {
  const adminAccess = useAdminAccess();

  if (!adminAccess.isConnected) {
    return (
      <AppShell
        description="Connect your wallet to access operations."
        eyebrow="Access"
        title="Connect wallet"
      >
        <AccessCard
          action={<WalletConnectButton />}
          body="Connect your wallet to access operations."
        />
      </AppShell>
    );
  }

  if (adminAccess.isLoading) {
    return (
      <AppShell
        description="Verifying wallet access."
        eyebrow="Access"
        title="Checking access"
      >
        <AccessCard body="Verifying wallet access." />
      </AppShell>
    );
  }

  if (!adminAccess.isAdmin) {
    return (
      <AppShell
        description="This area is only available to the Parametrix operator."
        eyebrow="Access"
        title="Access restricted"
      >
        <AccessCard
          action={
            <Button href="/dashboard" variant="secondary">
              Back to My Policies
            </Button>
          }
          body="This area is only available to the Parametrix operator."
        />
      </AppShell>
    );
  }

  return (
    <AppShell
      description={adminPageContent.description}
      eyebrow="Operations"
      title="Settlement Operations"
    >
      <SectionCard className="mb-6 p-6">
        <h2 className="text-xl font-semibold text-text">Operations summary</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
          {adminPageContent.settlement}
        </p>
      </SectionCard>
      <AdminOperationsContent ownerAddress={adminAccess.ownerAddress} />
    </AppShell>
  );
}

function AdminOperationsContent({
  ownerAddress,
}: {
  ownerAddress: string | null;
}) {
  const { address, isConnected } = useAccount();
  const poolStatus = usePoolStatus({ enabled: true });
  const activePolicies = useActivePolicies({ enabled: true });
  const settlePolicyDay = useSettlePolicyDay();
  const addPoolFunds = useAddPoolFunds();
  const withdrawFromPool = useWithdrawFromPool();

  const [readinessPolicyId, setReadinessPolicyId] = useState("");
  const [readinessDate, setReadinessDate] = useState("");
  const [readinessTarget, setReadinessTarget] = useState<{
    policyId: string;
    settlementDate: string;
  } | null>(null);
  const [poolFundAmount, setPoolFundAmount] = useState("");
  const [transactionAction, setTransactionAction] =
    useState<TransactionActionType>("settlePolicyDay");
  const [transactionError, setTransactionError] = useState("");
  const [transactionOpen, setTransactionOpen] = useState(false);
  const [transactionSettlementResult, setTransactionSettlementResult] =
    useState<ParametrixRecord | null>(null);
  const [transactionStage, setTransactionStage] =
    useState<TransactionStage>("review");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const readiness = useSettlementReadiness(
    readinessTarget?.policyId,
    readinessTarget?.settlementDate,
    { enabled: true },
  );
  const activePolicyIds = activePolicies.data ?? [];
  const activePolicyQueries = useQueries({
    queries: activePolicyIds.map((policyId) => ({
      enabled: Boolean(policyId),
      queryFn: () =>
        readPolicy(policyId, { cacheTtlMs: ADMIN_READ_STALE_TIME }),
      queryKey: parametrixQueryKeys.policy(policyId),
      refetchOnReconnect: false,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      retry: 0,
      staleTime: ADMIN_READ_STALE_TIME,
    })),
  });
  const activePolicyRows = activePolicyIds.map((policyId, index) => ({
    id: policyId,
    policy: activePolicyQueries[index]?.data,
  }));
  const selectedPolicy = activePolicyRows.find(
    (item) => item.id === readinessPolicyId,
  )?.policy;
  const selectedPolicyIndex = activePolicyIds.indexOf(readinessPolicyId);
  const selectedPolicyInActiveList = selectedPolicyIndex >= 0;
  const selectedPolicyLoading =
    selectedPolicyInActiveList && activePolicyQueries[selectedPolicyIndex]?.isLoading;
  const selectedPolicyStatus = statusFrom(selectedPolicy);
  const selectedPolicyCanSettle =
    selectedPolicyInActiveList &&
    !selectedPolicyLoading &&
    (!selectedPolicyStatus || selectedPolicyStatus === "ACTIVE");

  const isOwner =
    Boolean(address && ownerAddress) &&
    address?.toLowerCase() === ownerAddress?.toLowerCase();
  const adminReadError =
    poolStatus.error ??
    activePolicies.error ??
    activePolicyQueries.find((query) => query.error)?.error;
  const transactionActive =
    transactionOpen &&
    ["accepted", "review", "submitting", "verifying", "wallet"].includes(
      transactionStage,
    );

  function handleReadinessCheck(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setReadinessTarget({
      policyId: readinessPolicyId,
      settlementDate: readinessDate,
    });
  }

  async function verifyPoolChange({
    before,
    direction,
  }: {
    before: bigint;
    direction: "down" | "up";
  }) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      if (attempt > 0) {
        await wait(1500);
      }

      const nextPoolStatus = await readPoolStatus({
        cacheTtlMs: 45_000,
        forceFresh: true,
      });
      const next = capitalPoolValue(nextPoolStatus);

      if (direction === "up" ? next > before : next < before) {
        return true;
      }
    }

    return false;
  }

  async function verifySettlement({
    beforeLastChecked,
    beforeStatus,
    policyId,
    settlementDate,
  }: {
    beforeLastChecked: string;
    beforeStatus?: string;
    policyId: string;
    settlementDate: string;
  }) {
    clearParametrixPolicyReadCache(policyId, settlementDate);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      if (attempt > 0) {
        await wait(1500);
      }

      const policy = await readPolicy(policyId, {
        cacheTtlMs: 120_000,
        forceFresh: true,
      });
      const nextHistory = settlementHistoryFromPolicy(policy);
      const nextLastChecked = stringField(policy, [
        "last_settled_date",
        "lastSettledDate",
      ]);
      const nextStatus = statusFrom(policy);

      if (
        nextHistory.some(
          (record) => settlementRecordDate(record) === settlementDate,
        ) ||
        (nextLastChecked !== "--" && nextLastChecked !== beforeLastChecked) ||
        (beforeStatus === "ACTIVE" &&
          (nextStatus === "TRIGGERED" || nextStatus === "EXPIRED")) ||
        (nextStatus && beforeStatus && nextStatus !== beforeStatus)
      ) {
        return true;
      }
    }

    return false;
  }

  async function runAdminTransaction({
    action,
    execute,
    verify,
  }: {
    action: TransactionActionType;
    execute: () => Promise<unknown>;
    verify: () => Promise<boolean>;
  }) {
    if (transactionActive) {
      return;
    }

    setTransactionAction(action);
    setTransactionError("");
    setTransactionOpen(true);
    setTransactionStage("review");

    const walletTimer = setTimeout(() => {
      setTransactionStage("wallet");
    }, 250);
    const submittingTimer = setTimeout(() => {
      setTransactionStage("submitting");
    }, 1000);

    try {
      await execute();
      clearTimeout(walletTimer);
      clearTimeout(submittingTimer);
      setTransactionStage("accepted");
      await wait(350);
      setTransactionStage("verifying");

      const verified = await verify();
      setTransactionStage(verified ? "completed" : "submitted");
      poolStatus.refetch();
      activePolicies.refetch();
      activePolicyQueries.forEach((query) => query.refetch());
    } catch {
      clearTimeout(walletTimer);
      clearTimeout(submittingTimer);
      setTransactionError("The transaction was not completed.");
      setTransactionStage("failed");
    }
  }

  function resetTransaction() {
    settlePolicyDay.reset();
    addPoolFunds.reset();
    withdrawFromPool.reset();
    setTransactionError("");
    setTransactionOpen(false);
    setTransactionSettlementResult(null);
    setTransactionStage("review");
  }

  function refreshAdminReads() {
    clearParametrixReadCache(CONTRACT_READ_METHODS.GET_POOL_STATUS);
    clearParametrixReadCache(CONTRACT_READ_METHODS.GET_ACTIVE_POLICIES);
    activePolicyIds.forEach((policyId) => {
      clearParametrixPolicyReadCache(policyId);
    });
    poolStatus.refetch();
    activePolicies.refetch();
    activePolicyQueries.forEach((query) => query.refetch());
  }

  async function handleSettle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const beforePolicy = await readPolicy(readinessPolicyId, {
      cacheTtlMs: 120_000,
      forceFresh: true,
    }).catch(() => null);
    const beforeLastChecked = stringField(beforePolicy, [
      "last_settled_date",
      "lastSettledDate",
    ]);
    const beforeStatus = statusFrom(beforePolicy);
    setTransactionSettlementResult(null);

    runAdminTransaction({
      action: "settlePolicyDay",
      execute: async () => {
        const result = await settlePolicyDay.mutateAsync({
          policyId: readinessPolicyId,
          settlementDate: readinessDate,
        });
        setTransactionSettlementResult(parseSettlementRecord(result));
        return result;
      },
      verify: () =>
        verifySettlement({
          beforeLastChecked,
          beforeStatus,
          policyId: readinessPolicyId,
          settlementDate: readinessDate,
        }),
    });
  }

  async function handleAddPoolFunds(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const before = capitalPoolValue(poolStatus.data);

    runAdminTransaction({
      action: "addPoolFunds",
      execute: () => addPoolFunds.mutateAsync(poolFundAmount),
      verify: () => verifyPoolChange({ before, direction: "up" }),
    });
  }

  async function handleWithdraw(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const before = capitalPoolValue(poolStatus.data);

    runAdminTransaction({
      action: "withdrawPoolFunds",
      execute: () => withdrawFromPool.mutateAsync(withdrawAmount),
      verify: () => verifyPoolChange({ before, direction: "down" }),
    });
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <SectionCard className="p-6">
          <div className="flex items-center gap-3">
            <Landmark className="h-5 w-5 text-cyan" />
            <h2 className="text-lg font-semibold text-text">Pool Overview</h2>
          </div>
          <dl className="mt-5">
            <DataRow
              label="Capital Pool"
              value={
                poolStatus.isLoading
                  ? "Loading..."
                  : genAmountFromRecord(poolStatus.data, [
                      "capital_pool_wei",
                      "capitalPoolWei",
                      "total_pool_wei",
                      "totalPoolWei",
                      "capital_pool",
                      "capitalPool",
                    ])
              }
            />
            <DataRow
              label="Reserved Payouts"
              value={
                poolStatus.isLoading
                  ? "Loading..."
                  : genAmountFromRecord(poolStatus.data, [
                      "reserved_liability_wei",
                      "reservedLiabilityWei",
                      "reserved_liability",
                      "reservedLiability",
                    ])
              }
            />
            <DataRow
              label="Available Capacity"
              value={
                poolStatus.isLoading
                  ? "Loading..."
                  : genAmountFromRecord(poolStatus.data, [
                      "available_capacity_wei",
                      "availableCapacityWei",
                      "available_capacity",
                      "availableCapacity",
                    ])
              }
            />
          </dl>
        </SectionCard>

        <SectionCard className="p-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-cyan" />
            <h2 className="text-lg font-semibold text-text">Active Coverage</h2>
          </div>
          <p className="mt-5 text-3xl font-semibold text-text">
            {activePolicies.isLoading ? "Loading..." : activePolicies.data?.length ?? 0}
          </p>
          <p className="mt-3 text-sm leading-6 text-muted">
            Coverage ready for settlement review.
          </p>
        </SectionCard>

        <SectionCard className="p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber" />
            <h2 className="text-lg font-semibold text-text">Owner Account</h2>
          </div>
          <dl className="mt-5">
            <DataRow label="Contract owner" value={formatAddress(ownerAddress)} />
            <DataRow
              label="Wallet permission"
              value={!isConnected ? "Connect wallet" : isOwner ? "Owner" : "Read-only"}
            />
          </dl>
        </SectionCard>

        <CronStatusCard />
      </div>

      {adminReadError ? (
        <ReadErrorCard
          error={adminReadError}
          onRetry={refreshAdminReads}
        />
      ) : null}

      <div className="flex justify-end">
        <Button
          onClick={refreshAdminReads}
          variant="secondary"
        >
          Refresh
        </Button>
      </div>

      <SectionCard className="p-6">
        <div className="flex items-center gap-3">
          <Activity className="h-5 w-5 text-cyan" />
          <h2 className="text-xl font-semibold text-text">
            Active Coverage
          </h2>
        </div>
        <div className="mt-5 grid gap-3">
          {activePolicies.isLoading ? (
            <span className="text-sm text-muted">Loading active policies...</span>
          ) : activePolicyRows.length > 0 ? (
            activePolicyRows.map(({ id, policy }) => (
              <div
                className="grid gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm md:grid-cols-[1.3fr_0.55fr_0.65fr_0.75fr_0.7fr_0.7fr]"
                key={id}
              >
                <div>
                  <p className="text-muted">Coverage</p>
                  <p className="mt-1 font-semibold text-text">
                    {policyCoverageTitle(
                      stringField(policy, ["location_id", "locationId"]),
                      stringField(policy, ["policy_type", "policyType"]),
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-muted">Internal ID</p>
                  <p className="mt-1 font-semibold text-text">{id}</p>
                </div>
                <div>
                  <p className="text-muted">Status</p>
                  <p className="mt-1 font-semibold text-text">
                    {statusLabel(statusFrom(policy))}
                  </p>
                </div>
                <div>
                  <p className="text-muted">Coverage Period</p>
                  <p className="mt-1 font-semibold text-text">
                    {formatDate(
                      stringField(policy, ["coverage_start", "coverageStart"]),
                    )}{" "}
                    -{" "}
                    {formatDate(
                      stringField(policy, ["coverage_end", "coverageEnd"]),
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-muted">Last Checked</p>
                  <p className="mt-1 font-semibold text-text">
                    {formatDate(
                      stringField(policy, [
                        "last_settled_date",
                        "lastSettledDate",
                      ]),
                    ) === "--"
                      ? "Not checked yet"
                      : formatDate(
                          stringField(policy, [
                            "last_settled_date",
                            "lastSettledDate",
                          ]),
                      )}
                  </p>
                </div>
                <div>
                  <p className="text-muted">Next Check</p>
                  <p className="mt-1 font-semibold text-text">
                    {formatDate(
                      stringField(policy, [
                        "next_settlement_date",
                        "nextSettlementDate",
                      ]),
                    ) === "--"
                      ? "Not available"
                      : formatDate(
                          stringField(policy, [
                            "next_settlement_date",
                            "nextSettlementDate",
                          ]),
                        )}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <span className="text-sm text-muted">No active policies found.</span>
          )}
        </div>
      </SectionCard>

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard className="p-6">
          <h2 className="text-xl font-semibold text-text">Readiness Check</h2>
          <form className="mt-5 grid gap-4" onSubmit={handleReadinessCheck}>
            <Field label="Active Coverage">
              <select
                className={inputClassName}
                onChange={(event) => setReadinessPolicyId(event.target.value)}
                required
                value={readinessPolicyId}
              >
                <option value="">
                  {activePolicies.isLoading
                    ? "Loading active coverage..."
                    : "Select active coverage"}
                </option>
                {activePolicyRows.map(({ id, policy }) => (
                  <option key={id} value={id}>
                    {activePolicyTitle(id, policy)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Settlement date">
              <input
                className={inputClassName}
                onChange={(event) => setReadinessDate(event.target.value)}
                required
                type="date"
                value={readinessDate}
              />
            </Field>
            <Button disabled={readiness.isFetching} type="submit">
              {readiness.isFetching ? "Checking readiness..." : "Check Readiness"}
            </Button>
          </form>
          <div className="mt-5 rounded-md border border-white/10 bg-white/[0.03] p-4 text-sm text-muted">
            {readinessTarget ? (
              readiness.isLoading ? (
                "Loading readiness result..."
              ) : readiness.error ? (
                "Unable to load readiness. Please wait a moment and try again."
              ) : (
                <dl>
                  <DataRow
                    label="Ready"
                    value={readiness.data?.can_settle ? "Yes" : "No"}
                  />
                  <DataRow
                    label="Reason"
                    value={humanizeReason(readiness.data?.reason)}
                  />
                </dl>
              )
            ) : (
              "Select active coverage and a settlement date to check readiness."
            )}
          </div>
        </SectionCard>

        <SectionCard className="p-6">
          <h2 className="text-xl font-semibold text-text">Manual Settlement</h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            Submit a settlement check for the selected policy and covered date.
            Owner permissions are enforced by the contract.
          </p>
          <form className="mt-5 grid gap-4" onSubmit={handleSettle}>
            <Field label="Active Coverage">
              <select
                className={inputClassName}
                onChange={(event) => setReadinessPolicyId(event.target.value)}
                required
                value={readinessPolicyId}
              >
                <option value="">
                  {activePolicies.isLoading
                    ? "Loading active coverage..."
                    : "Select active coverage"}
                </option>
                {activePolicyRows.map(({ id, policy }) => (
                  <option key={id} value={id}>
                    {activePolicyTitle(id, policy)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Settlement date">
              <input
                className={inputClassName}
                onChange={(event) => setReadinessDate(event.target.value)}
                required
                type="date"
                value={readinessDate}
              />
            </Field>
            <Button
              disabled={
                !selectedPolicyCanSettle ||
                transactionActive ||
                settlePolicyDay.isPending
              }
              type="submit"
            >
              {transactionActive && transactionAction === "settlePolicyDay"
                ? "Submitting settlement..."
                : "Settle selected date"}
            </Button>
            {!selectedPolicyCanSettle && readinessPolicyId ? (
              <p className="text-sm text-muted">
                Only active coverage can be settled.
              </p>
            ) : null}
          </form>
        </SectionCard>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard className="p-6">
          <h2 className="text-xl font-semibold text-text">Add pool funds</h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            Adds the entered GEN amount to the capital pool.
          </p>
          <form className="mt-5 grid gap-4" onSubmit={handleAddPoolFunds}>
            <Field label="Amount GEN">
              <input
                className={inputClassName}
                min="0"
                onChange={(event) => setPoolFundAmount(event.target.value)}
                required
                step="0.01"
                type="number"
                value={poolFundAmount}
              />
            </Field>
            <Button
              disabled={transactionActive || addPoolFunds.isPending}
              type="submit"
            >
              {transactionActive && transactionAction === "addPoolFunds"
                ? "Submitting funds..."
                : "Add Pool Funds"}
            </Button>
          </form>
        </SectionCard>

        <SectionCard className="p-6">
          <h2 className="text-xl font-semibold text-text">
            Withdraw from pool
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            Withdraw expects a positive whole GEN amount. This action is
            owner-only.
          </p>
          {!isOwner ? (
            <div className="mt-4 rounded-md border border-amber/20 bg-amber/10 p-3 text-sm text-amber">
              Connect the owner wallet to withdraw pool funds.
            </div>
          ) : null}
          <form className="mt-5 grid gap-4" onSubmit={handleWithdraw}>
            <Field label="Amount GEN">
              <input
                className={inputClassName}
                min="1"
                onChange={(event) => setWithdrawAmount(event.target.value)}
                required
                step="1"
                type="number"
                value={withdrawAmount}
              />
            </Field>
            <Button
              disabled={!isOwner || transactionActive || withdrawFromPool.isPending}
              type="submit"
              variant="secondary"
            >
              {transactionActive && transactionAction === "withdrawPoolFunds"
                ? "Submitting withdrawal..."
                : "Withdraw From Pool"}
            </Button>
          </form>
        </SectionCard>
      </div>
      <TransactionStatusModal
        actionType={transactionAction}
        details={
          transactionAction === "settlePolicyDay" && readinessPolicyId
            ? [
                {
                  label: "Coverage",
                  value: activePolicyTitle(readinessPolicyId, selectedPolicy),
                },
                {
                  label: "Settlement Date",
                  value: formatDate(readinessDate),
                },
                ...(transactionSettlementResult
                  ? [
                      {
                        label: "Result",
                        value: booleanField(transactionSettlementResult, [
                          "triggered",
                          "is_triggered",
                          "isTriggered",
                        ])
                          ? "Trigger met"
                          : "Trigger not met",
                      },
                      {
                        label: "Status",
                        value: settlementRecordStatus(
                          transactionSettlementResult,
                          selectedPolicyStatus,
                        ),
                      },
                    ]
                  : []),
              ]
            : undefined
        }
        errorMessage={transactionError}
        onClose={resetTransaction}
        open={transactionOpen}
        primaryAction={
          transactionStage === "completed" || transactionStage === "submitted"
            ? transactionAction === "settlePolicyDay" && readinessPolicyId
              ? { href: `/policy/${readinessPolicyId}`, label: "View Policy" }
              : { href: "/admin", label: "Back to Operations" }
            : transactionStage === "failed"
              ? { label: "Try Again", onClick: resetTransaction }
              : undefined
        }
        secondaryAction={
          (transactionStage === "completed" || transactionStage === "submitted") &&
          transactionAction === "settlePolicyDay"
            ? { href: "/admin", label: "Back to Operations", variant: "secondary" }
            : undefined
        }
        stage={transactionStage}
      />
    </div>
  );
}
