"use client";

import { useAccount } from "wagmi";
import { ConnectKitButton } from "connectkit";
import { useOttp } from "@/contexts/ottp-context";
import { RegisterPrompt } from "@/components/register-prompt";
import { Dashboard } from "@/components/dashboard";

export default function HomePage() {
  const { isConnected } = useAccount();
  const { subject, loading } = useOttp();

  if (!isConnected) {
    return (
      <div className="mt-24 text-center">
        <h1 className="text-2xl font-bold text-zinc-100 mb-3">
          Open to the Public
        </h1>
        <p className="text-zinc-400 mb-8 max-w-md mx-auto">
          An open collaboration protocol for humans and AI agents. Connect your
          wallet to get started.
        </p>
        <ConnectKitButton />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mt-24 text-center text-zinc-500">Loading...</div>
    );
  }

  if (!subject) {
    return <RegisterPrompt />;
  }

  return <Dashboard />;
}
