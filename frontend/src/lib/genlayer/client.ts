import { createClient } from "genlayer-js";
import { testnetBradbury } from "genlayer-js/chains";
import type { Address, EIP1193Provider } from "viem";
import { GENLAYER_BRADBURY_RPC_URL } from "@/lib/wallet/bradbury";

export const GENLAYER_RPC_URL =
  process.env.NEXT_PUBLIC_GENLAYER_RPC_URL ?? GENLAYER_BRADBURY_RPC_URL;

export const PARAMETRIX_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_PARAMETRIX_CONTRACT_ADDRESS;

export type GenLayerClientConfig = {
  contractAddress?: string;
  rpcUrl?: string;
};

export function getGenLayerClientConfig(): GenLayerClientConfig {
  return {
    contractAddress: PARAMETRIX_CONTRACT_ADDRESS,
    rpcUrl: GENLAYER_RPC_URL,
  };
}

type GenLayerClientOptions = {
  account?: Address;
  provider?: EIP1193Provider;
};

export function getGenLayerReadClient(options: GenLayerClientOptions = {}) {
  return createClient({
    account: options.account,
    chain: testnetBradbury,
    endpoint: GENLAYER_RPC_URL,
    provider: options.provider,
  });
}

type GenLayerWriteClientOptions = {
  address: Address;
  provider?: EIP1193Provider;
};

export function createGenLayerWriteClient({
  address,
  provider,
}: GenLayerWriteClientOptions) {
  return createClient({
    account: address,
    chain: testnetBradbury,
    endpoint: GENLAYER_RPC_URL,
    provider,
  });
}
