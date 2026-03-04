"use client";

import { useState } from "react";
import { useOttp } from "@/contexts/ottp-context";
import { createLink } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface AttestButtonProps {
  targetObjectId: string;
  targetOwnerId: string;
  onAttested?: () => void;
}

export function AttestButton({
  targetObjectId,
  targetOwnerId,
  onAttested,
}: AttestButtonProps) {
  const { subject } = useOttp();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (!subject) return null;

  // Don't show attest on your own objects
  if (subject.id === targetOwnerId) return null;

  async function handleAttest() {
    if (!subject) return;
    setLoading(true);

    try {
      await createLink({
        sourceSubjectId: subject.id,
        targetObjectId,
        metadata: {
          intent: "attestation",
          note: note.trim() || undefined,
        },
        createdBySubjectId: subject.id,
      });
      setDone(true);
      setOpen(false);
      onAttested?.();
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  }

  if (done) {
    return (
      <span className="text-xs text-emerald-400">
        ✓ Attested — pending verification
      </span>
    );
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Attest
      </Button>
    );
  }

  return (
    <div className="p-3 rounded-lg border border-zinc-700 bg-zinc-900/50 space-y-2">
      <p className="text-xs text-zinc-400">
        Create an attestation link to this object. The owner will be notified
        and can verify your attestation, creating a 2-way link.
      </p>
      <Textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Add a note (optional) — endorsement, reference, flag..."
        rows={2}
        className="bg-zinc-900 border-zinc-700 text-zinc-100 text-sm"
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={handleAttest} disabled={loading}>
          {loading ? "..." : "Submit Attestation"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setOpen(false);
            setNote("");
          }}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
