"use client";

import { useRef, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { Activity, Coins, ShieldCheck, Wallet } from "lucide-react";
import { useAccount } from "wagmi";
import { PolicyStatusBadge } from "@/components/policy/PolicyStatusBadge";
import { ReadErrorCard } from "@/components/status/ReadErrorCard";
import {
  TransactionStatusModal,
  type TransactionStage,
} from "@/components/status/TransactionStatusModal";
import { ActionBar } from "@/components/ui/ActionBar";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { MetricCard } from "@/components/ui/MetricCard";
import { SectionCard } from "@/components/ui/SectionCard";
import { parametrixQueryKeys, useMyPolicyIds } from "@/hooks/useParametrixReads";
import { useClaimPayout } from "@/hooks/useParametrixWrites";
import { CONTRACT_READ_METHODS } from "@/lib/constants";
import {
  clearParametrixPolicyReadCache,
  clearParametrixReadCache,
  readPolicy,
} from "@/lib/genlayer/parametrix";
import { PARAMETRIX_CONTRACT_ADDRESS } from "@/lib/genlayer/client";
import {
  durationLabel,
  eventLevelLabel,
  formatDate,
  formatGenFromWei,
  policyCoverageTitle,
  policyTypeLabel,
} from "@/lib/format";
import {
  bigintField,
  booleanField,
  genAmountFromRecord,
  type ParametrixRecord,
  statusFrom,
  stringField,
  valueFrom,
} from "@/lib/parametrixData";
import { settlementHistoryFromPolicy } from "@/lib/settlement";

const DASHBOARD_POLICY_BATCH_SIZE = 12;

type PolicyBundle = {
  id: string;
  policy?: ParametrixRecord | null;
};

function isClaimablePolicy(bundle: PolicyBundle) {
  const status = statusFrom(bundle.policy);
  const paidAt = valueFrom(bundle.policy, ["paid_at", "paidAt"]);
  const readClaimable = booleanField(bundle.policy, [
    "is_claimable",
    "isClaimable",
  ]);

  if (status && ["ACTIVE", "PAID", "EXPIRED", "CANCELLED"].includes(status)) {
    return false;
  }

  return !paidAt && (readClaimable || status === "TRIGGERED");
}

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function PolicyCard({ bundle }: { bundle: PolicyBundle }) {
  const { id, policy } = bundle;
  const status = statusFrom(policy);
  const eventLevel = stringField(policy, ["event_level", "eventLevel"]);
  const policyType = stringField(policy, ["policy_type", "policyType"]);
  const locationId = stringField(policy, ["location_id", "locationId"]);
  const durationDays = stringField(policy, ["duration_days", "durationDays"]);
  const coverageTitle = policyCoverageTitle(locationId, policyType);
  const coverageStart = formatDate(
    stringField(policy, [
      "coverage_start",
      "coverageStart",
      "start_date",
      "startDate",
    ]),
  );
  const coverageEnd = formatDate(
    stringField(policy, [
      "coverage_end",
      "coverageEnd",
      "end_date",
      "endDate",
    ]),
  );
  const lastChecked = formatDate(
    stringField(policy, [
      "last_settled_date",
      "lastSettledDate",
    ]),
  );
  const availablePayout = genAmountFromRecord(policy, [
    "payout_amount_wei",
    "payoutAmountWei",
    "coverage_limit_wei",
    "coverageLimitWei",
    "coverage_limit",
    "coverageLimit",
  ]);

  return (
    <SectionCard className="p-6 transition duration-200 hover:-translate-y-0.5 hover:border-cyan/20">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-text">{coverageTitle}</h3>
          <p className="mt-2 text-sm text-muted">
            {policyTypeLabel(policyType)}
          </p>
        </div>
        {status ? (
          <PolicyStatusBadge status={status} />
        ) : (
          <span className="rounded-md border border-white/10 px-3 py-1 text-xs font-semibold uppercase text-muted">
            Status unavailable
          </span>
        )}
      </div>

      <div className="mt-6 grid gap-4 text-sm md:grid-cols-2 xl:grid-cols-5">
        <div>
          <p className="text-muted">Coverage Period</p>
          <p className="mt-1 font-medium text-text">
            {coverageStart} - {coverageEnd}
          </p>
        </div>
        <div>
          <p className="text-muted">Premium Paid</p>
          <p className="mt-1 font-medium text-text">
            {genAmountFromRecord(policy, [
              "premium_paid_wei",
              "premiumPaidWei",
              "premium_wei",
              "premiumWei",
              "premium_paid",
              "premiumPaid",
            ])}
          </p>
        </div>
        <div>
          <p className="text-muted">Coverage Payout</p>
          <p className="mt-1 font-medium text-text">{availablePayout}</p>
        </div>
        <div>
          <p className="text-muted">Event Level</p>
          <p className="mt-1 font-medium text-text">
            {eventLevelLabel(eventLevel)}
          </p>
        </div>
        <div>
          <p className="text-muted">Last Checked</p>
          <p className="mt-1 font-medium text-text">
            {lastChecked === "--" ? "Not checked yet" : lastChecked}
          </p>
        </div>
      </div>

      <ActionBar className="mt-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Duration
          </p>
          <p className="mt-1 text-sm font-medium text-text">
            {durationLabel(durationDays)}
          </p>
        </div>
        <Button href={`/policy/${id}`} variant="secondary">
          View Policy
        </Button>
      </ActionBar>
    </SectionCard>
  );
}

function ClaimCard({
  bundle,
  disabled,
  onClaim,
}: {
  bundle: PolicyBundle;
  disabled: boolean;
  onClaim: (policyId: string) => void;
}) {
  const { id, policy } = bundle;
  const eventLevel = stringField(policy, ["event_level", "eventLevel"]);
  const policyType = stringField(policy, ["policy_type", "policyType"]);
  const locationId = stringField(policy, ["location_id", "locationId"]);
  const triggeredDate = stringField(policy, [
    "triggered_at",
    "triggeredAt",
    "triggered_date",
    "triggeredDate",
    "last_settled_date",
    "lastSettledDate",
  ]);
  const availablePayout = genAmountFromRecord(policy, [
    "payout_amount_wei",
    "payoutAmountWei",
    "coverage_limit_wei",
    "coverageLimitWei",
    "coverage_limit",
    "coverageLimit",
  ]);

  return (
    <SectionCard className="p-5">
      <div className="grid gap-4 text-sm md:grid-cols-[1.4fr_1fr_1fr_1fr_auto] md:items-center">
        <div>
          <p className="text-muted">Coverage</p>
          <p className="mt-1 font-semibold text-text">
            {policyCoverageTitle(locationId, policyType)}
          </p>
        </div>
        <div>
          <p className="text-muted">Event level</p>
          <p className="mt-1 font-semibold text-text">
            {eventLevelLabel(eventLevel)}
          </p>
        </div>
        <div>
          <p className="text-muted">Coverage Payout</p>
          <p className="mt-1 font-semibold text-text">{availablePayout}</p>
        </div>
        <div>
          <p className="text-muted">Triggered date</p>
          <p className="mt-1 font-semibold text-text">
            {formatDate(triggeredDate)}
          </p>
        </div>
        <Button
          className="justify-center"
          disabled={disabled}
          onClick={() => onClaim(id)}
        >
          {disabled ? "Claiming payout..." : "Claim Payout"}
        </Button>
      </div>
    </SectionCard>
  );
}

export function DashboardContent() {
  const claimsSectionRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(DASHBOARD_POLICY_BATCH_SIZE);
  const [transactionError, setTransactionError] = useState("");
  const [transactionOpen, setTransactionOpen] = useState(false);
  const [transactionPolicyId, setTransactionPolicyId] = useState<string>();
  const [transactionStage, setTransactionStage] =
    useState<TransactionStage>("review");
  const { isConnected } = useAccount();
  const claimPayout = useClaimPayout();
  const policyIds = useMyPolicyIds();
  const ids = policyIds.data ?? [];
  const canReadPolicies = isConnected && Boolean(PARAMETRIX_CONTRACT_ADDRESS);
  const visibleIds = ids
    .slice(Math.max(0, ids.length - visibleCount))
    .reverse();
  const hasMorePolicies = visibleCount < ids.length;

  const policyQueries = useQueries({
    queries: visibleIds.map((policyId) => ({
      enabled: canReadPolicies,
      queryFn: () => readPolicy(policyId, { cacheTtlMs: 120_000 }),
      queryKey: parametrixQueryKeys.policy(policyId),
      refetchOnReconnect: false,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      retry: 0,
      staleTime: 120_000,
    })),
  });

  if (!isConnected) {
    return (
      <EmptyState
        actionHref="/buy"
        actionLabel="Review Coverage Options"
        body="Connect your wallet to view coverage periods, settlement status, and eligible payouts."
        icon={Wallet}
        title="Connect your wallet to view your policies."
      />
    );
  }

  const policyBundles: PolicyBundle[] = visibleIds.map((id, index) => ({
    id,
    policy: policyQueries[index]?.data,
  }));

  const activeCount = policyBundles.filter(
    (bundle) => statusFrom(bundle.policy) === "ACTIVE",
  ).length;
  const claimableWei = policyBundles.reduce((total, bundle) => {
    if (!isClaimablePolicy(bundle)) {
      return total;
    }

    return (
      total +
      (bigintField(bundle.policy, [
        "payout_amount_wei",
        "payoutAmountWei",
        "payout_amount",
        "payoutAmount",
        "coverage_limit_wei",
        "coverageLimitWei",
        "coverage_limit",
        "coverageLimit",
      ]) ?? BigInt(0))
    );
  }, BigInt(0));
  const historyCount = policyBundles.reduce(
    (total, bundle) => total + settlementHistoryFromPolicy(bundle.policy).length,
    0,
  );
  const claimablePolicies = policyBundles.filter((bundle) => {
    return isClaimablePolicy(bundle);
  });
  const anyLoading =
    policyIds.isLoading ||
    policyQueries.some((query) => query.isLoading);
  const hasClaimablePayout = claimableWei > BigInt(0);
  const readError =
    policyIds.error ??
    policyQueries.find((query) => query.error)?.error;

  const transactionActive =
    transactionOpen &&
    ["accepted", "review", "submitting", "verifying", "wallet"].includes(
      transactionStage,
    );

  async function verifyClaim(policyId: string) {
    clearParametrixPolicyReadCache(policyId);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      if (attempt > 0) {
        await wait(1500);
      }

      const policy = await readPolicy(policyId, {
        cacheTtlMs: 120_000,
        forceFresh: true,
      });
      const status = statusFrom(policy);
      const paidAt = valueFrom(policy, ["paid_at", "paidAt"]);
      const isPaid = booleanField(policy, ["is_paid", "isPaid"]);

      if (status === "PAID" || Boolean(paidAt) || isPaid) {
        return true;
      }
    }

    return false;
  }

  async function handleClaimPayout(policyId: string) {
    if (transactionActive) {
      return;
    }

    setTransactionPolicyId(policyId);
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
      await claimPayout.mutateAsync(policyId);
      clearTimeout(walletTimer);
      clearTimeout(submittingTimer);
      setTransactionStage("accepted");
      await wait(350);
      setTransactionStage("verifying");

      const verified = await verifyClaim(policyId);
      setTransactionStage(verified ? "completed" : "submitted");
      policyQueries.forEach((query) => query.refetch());
      policyIds.refetch();
    } catch {
      clearTimeout(walletTimer);
      clearTimeout(submittingTimer);
      setTransactionError("The transaction was not completed.");
      setTransactionStage("failed");
    }
  }

  function resetTransaction() {
    claimPayout.reset();
    setTransactionError("");
    setTransactionOpen(false);
    setTransactionPolicyId(undefined);
    setTransactionStage("review");
  }

  function refreshDashboardReads() {
    clearParametrixReadCache(CONTRACT_READ_METHODS.GET_MY_POLICIES);
    visibleIds.forEach((policyId) => {
      clearParametrixPolicyReadCache(policyId);
    });
    policyIds.refetch();
    policyQueries.forEach((query) => query.refetch());
  }

  function handleMetricClaimClick() {
    if (!hasClaimablePayout) {
      return;
    }

    if (claimablePolicies.length === 1) {
      handleClaimPayout(claimablePolicies[0].id);
      return;
    }

    claimsSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    claimsSectionRef.current?.focus({ preventScroll: true });
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Wallet}
          meta="Total policies"
          label="Total Policies"
          value={policyIds.isLoading ? "Loading..." : String(ids.length)}
        />
        <MetricCard
          icon={ShieldCheck}
          meta="Currently active"
          label="Active Policies"
          value={anyLoading ? "Loading..." : String(activeCount)}
        />
        <MetricCard
          action={
            <div>
              <Button
                className="w-full justify-center"
                disabled={
                  anyLoading || !hasClaimablePayout || transactionActive
                }
                onClick={handleMetricClaimClick}
              >
                {transactionActive ? "Claiming payout..." : "Claim Payout"}
              </Button>
              {!hasClaimablePayout && !anyLoading ? (
                <p className="mt-2 text-xs text-muted">
                  No claimable payout yet
                </p>
              ) : null}
            </div>
          }
          icon={Coins}
          meta="Unpaid payouts"
          label="Available Claims"
          value={anyLoading ? "Loading..." : formatGenFromWei(claimableWei)}
        />
        <MetricCard
          icon={Activity}
          meta="Daily checks recorded"
          label="Settlement Records"
          value={anyLoading ? "Loading..." : String(historyCount)}
        />
      </div>

      {readError ? (
        <ReadErrorCard
          error={readError}
          onRetry={refreshDashboardReads}
        />
      ) : null}

      {!policyIds.isLoading && ids.length === 0 ? (
        <EmptyState
          actionHref="/buy"
          actionLabel="Buy Coverage"
          body="Buy rainfall or temperature coverage to begin."
          title="No policies found"
        />
      ) : (
        <div className="space-y-5">
          {claimablePolicies.length > 0 ? (
            <div
              className="space-y-3 scroll-mt-24"
              ref={claimsSectionRef}
              tabIndex={-1}
            >
              <h2 className="text-xl font-semibold text-text">
                Available Claims
              </h2>
              {claimablePolicies.map((bundle) => (
                <ClaimCard
                  bundle={bundle}
                  disabled={transactionActive}
                  key={`claim-${bundle.id}`}
                  onClaim={handleClaimPayout}
                />
              ))}
            </div>
          ) : null}
          {policyBundles.length > 0 ? (
            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-text">Policies</h2>
              {policyBundles.map((bundle) => (
                <PolicyCard bundle={bundle} key={bundle.id} />
              ))}
              {hasMorePolicies ? (
                <Button
                  className="justify-center"
                  onClick={() =>
                    setVisibleCount((current) =>
                      Math.min(current + DASHBOARD_POLICY_BATCH_SIZE, ids.length),
                    )
                  }
                  variant="secondary"
                >
                  Load More
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      )}
      <TransactionStatusModal
        actionType="claimPayout"
        errorMessage={transactionError}
        onClose={resetTransaction}
        open={transactionOpen}
        primaryAction={
          transactionStage === "completed" || transactionStage === "submitted"
            ? {
                href: transactionPolicyId
                  ? `/policy/${transactionPolicyId}`
                  : "/dashboard",
                label: transactionPolicyId ? "View Policy" : "View My Policies",
              }
            : transactionStage === "failed"
              ? { label: "Try Again", onClick: resetTransaction }
              : undefined
        }
        stage={transactionStage}
      />
    </div>
  );
}
