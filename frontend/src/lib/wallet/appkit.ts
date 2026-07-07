"use client";

import { createAppKit } from "@reown/appkit/react";
import { appKitNetworks, genlayerBradbury } from "@/lib/wallet/bradbury";
import { appKitProjectId, wagmiAdapter } from "@/lib/wallet/wagmiConfig";

const metadata = {
  description: "Parametric weather insurance settled by real weather data.",
  icons: [] as string[],
  name: "Parametrix",
  url:
    typeof window === "undefined"
      ? "https://parametrix.app"
      : window.location.origin,
};

export const appKit = createAppKit({
  adapters: [wagmiAdapter],
  defaultNetwork: genlayerBradbury,
  features: {
    analytics: false,
  },
  metadata,
  networks: appKitNetworks,
  projectId: appKitProjectId,
  themeMode: "dark",
});
