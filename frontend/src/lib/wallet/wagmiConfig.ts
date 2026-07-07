import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { http } from "wagmi";
import {
  appKitNetworks,
  GENLAYER_BRADBURY_CHAIN_ID,
  GENLAYER_BRADBURY_RPC_URL,
} from "@/lib/wallet/bradbury";

export const reownProjectId =
  process.env.NEXT_PUBLIC_REOWN_PROJECT_ID?.trim() ?? "";

export const hasReownProjectId = reownProjectId.length > 0;

export const appKitProjectId = hasReownProjectId
  ? reownProjectId
  : "missing-reown-project-id";

export const wagmiAdapter = new WagmiAdapter({
  networks: appKitNetworks,
  projectId: appKitProjectId,
  ssr: true,
  transports: {
    [GENLAYER_BRADBURY_CHAIN_ID]: http(GENLAYER_BRADBURY_RPC_URL),
  },
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;
