"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useOttp } from "@/contexts/ottp-context";
import { updateSubject } from "@/lib/data";
import { hasFarcaster } from "@/lib/identity";
import { shortenAddress } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { FarcasterProfile } from "@/lib/identity";

export function FarcasterVerify() {
  const { address } = useAccount();
  const { subject, refresh } = useOttp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!subject || !address) return null;

  if (hasFarcaster(subject)) {
    const fc = subject.metadata.farcaster as FarcasterProfile;
    return (
      <span className="text-xs text-zinc-500">
        Farcaster: @{fc.username}
      </span>
    );
  }

  async function handleVerify() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/farcaster?address=${address}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lookup failed");
      if (!data.user) {
        setError("No Farcaster account found for this wallet.");
        setLoading(false);
        return;
      }

      const updates: { name?: string; metadata: Record<string, unknown> } = {
        metadata: { ...subject!.metadata, farcaster: data.user },
      };

      // Upgrade name if it was a shortened address
      const shortAddr = shortenAddress(subject!.wallet_address);
      if (subject!.name === shortAddr || !subject!.name) {
        updates.name = data.user.display_name || data.user.username;
      }

      await updateSubject(subject!.id, updates);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    }
    setLoading(false);
  }

  return (
    <div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleVerify}
        disabled={loading}
      >
        {loading ? "Looking up..." : "Verify with Farcaster"}
      </Button>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}
