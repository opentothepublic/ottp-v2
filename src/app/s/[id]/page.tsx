"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getSubjectById, getObjectsByOwner } from "@/lib/data";
import { ObjectCard } from "@/components/object-card";
import { shortenAddress, timeAgo } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { Subject, OttpObject, OttpObjectWithOwner } from "@/types/database";

export default function SubjectPage() {
  const { id } = useParams<{ id: string }>();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [objects, setObjects] = useState<OttpObject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const s = await getSubjectById(id);
      setSubject(s);
      if (s) {
        const objs = await getObjectsByOwner(s.id);
        setObjects(objs);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return <div className="mt-12 text-center text-zinc-500">Loading...</div>;
  }

  if (!subject) {
    return (
      <div className="mt-12 text-center text-zinc-500">Subject not found.</div>
    );
  }

  const identity = (subject.metadata?.identity as string) || "";

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          {identity && <Badge variant="muted">{identity.split(".").pop()}</Badge>}
          {subject.onchain_uid && <Badge variant="verified">onchain</Badge>}
        </div>
        <h1 className="text-xl font-semibold text-zinc-100">{subject.name}</h1>
        <p className="text-xs text-zinc-600 mt-1">
          {shortenAddress(subject.wallet_address)} · joined{" "}
          {timeAgo(subject.created_at)}
        </p>
      </div>

      <section>
        <h2 className="text-sm font-medium text-zinc-400 mb-3">Objects</h2>
        {objects.length === 0 ? (
          <p className="text-sm text-zinc-600">Nothing yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {objects.map((obj) => (
              <ObjectCard
                key={obj.id}
                object={{ ...obj, owner: subject } as OttpObjectWithOwner}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
