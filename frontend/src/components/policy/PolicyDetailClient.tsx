"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Activity, Gauge, MapPin, RefreshCw, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useAccount } from "wagmi";
import { SettlementHistoryChart } from "@/components/charts/SettlementHistoryChart";
import { PolicyStatusBadge } from "@/components/policy/PolicyStatusBadge";
import { ReadErrorCard } from "@/components/status/ReadErrorCard";
import {
  TransactionStatusModal,
  type TransactionActionType,
  type TransactionStage,
} from "@/components/status/TransactionStatusModal";
import { ActionBar } from "@/components/ui/ActionBar";
import { Button } from "@/components/ui/Button";
import { DataRow } from "@/components/ui/DataRow";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { parametrixQueryKeys, usePolicyDetails } from "@/hooks/useParametrixReads";
import { useCancelPolicy, useClaimPayout } from "@/hooks/useParametrixWrites";
import {
  clearParametrixPolicyReadCache,
  readPolicy,
} from "@/lib/genlayer/parametrix";
import {
  durationLabel,
  eventLevelLabel,
  formatDate,
  locationLabel,
  policyCoverageTitle,
  policyTypeShortLabel,
} from "@/lib/format";
import {
  booleanField,
  genAmountFromRecord,
  isPolicyStatus,
  type ParametrixRecord,
  statusFrom,
  stringField,
  valueFrom,
  weatherNumber,
} from "@/lib/parametrixData";
import {
  settlementHistoryFromPolicy,
  settlementRecordDate,
  settlementRecordStatus,
} from "@/lib/settlement";

type PolicyDetailClientProps = {
  policyId: string;
};

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return <DataRow label={label} value={value} />;
}

function rawValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "--";
  }

  if (typeof value === "object") {
    return "--";
  }

  return String(value);
}

function displayDate(dateString?: string | number | null) {
  const value = formatDate(dateString);
  return value === "--" ? "Not checked yet" : value;
}

function thresholdDisplay(value: unknown, unit?: string) {
  const formattedValue = rawValue(value);

  if (formattedValue === "--") {
    return "--";
  }

  if (!unit) {
    return formattedValue;
  }

  return unit === "°C" ? `${formattedValue}${unit}` : `${formattedValue} ${unit}`;
}

function weatherDisplay(
  record: ParametrixRecord | null | undefined,
  directKeys: string[],
  scaledKeys: string[],
  unit?: string,
) {
  const value = weatherNumber(record, directKeys, scaledKeys);
  return thresholdDisplay(value, unit);
}

function SummaryTile({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-text">{value}</p>
    </div>
  );
}

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function PolicyDetailClient({ policyId }: PolicyDetailClientProps) {
  const queryClient = useQueryClient();
  const { isConnected } = useAccount();
  const details = usePolicyDetails(policyId);
  const claimPayout = useClaimPayout();
  const cancelPolicy = useCancelPolicy();
  const [transactionAction, setTransactionAction] =
    useState<TransactionActionType>("claimPayout");
  const [transactionError, setTransactionError] = useState("");
  const [transactionOpen, setTransactionOpen] = useState(false);
  const [transactionStage, setTransactionStage] =
    useState<TransactionStage>("review");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const summary = details.summary.data;
  const settlementStatus = details.settlementStatus.data;
  const financials = details.financials.data;
  const history = settlementHistoryFromPolicy(summary);
  const status = statusFrom(settlementStatus, summary);
  const policyType = stringField(summary, ["policy_type", "policyType"]);
  const eventLevel = stringField(summary, ["event_level", "eventLevel"]);
  const locationId = stringField(summary, ["location_id", "locationId"]);
  const coverageTitle = policyCoverageTitle(locationId, policyType);
  const coverageStart = stringField(summary, [
    "coverage_start",
    "coverageStart",
    "start_date",
    "startDate",
  ]);
  const coverageEnd = stringField(summary, [
    "coverage_end",
    "coverageEnd",
    "end_date",
    "endDate",
  ]);
  const isClaimable = booleanField(financials, ["is_claimable", "isClaimable"]);
  const canCancel = isConnected && status === "ACTIVE";
  const triggerUnit =
    stringField(summary, ["unit", "weather_unit", "weatherUnit"], "") ||
    (policyType === "TEMPERATURE_INDEX" ? "°C" : "mm");
  const triggerThreshold = valueFrom(summary, [
    "threshold",
    "threshold_scaled",
    "thresholdScaled",
  ]);
  const formattedTriggerThreshold =
    weatherNumber(summary, ["threshold"], ["threshold_scaled", "thresholdScaled"]) ??
    triggerThreshold;
  const premiumPaid = genAmountFromRecord(financials, [
    "premium_paid_wei",
    "premiumPaidWei",
    "premium_wei",
    "premiumWei",
    "premium_paid",
    "premiumPaid",
  ]);
  const coveragePayout = genAmountFromRecord(financials, [
    "coverage_limit_wei",
    "coverageLimitWei",
    "payout_amount_wei",
    "payoutAmountWei",
    "coverage_limit",
    "coverageLimit",
  ]);

  const chartData = history
    .map((record) => ({
      settlementDate: stringField(record, [
        "settlement_date",
        "settlementDate",
        "date",
      ]),
      threshold:
        weatherNumber(record, ["threshold"], ["threshold_scaled", "thresholdScaled"]) ??
        0,
      triggered: booleanField(record, [
        "triggered",
        "is_triggered",
        "isTriggered",
      ]),
      unit: stringField(record, ["unit", "weather_unit", "weatherUnit"], ""),
      weatherValue:
        weatherNumber(
          record,
          ["weather_value", "weatherValue"],
          ["weather_value_scaled", "weatherValueScaled"],
        ) ?? 0,
    }))
    .filter((record) => record.settlementDate !== "--");

  const latestTriggeredRecord = [...history]
    .reverse()
    .find((record) =>
      booleanField(record, ["triggered", "is_triggered", "isTriggered"]),
    );

  const transactionActive =
    transactionOpen &&
    ["accepted", "review", "submitting", "verifying", "wallet"].includes(
      transactionStage,
    );

  async function verifyPolicyUpdate(
    verifier: (policy: Record<string, unknown> | null) => boolean,
  ) {
    clearParametrixPolicyReadCache(policyId);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      if (attempt > 0) {
        await wait(1500);
      }

      const policy = await readPolicy(policyId, {
        cacheTtlMs: 120_000,
        forceFresh: true,
      });

      if (verifier(policy)) {
        return true;
      }
    }

    return false;
  }

  async function refreshPolicy() {
    setIsRefreshing(true);
    clearParametrixPolicyReadCache(policyId);

    try {
      const freshPolicy = await readPolicy(policyId, {
        cacheTtlMs: 120_000,
        forceFresh: true,
      });

      queryClient.setQueryData(parametrixQueryKeys.policy(policyId), freshPolicy);
    } catch {
      await details.refetch();
    } finally {
      setIsRefreshing(false);
    }
  }

  async function runPolicyTransaction(action: "cancelCoverage" | "claimPayout") {
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
      if (action === "claimPayout") {
        await claimPayout.mutateAsync(policyId);
      } else {
        await cancelPolicy.mutateAsync(policyId);
      }

      clearTimeout(walletTimer);
      clearTimeout(submittingTimer);
      setTransactionStage("accepted");
      await wait(350);
      setTransactionStage("verifying");

      const verified = await verifyPolicyUpdate((policy) => {
        if (!policy) {
          return false;
        }

        const nextStatus = statusFrom(policy);

        if (action === "claimPayout") {
          return (
            nextStatus === "PAID" ||
            booleanField(policy, ["is_paid", "isPaid"]) ||
            Boolean(valueFrom(policy, ["paid_at", "paidAt"]))
          );
        }

        return nextStatus === "CANCELLED";
      });

      setTransactionStage(verified ? "completed" : "submitted");
      details.refetch();
    } catch {
      clearTimeout(walletTimer);
      clearTimeout(submittingTimer);
      setTransactionError("The transaction was not completed.");
      setTransactionStage("failed");
    }
  }

  function resetTransaction() {
    claimPayout.reset();
    cancelPolicy.reset();
    setTransactionError("");
    setTransactionOpen(false);
    setTransactionStage("review");
  }

  if (!isConnected) {
    return (
      <EmptyState
        body="Connect the wallet used to buy coverage to review terms, settlement status, and payout details."
        icon={ShieldCheck}
        title="Connect your wallet to view this policy."
      />
    );
  }

  if (details.isLoading) {
    return (
      <SectionCard className="p-6">
        <h2 className="text-xl font-semibold text-text">
          Loading policy details...
        </h2>
        <p className="mt-3 text-sm leading-6 text-muted">
          Loading coverage terms, settlement status, and payout details.
        </p>
      </SectionCard>
    );
  }

  if (details.error) {
    return <ReadErrorCard error={details.error} onRetry={refreshPolicy} />;
  }

  return (
    <>
      <PageHeader
        eyebrow="Policy record"
        subtitle="Review coverage terms, settlement updates, and payout status."
        title={coverageTitle}
      />

      <div className="space-y-6">
        <SectionCard className="p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-cyan" />
              <div>
                <h2 className="text-2xl font-semibold text-text">
                  {coverageTitle}
                </h2>
                <p className="mt-2 text-sm text-muted">
                  Fixed premium coverage with settlement updates during the
                  coverage period.
                </p>
              </div>
            </div>
            {isPolicyStatus(status) ? (
              <PolicyStatusBadge status={status} />
            ) : (
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-muted">
                Status unavailable
              </span>
            )}
          </div>

          <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
            <SummaryTile label="Premium Paid" value={premiumPaid} />
            <SummaryTile label="Coverage Payout" value={coveragePayout} />
            <SummaryTile
              label="Payout Available"
              value={isClaimable ? "Yes" : "No"}
            />
            <SummaryTile
              label="Coverage Start"
              value={formatDate(coverageStart)}
            />
            <SummaryTile label="Coverage End" value={formatDate(coverageEnd)} />
            <SummaryTile
              label="Trigger Threshold"
              value={thresholdDisplay(formattedTriggerThreshold, triggerUnit)}
            />
          </div>

          <ActionBar className="mt-7">
            <div className="text-sm text-muted">
              {isClaimable
                ? "A payout is available for this coverage."
                : "No claimable payout yet."}
            </div>
            <div className="flex flex-wrap gap-3">
            {isClaimable ? (
              <Button
                disabled={transactionActive}
                onClick={() => runPolicyTransaction("claimPayout")}
              >
                {transactionActive && transactionAction === "claimPayout"
                  ? "Claiming payout..."
                  : "Claim Payout"}
              </Button>
            ) : null}
            {canCancel ? (
              <Button
                disabled={transactionActive}
                onClick={() => runPolicyTransaction("cancelCoverage")}
                variant="secondary"
              >
                {transactionActive && transactionAction === "cancelCoverage"
                  ? "Submitting cancellation..."
                  : "Cancel Coverage"}
              </Button>
            ) : null}
            </div>
          </ActionBar>
        </SectionCard>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
        <SectionCard className="p-6">
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-cyan" />
            <h2 className="text-xl font-semibold text-text">Coverage Terms</h2>
          </div>
          <dl className="mt-6">
            <DetailRow label="Covered Location" value={locationLabel(locationId)} />
            <DetailRow
              label="Coverage Type"
              value={`${policyTypeShortLabel(policyType)} Coverage`}
            />
            <DetailRow label="Event Level" value={eventLevelLabel(eventLevel)} />
            <DetailRow
              label="Coverage Duration"
              value={durationLabel(
                stringField(summary, ["duration_days", "durationDays"]),
              )}
            />
            <DetailRow
              label="Coverage Period"
              value={`${formatDate(coverageStart)} to ${formatDate(coverageEnd)}`}
            />
            <DetailRow
              label="Trigger Threshold"
              value={thresholdDisplay(formattedTriggerThreshold, triggerUnit)}
            />
          </dl>
        </SectionCard>

        <SectionCard className="p-6">
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-cyan" />
            <h2 className="text-xl font-semibold text-text">
              Settlement Status
            </h2>
          </div>
          <dl className="mt-6">
            <DetailRow
              label="Days Checked"
              value={stringField(settlementStatus, [
                "covered_days_checked",
                "coveredDaysChecked",
              ])}
            />
            <DetailRow
              label="Last Checked"
              value={displayDate(
                stringField(settlementStatus, [
                  "last_settled_date",
                  "lastSettledDate",
                ]),
              )}
            />
            <DetailRow
              label="Next Check"
              value={displayDate(
                stringField(settlementStatus, [
                  "next_settlement_date",
                  "nextSettlementDate",
                ]),
              )}
            />
            <DetailRow
              label="Payout Available"
              value={isClaimable ? "Yes" : "No"}
            />
          </dl>
        </SectionCard>

        {latestTriggeredRecord ? (
          <SectionCard className="p-6">
            <div className="flex items-center gap-3">
              <Gauge className="h-5 w-5 text-amber" />
              <h2 className="text-xl font-semibold text-text">
                Trigger Details
              </h2>
            </div>
            <dl className="mt-6">
              <DetailRow
                label="Settlement Date"
                value={formatDate(
                  stringField(latestTriggeredRecord, [
                    "settlement_date",
                    "settlementDate",
                    "date",
                  ]),
                )}
              />
              <DetailRow
                label="Weather Value"
                value={weatherDisplay(
                  latestTriggeredRecord,
                  ["weather_value", "weatherValue"],
                  ["weather_value_scaled", "weatherValueScaled"],
                  stringField(latestTriggeredRecord, ["unit"], triggerUnit),
                )}
              />
              <DetailRow
                label="Trigger Threshold"
                value={weatherDisplay(
                  latestTriggeredRecord,
                  ["threshold"],
                  ["threshold_scaled", "thresholdScaled"],
                  stringField(latestTriggeredRecord, ["unit"], triggerUnit),
                )}
              />
            </dl>
          </SectionCard>
        ) : null}
      </div>

      <div className="space-y-6">
        <SectionCard className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-cyan" />
              <div>
                <h2 className="text-xl font-semibold text-text">
                  Settlement History
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Daily weather checks appear here as settlement records.
                </p>
              </div>
            </div>
            <Button
              disabled={isRefreshing}
              onClick={refreshPolicy}
              variant="secondary"
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
          <div className="mt-6">
            {chartData.length > 1 ? (
              <SettlementHistoryChart
                data={chartData}
                policyType={
                  policyType === "TEMPERATURE_INDEX"
                    ? "TEMPERATURE_INDEX"
                    : "RAINFALL_INDEX"
                }
              />
            ) : (
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-muted">
                {status === "CANCELLED"
                  ? "No settlement checks were recorded before this coverage was cancelled."
                  : "No settlement checks yet."}
              </div>
            )}
          </div>

          {history.length > 0 ? (
            <div className="mt-6 space-y-3">
              {history.map((record, index) => {
                const recordUnit = stringField(
                  record,
                  ["unit", "weather_unit", "weatherUnit"],
                  triggerUnit,
                );

                return (
                  <div
                    className="grid gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm md:grid-cols-5"
                    key={`${settlementRecordDate(record) || "record"}-${index}`}
                  >
                    <div>
                      <p className="text-muted">Date</p>
                      <p className="mt-1 font-semibold text-text">
                        {formatDate(settlementRecordDate(record))}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted">Weather Value</p>
                      <p className="mt-1 font-semibold text-text">
                        {weatherDisplay(
                          record,
                          ["weather_value", "weatherValue"],
                          ["weather_value_scaled", "weatherValueScaled"],
                          recordUnit,
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted">Trigger Threshold</p>
                      <p className="mt-1 font-semibold text-text">
                        {weatherDisplay(
                          record,
                          ["threshold"],
                          ["threshold_scaled", "thresholdScaled"],
                          recordUnit,
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted">Result</p>
                      <p className="mt-1 font-semibold text-text">
                        {booleanField(record, [
                          "triggered",
                          "is_triggered",
                          "isTriggered",
                        ])
                          ? "Trigger met"
                          : "Trigger not met"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted">Status After Check</p>
                      <p className="mt-1 font-semibold text-text">
                        {settlementRecordStatus(record, status)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </SectionCard>
      </div>
      </div>
      </div>
      <TransactionStatusModal
        actionType={transactionAction}
        errorMessage={transactionError}
        onClose={resetTransaction}
        open={transactionOpen}
        primaryAction={
          transactionStage === "completed" || transactionStage === "submitted"
            ? {
                href:
                  transactionAction === "cancelCoverage"
                    ? "/dashboard"
                    : `/policy/${policyId}`,
                label:
                  transactionAction === "cancelCoverage"
                    ? "View My Policies"
                    : "View Policy",
              }
            : transactionStage === "failed"
              ? { label: "Try Again", onClick: resetTransaction }
              : undefined
        }
        stage={transactionStage}
      />
    </>
  );
}
