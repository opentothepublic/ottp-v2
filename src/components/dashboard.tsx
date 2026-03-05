"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useOttp } from "@/contexts/ottp-context";
import {
  getObjectsByOwner,
  getPendingLinksForOwner,
} from "@/lib/data";
import { IDENTITY, getTitle } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PublishButton } from "@/components/publish-button";
import { FarcasterVerify } from "@/components/farcaster-verify";
import { getDisplayName, getFarcasterUsername } from "@/lib/identity";
import { timeAgo } from "@/lib/utils";
import type { OttpObject, Link as OttpLink } from "@/types/database";

export function Dashboard() {
  const { subject } = useOttp();
  const [projects, setProjects] = useState<OttpObject[]>([]);
  const [works, setWorks] = useState<OttpObject[]>([]);
  const [pendingLinks, setPendingLinks] = useState<OttpLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!subject) return;
    async function load() {
      const [p, w, pl] = await Promise.all([
        getObjectsByOwner(subject!.id, IDENTITY.PROJECT),
        getObjectsByOwner(subject!.id, IDENTITY.WORK),
        getPendingLinksForOwner(subject!.id),
      ]);
      setProjects(p);
      setWorks(w);
      setPendingLinks(pl);
      setLoading(false);
    }
    load();
  }, [subject]);

  if (loading) {
    return <div className="mt-12 text-center text-zinc-500">Loading...</div>;
  }

  const fcUsername = subject ? getFarcasterUsername(subject) : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-zinc-100">
              {subject ? getDisplayName(subject) : ""}
            </h1>
            {fcUsername && (
              <a
                href={`https://farcaster.com/${fcUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-500 hover:text-zinc-300"
                title={`@${fcUsername} on Farcaster`}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 1000 1000"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M257.778 155.556H742.222V844.444H671.111V528.889H670.414C662.554 441.677 589.258 373.333 500 373.333C410.742 373.333 337.446 441.677 329.586 528.889H328.889V844.444H257.778V155.556Z" />
                  <path d="M128.889 253.333L157.778 351.111H182.222V746.667C169.949 746.667 160 756.616 160 768.889V795.556H155.556C143.283 795.556 133.333 805.505 133.333 817.778V844.444H382.222V817.778C382.222 805.505 372.273 795.556 360 795.556H355.556V768.889C355.556 756.616 345.606 746.667 333.333 746.667H306.667V253.333H128.889Z" />
                  <path d="M675.556 746.667C663.283 746.667 653.333 756.616 653.333 768.889V795.556H648.889C636.616 795.556 626.667 805.505 626.667 817.778V844.444H875.556V817.778C875.556 805.505 865.606 795.556 853.333 795.556H848.889V768.889C848.889 756.616 838.94 746.667 826.667 746.667V351.111H851.111L880 253.333H702.222V746.667H675.556Z" />
                </svg>
              </a>
            )}
          </div>
          <p className="text-sm text-zinc-500">Your dashboard</p>
          <div className="mt-2">
            <FarcasterVerify />
          </div>
        </div>
        <Link href="/new">
          <Button>Create</Button>
        </Link>
      </div>

      {pendingLinks.length > 0 && (
        <div className="mb-8 p-4 rounded-lg border border-amber-800/50 bg-amber-950/20">
          <h2 className="text-sm font-medium text-amber-300 mb-2">
            {pendingLinks.length} pending link{pendingLinks.length === 1 ? "" : "s"} to review
          </h2>
          <p className="text-xs text-zinc-400">
            Someone has linked their work to one of your projects.{" "}
            <Link href="/activity" className="text-amber-400 hover:underline">
              Review →
            </Link>
          </p>
        </div>
      )}

      <PublishButton />

      <section className="mb-8">
        <h2 className="text-sm font-medium text-zinc-400 mb-3">
          Your Projects
        </h2>
        {projects.length === 0 ? (
          <p className="text-sm text-zinc-600">
            No projects yet.{" "}
            <Link href="/new" className="text-zinc-400 hover:underline">
              Create one →
            </Link>
          </p>
        ) : (
          <div className="space-y-2">
            {projects.map((p) => (
              <Link
                key={p.id}
                href={`/o/${p.id}`}
                className="block p-3 rounded-lg border border-zinc-800 hover:border-zinc-600 transition-colors"
              >
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <span className="text-sm text-zinc-200 truncate">
                    {getTitle(p)}
                  </span>
                  <span className="text-xs text-zinc-600 shrink-0">
                    {timeAgo(p.created_at)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-sm font-medium text-zinc-400 mb-3">Your Work</h2>
        {works.length === 0 ? (
          <p className="text-sm text-zinc-600">
            No work submitted yet.
          </p>
        ) : (
          <div className="space-y-2">
            {works.map((w) => (
              <Link
                key={w.id}
                href={`/o/${w.id}`}
                className="block p-3 rounded-lg border border-zinc-800 hover:border-zinc-600 transition-colors"
              >
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm text-zinc-200 truncate">
                      {getTitle(w)}
                    </span>
                    <Badge variant="muted">Work</Badge>
                  </div>
                  <span className="text-xs text-zinc-600 shrink-0">
                    {timeAgo(w.created_at)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
