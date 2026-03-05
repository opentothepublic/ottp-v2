"use client";

import { useState, useEffect, useCallback } from "react";
import { useEas } from "@/hooks/use-eas";
import { useOttp } from "@/contexts/ottp-context";
import {
  getUnpublishedCounts,
  batchPublishAll,
  type BatchPublishResult,
} from "@/lib/eas";
import { getSchemaUids, schemasReady } from "@/lib/eas/config";
import { Button } from "@/components/ui/button";
import type { Hex } from "viem";

export function PublishButton() {
  const { subject } = useOttp();
  const { walletClient, publicClient, ensureChain } = useEas("base");
  const [counts, setCounts] = useState({ subjects: 0, objects: 0, links: 0, total: 0 });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BatchPublishResult | null>(null);

  const refreshCounts = useCallback(() => {
    if (!subject) return;
    getUnpublishedCounts(subject.id).then(setCounts);
  }, [subject]);

  useEffect(() => {
    refreshCounts();
  }, [refreshCounts]);

  if (!schemasReady() || counts.total === 0) return null;

  async function handlePublish() {
    if (!walletClient || !publicClient || !subject) return;
    setLoading(true);
    setResult(null);

    try {
      await ensureChain();
      const uids = getSchemaUids();
      const res = await batchPublishAll(
        walletClient,
        publicClient,
        subject.id,
        {
          subject: uids.subject as Hex,
          object: uids.object as Hex,
          link: uids.link as Hex,
        },
        "base"
      );
      setResult(res);
      // Refresh counts so card disappears if everything is published
      refreshCounts();
    } catch (err) {
      setResult({
        subjects: 0,
        objects: 0,
        links: 0,
        txHash: null,
        error: err instanceof Error ? err.message : "Failed",
      });
    }
    setLoading(false);
  }

  return (
    <div className="p-4 rounded-lg border border-zinc-700 bg-zinc-900/50 mb-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-medium text-zinc-200">
            Publish to Base
          </h3>
          <p className="text-xs text-zinc-500 mt-1 truncate">
            {counts.total} unpublished item{counts.total === 1 ? "" : "s"}
            {counts.subjects > 0 && ` · ${counts.subjects} subject`}
            {counts.objects > 0 && ` · ${counts.objects} object${counts.objects === 1 ? "" : "s"}`}
            {counts.links > 0 && ` · ${counts.links} link${counts.links === 1 ? "" : "s"}`}
          </p>
        </div>
        <Button
          onClick={handlePublish}
          disabled={loading || !walletClient}
          size="sm"
          className="shrink-0"
        >
          {loading ? "Publishing..." : "Publish All"}
        </Button>
      </div>

      {result && !result.error && (
        <p className="text-xs text-emerald-400 mt-2">
          Published {result.subjects + result.objects + result.links} items onchain.
        </p>
      )}
      {result?.error && (
        <p className="text-xs text-red-400 mt-2">{result.error}</p>
      )}
    </div>
  );
}
