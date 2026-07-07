"use client";

import { useAppKit } from "@reown/appkit/react";
import { Wallet } from "lucide-react";
import { toast } from "sonner";
import { useAccount, useChainId, useDisconnect, useSwitchChain } from "wagmi";
import {
  GENLAYER_BRADBURY_CHAIN_ID,
  genlayerBradbury,
} from "@/lib/wallet/bradbury";
import { hasReownProjectId } from "@/lib/wallet/wagmiConfig";

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function WalletConnectButton() {
  const { open } = useAppKit();
  const { address, isConnected, isConnecting } = useAccount();
  const chainId = useChainId();
  const { disconnect } = useDisconnect();
  const { isPending: isSwitchingChain, switchChain } = useSwitchChain();

  const isWrongChain = isConnected && chainId !== GENLAYER_BRADBURY_CHAIN_ID;

  const handleClick = async () => {
    if (!hasReownProjectId) {
      toast.error(
        "Missing NEXT_PUBLIC_REOWN_PROJECT_ID. Add your Reown project ID to .env.local.",
      );
      return;
    }

    if (!isConnected) {
      await open({ view: "Connect" });
      return;
    }

    if (isWrongChain) {
      switchChain(
        { chainId: genlayerBradbury.id },
        {
          onError: () =>
            toast.error("Unable to switch wallet network to GenLayer Bradbury."),
        },
      );
      return;
    }

    try {
      await open({ view: "Account" });
    } catch {
      disconnect();
    }
  };

  const label = !hasReownProjectId
    ? "Wallet setup required"
    : !isConnected
      ? isConnecting
        ? "Connecting..."
        : "Connect Wallet"
      : isWrongChain
        ? isSwitchingChain
          ? "Switching..."
          : "Switch to Bradbury"
        : address
          ? shortenAddress(address)
          : "Connected";

  return (
    <button
      className="inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-lg border border-cyan/35 bg-cyan/10 px-5 py-2.5 text-sm font-semibold text-cyan transition hover:border-cyan/60 hover:bg-cyan/15 hover:shadow-[0_16px_40px_rgba(0,229,255,0.12)] active:scale-[0.98]"
      onClick={handleClick}
      type="button"
    >
      {isConnected && !isWrongChain ? (
        <span className="h-2 w-2 rounded-full bg-cyan" />
      ) : null}
      <Wallet className="h-4 w-4" />
      {label}
    </button>
  );
}
