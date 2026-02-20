"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useOttp } from "@/contexts/ottp-context";
import {
  getObjectById,
  getChildObjects,
  getLinksToObject,
  getBlocksForObject,
  verifyLink,
  rejectLink,
  getSubjectById,
} from "@/lib/data";
import {
  getTitle,
  getDescription,
  getIdentity,
  IDENTITY,
} from "@/types/database";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ObjectCard } from "@/components/object-card";
import { timeAgo, shortenAddress } from "@/lib/utils";
import type {
  OttpObjectWithOwner,
  Block,
  Link as OttpLink,
  Subject,
} from "@/types/database";

const identityLabels: Record<string, string> = {
  [IDENTITY.PROJECT]: "Project",
  [IDENTITY.SCOPE]: "Scope",
  [IDENTITY.WORK]: "Work",
  [IDENTITY.PLUGIN]: "Plugin",
};

export default function ObjectPage() {
  const { id } = useParams<{ id: string }>();
  const { subject } = useOttp();
  const [object, setObject] = useState<OttpObjectWithOwner | null>(null);
  const [children, setChildren] = useState<OttpObjectWithOwner[]>([]);
  const [inboundLinks, setInboundLinks] = useState<OttpLink[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [linkSources, setLinkSources] = useState<
    Record<string, { object?: OttpObjectWithOwner; subject?: Subject }>
  >({});
  const [loading, setLoading] = useState(true);

  const isOwner = subject && object && subject.id === object.owner_subject_id;
  const identity = object ? getIdentity(object) : "";

  useEffect(() => {
    async function load() {
      const [obj, links, blks] = await Promise.all([
        getObjectById(id),
        getLinksToObject(id),
        getBlocksForObject(id),
      ]);
      setObject(obj);
      setInboundLinks(links);
      setBlocks(blks);

      if (obj) {
        const ch = await getChildObjects(obj.id);
        setChildren(ch);
      }

      // Resolve link sources
      const sources: Record<
        string,
        { object?: OttpObjectWithOwner; subject?: Subject }
      > = {};
      for (const link of links) {
        if (link.source_object_id) {
          const srcObj = await getObjectById(link.source_object_id);
          if (srcObj) sources[link.id] = { object: srcObj };
        } else if (link.source_subject_id) {
          const srcSubj = await getSubjectById(link.source_subject_id);
          if (srcSubj) sources[link.id] = { subject: srcSubj };
        }
      }
      setLinkSources(sources);
      setLoading(false);
    }
    load();
  }, [id]);

  async function handleVerify(linkId: string) {
    if (!subject) return;
    await verifyLink(linkId, subject.id);
    setInboundLinks((prev) =>
      prev.map((l) => (l.id === linkId ? { ...l, status: "verified" as const } : l))
    );
  }

  async function handleReject(linkId: string) {
    if (!subject) return;
    await rejectLink(linkId, subject.id);
    setInboundLinks((prev) =>
      prev.map((l) => (l.id === linkId ? { ...l, status: "rejected" as const } : l))
    );
  }

  if (loading) {
    return <div className="mt-12 text-center text-zinc-500">Loading...</div>;
  }

  if (!object) {
    return (
      <div className="mt-12 text-center text-zinc-500">Object not found.</div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="muted">{identityLabels[identity] || "Object"}</Badge>
          {object.onchain_uid && <Badge variant="verified">onchain</Badge>}
        </div>
        <h1 className="text-xl font-semibold text-zinc-100">
          {getTitle(object)}
        </h1>
        {getDescription(object) && (
          <p className="text-sm text-zinc-400 mt-2">
            {getDescription(object)}
          </p>
        )}
        <div className="flex items-center gap-2 mt-3 text-xs text-zinc-600">
          <Link
            href={`/s/${object.owner_subject_id}`}
            className="hover:text-zinc-400"
          >
            {object.owner?.name ||
              shortenAddress(object.owner?.wallet_address || "")}
          </Link>
          <span>·</span>
          <span>{timeAgo(object.created_at)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mb-8">
        {identity === IDENTITY.PROJECT && (
          <>
            <Link href={`/new?type=${IDENTITY.SCOPE}&parent=${object.id}`}>
              <Button variant="outline" size="sm">
                Add Scope
              </Button>
            </Link>
            <Link
              href={`/new?type=${IDENTITY.WORK}&linkTo=${object.id}`}
            >
              <Button variant="outline" size="sm">
                Submit Work
              </Button>
            </Link>
          </>
        )}
        {identity === IDENTITY.SCOPE && (
          <Link
            href={`/new?type=${IDENTITY.WORK}&linkTo=${object.id}&parent=${object.parent_object_id || ""}`}
          >
            <Button variant="outline" size="sm">
              Submit Work
            </Button>
          </Link>
        )}
      </div>

      {/* Content Blocks */}
      {blocks.filter((b) => !b.slot).length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-medium text-zinc-400 mb-3">Content</h2>
          <div className="space-y-3">
            {blocks
              .filter((b) => !b.slot)
              .map((block) => (
                <div
                  key={block.id}
                  className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/50"
                >
                  <p className="text-sm text-zinc-300 whitespace-pre-wrap">
                    {block.content}
                  </p>
                  <span className="text-xs text-zinc-600 mt-2 block">
                    {block.content_type} · {timeAgo(block.created_at)}
                  </span>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* Child Objects (Scopes under a Project, etc.) */}
      {children.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-medium text-zinc-400 mb-3">
            Scopes & Children
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {children.map((child) => (
              <ObjectCard key={child.id} object={child} />
            ))}
          </div>
        </section>
      )}

      {/* Inbound Links */}
      {inboundLinks.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-zinc-400 mb-3">
            Linked Work
          </h2>
          <div className="space-y-2">
            {inboundLinks.map((link) => {
              const src = linkSources[link.id];
              const srcTitle = src?.object
                ? getTitle(src.object)
                : src?.subject?.name || "Unknown";

              return (
                <div
                  key={link.id}
                  className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/50 flex items-center justify-between"
                >
                  <div>
                    {src?.object ? (
                      <Link
                        href={`/o/${src.object.id}`}
                        className="text-sm text-zinc-200 hover:text-white"
                      >
                        {srcTitle}
                      </Link>
                    ) : (
                      <span className="text-sm text-zinc-200">
                        {srcTitle}
                      </span>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant={
                          link.status === "verified"
                            ? "verified"
                            : link.status === "rejected"
                            ? "rejected"
                            : "unverified"
                        }
                      >
                        {link.status}
                      </Badge>
                      <span className="text-xs text-zinc-600">
                        {timeAgo(link.created_at)}
                      </span>
                    </div>
                  </div>

                  {isOwner && link.status === "unverified" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleVerify(link.id)}
                      >
                        Verify
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleReject(link.id)}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
