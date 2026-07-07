import type { AppKitNetwork } from "@reown/appkit/networks";

export const GENLAYER_BRADBURY_CHAIN_ID = 4221;

export const GENLAYER_BRADBURY_RPC_URL =
  process.env.NEXT_PUBLIC_GENLAYER_RPC_URL ??
  "https://rpc-bradbury.genlayer.com";

export const GENLAYER_BRADBURY_CHAIN_RPC_URL =
  process.env.NEXT_PUBLIC_GENLAYER_CHAIN_RPC_URL ??
  "https://rpc.testnet-chain.genlayer.com";

export const GENLAYER_BRADBURY_EXPLORER_URL =
  process.env.NEXT_PUBLIC_GENLAYER_EXPLORER_URL ??
  "https://explorer-bradbury.genlayer.com";

export const GENLAYER_BRADBURY_CHAIN_EXPLORER_URL =
  process.env.NEXT_PUBLIC_GENLAYER_CHAIN_EXPLORER_URL ??
  "https://explorer.testnet-chain.genlayer.com";

export const GENLAYER_BRADBURY_CURRENCY_SYMBOL =
  process.env.NEXT_PUBLIC_GENLAYER_CURRENCY_SYMBOL ?? "GEN";

export const GENLAYER_BRADBURY_CAIP_NETWORK_ID =
  `eip155:${GENLAYER_BRADBURY_CHAIN_ID}` as const;

export const genlayerBradbury = {
  blockExplorers: {
    default: {
      name: "GenLayer Bradbury Explorer",
      url: GENLAYER_BRADBURY_EXPLORER_URL,
    },
  },
  caipNetworkId: GENLAYER_BRADBURY_CAIP_NETWORK_ID,
  chainNamespace: "eip155",
  id: GENLAYER_BRADBURY_CHAIN_ID,
  name: "GenLayer Bradbury",
  nativeCurrency: {
    decimals: 18,
    name: GENLAYER_BRADBURY_CURRENCY_SYMBOL,
    symbol: GENLAYER_BRADBURY_CURRENCY_SYMBOL,
  },
  rpcUrls: {
    default: {
      http: [GENLAYER_BRADBURY_RPC_URL],
    },
    public: {
      http: [GENLAYER_BRADBURY_RPC_URL],
    },
  },
  testnet: true,
} as const satisfies AppKitNetwork;

export const appKitNetworks = [genlayerBradbury] as [
  typeof genlayerBradbury,
];
