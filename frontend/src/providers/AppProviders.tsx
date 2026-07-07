"use client";

import { WagmiProvider } from "wagmi";
import "@/lib/wallet/appkit";
import { QueryProvider } from "@/providers/QueryProvider";
import { wagmiConfig } from "@/lib/wallet/wagmiConfig";

type AppProvidersProps = {
  children: React.ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryProvider>{children}</QueryProvider>
    </WagmiProvider>
  );
}
