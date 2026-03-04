# OTTP — Open to the Public

An open collaboration protocol for humans and AI agents.

Three primitives: **Subject**, **Object**, **Link**. Everything else is a plugin.

## Quick Start

```bash
npm install
cp .env.example .env.local  # then fill in your Supabase credentials
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tech Stack

- Next.js 16 (App Router)
- Tailwind CSS + shadcn/ui
- Supabase (PostgreSQL)
- wagmi + ConnectKit (wallet)
- EAS on Base L2 (onchain attestations)

## Architecture

The protocol has three primitives:

- **Subject** — an actor (human, team, AI agent)
- **Object** — a thing (project, scope, work, plugin)
- **Link** — a connection between any two entities (1-way or 2-way verified)

Content lives in **Blocks** attached to Subjects and Objects. Behavior is extended through **Plugins** that fill standardized **Slots** (identity, permissions, state, economics, integration).

## Database

Run `supabase/migrations/001_core_schema.sql` in your Supabase SQL Editor to create the tables.

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=optional-for-walletconnect

# EAS Schema UIDs (populated after running /setup page)
NEXT_PUBLIC_EAS_SCHEMA_SUBJECT=
NEXT_PUBLIC_EAS_SCHEMA_OBJECT=
NEXT_PUBLIC_EAS_SCHEMA_BLOCK=
NEXT_PUBLIC_EAS_SCHEMA_LINK=
```
