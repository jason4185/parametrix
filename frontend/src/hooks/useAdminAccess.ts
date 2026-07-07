"use client";

import { useAccount } from "wagmi";
import { useContractOwner } from "@/hooks/useParametrixReads";

function normalizeAddress(address?: string | null) {
  return address?.trim().toLowerCase() ?? "";
}

export function useAdminAccess() {
  const { address, isConnected } = useAccount();
  const owner = useContractOwner({
    enabled: isConnected && Boolean(address),
  });
  const ownerAddress = isConnected && !owner.error ? owner.data ?? null : null;
  const isAdmin =
    Boolean(address && ownerAddress) &&
    normalizeAddress(address) === normalizeAddress(ownerAddress);

  return {
    error: owner.error,
    isAdmin: owner.error ? false : isAdmin,
    isConnected,
    isLoading: isConnected && owner.isLoading,
    ownerAddress,
  };
}
