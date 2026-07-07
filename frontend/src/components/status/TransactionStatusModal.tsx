"use client";

import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

export type TransactionActionType =
  | "addPoolFunds"
  | "buyCoverage"
  | "cancelCoverage"
  | "claimPayout"
  | "settlePolicyDay"
  | "withdrawPoolFunds";

export type TransactionStage =
  | "accepted"
  | "completed"
  | "failed"
  | "review"
  | "submitted"
  | "submitting"
  | "verifying"
  | "wallet";

type TransactionStatusAction = {
  href?: string;
  label: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost";
};

type TransactionStatusModalProps = {
  actionType: TransactionActionType;
  details?: Array<{ label: string; value: ReactNode }>;
  errorMessage?: string;
  onClose?: () => void;
  open: boolean;
  primaryAction?: TransactionStatusAction;
  secondaryAction?: TransactionStatusAction;
  stage: TransactionStage;
};

const stageCopy: Record<TransactionStage, { body: string; title: string }> = {
  accepted: {
    body: "Parametrix is checking the latest status.",
    title: "Transaction accepted",
  },
  completed: {
    body: "The update is confirmed.",
    title: "Completed",
  },
  failed: {
    body: "The transaction was not completed.",
    title: "Transaction failed",
  },
  review: {
    body: "Review the action before confirming.",
    title: "Review transaction",
  },
  submitted: {
    body: "The transaction was accepted and may take a moment to appear.",
    title: "Transaction submitted",
  },
  submitting: {
    body: "Sending the transaction.",
    title: "Submitting",
  },
  verifying: {
    body: "Checking the updated policy state.",
    title: "Verifying update",
  },
  wallet: {
    body: "Confirm the transaction in your wallet.",
    title: "Confirm in wallet",
  },
};

const completedCopy: Record<TransactionActionType, { body: string; title: string }> =
  {
    addPoolFunds: {
      body: "The pool balance has been updated.",
      title: "Pool updated",
    },
    buyCoverage: {
      body: "Your coverage is active.",
      title: "Coverage active",
    },
    cancelCoverage: {
      body: "Your coverage has been cancelled.",
      title: "Coverage cancelled",
    },
    claimPayout: {
      body: "The payout has been paid.",
      title: "Payout paid",
    },
    settlePolicyDay: {
      body: "The settlement update has been recorded.",
      title: "Settlement updated",
    },
    withdrawPoolFunds: {
      body: "The pool balance has been updated.",
      title: "Pool updated",
    },
  };

const buyCoverageStageCopy: Partial<
  Record<TransactionStage, { body: string; title: string }>
> = {
  accepted: {
    body: "Parametrix is preparing your new coverage.",
    title: "Creating policy",
  },
  failed: {
    body: "Purchase failed. Your policy was not created. Please try again.",
    title: "Purchase failed",
  },
  submitted: {
    body: "Your transaction was accepted and the policy is still being verified.",
    title: "Creating policy",
  },
  submitting: {
    body: "Submitting your coverage purchase.",
    title: "Creating policy",
  },
  verifying: {
    body: "Checking that your new policy is active.",
    title: "Verifying policy",
  },
};

const activeStages: TransactionStage[] = [
  "accepted",
  "review",
  "submitting",
  "verifying",
  "wallet",
];

function StatusIcon({ stage }: { stage: TransactionStage }) {
  if (stage === "completed") {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-cyan/30 bg-cyan/10 text-cyan">
        <CheckCircle2 className="h-6 w-6" />
      </div>
    );
  }

  if (stage === "failed") {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-coral/30 bg-coral/10 text-coral">
        <AlertTriangle className="h-6 w-6" />
      </div>
    );
  }

  return (
    <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-cyan/30 bg-cyan/10 text-cyan">
      <span className="absolute inset-0 animate-ping rounded-full bg-cyan/10" />
      <Loader2 className="relative h-6 w-6 animate-spin" />
    </div>
  );
}

function ModalAction({ action }: { action: TransactionStatusAction }) {
  return (
    <Button
      className="justify-center"
      href={action.href}
      onClick={action.onClick}
      variant={action.variant ?? "primary"}
    >
      {action.label}
    </Button>
  );
}

export function TransactionStatusModal({
  actionType,
  details,
  errorMessage,
  onClose,
  open,
  primaryAction,
  secondaryAction,
  stage,
}: TransactionStatusModalProps) {
  if (!open) {
    return null;
  }

  const actionStageCopy =
    actionType === "buyCoverage" ? buyCoverageStageCopy[stage] : undefined;
  const copy =
    stage === "completed"
      ? completedCopy[actionType]
      : actionStageCopy ?? stageCopy[stage];
  const canClose = !activeStages.includes(stage);

  return (
    <div
      aria-labelledby="transaction-status-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
    >
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0B171B]/95 p-6 text-text shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
        <div className="flex items-start justify-between gap-4">
          <StatusIcon stage={stage} />
          {canClose && onClose ? (
            <button
              aria-label="Close transaction status"
              className="rounded-lg border border-white/10 bg-white/[0.03] p-2 text-muted transition hover:border-cyan/30 hover:bg-white/[0.06] hover:text-text"
              onClick={onClose}
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <div className="mt-5">
          <h2
            className="text-2xl font-semibold tracking-tight"
            id="transaction-status-title"
          >
            {copy.title}
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">{copy.body}</p>
          {errorMessage ? (
            <p className="mt-3 rounded-lg border border-coral/25 bg-coral/10 p-3 text-sm leading-6 text-coral">
              {errorMessage}
            </p>
          ) : null}
          {details && details.length > 0 ? (
            <dl className="mt-4 grid gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm">
              {details.map((item) => (
                <div
                  className="flex justify-between gap-4"
                  key={`${item.label}-${String(item.value)}`}
                >
                  <dt className="text-muted">{item.label}</dt>
                  <dd className="text-right font-semibold text-text">
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>

        {primaryAction || secondaryAction || stage === "failed" ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {primaryAction ? <ModalAction action={primaryAction} /> : null}
            {secondaryAction ? <ModalAction action={secondaryAction} /> : null}
            {stage === "failed" && onClose ? (
              <Button onClick={onClose} variant="secondary">
                Close
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
