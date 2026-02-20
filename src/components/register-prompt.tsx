"use client";

import { useState } from "react";
import { useOttp } from "@/contexts/ottp-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function RegisterPrompt() {
  const { register } = useOttp();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    try {
      await register(name.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    }
    setLoading(false);
  }

  return (
    <div className="max-w-md mx-auto mt-24 p-6">
      <h2 className="text-lg font-semibold text-zinc-100 mb-2">
        Welcome to OTTP
      </h2>
      <p className="text-sm text-zinc-400 mb-6">
        Your wallet is connected. Choose a name to register as a Subject and
        start collaborating.
      </p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="bg-zinc-900 border-zinc-700 text-zinc-100"
          disabled={loading}
        />
        <Button type="submit" disabled={loading || !name.trim()}>
          {loading ? "..." : "Register"}
        </Button>
      </form>
      {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
    </div>
  );
}
