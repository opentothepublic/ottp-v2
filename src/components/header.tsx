"use client";

import Link from "next/link";
import { ConnectKitButton } from "connectkit";
import { useOttp } from "@/contexts/ottp-context";
import { useAccount } from "wagmi";

export function Header() {
  const { subject } = useOttp();
  const { isConnected } = useAccount();

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-sm font-bold tracking-tight text-zinc-100 hover:text-white transition-colors"
          >
            OTTP
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/explore"
              className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Explore
            </Link>
            {subject && (
              <>
                <Link
                  href="/new"
                  className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  Create
                </Link>
                <Link
                  href="/activity"
                  className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  Activity
                </Link>
              </>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {isConnected && subject && (
            <Link
              href={`/s/${subject.id}`}
              className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              {subject.name || "Profile"}
            </Link>
          )}
          <ConnectKitButton />
        </div>
      </div>
    </header>
  );
}
