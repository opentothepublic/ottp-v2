import { encodeAbiParameters, parseAbiParameters, type Hex } from "viem";
import { ZERO_BYTES32 } from "./contracts";
import type { Subject, OttpObject, Block, Link } from "@/types/database";

// ============================================
// ENCODE SUBJECT
// ============================================

export function encodeSubjectData(subject: Subject): Hex {
  return encodeAbiParameters(
    parseAbiParameters("string name, string metadata"),
    [subject.name, JSON.stringify(subject.metadata)]
  );
}

// ============================================
// ENCODE OBJECT
// ============================================

export function encodeObjectData(
  object: OttpObject,
  ownerOnchainUid?: string | null,
  parentOnchainUid?: string | null
): Hex {
  return encodeAbiParameters(
    parseAbiParameters(
      "bytes32 ownerSubject, bytes32 parentObject, string metadata"
    ),
    [
      (ownerOnchainUid as `0x${string}`) || ZERO_BYTES32,
      (parentOnchainUid as `0x${string}`) || ZERO_BYTES32,
      JSON.stringify(object.metadata),
    ]
  );
}

// ============================================
// ENCODE BLOCK
// ============================================

export function encodeBlockData(block: Block): Hex {
  return encodeAbiParameters(
    parseAbiParameters(
      "string content, string contentType, string slot, string metadata"
    ),
    [
      block.content,
      block.content_type,
      block.slot || "",
      JSON.stringify(block.metadata),
    ]
  );
}

// ============================================
// ENCODE LINK
// ============================================

export function encodeLinkData(
  link: Link,
  sourceOnchainUid?: string | null,
  targetOnchainUid?: string | null
): Hex {
  // For links, source/target UIDs refer to the onchain attestation UIDs
  // of the source and target objects/subjects
  return encodeAbiParameters(
    parseAbiParameters("bytes32 sourceUid, bytes32 targetUid, string metadata"),
    [
      (sourceOnchainUid as `0x${string}`) || ZERO_BYTES32,
      (targetOnchainUid as `0x${string}`) || ZERO_BYTES32,
      JSON.stringify({
        ...link.metadata,
        status: link.status,
        source_object_id: link.source_object_id,
        source_subject_id: link.source_subject_id,
        target_object_id: link.target_object_id,
        target_subject_id: link.target_subject_id,
      }),
    ]
  );
}
