"use client";

import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import {
  readActivePolicies,
  readOwner,
  readPolicy,
  readPolicyFinancials,
  readPolicySettlementHistory,
  readPolicySettlementStatus,
  readPolicySummary,
  readPoolStatus,
  readMyPolicies,
  readSettlementReadiness,
} from "@/lib/genlayer/parametrix";
import { PARAMETRIX_CONTRACT_ADDRESS } from "@/lib/genlayer/client";

export const USER_READ_STALE_TIME = 120_000;
export const ADMIN_READ_STALE_TIME = 45_000;
const CONTRACT_READ_QUERY_OPTIONS = {
  refetchOnReconnect: false,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
  retry: 0,
};

type ContractReadHookOptions = {
  enabled?: boolean;
};

function hasContractAddress() {
  return Boolean(PARAMETRIX_CONTRACT_ADDRESS);
}

export const parametrixQueryKeys = {
  activePolicies: () => ["parametrix", "active-policies"] as const,
  all: ["parametrix"] as const,
  contractOwner: () => ["parametrix", "owner"] as const,
  dashboardPolicies: (account?: string) =>
    ["parametrix", "dashboardPolicies", account] as const,
  myPolicyIds: (account?: string) =>
    ["parametrix", "myPolicies", account] as const,
  policy: (policyId?: string) => ["parametrix", "policy", policyId] as const,
  policyFinancials: (policyId?: string) =>
    ["parametrix", "policy-financials", policyId] as const,
  policyOwner: (policyId?: string) =>
    ["parametrix", "policy-owner", policyId] as const,
  policySettlementHistory: (policyId?: string) =>
    ["parametrix", "policy-settlement-history", policyId] as const,
  policySettlementStatus: (policyId?: string) =>
    ["parametrix", "policy-settlement-status", policyId] as const,
  policySummary: (policyId?: string) =>
    ["parametrix", "policy-summary", policyId] as const,
  poolStatus: () => ["parametrix", "pool-status"] as const,
  settlementReadiness: (policyId?: string, settlementDate?: string) =>
    ["parametrix", "settlement-readiness", policyId, settlementDate] as const,
};

export function usePoolStatus(options: ContractReadHookOptions = {}) {
  const { enabled = true } = options;

  return useQuery({
    enabled: enabled && hasContractAddress(),
    queryFn: () => readPoolStatus({ cacheTtlMs: ADMIN_READ_STALE_TIME }),
    queryKey: parametrixQueryKeys.poolStatus(),
    staleTime: ADMIN_READ_STALE_TIME,
    ...CONTRACT_READ_QUERY_OPTIONS,
  });
}

export function useMyPolicyIds() {
  const { address, isConnected } = useAccount();

  return useQuery({
    enabled: isConnected && Boolean(address) && hasContractAddress(),
    queryFn: () =>
      readMyPolicies({ account: address, cacheTtlMs: USER_READ_STALE_TIME }),
    queryKey: parametrixQueryKeys.myPolicyIds(address),
    staleTime: USER_READ_STALE_TIME,
    ...CONTRACT_READ_QUERY_OPTIONS,
  });
}

export function usePolicy(policyId?: string) {
  const { isConnected } = useAccount();

  return useQuery({
    enabled:
      isConnected &&
      Boolean(policyId && policyId.trim() !== "") &&
      hasContractAddress(),
    queryFn: () =>
      readPolicy(policyId as string, { cacheTtlMs: USER_READ_STALE_TIME }),
    queryKey: parametrixQueryKeys.policy(policyId),
    staleTime: USER_READ_STALE_TIME,
    ...CONTRACT_READ_QUERY_OPTIONS,
  });
}

export function usePolicySummary(policyId?: string) {
  const { isConnected } = useAccount();

  return useQuery({
    enabled: isConnected && Boolean(policyId) && hasContractAddress(),
    queryFn: () =>
      readPolicySummary(policyId as string, { cacheTtlMs: USER_READ_STALE_TIME }),
    queryKey: parametrixQueryKeys.policySummary(policyId),
    staleTime: USER_READ_STALE_TIME,
    ...CONTRACT_READ_QUERY_OPTIONS,
  });
}

export function usePolicySettlementStatus(policyId?: string) {
  const { isConnected } = useAccount();

  return useQuery({
    enabled: isConnected && Boolean(policyId) && hasContractAddress(),
    queryFn: () =>
      readPolicySettlementStatus(policyId as string, {
        cacheTtlMs: USER_READ_STALE_TIME,
      }),
    queryKey: parametrixQueryKeys.policySettlementStatus(policyId),
    staleTime: USER_READ_STALE_TIME,
    ...CONTRACT_READ_QUERY_OPTIONS,
  });
}

export function usePolicyFinancials(policyId?: string) {
  const { isConnected } = useAccount();

  return useQuery({
    enabled: isConnected && Boolean(policyId) && hasContractAddress(),
    queryFn: () =>
      readPolicyFinancials(policyId as string, {
        cacheTtlMs: USER_READ_STALE_TIME,
      }),
    queryKey: parametrixQueryKeys.policyFinancials(policyId),
    staleTime: USER_READ_STALE_TIME,
    ...CONTRACT_READ_QUERY_OPTIONS,
  });
}

export function usePolicySettlementHistory(policyId?: string) {
  const { isConnected } = useAccount();

  return useQuery({
    enabled: isConnected && Boolean(policyId) && hasContractAddress(),
    queryFn: () =>
      readPolicySettlementHistory(policyId as string, {
        cacheTtlMs: USER_READ_STALE_TIME,
      }),
    queryKey: parametrixQueryKeys.policySettlementHistory(policyId),
    staleTime: USER_READ_STALE_TIME,
    ...CONTRACT_READ_QUERY_OPTIONS,
  });
}

export function usePolicyDetails(policyId?: string) {
  const policy = usePolicy(policyId);

  return {
    error: policy.error,
    financials: policy,
    isLoading: policy.isLoading,
    policy,
    refetch: () => policy.refetch(),
    settlementHistory: policy,
    settlementStatus: policy,
    summary: policy,
  };
}

export function useActivePolicies(options: ContractReadHookOptions = {}) {
  const { enabled = true } = options;

  return useQuery({
    enabled: enabled && hasContractAddress(),
    queryFn: () => readActivePolicies({ cacheTtlMs: ADMIN_READ_STALE_TIME }),
    queryKey: parametrixQueryKeys.activePolicies(),
    staleTime: ADMIN_READ_STALE_TIME,
    ...CONTRACT_READ_QUERY_OPTIONS,
  });
}

export function useSettlementReadiness(
  policyId?: string,
  settlementDate?: string,
  options: ContractReadHookOptions = {},
) {
  const { enabled = true } = options;

  return useQuery({
    enabled:
      enabled && Boolean(policyId && settlementDate) && hasContractAddress(),
    queryFn: () =>
      readSettlementReadiness(policyId as string, settlementDate as string, {
        cacheTtlMs: ADMIN_READ_STALE_TIME,
      }),
    queryKey: parametrixQueryKeys.settlementReadiness(
      policyId,
      settlementDate,
    ),
    staleTime: ADMIN_READ_STALE_TIME,
    ...CONTRACT_READ_QUERY_OPTIONS,
  });
}

export function useContractOwner(options: ContractReadHookOptions = {}) {
  const { enabled = true } = options;

  return useQuery({
    enabled: enabled && hasContractAddress(),
    queryFn: () => readOwner({ cacheTtlMs: ADMIN_READ_STALE_TIME }),
    queryKey: parametrixQueryKeys.contractOwner(),
    staleTime: ADMIN_READ_STALE_TIME,
    ...CONTRACT_READ_QUERY_OPTIONS,
  });
}
