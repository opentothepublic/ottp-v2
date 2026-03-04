import type { Subject } from "@/types/database";
import { shortenAddress } from "@/lib/utils";

export interface FarcasterProfile {
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
}

/**
 * Get display name with fallback chain:
 * FC display_name > FC username > subject.name > shortened wallet address
 */
export function getDisplayName(subject: Subject): string {
  const fc = subject.metadata?.farcaster as FarcasterProfile | undefined;
  if (fc?.display_name) return fc.display_name;
  if (fc?.username) return fc.username;
  if (subject.name) return subject.name;
  return shortenAddress(subject.wallet_address);
}

/**
 * Get profile picture URL from Farcaster data.
 * Returns null if no pfp available.
 */
export function getPfpUrl(subject: Subject): string | null {
  const fc = subject.metadata?.farcaster as FarcasterProfile | undefined;
  return fc?.pfp_url ?? null;
}

/**
 * Check if subject has verified Farcaster identity.
 */
export function hasFarcaster(subject: Subject): boolean {
  const fc = subject.metadata?.farcaster as FarcasterProfile | undefined;
  return !!fc?.fid;
}
