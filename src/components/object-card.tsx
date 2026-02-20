"use client";

import Link from "next/link";
import { getTitle, getDescription, getIdentity } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import { timeAgo, shortenAddress } from "@/lib/utils";
import type { OttpObjectWithOwner } from "@/types/database";

const identityLabels: Record<string, string> = {
  "ottp.identity.project": "Project",
  "ottp.identity.scope": "Scope",
  "ottp.identity.work": "Work",
  "ottp.identity.plugin": "Plugin",
};

export function ObjectCard({ object }: { object: OttpObjectWithOwner }) {
  const identity = getIdentity(object);
  const label = identityLabels[identity] || "Object";

  return (
    <Link
      href={`/o/${object.id}`}
      className="block p-4 rounded-lg border border-zinc-800 bg-zinc-900/50 hover:border-zinc-600 hover:bg-zinc-900 transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="muted">{label}</Badge>
            {object.onchain_uid && (
              <Badge variant="verified">onchain</Badge>
            )}
          </div>
          <h3 className="text-sm font-medium text-zinc-100 truncate">
            {getTitle(object)}
          </h3>
          {getDescription(object) && (
            <p className="text-xs text-zinc-500 mt-1 line-clamp-2">
              {getDescription(object)}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3 text-xs text-zinc-600">
        <span>{object.owner?.name || shortenAddress(object.owner?.wallet_address || "")}</span>
        <span>·</span>
        <span>{timeAgo(object.created_at)}</span>
      </div>
    </Link>
  );
}
