"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useOttp } from "@/contexts/ottp-context";
import { createObject, createLink } from "@/lib/data";
import { IDENTITY } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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

  const parentId = searchParams.get("parent");
  const linkTo = searchParams.get("linkTo");
  const presetType = searchParams.get("type");

  const [selectedType, setSelectedType] = useState(
    presetType || IDENTITY.PROJECT
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!subject) {
    return (
      <div className="mt-12 text-center text-zinc-500">
        Connect your wallet and register to create objects.
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !subject) return;

    setLoading(true);
    setError("");

    try {
      const obj = await createObject(
        subject.id,
        {
          identity: selectedType,
          title: title.trim(),
          description: description.trim(),
        },
        parentId ?? undefined
      );

      if (linkTo) {
        await createLink({
          sourceObjectId: obj.id,
          targetObjectId: linkTo,
          metadata: { intent: "submission" },
          createdBySubjectId: subject.id,
        });
      }

      router.push(`/o/${obj.id}`);
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
            onClick={() => setSelectedType(t.identity)}
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

        {linkTo && (
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
