"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useOttp } from "@/contexts/ottp-context";
import {
  getObjectsByOwner,
  getPendingLinksForOwner,
} from "@/lib/data";
import { IDENTITY, getTitle, getIdentity } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100">
            {subject?.name}
          </h1>
          <p className="text-sm text-zinc-500">Your dashboard</p>
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
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-200">
                    {getTitle(p)}
                  </span>
                  <span className="text-xs text-zinc-600">
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-zinc-200">
                      {getTitle(w)}
                    </span>
                    <Badge variant="muted">Work</Badge>
                  </div>
                  <span className="text-xs text-zinc-600">
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
