"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useEas } from "@/hooks/use-eas";
import { registerSchema, OTTP_SCHEMAS, type OttpSchemaName, EAS_CONTRACTS } from "@/lib/eas";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Hex } from "viem";

interface SchemaResult {
  name: string;
  txHash: Hex;
}

export default function SetupPage() {
  const { isConnected } = useAccount();
  const { walletClient, publicClient, ensureChain, explorerUrl } = useEas("base");
  const [results, setResults] = useState<SchemaResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uids, setUids] = useState<Record<string, string>>({});

  async function handleRegisterAll() {
    if (!walletClient || !publicClient) return;
    setLoading(true);
    setError("");
    setResults([]);
    setUids({});

    try {
      await ensureChain();

      const schemaNames: OttpSchemaName[] = [
        "subject",
        "object",
        "block",
        "link",
      ];

      for (const name of schemaNames) {
        const schema = OTTP_SCHEMAS[name];

        const txHash = await registerSchema(
          walletClient,
          schema.schema,
          schema.revocable,
          "base"
        );

        // Wait for receipt to get the schema UID from logs
        const receipt = await publicClient.waitForTransactionReceipt({
          hash: txHash,
        });

        // SchemaRegistry emits Registered(bytes32 indexed uid, address indexed registerer)
        // The UID is topics[1]
        let uid = "";
        for (const log of receipt.logs) {
          if (log.topics.length >= 2) {
            uid = log.topics[1] || "";
            break;
          }
        }

        setResults((prev) => [...prev, { name, txHash }]);
        if (uid) {
          setUids((prev) => ({ ...prev, [name]: uid }));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    }

    setLoading(false);
  }

  if (!isConnected) {
    return (
      <div className="mt-12 text-center text-zinc-500">
        Connect your wallet to register schemas.
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-lg font-semibold text-zinc-100 mb-2">
        Schema Setup
      </h1>
      <p className="text-sm text-zinc-500 mb-6">
        One-time registration of OTTP schemas on EAS (Base mainnet). This
        registers 4 schemas: subject, object, block, and link.
      </p>

      <div className="space-y-3 mb-6">
        {(Object.entries(OTTP_SCHEMAS) as [OttpSchemaName, typeof OTTP_SCHEMAS[OttpSchemaName]][]).map(
          ([name, schema]) => (
            <div
              key={name}
              className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/50"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-zinc-200">
                  ottp.{name}
                </span>
                {uids[name] && (
                  <Badge variant="verified">registered</Badge>
                )}
              </div>
              <code className="text-xs text-zinc-500 block break-all">
                {schema.schema}
              </code>
              {uids[name] && (
                <code className="text-xs text-emerald-400 block mt-1 break-all">
                  UID: {uids[name]}
                </code>
              )}
            </div>
          )
        )}
      </div>

      <Button
        onClick={handleRegisterAll}
        disabled={loading || !walletClient}
      >
        {loading ? "Registering..." : "Register All Schemas on Base"}
      </Button>

      {error && <p className="text-sm text-red-400 mt-3">{error}</p>}

      {Object.keys(uids).length > 0 && (
        <div className="mt-8 p-4 rounded-lg border border-zinc-700 bg-zinc-900">
          <h2 className="text-sm font-medium text-zinc-300 mb-2">
            Add these to your .env.local and Vercel:
          </h2>
          <pre className="text-xs text-zinc-400 whitespace-pre-wrap break-all">
            {uids.subject &&
              `NEXT_PUBLIC_EAS_SCHEMA_SUBJECT=${uids.subject}\n`}
            {uids.object &&
              `NEXT_PUBLIC_EAS_SCHEMA_OBJECT=${uids.object}\n`}
            {uids.block && `NEXT_PUBLIC_EAS_SCHEMA_BLOCK=${uids.block}\n`}
            {uids.link && `NEXT_PUBLIC_EAS_SCHEMA_LINK=${uids.link}\n`}
          </pre>
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-4">
          <h2 className="text-sm font-medium text-zinc-400 mb-2">
            Transactions
          </h2>
          {results.map((r) => (
            <div key={r.name} className="text-xs text-zinc-500 mb-1">
              {r.name}:{" "}
              <a
                href={`https://basescan.org/tx/${r.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                {r.txHash.slice(0, 16)}...
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
