"use client";

import { AlertTriangle, CheckCircle2, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

export type TransactionProgressStatus =
  | "idle"
  | "preparing"
  | "wallet"
  | "pending"
  | "verifying"
  | "success"
  | "submitted"
  | "error";

export type TransactionProgressStep = {
  label: string;
  state: "active" | "completed" | "waiting";
};

type TransactionProgressAction = {
  href?: string;
  label: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost";
};

type TransactionProgressModalProps = {
  description: string;
  errorMessage?: string;
  onClose?: () => void;
  open: boolean;
  primaryAction?: TransactionProgressAction;
  secondaryAction?: TransactionProgressAction;
  status: TransactionProgressStatus;
  steps?: TransactionProgressStep[];
  title: string;
};

const activeStatuses: TransactionProgressStatus[] = [
  "preparing",
  "wallet",
  "pending",
  "verifying",
];

function StatusIcon({ status }: { status: TransactionProgressStatus }) {
  if (status === "success") {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-cyan/30 bg-cyan/10 text-cyan">
        <CheckCircle2 className="h-6 w-6" />
      </div>
    );
  }

  if (status === "submitted") {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-cyan/30 bg-cyan/10 text-cyan">
        <CheckCircle2 className="h-6 w-6" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-coral/30 bg-coral/10 text-coral">
        <AlertTriangle className="h-6 w-6" />
      </div>
    );
  }

  return (
    <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-cyan/30 bg-cyan/10 text-cyan">
      <span className="absolute inset-0 rounded-full bg-cyan/10 animate-ping" />
      <Loader2 className="relative h-6 w-6 animate-spin" />
    </div>
  );
}

function StepIcon({ state }: { state: TransactionProgressStep["state"] }) {
  if (state === "completed") {
    return (
      <span className="flex h-6 w-6 items-center justify-center rounded-full border border-cyan/30 bg-cyan/10 text-cyan">
        <CheckCircle2 className="h-3.5 w-3.5" />
      </span>
    );
  }

  if (state === "active") {
    return (
      <span className="flex h-6 w-6 items-center justify-center rounded-full border border-cyan/35 bg-cyan/10 text-cyan">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      </span>
    );
  }

  return (
    <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]">
      <span className="h-1.5 w-1.5 rounded-full bg-muted/60" />
    </span>
  );
}

function ModalAction({ action }: { action: TransactionProgressAction }) {
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

export function TransactionProgressModal({
  description,
  errorMessage,
  onClose,
  open,
  primaryAction,
  secondaryAction,
  status,
  steps = [],
  title,
}: TransactionProgressModalProps) {
  if (!open) {
    return null;
  }

  const canClose = !activeStatuses.includes(status);

  return (
    <div
      aria-labelledby="transaction-progress-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
    >
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0B171B]/95 p-6 text-text shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
        <div className="flex items-start justify-between gap-4">
          <StatusIcon status={status} />
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
            id="transaction-progress-title"
          >
            {title}
          </h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-300">
            {description}
          </p>
          {errorMessage ? (
            <p className="mt-3 rounded-lg border border-coral/25 bg-coral/10 p-3 text-sm leading-6 text-coral">
              {errorMessage}
            </p>
          ) : null}
        </div>

        {steps.length > 0 ? (
          <div className="mt-6 rounded-lg border border-white/10 bg-black/20 p-4">
            <div className="space-y-3">
              {steps.map((step) => (
                <div
                  className="flex items-center gap-3 text-sm"
                  key={step.label}
                >
                  <StepIcon state={step.state} />
                  <span
                    className={
                      step.state === "waiting"
                        ? "text-muted"
                        : "font-medium text-text"
                    }
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {primaryAction || secondaryAction ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {primaryAction ? <ModalAction action={primaryAction} /> : null}
            {secondaryAction ? <ModalAction action={secondaryAction} /> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
