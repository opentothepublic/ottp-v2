"use client";

import {
  useWalletClient,
  usePublicClient,
  useSwitchChain,
  useChainId,
} from "wagmi";
import { EAS_CONTRACTS, type EasChain } from "@/lib/eas";

export function useEas(chain: EasChain = "base") {
  const targetChainId = EAS_CONTRACTS[chain].chainId;
  const currentChainId = useChainId();

  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { switchChainAsync } = useSwitchChain();

  async function ensureChain() {
    if (currentChainId !== targetChainId) {
      await switchChainAsync({ chainId: targetChainId });
    }
  }

  return {
    walletClient: walletClient ?? null,
    publicClient: publicClient ?? null,
    ensureChain,
    chain,
    explorerUrl: EAS_CONTRACTS[chain].explorer,
    isCorrectChain: currentChainId === targetChainId,
  };
}
