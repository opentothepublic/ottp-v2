"use client";

import { useEffect, useState } from "react";
import { getRecentActivity } from "@/lib/data";
import { timeAgo } from "@/lib/utils";
import type { ActivityLogEntry } from "@/types/database";

const actionLabels: Record<string, string> = {
  "subject.registered": "registered",
  "object.created": "created an object",
  "link.created": "created a link",
  "link.verified": "verified a link",
  "link.rejected": "rejected a link",
};

export default function ActivityPage() {
  const [entries, setEntries] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await getRecentActivity(100);
      setEntries(data);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div>
      <h1 className="text-lg font-semibold text-zinc-100 mb-1">Activity</h1>
      <p className="text-sm text-zinc-500 mb-6">Recent actions on OTTP</p>

      {loading ? (
        <p className="text-sm text-zinc-600">Loading...</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-zinc-600">No activity yet.</p>
      ) : (
        <div className="space-y-1">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between py-2 border-b border-zinc-800/50"
            >
              <span className="text-sm text-zinc-400">
                {actionLabels[entry.action] || entry.action}
              </span>
              <span className="text-xs text-zinc-600">
                {timeAgo(entry.created_at)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
