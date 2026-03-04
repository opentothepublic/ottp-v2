// Types matching the OTTP v2 minimal schema
// Three primitives: Subject, Object, Link
// Plus Blocks (content) and Activity Log

export interface Subject {
  id: string;
  onchain_uid: string | null;
  wallet_address: string;
  name: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface OttpObject {
  id: string;
  onchain_uid: string | null;
  owner_subject_id: string;
  parent_object_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Block {
  id: string;
  onchain_uid: string | null;
  parent_object_id: string | null;
  parent_subject_id: string | null;
  content: string;
  content_type: string;
  slot: string | null;
  metadata: Record<string, unknown>;
  created_by_subject_id: string;
  is_current: boolean;
  supersedes_block_id: string | null;
  created_at: string;
}

export interface Link {
  id: string;
  onchain_uid: string | null;
  source_object_id: string | null;
  source_subject_id: string | null;
  target_object_id: string | null;
  target_subject_id: string | null;
  metadata: Record<string, unknown>;
  status: "unverified" | "verified" | "rejected";
  confirmation_link_id: string | null;
  created_by_subject_id: string;
  created_at: string;
}

export interface ActivityLogEntry {
  id: string;
  action: string;
  actor_subject_id: string;
  target_object_id: string | null;
  target_subject_id: string | null;
  target_link_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// Identity plugin constants
export const IDENTITY = {
  PROJECT: "ottp.identity.project",
  SCOPE: "ottp.identity.scope",
  WORK: "ottp.identity.work",
  PLUGIN: "ottp.identity.plugin",
  USER: "ottp.identity.user-profile",
  AGENT: "ottp.identity.agent-profile",
  TEAM: "ottp.identity.team-profile",
} as const;

// Helper to get identity from object metadata
export function getIdentity(obj: OttpObject): string {
  return (obj.metadata?.identity as string) ?? "";
}

export function getTitle(obj: OttpObject): string {
  return (obj.metadata?.title as string) ?? "Untitled";
}

export function getDescription(obj: OttpObject): string {
  return (obj.metadata?.description as string) ?? "";
}

// Joined types for queries
export interface OttpObjectWithOwner extends OttpObject {
  owner: Subject;
}

export interface LinkWithDetails extends Link {
  source_object?: OttpObject | null;
  source_subject?: Subject | null;
  target_object?: OttpObject | null;
  target_subject?: Subject | null;
  created_by?: Subject | null;
}

// Database type for Supabase client
export interface Database {
  public: {
    Tables: {
      subjects: {
        Row: Subject;
        Insert: Partial<Pick<Subject, "id">> & Omit<Subject, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Subject, "id" | "created_at">>;
      };
      objects: {
        Row: OttpObject;
        Insert: Partial<Pick<OttpObject, "id">> & Omit<OttpObject, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<OttpObject, "id" | "created_at">>;
      };
      blocks: {
        Row: Block;
        Insert: Partial<Pick<Block, "id">> & Omit<Block, "id" | "created_at">;
        Update: Partial<Omit<Block, "id" | "created_at">>;
      };
      links: {
        Row: Link;
        Insert: Partial<Pick<Link, "id">> & Omit<Link, "id" | "created_at">;
        Update: Partial<Omit<Link, "id" | "created_at">>;
      };
      activity_log: {
        Row: ActivityLogEntry;
        Insert: Partial<Pick<ActivityLogEntry, "id">> & Omit<ActivityLogEntry, "id" | "created_at">;
        Update: Partial<Omit<ActivityLogEntry, "id" | "created_at">>;
      };
    };
  };
}
