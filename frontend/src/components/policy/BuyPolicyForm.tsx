"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, ClipboardCheck, DatabaseZap, Gauge, MapPin } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import type { Address } from "viem";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/Button";
import { DataRow } from "@/components/ui/DataRow";
import { SectionCard } from "@/components/ui/SectionCard";
import { DurationSelector } from "@/components/policy/DurationSelector";
import { EventLevelCard } from "@/components/policy/EventLevelCard";
import { PolicyFinancialPreview } from "@/components/policy/PolicyFinancialPreview";
import { PolicyTypeCard } from "@/components/policy/PolicyTypeCard";
import {
  TransactionStatusModal,
  type TransactionStage,
} from "@/components/status/TransactionStatusModal";
import { parametrixQueryKeys } from "@/hooks/useParametrixReads";
import { usePurchasePolicy } from "@/hooks/useParametrixWrites";
import { auditPurchaseSelection } from "@/lib/audit/purchaseAudit";
import {
  PREMIUM_AND_COVERAGE,
  EVENT_LEVELS,
  POLICY_TYPES,
  SUPPORTED_LOCATIONS,
  THRESHOLD_REGISTRY_URL,
} from "@/lib/constants";
import { buyPageContent } from "@/lib/content";
import { readMyPolicies, readPolicy } from "@/lib/genlayer/parametrix";
import {
  fetchThresholdRegistry,
  validateFrontendSelectionAgainstRegistry,
} from "@/lib/registry";
import {
  PolicyFormValues,
  policyFormSchema,
} from "@/lib/validation/policyFormSchema";

function getPurchaseErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return "Purchase failed. Your policy was not created. Please try again.";
  }

  const message = error.message.toLowerCase();

  if (message.includes("rejected") || message.includes("denied")) {
    return "Wallet confirmation was rejected.";
  }

  if (message.includes("insufficient")) {
    return "Insufficient GEN balance for the selected premium and network fees.";
  }

  if (message.includes("capacity") || message.includes("pool")) {
    return "Available pool capacity may be insufficient for this coverage payout.";
  }

  if (message.includes("registry") || message.includes("threshold")) {
    return "The selected coverage terms are not available right now.";
  }

  return "Purchase failed. Your policy was not created. Please try again.";
}

function getPolicyIdFromPurchaseResult(result: unknown) {
  const extractFromRecord = (value: unknown): string | undefined => {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return undefined;
    }

    const record = value as Record<string, unknown>;
    const candidate =
      record.policy_id ?? record.policyId ?? record.id ?? record.returnValue;

    if (
      typeof candidate === "string" ||
      typeof candidate === "number" ||
      typeof candidate === "bigint"
    ) {
      return String(candidate);
    }

    return extractFromRecord(candidate ?? record.policy);
  };

  if (typeof result === "string") {
    const trimmed = result.trim();

    if (/^\d+$/.test(trimmed)) {
      return trimmed;
    }

    if (trimmed.startsWith("{")) {
      try {
        return extractFromRecord(JSON.parse(trimmed));
      } catch {
        return undefined;
      }
    }

    return undefined;
  }

  return extractFromRecord(result);
}

function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

type CheckoutStep = "configure" | "review";

function formatThresholdPreview(
  thresholdPreview?: { threshold: number; unit: string },
) {
  if (!thresholdPreview) {
    return "Checking";
  }

  return `${thresholdPreview.threshold}${
    thresholdPreview.unit === "°C" ? "" : " "
  }${thresholdPreview.unit}`;
}

export function BuyPolicyForm() {
  const { address, isConnected } = useAccount();
  const queryClient = useQueryClient();
  const purchasePolicy = usePurchasePolicy();
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>("configure");
  const [transactionError, setTransactionError] = useState("");
  const [transactionOpen, setTransactionOpen] = useState(false);
  const [transactionStage, setTransactionStage] =
    useState<TransactionStage>("review");
  const [createdPolicyId, setCreatedPolicyId] = useState<string>();
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    control,
    setValue,
  } = useForm<PolicyFormValues>({
    defaultValues: {
      durationDays: 14,
      eventLevel: "EXTREME_EVENT",
      locationId: "lagos_ng",
      policyType: "RAINFALL_INDEX",
    },
    resolver: zodResolver(policyFormSchema),
  });

  const policyType = useWatch({ control, name: "policyType" });
  const eventLevel = useWatch({ control, name: "eventLevel" });
  const durationDays = useWatch({ control, name: "durationDays" });
  const locationId = useWatch({ control, name: "locationId" });

  const registryQuery = useQuery({
    queryFn: fetchThresholdRegistry,
    queryKey: ["threshold-registry", THRESHOLD_REGISTRY_URL],
    retry: 1,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    staleTime: 10 * 60_000,
  });

  const registryValidation = registryQuery.data
    ? validateFrontendSelectionAgainstRegistry(
        {
          eventLevel,
          locationId,
          policyType,
        },
        registryQuery.data,
      )
    : null;
  const registryMismatch =
    registryValidation !== null && registryValidation.ok === false;
  const thresholdPreview =
    registryValidation?.ok &&
    registryValidation.terms?.threshold !== undefined &&
    registryValidation.terms.unit
      ? {
          threshold: registryValidation.terms.threshold,
          unit: registryValidation.terms.unit,
        }
      : undefined;
  const selectedLocation =
    SUPPORTED_LOCATIONS.find((location) => location.id === locationId) ??
    SUPPORTED_LOCATIONS[0];
  const selectedPolicyType =
    POLICY_TYPES.find((type) => type.id === policyType) ?? POLICY_TYPES[0];
  const selectedEventLevel =
    EVENT_LEVELS.find((level) => level.id === eventLevel) ?? EVENT_LEVELS[0];
  const thresholdLabel = formatThresholdPreview(thresholdPreview);
  const selectionValidation = policyFormSchema.safeParse({
    durationDays,
    eventLevel,
    locationId,
    policyType,
  });
  const isSelectionValid = selectionValidation.success;

  const getCurrentPolicyIds = async () => {
    if (!address) {
      return [];
    }

    return readMyPolicies({
      account: address as Address,
      cacheTtlMs: 120_000,
    });
  };

  const confirmCreatedPolicy = async ({
    beforePolicyIds,
    returnedPolicyId,
  }: {
    beforePolicyIds: string[];
    returnedPolicyId?: string;
  }) => {
    if (!address) {
      return returnedPolicyId;
    }

    const policyIdsKey = parametrixQueryKeys.myPolicyIds(address);
    const previousPolicyIds = new Set(beforePolicyIds);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      if (attempt > 0) {
        await wait(1500);
      }

      try {
        const nextPolicyIds = await readMyPolicies({
          account: address as Address,
          cacheTtlMs: 120_000,
          forceFresh: true,
        });
        queryClient.setQueryData(policyIdsKey, nextPolicyIds);

        const newPolicyId =
          returnedPolicyId && nextPolicyIds.includes(returnedPolicyId)
            ? returnedPolicyId
            : nextPolicyIds.find((policyId) => !previousPolicyIds.has(policyId));

        if (newPolicyId) {
          await queryClient.invalidateQueries({
            queryKey: parametrixQueryKeys.myPolicyIds(address),
          });
          await queryClient.invalidateQueries({
            queryKey: parametrixQueryKeys.dashboardPolicies(address),
          });
          await queryClient.invalidateQueries({
            queryKey: parametrixQueryKeys.policy(newPolicyId),
          });
          return newPolicyId;
        }
      } catch {
        // Continue to detail confirmation below when a policy ID is available.
      }

      if (returnedPolicyId) {
        try {
          const policy = await readPolicy(returnedPolicyId, {
            cacheTtlMs: 120_000,
            forceFresh: true,
          });

          if (policy) {
            await queryClient.invalidateQueries({
              queryKey: parametrixQueryKeys.policy(returnedPolicyId),
            });
            return returnedPolicyId;
          }
        } catch {
          // Retry briefly; read availability can lag immediately after submission.
        }
      }
    }

    await queryClient.invalidateQueries({
      queryKey: parametrixQueryKeys.myPolicyIds(address),
    });
    return undefined;
  };

  const moveToReview = (values: PolicyFormValues) => {
    const purchaseAudit = auditPurchaseSelection(values);

    if (!purchaseAudit.ok) {
      toast.error("Complete your coverage selections to continue.");
      return;
    }

    if (registryMismatch) {
      toast.error("Selected coverage terms are not available right now.");
      return;
    }

    setTransactionError("");
    setCheckoutStep("review");
  };

  const onSubmit = async (values: PolicyFormValues) => {
    if (!isConnected) {
      toast.error("Connect your wallet to confirm and pay.");
      return;
    }

    if (
      purchasePolicy.isPending ||
      isSubmitting ||
      (transactionOpen &&
        ["accepted", "review", "submitting", "verifying", "wallet"].includes(
          transactionStage,
        ))
    ) {
      return;
    }

    setCreatedPolicyId(undefined);
    setTransactionError("");
    setTransactionOpen(true);
    setTransactionStage("review");

    const purchaseAudit = auditPurchaseSelection(values);

    if (!purchaseAudit.ok) {
      const message = purchaseAudit.errors[0] ?? "Invalid policy terms.";
      setTransactionError(message);
      setTransactionStage("failed");
      toast.error(message);
      return;
    }

    if (registryQuery.data) {
      const nextRegistryValidation = validateFrontendSelectionAgainstRegistry(
        values,
        registryQuery.data,
      );

      if (!nextRegistryValidation.ok) {
        const message =
          "Selected coverage terms are not available right now.";
        setTransactionError(message);
        setTransactionStage("failed");
        toast.error(message);
        return;
      }
    }

    let beforePolicyIds: string[] = [];

    try {
      beforePolicyIds = await getCurrentPolicyIds();

      if (address) {
        queryClient.setQueryData(
          parametrixQueryKeys.myPolicyIds(address),
          beforePolicyIds,
        );
      }
    } catch {
      beforePolicyIds =
        (address
          ? queryClient.getQueryData<string[]>(
              parametrixQueryKeys.myPolicyIds(address),
            )
          : undefined) ?? [];
    }

    setTransactionStage("wallet");

    const pendingTimer = window.setTimeout(() => {
      setTransactionStage("submitting");
    }, 900);

    try {
      const result = await purchasePolicy.mutateAsync(values);
      const returnedPolicyId = getPolicyIdFromPurchaseResult(result);

      window.clearTimeout(pendingTimer);
      setTransactionStage("accepted");
      await wait(350);
      setTransactionStage("verifying");

      const confirmedPolicyId = await confirmCreatedPolicy({
        beforePolicyIds,
        returnedPolicyId,
      });

      setCreatedPolicyId(confirmedPolicyId ?? returnedPolicyId);
      setTransactionStage(confirmedPolicyId ? "completed" : "submitted");
    } catch (error) {
      window.clearTimeout(pendingTimer);
      setTransactionError(getPurchaseErrorMessage(error));
      setTransactionStage("failed");
    }
  };

  const resetTransaction = () => {
    purchasePolicy.reset();
    setCreatedPolicyId(undefined);
    setTransactionError("");
    setTransactionOpen(false);
    setTransactionStage("review");
  };

  const isTransactionActive =
    isSubmitting ||
    purchasePolicy.isPending ||
    (transactionOpen &&
      ["accepted", "review", "submitting", "verifying", "wallet"].includes(
        transactionStage,
      ));
  const canReviewCoverage =
    isSelectionValid && !registryMismatch && !isTransactionActive;
  const reviewButtonLabel = isSelectionValid
    ? "Review Coverage"
    : "Complete selections to continue";
  const confirmButtonLabel =
    transactionOpen && transactionStage === "review"
      ? "Preparing transaction…"
      : transactionOpen && transactionStage === "wallet"
        ? "Confirm in wallet"
        : transactionStage === "submitting" ||
          transactionStage === "accepted" ||
          transactionStage === "verifying" ||
          transactionStage === "submitted" ||
          purchasePolicy.isPending
          ? "Creating policy…"
          : "Confirm & Pay";
  const handleMoveToReview = handleSubmit(moveToReview);
  const handleCheckoutSubmit = handleSubmit((values) => {
    if (checkoutStep === "configure") {
      moveToReview(values);
      return;
    }

    return onSubmit(values);
  });
  const handleEditCoverage = () => {
    if (!isTransactionActive) {
      setCheckoutStep("configure");
    }
  };
  const modalPrimaryAction =
    transactionStage === "completed" || transactionStage === "submitted"
      ? {
          href: "/dashboard",
          label: "View My Policies",
        }
      : transactionStage === "failed"
        ? {
            label: "Try Again",
            onClick: resetTransaction,
          }
        : undefined;
  const modalSecondaryAction =
    transactionStage === "completed" && createdPolicyId
      ? {
          href: `/policy/${createdPolicyId}`,
          label: "View Policy",
          variant: "secondary" as const,
        }
      : undefined;

  return (
    <>
      <form onSubmit={handleCheckoutSubmit}>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.28 }}
          >
            <div className="mb-4 flex flex-wrap gap-2">
              <span
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                  checkoutStep === "configure"
                    ? "border-cyan/40 bg-cyan/10 text-cyan"
                    : "border-white/10 bg-white/[0.03] text-slate-300"
                }`}
              >
                1. Configure Coverage
              </span>
              <span
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                  checkoutStep === "review"
                    ? "border-cyan/40 bg-cyan/10 text-cyan"
                    : "border-white/10 bg-white/[0.03] text-slate-300"
                }`}
              >
                2. Review Coverage
              </span>
            </div>

            {checkoutStep === "configure" ? (
              <SectionCard className="p-7">
                <div className="flex items-center gap-3">
                  <Activity className="h-5 w-5 text-cyan" />
                  <h2 className="text-xl font-semibold text-text">
                    Configure Coverage
                  </h2>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted">
                  {buyPageContent.description}
                </p>

                <label className="mt-6 block text-sm font-semibold text-text">
                  <span className="flex items-center gap-2">
                    <span className="text-cyan">1.</span>
                    <MapPin className="h-4 w-4 text-cyan" />
                    Location
                  </span>
                  <select
                    className="mt-3 w-full rounded-lg border border-white/10 bg-base px-4 py-3 text-sm text-text outline-none transition focus:border-cyan/60"
                    {...register("locationId")}
                  >
                    {SUPPORTED_LOCATIONS.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.label}
                      </option>
                    ))}
                  </select>
                </label>
                {errors.locationId ? (
                  <p className="mt-2 text-sm text-coral">
                    {errors.locationId.message}
                  </p>
                ) : null}

                <div className="mt-7">
                  <p className="flex items-center gap-2 text-sm font-semibold text-text">
                    <span className="text-cyan">2.</span>
                    <DatabaseZap className="h-4 w-4 text-cyan" />
                    Coverage Type
                  </p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {POLICY_TYPES.map((policyTypeOption) => (
                      <PolicyTypeCard
                        key={policyTypeOption.id}
                        onSelect={(nextType) =>
                          setValue("policyType", nextType, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                        selected={policyType === policyTypeOption.id}
                        type={policyTypeOption.id}
                      />
                    ))}
                  </div>
                </div>

                <div className="mt-7">
                  <p className="flex items-center gap-2 text-sm font-semibold text-text">
                    <span className="text-cyan">3.</span>
                    <Gauge className="h-4 w-4 text-cyan" />
                    Event Level
                  </p>
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    {PREMIUM_AND_COVERAGE.map((option) => (
                      <EventLevelCard
                        key={option.level}
                        coverageDisplay={option.coverageDisplay}
                        label={option.shortLabel}
                        level={option.level}
                        onSelect={(nextLevel) =>
                          setValue("eventLevel", nextLevel, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                        premiumDisplay={option.premiumDisplay}
                        selected={eventLevel === option.level}
                      />
                    ))}
                  </div>
                </div>

                <div className="mt-7">
                  <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-text">
                    <span className="text-cyan">4.</span>
                    Duration
                  </p>
                  <DurationSelector
                    onChange={(nextDuration) =>
                      setValue("durationDays", nextDuration, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                    value={durationDays}
                  />
                </div>

                <div className="mt-8 flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <p className="max-w-md text-sm leading-6 text-muted">
                    Review your coverage terms before opening your wallet.
                  </p>
                  <Button
                    className="justify-center"
                    disabled={!canReviewCoverage}
                    onClick={handleMoveToReview}
                  >
                    {reviewButtonLabel}
                  </Button>
                </div>
              </SectionCard>
            ) : (
              <SectionCard className="p-7">
                <div className="flex items-start gap-3">
                  <span className="rounded-lg border border-cyan/25 bg-cyan/10 p-2 text-cyan">
                    <ClipboardCheck className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-xl font-semibold text-text">
                      Review Coverage
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      Confirm your selected coverage before continuing.
                    </p>
                  </div>
                </div>

                <div className="mt-7 rounded-xl border border-white/10 bg-white/[0.03] p-5">
                  <h3 className="text-sm font-semibold text-text">
                    Coverage Details
                  </h3>
                  <dl className="mt-4">
                    <DataRow label="Location" value={selectedLocation.label} />
                    <DataRow
                      label="Coverage Type"
                      value={selectedPolicyType.label}
                    />
                    <DataRow
                      label="Event Level"
                      value={selectedEventLevel.label}
                    />
                    <DataRow
                      label="Coverage Period"
                      value={`${durationDays} days`}
                    />
                    <DataRow label="Trigger Threshold" value={thresholdLabel} />
                  </dl>
                </div>

                <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-5">
                  <h3 className="text-sm font-semibold text-text">
                    What happens next
                  </h3>
                  <ol className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
                    {[
                      "Confirm the transaction in your wallet",
                      "Parametrix creates your policy",
                      "Weather data is checked during the coverage period",
                      "Eligible payouts become claimable if the trigger is met",
                    ].map((item, index) => (
                      <li className="flex gap-3" key={item}>
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-cyan/25 bg-cyan/10 text-xs font-semibold text-cyan">
                          {index + 1}
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="mt-8 border-t border-white/10 pt-6">
                  <Button
                    disabled={isTransactionActive}
                    onClick={handleEditCoverage}
                    variant="secondary"
                  >
                    Edit Coverage
                  </Button>
                </div>
              </SectionCard>
            )}
          </motion.div>

          <div className="space-y-5 xl:sticky xl:top-24 xl:self-start">
            <PolicyFinancialPreview
              action={
                checkoutStep === "review" ? (
                  <Button
                    className="w-full justify-center"
                    disabled={
                      !isConnected || isTransactionActive || registryMismatch
                    }
                    type="submit"
                  >
                    {confirmButtonLabel}
                  </Button>
                ) : undefined
              }
              durationDays={durationDays}
              eventLevel={eventLevel}
              note={
                checkoutStep === "review" && !isConnected ? (
                  <p className="rounded-lg border border-amber/25 bg-amber/10 p-3 text-sm leading-6 text-amber">
                    Connect your wallet to confirm and pay.
                  </p>
                ) : undefined
              }
              thresholdPreview={thresholdPreview}
              variant={checkoutStep === "review" ? "payment" : "preview"}
            />
            {registryQuery.isError ? (
              <p className="rounded-md border border-amber/25 bg-amber/10 p-3 text-xs leading-5 text-amber">
                Trigger preview unavailable. Coverage terms will still be
                checked during purchase.
              </p>
            ) : null}
            {registryMismatch ? (
              <p className="rounded-md border border-coral/30 bg-coral/10 p-3 text-xs leading-5 text-coral">
                Selected coverage terms are not available right now.
              </p>
            ) : null}
          </div>
        </div>
      </form>

      <TransactionStatusModal
        actionType="buyCoverage"
        errorMessage={transactionError}
        onClose={resetTransaction}
        open={transactionOpen}
        primaryAction={modalPrimaryAction}
        secondaryAction={modalSecondaryAction}
        stage={transactionStage}
      />
    </>
  );
}
