-- OTTP v2 Core Schema
-- Three primitives: Subject, Object, Link
-- Everything else is Blocks and Plugins
--
-- Run this in the Supabase SQL Editor

-- ============================================
-- SUBJECTS
-- ============================================
-- An actor: human, team, or AI agent.
-- Type/role is determined by plugin blocks, not by enum.

CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  onchain_uid TEXT UNIQUE,              -- EAS attestation UID (null until published)
  wallet_address TEXT NOT NULL,         -- Identity anchor
  name TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}', -- Extensible: bio, pfp, links, agent model, operator, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_subjects_wallet ON public.subjects(wallet_address);
CREATE INDEX idx_subjects_onchain ON public.subjects(onchain_uid);

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Subjects are publicly readable"
  ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Anyone can register a subject"
  ON public.subjects FOR INSERT WITH CHECK (true);
CREATE POLICY "Subjects can update their own record"
  ON public.subjects FOR UPDATE USING (true);

-- ============================================
-- OBJECTS
-- ============================================
-- A thing: project, scope, work, plugin, or anything else.
-- What kind of thing is determined by plugin blocks, not by enum.
-- Objects nest via parent_object_id.

CREATE TABLE public.objects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  onchain_uid TEXT UNIQUE,
  owner_subject_id UUID NOT NULL REFERENCES public.subjects(id),
  parent_object_id UUID REFERENCES public.objects(id),
  metadata JSONB NOT NULL DEFAULT '{}', -- Extensible: title, description, tags, config, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_objects_owner ON public.objects(owner_subject_id);
CREATE INDEX idx_objects_parent ON public.objects(parent_object_id);
CREATE INDEX idx_objects_onchain ON public.objects(onchain_uid);

ALTER TABLE public.objects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Objects are publicly readable"
  ON public.objects FOR SELECT USING (true);
CREATE POLICY "Anyone can create objects"
  ON public.objects FOR INSERT WITH CHECK (true);
CREATE POLICY "Objects can be updated"
  ON public.objects FOR UPDATE USING (true);

-- ============================================
-- BLOCKS
-- ============================================
-- Content or behavior attached to a Subject or Object.
-- Regular content: slot is NULL (descriptions, readmes, evidence, media).
-- Plugin config: slot is a category name (identity, permissions, state, economics, integration).

CREATE TABLE public.blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  onchain_uid TEXT UNIQUE,
  parent_object_id UUID REFERENCES public.objects(id) ON DELETE CASCADE,
  parent_subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  content_type TEXT NOT NULL DEFAULT 'text',  -- text, url, ipfs_hash, github_ref, encrypted
  slot TEXT,                                   -- NULL for content; 'identity', 'permissions', 'state', 'economics', 'integration' for plugins
  metadata JSONB NOT NULL DEFAULT '{}',        -- Plugin ref, config, version, etc.
  created_by_subject_id UUID NOT NULL REFERENCES public.subjects(id),
  is_current BOOLEAN NOT NULL DEFAULT true,
  supersedes_block_id UUID REFERENCES public.blocks(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT block_has_parent CHECK (parent_object_id IS NOT NULL OR parent_subject_id IS NOT NULL)
);

CREATE INDEX idx_blocks_object ON public.blocks(parent_object_id);
CREATE INDEX idx_blocks_subject ON public.blocks(parent_subject_id);
CREATE INDEX idx_blocks_slot ON public.blocks(slot) WHERE slot IS NOT NULL;
CREATE INDEX idx_blocks_current ON public.blocks(parent_object_id, is_current) WHERE is_current = true;
CREATE INDEX idx_blocks_onchain ON public.blocks(onchain_uid);

ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Blocks are publicly readable"
  ON public.blocks FOR SELECT USING (true);
CREATE POLICY "Anyone can create blocks"
  ON public.blocks FOR INSERT WITH CHECK (true);
CREATE POLICY "Blocks can be updated"
  ON public.blocks FOR UPDATE USING (true);

-- ============================================
-- LINKS
-- ============================================
-- A connection between any two entities.
-- 1-way (unverified) or 2-way (verified via confirmation link).
-- All meaning comes from metadata.

CREATE TABLE public.links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  onchain_uid TEXT UNIQUE,
  source_object_id UUID REFERENCES public.objects(id),
  source_subject_id UUID REFERENCES public.subjects(id),
  target_object_id UUID REFERENCES public.objects(id),
  target_subject_id UUID REFERENCES public.subjects(id),
  metadata JSONB NOT NULL DEFAULT '{}',  -- Context, notes, intent, link semantics
  status TEXT NOT NULL DEFAULT 'unverified',  -- unverified, verified, rejected
  confirmation_link_id UUID REFERENCES public.links(id),
  created_by_subject_id UUID NOT NULL REFERENCES public.subjects(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT link_has_source CHECK (source_object_id IS NOT NULL OR source_subject_id IS NOT NULL),
  CONSTRAINT link_has_target CHECK (target_object_id IS NOT NULL OR target_subject_id IS NOT NULL)
);

CREATE INDEX idx_links_source_object ON public.links(source_object_id);
CREATE INDEX idx_links_source_subject ON public.links(source_subject_id);
CREATE INDEX idx_links_target_object ON public.links(target_object_id);
CREATE INDEX idx_links_target_subject ON public.links(target_subject_id);
CREATE INDEX idx_links_status ON public.links(status);
CREATE INDEX idx_links_onchain ON public.links(onchain_uid);

ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Links are publicly readable"
  ON public.links FOR SELECT USING (true);
CREATE POLICY "Anyone can create links"
  ON public.links FOR INSERT WITH CHECK (true);
CREATE POLICY "Links can be updated"
  ON public.links FOR UPDATE USING (true);

-- ============================================
-- ACTIVITY LOG
-- ============================================

CREATE TABLE public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  actor_subject_id UUID NOT NULL REFERENCES public.subjects(id),
  target_object_id UUID REFERENCES public.objects(id),
  target_subject_id UUID REFERENCES public.subjects(id),
  target_link_id UUID REFERENCES public.links(id),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_actor ON public.activity_log(actor_subject_id);
CREATE INDEX idx_activity_time ON public.activity_log(created_at DESC);

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Activity is publicly readable"
  ON public.activity_log FOR SELECT USING (true);
CREATE POLICY "Anyone can log activity"
  ON public.activity_log FOR INSERT WITH CHECK (true);

-- ============================================
-- UPDATED_AT TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_subjects_updated_at
  BEFORE UPDATE ON public.subjects FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_objects_updated_at
  BEFORE UPDATE ON public.objects FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
