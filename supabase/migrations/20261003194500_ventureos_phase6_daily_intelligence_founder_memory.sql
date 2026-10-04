-- VentureOS Phase 6: Daily Intelligence + Founder Memory
create table if not exists public.ventureos_founder_profiles (
  id bigserial primary key, founder_key text not null unique default 'primary', display_name text, role text, bio text,
  capabilities text[] not null default '{}', markets text[] not null default '{}', preferred_business_models text[] not null default '{}',
  distribution_strengths text[] not null default '{}', technical_capabilities text[] not null default '{}',
  goals jsonb not null default '{}'::jsonb, preferences jsonb not null default '{}'::jsonb, metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(), created_at timestamptz not null default now()
);
create table if not exists public.ventureos_founder_preferences (
  id bigserial primary key, founder_key text not null default 'primary', category text not null, preference_key text not null,
  value jsonb not null default '{}'::jsonb, weight numeric not null default 1, confidence numeric not null default 50,
  source_type text not null default 'manual', source_id text, status text not null default 'active',
  last_reinforced_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(founder_key,category,preference_key)
);
create table if not exists public.ventureos_founder_decisions (
  id bigserial primary key, founder_key text not null default 'primary', decision_type text not null, subject_type text not null,
  subject_id text, title text not null, rationale text, tags text[] not null default '{}', outcome text,
  metadata jsonb not null default '{}'::jsonb, decided_at timestamptz not null default now(), created_at timestamptz not null default now()
);
create table if not exists public.ventureos_founder_lessons (
  id bigserial primary key, founder_key text not null default 'primary', title text not null, lesson text not null, category text,
  confidence numeric not null default 60, source_type text not null default 'manual', source_id text,
  status text not null default 'active', learned_at timestamptz not null default now(), created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.ventureos_founder_memory (
  id bigserial primary key, founder_key text not null default 'primary', memory_type text not null, title text not null, content text not null,
  structured_value jsonb not null default '{}'::jsonb, importance numeric not null default 50, confidence numeric not null default 60,
  source_type text not null default 'manual', source_id text, last_accessed_at timestamptz, expires_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.ventureos_daily_snapshots (
  id bigserial primary key, founder_key text not null default 'primary', snapshot_date date not null, status text not null default 'draft',
  generated_at timestamptz not null default now(), headline text, executive_summary text,
  what_changed jsonb not null default '[]'::jsonb, accelerating_problems jsonb not null default '[]'::jsonb,
  demand_shifts jsonb not null default '[]'::jsonb, attention_items jsonb not null default '[]'::jsonb,
  opportunity_highlights jsonb not null default '[]'::jsonb, counts jsonb not null default '{}'::jsonb,
  source_refs jsonb not null default '{}'::jsonb, delta jsonb not null default '{}'::jsonb, founder_context jsonb not null default '{}'::jsonb,
  previous_snapshot_date date, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(founder_key,snapshot_date)
);
create table if not exists public.ventureos_daily_snapshot_items (
  id bigserial primary key, snapshot_id bigint not null references public.ventureos_daily_snapshots(id) on delete cascade,
  item_type text not null, title text not null, summary text not null, change_score numeric not null default 0,
  confidence numeric not null default 0, status text not null default 'observed', reference_id text, reference_type text,
  evidence_ids bigint[] not null default '{}', metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create table if not exists public.ventureos_daily_processing_runs (
  id bigserial primary key, run_id text not null unique, founder_key text not null default 'primary', snapshot_date date not null,
  status text not null default 'running', market_events_count integer not null default 0, problem_clusters_count integer not null default 0,
  opportunities_count integer not null default 0, decisions_count integer not null default 0, memories_retrieved integer not null default 0,
  items_created integer not null default 0, error text, started_at timestamptz not null default now(), completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);
create index if not exists idx_vos_founder_preferences_key on public.ventureos_founder_preferences(founder_key,category,status);
create index if not exists idx_vos_founder_decisions_date on public.ventureos_founder_decisions(founder_key,decided_at desc);
create index if not exists idx_vos_founder_lessons_date on public.ventureos_founder_lessons(founder_key,learned_at desc);
create index if not exists idx_vos_founder_memory_type on public.ventureos_founder_memory(founder_key,memory_type,importance desc);
create index if not exists idx_vos_daily_snapshots_date on public.ventureos_daily_snapshots(founder_key,snapshot_date desc);
create index if not exists idx_vos_daily_items_snapshot on public.ventureos_daily_snapshot_items(snapshot_id,item_type);
create index if not exists idx_vos_daily_runs_date on public.ventureos_daily_processing_runs(founder_key,snapshot_date desc);
alter table public.ventureos_founder_profiles enable row level security;
alter table public.ventureos_founder_preferences enable row level security;
alter table public.ventureos_founder_decisions enable row level security;
alter table public.ventureos_founder_lessons enable row level security;
alter table public.ventureos_founder_memory enable row level security;
alter table public.ventureos_daily_snapshots enable row level security;
alter table public.ventureos_daily_snapshot_items enable row level security;
alter table public.ventureos_daily_processing_runs enable row level security;
