"use client";

import { useEffect, useState } from "react";
import { getObjectsByIdentity } from "@/lib/data";
import { IDENTITY } from "@/types/database";
import { ObjectCard } from "@/components/object-card";
import type { OttpObjectWithOwner } from "@/types/database";

export default function ExplorePage() {
  const [projects, setProjects] = useState<OttpObjectWithOwner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await getObjectsByIdentity(IDENTITY.PROJECT);
      setProjects(data);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div>
      <h1 className="text-lg font-semibold text-zinc-100 mb-1">Explore</h1>
      <p className="text-sm text-zinc-500 mb-6">All projects on OTTP</p>

      {loading ? (
        <p className="text-sm text-zinc-600">Loading...</p>
      ) : projects.length === 0 ? (
        <p className="text-sm text-zinc-600">
          No projects yet. Be the first to create one.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {projects.map((p) => (
            <ObjectCard key={p.id} object={p} />
          ))}
        </div>
      )}
    </div>
  );
}
