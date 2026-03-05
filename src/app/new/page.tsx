"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useOttp } from "@/contexts/ottp-context";
import { createObject, createLink, getObjectsByOwner } from "@/lib/data";
import { IDENTITY, getTitle } from "@/types/database";
import type { OttpObject } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useEas } from "@/hooks/use-eas";
import { publishObject } from "@/lib/eas/operations";
import { getSchemaUids, schemasReady } from "@/lib/eas/config";
import type { Hex } from "viem";

const objectTypes = [
  {
    identity: IDENTITY.PROJECT,
    label: "Project",
    description: "A container for scopes and work",
  },
  {
    identity: IDENTITY.SCOPE,
    label: "Scope",
    description: "A definition of work needed or proposed",
  },
  {
    identity: IDENTITY.WORK,
    label: "Work",
    description: "Something you built, wrote, or produced",
  },
];

function NewObjectForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { subject } = useOttp();
  const { walletClient, publicClient, ensureChain } = useEas("base");

  const presetParent = searchParams.get("parent");
  const presetLinkTo = searchParams.get("linkTo");
  const presetType = searchParams.get("type");

  const [selectedType, setSelectedType] = useState(
    presetType || IDENTITY.PROJECT
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Parent project picker state
  const [projects, setProjects] = useState<OttpObject[]>([]);
  const [projectFilter, setProjectFilter] = useState("");
  const [selectedParentId, setSelectedParentId] = useState<string | null>(
    presetParent
  );
  const [selectedLinkTo, setSelectedLinkTo] = useState<string | null>(
    presetLinkTo
  );

  // Post-create publish state
  const [createdObject, setCreatedObject] = useState<OttpObject | null>(null);
  const [publishing, setPublishing] = useState(false);

  // Load user's projects for the picker
  useEffect(() => {
    if (!subject) return;
    getObjectsByOwner(subject.id, IDENTITY.PROJECT).then(setProjects);
  }, [subject]);

  const showParentPicker =
    selectedType === IDENTITY.SCOPE || selectedType === IDENTITY.WORK;

  const filteredProjects = projects.filter((p) =>
    getTitle(p).toLowerCase().includes(projectFilter.toLowerCase())
  );

  if (!subject) {
    return (
      <div className="mt-12 text-center text-zinc-500">
        Connect your wallet and register to create objects.
      </div>
    );
  }

  // Post-create publish prompt
  if (createdObject) {
    const canPublish = schemasReady() && walletClient && publicClient;
    return (
      <div className="max-w-lg mx-auto text-center">
        <h1 className="text-lg font-semibold text-zinc-100 mb-2">Created!</h1>
        <p className="text-sm text-zinc-400 mb-6">
          {getTitle(createdObject)} has been created.
          {canPublish && " Publish to Base now?"}
        </p>
        {canPublish && (
          <Button
            onClick={async () => {
              setPublishing(true);
              try {
                await ensureChain();
                const uids = getSchemaUids();
                await publishObject(
                  walletClient,
                  publicClient,
                  createdObject,
                  uids.object as Hex,
                  subject.onchain_uid,
                  null,
                  "base"
                );
                router.push(`/o/${createdObject.id}`);
              } catch {
                // On error, just navigate to the object page
                router.push(`/o/${createdObject.id}`);
              }
            }}
            disabled={publishing}
            className="mr-2"
          >
            {publishing ? "Publishing..." : "Publish Now"}
          </Button>
        )}
        <Button
          variant="ghost"
          onClick={() => router.push(`/o/${createdObject.id}`)}
          disabled={publishing}
        >
          {canPublish ? "Later" : "View Object"}
        </Button>
      </div>
    );
  }

  function handleProjectSelect(projectId: string) {
    if (selectedType === IDENTITY.SCOPE) {
      setSelectedParentId(projectId);
      setSelectedLinkTo(null);
    } else if (selectedType === IDENTITY.WORK) {
      setSelectedLinkTo(projectId);
      setSelectedParentId(null);
    }
  }

  const activeProjectId =
    selectedType === IDENTITY.SCOPE ? selectedParentId : selectedLinkTo;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !subject) return;

    setLoading(true);
    setError("");

    try {
      const parentId =
        selectedType === IDENTITY.SCOPE ? selectedParentId : undefined;
      const linkToId =
        selectedType === IDENTITY.WORK ? selectedLinkTo : undefined;

      const obj = await createObject(
        subject.id,
        {
          identity: selectedType,
          title: title.trim(),
          description: description.trim(),
        },
        parentId ?? undefined
      );

      if (linkToId) {
        await createLink({
          sourceObjectId: obj.id,
          targetObjectId: linkToId,
          metadata: { intent: "submission" },
          createdBySubjectId: subject.id,
        });
      }

      setCreatedObject(obj);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-lg font-semibold text-zinc-100 mb-6">Create</h1>

      <div className="flex gap-2 mb-6">
        {objectTypes.map((t) => (
          <button
            key={t.identity}
            onClick={() => {
              setSelectedType(t.identity);
              // Reset parent/link selections when switching types
              if (t.identity === IDENTITY.PROJECT) {
                setSelectedParentId(null);
                setSelectedLinkTo(null);
              }
            }}
            className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
              selectedType === t.identity
                ? "bg-zinc-100 text-zinc-900"
                : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <p className="text-xs text-zinc-500 mb-4">
        {objectTypes.find((t) => t.identity === selectedType)?.description}
      </p>

      {/* Parent project picker */}
      {showParentPicker && (
        <div className="mb-6">
          <label className="block text-sm text-zinc-400 mb-2">
            {selectedType === IDENTITY.SCOPE
              ? "Parent Project"
              : "Link to Project"}
          </label>
          <Input
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            placeholder="Search projects..."
            className="bg-zinc-900 border-zinc-700 text-zinc-100 mb-2"
          />
          {filteredProjects.length === 0 ? (
            <p className="text-xs text-zinc-600">No projects found.</p>
          ) : (
            <div className="grid gap-2 max-h-48 overflow-y-auto">
              {filteredProjects.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleProjectSelect(p.id)}
                  className={`text-left p-2 rounded-md border text-sm transition-colors ${
                    activeProjectId === p.id
                      ? "border-zinc-400 bg-zinc-800 text-zinc-100"
                      : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-600"
                  }`}
                >
                  {getTitle(p)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-zinc-400 mb-1">Title</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What are you creating?"
            className="bg-zinc-900 border-zinc-700 text-zinc-100"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm text-zinc-400 mb-1">
            Description
          </label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe it..."
            rows={4}
            className="bg-zinc-900 border-zinc-700 text-zinc-100"
            disabled={loading}
          />
        </div>

        {selectedLinkTo && (
          <p className="text-xs text-zinc-500">
            This will be linked to the target project for review.
          </p>
        )}

        <Button type="submit" disabled={loading || !title.trim()}>
          {loading ? "Creating..." : "Create"}
        </Button>

        {error && <p className="text-sm text-red-400">{error}</p>}
      </form>
    </div>
  );
}

export default function NewObjectPage() {
  return (
    <Suspense fallback={<div className="mt-12 text-center text-zinc-500">Loading...</div>}>
      <NewObjectForm />
    </Suspense>
  );
}
