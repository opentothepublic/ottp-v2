import { supabase } from "./supabase";
import { IDENTITY } from "@/types/database";
import type {
  Subject,
  OttpObject,
  Block,
  Link,
  OttpObjectWithOwner,
} from "@/types/database";

// ============================================
// SUBJECTS
// ============================================

export async function getSubjectByWallet(
  walletAddress: string
): Promise<Subject | null> {
  const { data } = await supabase
    .from("subjects")
    .select("*")
    .eq("wallet_address", walletAddress.toLowerCase())
    .single();
  return data;
}

export async function getSubjectById(id: string): Promise<Subject | null> {
  const { data } = await supabase
    .from("subjects")
    .select("*")
    .eq("id", id)
    .single();
  return data;
}

export async function registerSubject(
  walletAddress: string,
  name: string,
  metadata: Record<string, unknown> = {}
): Promise<Subject> {
  const { data, error } = await supabase
    .from("subjects")
    .insert({
      wallet_address: walletAddress.toLowerCase(),
      name,
      metadata: { identity: IDENTITY.USER, ...metadata },
    })
    .select()
    .single();
  if (error) throw error;

  await logActivity("subject.registered", data.id, {
    target_subject_id: data.id,
  });

  return data;
}

export async function updateSubject(
  id: string,
  updates: { name?: string; metadata?: Record<string, unknown> }
): Promise<Subject> {
  const { data, error } = await supabase
    .from("subjects")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ============================================
// OBJECTS
// ============================================

export async function createObject(
  ownerSubjectId: string,
  metadata: Record<string, unknown>,
  parentObjectId?: string
): Promise<OttpObject> {
  const { data, error } = await supabase
    .from("objects")
    .insert({
      owner_subject_id: ownerSubjectId,
      parent_object_id: parentObjectId ?? null,
      metadata,
    })
    .select()
    .single();
  if (error) throw error;

  await logActivity("object.created", ownerSubjectId, {
    target_object_id: data.id,
  });

  return data;
}

export async function getObjectById(
  id: string
): Promise<OttpObjectWithOwner | null> {
  const { data } = await supabase
    .from("objects")
    .select("*, owner:subjects!owner_subject_id(*)")
    .eq("id", id)
    .single();
  return data as OttpObjectWithOwner | null;
}

export async function getObjectsByIdentity(
  identity: string
): Promise<OttpObjectWithOwner[]> {
  const { data } = await supabase
    .from("objects")
    .select("*, owner:subjects!owner_subject_id(*)")
    .eq("metadata->>identity", identity)
    .order("created_at", { ascending: false });
  return (data as OttpObjectWithOwner[]) ?? [];
}

export async function getObjectsByOwner(
  ownerSubjectId: string,
  identity?: string
): Promise<OttpObject[]> {
  let query = supabase
    .from("objects")
    .select("*")
    .eq("owner_subject_id", ownerSubjectId)
    .order("created_at", { ascending: false });
  if (identity) {
    query = query.eq("metadata->>identity", identity);
  }
  const { data } = await query;
  return data ?? [];
}

export async function getChildObjects(
  parentObjectId: string,
  identity?: string
): Promise<OttpObjectWithOwner[]> {
  let query = supabase
    .from("objects")
    .select("*, owner:subjects!owner_subject_id(*)")
    .eq("parent_object_id", parentObjectId)
    .order("created_at", { ascending: false });
  if (identity) {
    query = query.eq("metadata->>identity", identity);
  }
  const { data } = await query;
  return (data as OttpObjectWithOwner[]) ?? [];
}

export async function updateObject(
  id: string,
  metadata: Record<string, unknown>
): Promise<OttpObject> {
  const { data, error } = await supabase
    .from("objects")
    .update({ metadata })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ============================================
// BLOCKS
// ============================================

export async function createBlock(params: {
  parentObjectId?: string;
  parentSubjectId?: string;
  content: string;
  contentType?: string;
  slot?: string;
  metadata?: Record<string, unknown>;
  createdBySubjectId: string;
}): Promise<Block> {
  const { data, error } = await supabase
    .from("blocks")
    .insert({
      parent_object_id: params.parentObjectId ?? null,
      parent_subject_id: params.parentSubjectId ?? null,
      content: params.content,
      content_type: params.contentType ?? "text",
      slot: params.slot ?? null,
      metadata: params.metadata ?? {},
      created_by_subject_id: params.createdBySubjectId,
      is_current: true,
      supersedes_block_id: null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getBlocksForObject(
  objectId: string,
  currentOnly = true
): Promise<Block[]> {
  let query = supabase
    .from("blocks")
    .select("*")
    .eq("parent_object_id", objectId)
    .order("created_at", { ascending: true });
  if (currentOnly) {
    query = query.eq("is_current", true);
  }
  const { data } = await query;
  return data ?? [];
}

export async function getBlocksForSubject(
  subjectId: string
): Promise<Block[]> {
  const { data } = await supabase
    .from("blocks")
    .select("*")
    .eq("parent_subject_id", subjectId)
    .eq("is_current", true)
    .order("created_at", { ascending: true });
  return data ?? [];
}

// ============================================
// LINKS
// ============================================

export async function createLink(params: {
  sourceObjectId?: string;
  sourceSubjectId?: string;
  targetObjectId?: string;
  targetSubjectId?: string;
  metadata?: Record<string, unknown>;
  createdBySubjectId: string;
}): Promise<Link> {
  const { data, error } = await supabase
    .from("links")
    .insert({
      source_object_id: params.sourceObjectId ?? null,
      source_subject_id: params.sourceSubjectId ?? null,
      target_object_id: params.targetObjectId ?? null,
      target_subject_id: params.targetSubjectId ?? null,
      metadata: params.metadata ?? {},
      status: "unverified",
      confirmation_link_id: null,
      created_by_subject_id: params.createdBySubjectId,
    })
    .select()
    .single();
  if (error) throw error;

  await logActivity("link.created", params.createdBySubjectId, {
    target_link_id: data.id,
  });

  return data;
}

export async function verifyLink(
  linkId: string,
  verifierSubjectId: string
): Promise<Link> {
  // Create the confirmation link (reverse direction)
  const original = await supabase
    .from("links")
    .select("*")
    .eq("id", linkId)
    .single();
  if (!original.data) throw new Error("Link not found");

  const confirmation = await supabase
    .from("links")
    .insert({
      source_object_id: original.data.target_object_id,
      source_subject_id: original.data.target_subject_id,
      target_object_id: original.data.source_object_id,
      target_subject_id: original.data.source_subject_id,
      metadata: { confirms: linkId },
      status: "verified",
      confirmation_link_id: linkId,
      created_by_subject_id: verifierSubjectId,
    })
    .select()
    .single();
  if (confirmation.error) throw confirmation.error;

  // Update original link status
  const { data, error } = await supabase
    .from("links")
    .update({
      status: "verified",
      confirmation_link_id: confirmation.data.id,
    })
    .eq("id", linkId)
    .select()
    .single();
  if (error) throw error;

  await logActivity("link.verified", verifierSubjectId, {
    target_link_id: linkId,
  });

  return data;
}

export async function rejectLink(
  linkId: string,
  rejectorSubjectId: string
): Promise<Link> {
  const { data, error } = await supabase
    .from("links")
    .update({ status: "rejected" })
    .eq("id", linkId)
    .select()
    .single();
  if (error) throw error;

  await logActivity("link.rejected", rejectorSubjectId, {
    target_link_id: linkId,
  });

  return data;
}

export async function getLinksToObject(objectId: string): Promise<Link[]> {
  const { data } = await supabase
    .from("links")
    .select("*")
    .eq("target_object_id", objectId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getLinksFromObject(objectId: string): Promise<Link[]> {
  const { data } = await supabase
    .from("links")
    .select("*")
    .eq("source_object_id", objectId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getPendingLinksForOwner(
  ownerSubjectId: string
): Promise<Link[]> {
  // Get all objects owned by this subject, then find unverified inbound links
  const { data: ownedObjects } = await supabase
    .from("objects")
    .select("id")
    .eq("owner_subject_id", ownerSubjectId);

  if (!ownedObjects?.length) return [];

  const objectIds = ownedObjects.map((o) => o.id);
  const { data } = await supabase
    .from("links")
    .select("*")
    .in("target_object_id", objectIds)
    .eq("status", "unverified")
    .order("created_at", { ascending: false });
  return data ?? [];
}

// ============================================
// ACTIVITY LOG
// ============================================

async function logActivity(
  action: string,
  actorSubjectId: string,
  targets: {
    target_object_id?: string;
    target_subject_id?: string;
    target_link_id?: string;
  } = {},
  metadata: Record<string, unknown> = {}
) {
  await supabase.from("activity_log").insert({
    action,
    actor_subject_id: actorSubjectId,
    target_object_id: targets.target_object_id ?? null,
    target_subject_id: targets.target_subject_id ?? null,
    target_link_id: targets.target_link_id ?? null,
    metadata,
  });
}

export async function getRecentActivity(limit = 50): Promise<ActivityLogEntry[]> {
  const { data } = await supabase
    .from("activity_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

// Re-export the type
import type { ActivityLogEntry } from "@/types/database";
