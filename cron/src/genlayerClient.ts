import { createAccount, createClient } from "genlayer-js";
import { testnetBradbury } from "genlayer-js/chains";
import type { Address } from "viem";
import type { ContractArg, Env } from "./types";

const ZERO_VALUE = BigInt(0);

function requireHexAddress(value: string | undefined, name: string): Address {
  if (!value || !/^0x[a-fA-F0-9]{40}$/.test(value)) {
    throw new Error(`Missing or invalid ${name}.`);
  }

  return value as Address;
}

function requirePrivateKey(value: string | undefined): `0x${string}` {
  if (!value) {
    throw new Error("Missing OPERATOR_PRIVATE_KEY.");
  }

  const normalized = value.startsWith("0x") ? value : `0x${value}`;

  if (!/^0x[a-fA-F0-9]{64}$/.test(normalized)) {
    throw new Error("Invalid OPERATOR_PRIVATE_KEY format.");
  }

  return normalized as `0x${string}`;
}

function getNetwork(env: Env) {
  if (!env.GENLAYER_NETWORK || env.GENLAYER_NETWORK === "testnetBradbury") {
    return testnetBradbury;
  }

  throw new Error(`Unsupported GENLAYER_NETWORK: ${env.GENLAYER_NETWORK}.`);
}

export function createParametrixCronClient(env: Env) {
  const contractAddress = requireHexAddress(
    env.PARAMETRIX_CONTRACT_ADDRESS,
    "PARAMETRIX_CONTRACT_ADDRESS"
  );
  const endpoint = env.GENLAYER_RPC_URL;

  if (!endpoint) {
    throw new Error("Missing GENLAYER_RPC_URL.");
  }

  const chain = getNetwork(env);
  const operatorAccount = createAccount(requirePrivateKey(env.OPERATOR_PRIVATE_KEY));
  const readClient = createClient({
    chain,
    endpoint
  });
  const writeClient = createClient({
    account: operatorAccount,
    chain,
    endpoint
  });

  async function readContract(methodName: string, args: ContractArg[] = []) {
    return readClient.readContract({
      address: contractAddress,
      args,
      functionName: methodName
    });
  }

  async function writeContract(
    methodName: string,
    args: ContractArg[] = [],
    value = ZERO_VALUE
  ) {
    return writeClient.writeContract({
      address: contractAddress,
      args,
      functionName: methodName,
      value
    });
  }

  return {
    contractAddress,
    operatorAddress: operatorAccount.address,
    readContract,
    writeContract
  };
}
