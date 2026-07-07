"use client";

import { useAppKitProvider } from "@reown/appkit/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Address, EIP1193Provider } from "viem";
import { useAccount } from "wagmi";
import { toast } from "sonner";
import type { PolicyFormValues } from "@/lib/validation/policyFormSchema";
import { CONTRACT_READ_METHODS } from "@/lib/constants";
import {
  addPoolFunds,
  cancelPolicy,
  clearParametrixPolicyReadCache,
  claimPayout,
  clearParametrixReadCache,
  purchasePolicy,
  settlePolicyDay,
  withdrawFromPool,
} from "@/lib/genlayer/parametrix";
import { parametrixQueryKeys } from "@/hooks/useParametrixReads";

type ToastId = string | number;

function errorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "The contract call failed.";
}

function useWalletWriteContext() {
  const { address, isConnected } = useAccount();
  const { walletProvider } = useAppKitProvider<EIP1193Provider>("eip155");

  return () => {
    if (!isConnected || !address) {
      throw new Error("Connect your wallet to continue.");
    }

    if (!walletProvider) {
      throw new Error("Wallet provider unavailable. Reconnect your wallet.");
    }

    return {
      account: address as Address,
      provider: walletProvider,
    };
  };
}

function useMutationToasts() {
  return {
    onError: (error: unknown, _variables: unknown, toastId?: ToastId) => {
      toast.error(errorMessage(error), { id: toastId });
    },
    onSuccess: (message: string, toastId?: ToastId) => {
      toast.success(message, { id: toastId });
    },
  };
}

export function usePurchasePolicy() {
  const { address } = useAccount();
  const getWalletContext = useWalletWriteContext();
  const queryClient = useQueryClient();
  const toastHandlers = useMutationToasts();

  return useMutation({
    mutationFn: (values: PolicyFormValues) =>
      purchasePolicy({
        ...values,
        ...getWalletContext(),
      }),
    onError: toastHandlers.onError,
    onMutate: () => toast.loading("Submitting policy purchase..."),
    onSuccess: (_result, _variables, toastId) => {
      toastHandlers.onSuccess("Coverage purchase submitted.", toastId);
      clearParametrixReadCache(CONTRACT_READ_METHODS.GET_MY_POLICIES);
      clearParametrixReadCache(CONTRACT_READ_METHODS.GET_POLICY);
      queryClient.invalidateQueries({
        queryKey: parametrixQueryKeys.myPolicyIds(address),
      });
      queryClient.invalidateQueries({
        queryKey: parametrixQueryKeys.dashboardPolicies(address),
      });
    },
  });
}

export function useClaimPayout() {
  const { address } = useAccount();
  const getWalletContext = useWalletWriteContext();
  const queryClient = useQueryClient();
  const toastHandlers = useMutationToasts();

  return useMutation({
    mutationFn: (policyId: string) => claimPayout(policyId, getWalletContext()),
    onError: toastHandlers.onError,
    onMutate: () => toast.loading("Submitting payout claim..."),
    onSuccess: (_result, policyId, toastId) => {
      toastHandlers.onSuccess("Payout claimed successfully.", toastId);
      clearParametrixPolicyReadCache(policyId);
      clearParametrixReadCache(CONTRACT_READ_METHODS.GET_MY_POLICIES);
      clearParametrixReadCache(CONTRACT_READ_METHODS.GET_POOL_STATUS);
      queryClient.invalidateQueries({
        queryKey: parametrixQueryKeys.myPolicyIds(address),
      });
      queryClient.invalidateQueries({
        queryKey: parametrixQueryKeys.dashboardPolicies(address),
      });
      queryClient.invalidateQueries({ queryKey: parametrixQueryKeys.policy(policyId) });
      queryClient.invalidateQueries({ queryKey: parametrixQueryKeys.poolStatus() });
    },
  });
}

export function useCancelPolicy() {
  const { address } = useAccount();
  const getWalletContext = useWalletWriteContext();
  const queryClient = useQueryClient();
  const toastHandlers = useMutationToasts();

  return useMutation({
    mutationFn: (policyId: string) => cancelPolicy(policyId, getWalletContext()),
    onError: toastHandlers.onError,
    onMutate: () => toast.loading("Submitting policy cancellation..."),
    onSuccess: (_result, policyId, toastId) => {
      toastHandlers.onSuccess("Policy cancellation submitted.", toastId);
      clearParametrixPolicyReadCache(policyId);
      clearParametrixReadCache(CONTRACT_READ_METHODS.GET_MY_POLICIES);
      clearParametrixReadCache(CONTRACT_READ_METHODS.GET_ACTIVE_POLICIES);
      queryClient.invalidateQueries({
        queryKey: parametrixQueryKeys.myPolicyIds(address),
      });
      queryClient.invalidateQueries({
        queryKey: parametrixQueryKeys.dashboardPolicies(address),
      });
      queryClient.invalidateQueries({ queryKey: parametrixQueryKeys.policy(policyId) });
      queryClient.invalidateQueries({
        queryKey: parametrixQueryKeys.activePolicies(),
      });
    },
  });
}

export function useSettlePolicyDay() {
  const { address } = useAccount();
  const getWalletContext = useWalletWriteContext();
  const queryClient = useQueryClient();
  const toastHandlers = useMutationToasts();

  return useMutation({
    mutationFn: ({
      policyId,
      settlementDate,
    }: {
      policyId: string;
      settlementDate: string;
    }) => settlePolicyDay(policyId, settlementDate, getWalletContext()),
    onError: toastHandlers.onError,
    onMutate: () => toast.loading("Submitting settlement check..."),
    onSuccess: (_result, variables, toastId) => {
      toastHandlers.onSuccess("Settlement check submitted.", toastId);
      clearParametrixPolicyReadCache(
        variables.policyId,
        variables.settlementDate,
      );
      clearParametrixReadCache(CONTRACT_READ_METHODS.GET_ACTIVE_POLICIES);
      queryClient.invalidateQueries({
        queryKey: parametrixQueryKeys.activePolicies(),
      });
      queryClient.invalidateQueries({
        queryKey: parametrixQueryKeys.dashboardPolicies(address),
      });
      queryClient.invalidateQueries({
        queryKey: parametrixQueryKeys.policy(variables.policyId),
      });
      queryClient.invalidateQueries({
        queryKey: parametrixQueryKeys.policySummary(variables.policyId),
      });
      queryClient.invalidateQueries({
        queryKey: parametrixQueryKeys.policyFinancials(variables.policyId),
      });
      queryClient.invalidateQueries({
        queryKey: parametrixQueryKeys.policySettlementStatus(variables.policyId),
      });
      queryClient.invalidateQueries({
        queryKey: parametrixQueryKeys.policySettlementHistory(variables.policyId),
      });
      queryClient.invalidateQueries({
        queryKey: parametrixQueryKeys.settlementReadiness(
          variables.policyId,
          variables.settlementDate,
        ),
      });
    },
  });
}

export function useAddPoolFunds() {
  const getWalletContext = useWalletWriteContext();
  const queryClient = useQueryClient();
  const toastHandlers = useMutationToasts();

  return useMutation({
    mutationFn: (amountGen: string) => addPoolFunds(amountGen, getWalletContext()),
    onError: toastHandlers.onError,
    onMutate: () => toast.loading("Submitting pool funding transaction..."),
    onSuccess: (_result, _variables, toastId) => {
      toastHandlers.onSuccess("Pool funding submitted.", toastId);
      clearParametrixReadCache(CONTRACT_READ_METHODS.GET_POOL_STATUS);
      queryClient.invalidateQueries({ queryKey: parametrixQueryKeys.poolStatus() });
    },
  });
}

export function useWithdrawFromPool() {
  const getWalletContext = useWalletWriteContext();
  const queryClient = useQueryClient();
  const toastHandlers = useMutationToasts();

  return useMutation({
    mutationFn: (amountGen: string) =>
      withdrawFromPool(amountGen, getWalletContext()),
    onError: toastHandlers.onError,
    onMutate: () => toast.loading("Submitting pool withdrawal..."),
    onSuccess: (_result, _variables, toastId) => {
      toastHandlers.onSuccess("Pool withdrawal submitted.", toastId);
      clearParametrixReadCache(CONTRACT_READ_METHODS.GET_POOL_STATUS);
      queryClient.invalidateQueries({ queryKey: parametrixQueryKeys.poolStatus() });
    },
  });
}
