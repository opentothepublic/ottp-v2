import type { Hex } from "viem";

// Schema UIDs are set after one-time registration via /setup page.
// Store them as environment variables.

export function getSchemaUids(): {
  subject: Hex | null;
  object: Hex | null;
  block: Hex | null;
  link: Hex | null;
} {
  return {
    subject: (process.env.NEXT_PUBLIC_EAS_SCHEMA_SUBJECT as Hex) || null,
    object: (process.env.NEXT_PUBLIC_EAS_SCHEMA_OBJECT as Hex) || null,
    block: (process.env.NEXT_PUBLIC_EAS_SCHEMA_BLOCK as Hex) || null,
    link: (process.env.NEXT_PUBLIC_EAS_SCHEMA_LINK as Hex) || null,
  };
}

export function schemasReady(): boolean {
  const uids = getSchemaUids();
  return !!(uids.subject && uids.object && uids.link);
}
