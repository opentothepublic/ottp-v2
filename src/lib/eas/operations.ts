import type { Hex, Address } from "viem";
import {
  EAS_CONTRACTS,
  EAS_ABI,
  SCHEMA_REGISTRY_ABI,
  ZERO_BYTES32,
  ZERO_ADDRESS,
  NO_EXPIRATION,
  type EasChain,
} from "./contracts";

// We use `any` for client types because wagmi's useWalletClient/usePublicClient
// return clients with account already bound, but viem's strict types
// require explicit account in writeContract params.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyWalletClient = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPublicClient = any;
import {
  encodeSubjectData,
  encodeObjectData,
  encodeBlockData,
  encodeLinkData,
} from "./encode";
import { supabase } from "@/lib/supabase";
import type { Subject, OttpObject, Block, Link } from "@/types/database";

// ============================================
// SCHEMA REGISTRATION
// ============================================

export async function registerSchema(
  walletClient: AnyWalletClient,
  schema: string,
  revocable: boolean,
  chain: EasChain = "base"
): Promise<Hex> {
  const contracts = EAS_CONTRACTS[chain];

  const hash = await walletClient.writeContract({
    address: contracts.schemaRegistry,
    abi: SCHEMA_REGISTRY_ABI,
    functionName: "register",
    args: [schema, ZERO_ADDRESS, revocable],
    chain: walletClient.chain,
  });

  return hash;
}

// ============================================
// SINGLE ATTESTATION
// ============================================

export async function createAttestation(
  walletClient: AnyWalletClient,
  params: {
    schemaUid: Hex;
    data: Hex;
    recipient?: Address;
    refUID?: Hex;
    revocable?: boolean;
  },
  chain: EasChain = "base"
): Promise<Hex> {
  const contracts = EAS_CONTRACTS[chain];

  const hash = await walletClient.writeContract({
    address: contracts.eas,
    abi: EAS_ABI,
    functionName: "attest",
    args: [
      {
        schema: params.schemaUid,
        data: {
          recipient: params.recipient || ZERO_ADDRESS,
          expirationTime: NO_EXPIRATION,
          revocable: params.revocable ?? true,
          refUID: params.refUID || ZERO_BYTES32,
          data: params.data,
          value: 0n,
        },
      },
    ],
    chain: walletClient.chain,
  });

  return hash;
}

// ============================================
// BATCH ATTESTATION
// ============================================

export async function createBatchAttestations(
  walletClient: AnyWalletClient,
  requests: Array<{
    schemaUid: Hex;
    items: Array<{
      data: Hex;
      recipient?: Address;
      refUID?: Hex;
    }>;
  }>,
  chain: EasChain = "base"
): Promise<Hex> {
  const contracts = EAS_CONTRACTS[chain];

  const multiRequests = requests.map((req) => ({
    schema: req.schemaUid,
    data: req.items.map((item) => ({
      recipient: item.recipient || ZERO_ADDRESS,
      expirationTime: NO_EXPIRATION,
      revocable: true,
      refUID: item.refUID || ZERO_BYTES32,
      data: item.data,
      value: 0n,
    })),
  }));

  const hash = await walletClient.writeContract({
    address: contracts.eas,
    abi: EAS_ABI,
    functionName: "multiAttest",
    args: [multiRequests],
    chain: walletClient.chain,
  });

  return hash;
}

// ============================================
// WAIT FOR ATTESTATION UID FROM TX RECEIPT
// ============================================

// The EAS contract emits: event Attested(address indexed recipient, address indexed attester, bytes32 uid, bytes32 indexed schemaUid)
// We use viem's parseEventLogs to reliably decode the UID.

import { parseEventLogs } from "viem";

export function extractAttestationUids(logs: Array<{ topics: Hex[]; data: Hex; address?: string }>): Hex[] {
  const parsed = parseEventLogs({
    abi: EAS_ABI,
    eventName: "Attested",
    logs: logs as Parameters<typeof parseEventLogs>[0]["logs"],
  });
  return parsed.map((log) => (log.args as { uid: Hex }).uid);
}

// ============================================
// PUBLISH SUBJECT ONCHAIN
// ============================================

export async function publishSubject(
  walletClient: AnyWalletClient,
  publicClient: AnyPublicClient,
  subject: Subject,
  schemaUid: Hex,
  chain: EasChain = "base"
): Promise<{ txHash: Hex; uid: Hex }> {
  const data = encodeSubjectData(subject);

  const hash = await createAttestation(
    walletClient,
    { schemaUid, data },
    chain
  );

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  const uids = extractAttestationUids(receipt.logs as Array<{ topics: Hex[]; data: Hex }>);

  if (uids.length === 0) throw new Error("No attestation UID found in receipt");

  const uid = uids[0];

  // Update Supabase with onchain UID
  await supabase
    .from("subjects")
    .update({ onchain_uid: `${chain}:${uid}` })
    .eq("id", subject.id);

  return { txHash: hash, uid };
}

// ============================================
// PUBLISH OBJECT ONCHAIN
// ============================================

export async function publishObject(
  walletClient: AnyWalletClient,
  publicClient: AnyPublicClient,
  object: OttpObject,
  schemaUid: Hex,
  ownerOnchainUid?: string | null,
  parentOnchainUid?: string | null,
  chain: EasChain = "base"
): Promise<{ txHash: Hex; uid: Hex }> {
  const data = encodeObjectData(object, ownerOnchainUid, parentOnchainUid);

  // If the owner has an onchain UID, use it as refUID to create a chain
  const ownerRef = ownerOnchainUid
    ? (ownerOnchainUid.split(":").pop() as Hex)
    : undefined;

  const hash = await createAttestation(
    walletClient,
    { schemaUid, data, refUID: ownerRef },
    chain
  );

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  const uids = extractAttestationUids(receipt.logs as Array<{ topics: Hex[]; data: Hex }>);

  if (uids.length === 0) throw new Error("No attestation UID found in receipt");

  const uid = uids[0];

  await supabase
    .from("objects")
    .update({ onchain_uid: `${chain}:${uid}` })
    .eq("id", object.id);

  return { txHash: hash, uid };
}

// ============================================
// PUBLISH LINK ONCHAIN
// ============================================

export async function publishLink(
  walletClient: AnyWalletClient,
  publicClient: AnyPublicClient,
  link: Link,
  schemaUid: Hex,
  sourceOnchainUid?: string | null,
  targetOnchainUid?: string | null,
  chain: EasChain = "base"
): Promise<{ txHash: Hex; uid: Hex }> {
  const data = encodeLinkData(link, sourceOnchainUid, targetOnchainUid);

  // If there's a target onchain UID, reference it
  const targetRef = targetOnchainUid
    ? (targetOnchainUid.split(":").pop() as Hex)
    : undefined;

  const hash = await createAttestation(
    walletClient,
    { schemaUid, data, refUID: targetRef },
    chain
  );

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  const uids = extractAttestationUids(receipt.logs as Array<{ topics: Hex[]; data: Hex }>);

  if (uids.length === 0) throw new Error("No attestation UID found in receipt");

  const uid = uids[0];

  await supabase
    .from("links")
    .update({ onchain_uid: `${chain}:${uid}` })
    .eq("id", link.id);

  return { txHash: hash, uid };
}

// ============================================
// BATCH PUBLISH ALL UNPUBLISHED
// ============================================

export interface BatchPublishResult {
  subjects: number;
  objects: number;
  links: number;
  txHash: Hex | null;
  error?: string;
}

export async function getUnpublishedCounts(subjectId: string): Promise<{
  subjects: number;
  objects: number;
  links: number;
  total: number;
}> {
  // Check if the subject itself is unpublished
  const { data: subj } = await supabase
    .from("subjects")
    .select("onchain_uid")
    .eq("id", subjectId)
    .single();
  const subjectCount = subj && !subj.onchain_uid ? 1 : 0;

  // Count unpublished objects owned by this subject
  const { count: objCount } = await supabase
    .from("objects")
    .select("*", { count: "exact", head: true })
    .eq("owner_subject_id", subjectId)
    .is("onchain_uid", null);

  // Count unpublished links created by this subject
  const { count: linkCount } = await supabase
    .from("links")
    .select("*", { count: "exact", head: true })
    .eq("created_by_subject_id", subjectId)
    .is("onchain_uid", null);

  const subjects = subjectCount;
  const objects = objCount ?? 0;
  const links = linkCount ?? 0;

  return {
    subjects,
    objects,
    links,
    total: subjects + objects + links,
  };
}

export async function batchPublishAll(
  walletClient: AnyWalletClient,
  publicClient: AnyPublicClient,
  subjectId: string,
  schemaUids: {
    subject: Hex;
    object: Hex;
    link: Hex;
  },
  chain: EasChain = "base"
): Promise<BatchPublishResult> {
  const result: BatchPublishResult = {
    subjects: 0,
    objects: 0,
    links: 0,
    txHash: null,
  };

  try {
    // 1. Publish subject first (if not already published)
    const { data: subject } = await supabase
      .from("subjects")
      .select("*")
      .eq("id", subjectId)
      .single();

    if (!subject) throw new Error("Subject not found");

    if (!subject.onchain_uid) {
      const { uid } = await publishSubject(
        walletClient,
        publicClient,
        subject,
        schemaUids.subject,
        chain
      );
      subject.onchain_uid = `${chain}:${uid}`;
      result.subjects = 1;
    }

    // 2. Publish all unpublished objects
    const { data: objects } = await supabase
      .from("objects")
      .select("*")
      .eq("owner_subject_id", subjectId)
      .is("onchain_uid", null)
      .order("created_at", { ascending: true });

    if (objects && objects.length > 0) {
      for (const obj of objects) {
        // Look up parent's onchain UID if it has a parent
        let parentUid: string | null = null;
        if (obj.parent_object_id) {
          const { data: parent } = await supabase
            .from("objects")
            .select("onchain_uid")
            .eq("id", obj.parent_object_id)
            .single();
          parentUid = parent?.onchain_uid ?? null;
        }

        const { uid } = await publishObject(
          walletClient,
          publicClient,
          obj,
          schemaUids.object,
          subject.onchain_uid,
          parentUid,
          chain
        );
        obj.onchain_uid = `${chain}:${uid}`;
        result.objects++;
      }
    }

    // 3. Publish all unpublished links
    const { data: links } = await supabase
      .from("links")
      .select("*")
      .eq("created_by_subject_id", subjectId)
      .is("onchain_uid", null)
      .order("created_at", { ascending: true });

    if (links && links.length > 0) {
      for (const link of links) {
        // Resolve source and target onchain UIDs
        let sourceUid: string | null = null;
        let targetUid: string | null = null;

        if (link.source_object_id) {
          const { data: src } = await supabase
            .from("objects")
            .select("onchain_uid")
            .eq("id", link.source_object_id)
            .single();
          sourceUid = src?.onchain_uid ?? null;
        }
        if (link.target_object_id) {
          const { data: tgt } = await supabase
            .from("objects")
            .select("onchain_uid")
            .eq("id", link.target_object_id)
            .single();
          targetUid = tgt?.onchain_uid ?? null;
        }

        await publishLink(
          walletClient,
          publicClient,
          link,
          schemaUids.link,
          sourceUid,
          targetUid,
          chain
        );
        result.links++;
      }
    }

    return result;
  } catch (err) {
    result.error = err instanceof Error ? err.message : "Publish failed";
    return result;
  }
}
