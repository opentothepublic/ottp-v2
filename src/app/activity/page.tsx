"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getRecentActivity, getSubjectById, getObjectById } from "@/lib/data";
import { getDisplayName } from "@/lib/identity";
import { getTitle, getIdentity } from "@/types/database";
import { timeAgo } from "@/lib/utils";
import type { ActivityLogEntry, Subject, OttpObjectWithOwner } from "@/types/database";

interface EnrichedEntry extends ActivityLogEntry {
  actor?: Subject;
  targetObject?: OttpObjectWithOwner;
  targetSubject?: Subject;
}

const identityLabels: Record<string, string> = {
  "ottp.identity.project": "project",
  "ottp.identity.scope": "scope",
  "ottp.identity.work": "work",
  "ottp.identity.plugin": "plugin",
};

export default function ActivityPage() {
  const [entries, setEntries] = useState<EnrichedEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const raw = await getRecentActivity(100);

      // Resolve actors and targets in parallel
      const enriched = await Promise.all(
        raw.map(async (entry) => {
          const enrichedEntry: EnrichedEntry = { ...entry };

          const [actor, targetObj, targetSubj] = await Promise.all([
            getSubjectById(entry.actor_subject_id).catch(() => null),
            entry.target_object_id
              ? getObjectById(entry.target_object_id).catch(() => null)
              : null,
            entry.target_subject_id
              ? getSubjectById(entry.target_subject_id).catch(() => null)
              : null,
          ]);

          if (actor) enrichedEntry.actor = actor;
          if (targetObj) enrichedEntry.targetObject = targetObj;
          if (targetSubj) enrichedEntry.targetSubject = targetSubj;

          return enrichedEntry;
        })
      );

      setEntries(enriched);
      setLoading(false);
    }
    load();
  }, []);

  function renderEntry(entry: EnrichedEntry) {
    const actorName = entry.actor ? getDisplayName(entry.actor) : "Someone";
    const actorLink = entry.actor ? (
      <Link href={`/s/${entry.actor.id}`} className="text-zinc-200 hover:text-white">
        {actorName}
      </Link>
    ) : (
      <span className="text-zinc-200">{actorName}</span>
    );

    switch (entry.action) {
      case "subject.registered": {
        return <>{actorLink} <span className="text-zinc-500">joined OTTP</span></>;
      }
      case "object.created": {
        const obj = entry.targetObject;
        const identity = obj ? identityLabels[getIdentity(obj)] || "object" : "object";
        const title = obj ? getTitle(obj) : "an object";
        return (
          <>
            {actorLink}{" "}
            <span className="text-zinc-500">created {identity}:</span>{" "}
            {obj ? (
              <Link href={`/o/${obj.id}`} className="text-zinc-200 hover:text-white">
                {title}
              </Link>
            ) : (
              <span className="text-zinc-300">{title}</span>
            )}
          </>
        );
      }
      case "link.created": {
        return (
          <>
            {actorLink}{" "}
            <span className="text-zinc-500">submitted a link</span>
            {entry.targetObject && (
              <>
                {" "}<span className="text-zinc-500">to</span>{" "}
                <Link href={`/o/${entry.targetObject.id}`} className="text-zinc-200 hover:text-white">
                  {getTitle(entry.targetObject)}
                </Link>
              </>
            )}
          </>
        );
      }
      case "link.verified": {
        return (
          <>
            {actorLink}{" "}
            <span className="text-zinc-500">verified a link</span>
            {entry.targetObject && (
              <>
                {" "}<span className="text-zinc-500">on</span>{" "}
                <Link href={`/o/${entry.targetObject.id}`} className="text-zinc-200 hover:text-white">
                  {getTitle(entry.targetObject)}
                </Link>
              </>
            )}
          </>
        );
      }
      case "link.rejected": {
        return (
          <>
            {actorLink}{" "}
            <span className="text-zinc-500">rejected a link</span>
          </>
        );
      }
      default: {
        return (
          <>
            {actorLink}{" "}
            <span className="text-zinc-500">{entry.action}</span>
          </>
        );
      }
    }
  }

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
              className="flex items-center justify-between py-2.5 border-b border-zinc-800/50"
            >
              <span className="text-sm">
                {renderEntry(entry)}
              </span>
              <span className="text-xs text-zinc-600 shrink-0 ml-4">
                {timeAgo(entry.created_at)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
