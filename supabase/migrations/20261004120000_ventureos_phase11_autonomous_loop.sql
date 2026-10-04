-- VentureOS Phase 11: Autonomous Loop Control Plane
create table if not exists public.ventureos_autonomous_runs(
  id bigserial primary key,
  run_key text not null unique,
  founder_key text not null default 'primary',
  mode text not null default 'autonomous',
  status text not null default 'queued',
  current_step text,
  selected_opportunity_id bigint references public.ventureos_opportunities(id) on delete set null,
  approved_opportunity_id bigint references public.ventureos_opportunities(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  error text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.ventureos_autonomous_steps(
  id bigserial primary key,
  run_key text not null references public.ventureos_autonomous_runs(run_key) on delete cascade,
  step_key text not null,
  order_index integer not null,
  status text not null default 'pending',
  output jsonb not null default '{}'::jsonb,
  error text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(run_key,step_key)
);
create table if not exists public.ventureos_autonomous_policies(
  id bigserial primary key,
  founder_key text not null unique default 'primary',
  enabled boolean not null default true,
  schedule_enabled boolean not null default true,
  cadence_hours integer not null default 24,
  minimum_opportunity_score numeric(5,2) not null default 75,
  max_products_per_run integer not null default 1,
  require_approval_for_product boolean not null default true,
  require_approval_for_execution boolean not null default true,
  daily_budget_percent numeric(5,2) not null default 25,
  updated_at timestamptz not null default now()
);
create table if not exists public.ventureos_autonomous_events(
  id bigserial primary key,
  run_key text references public.ventureos_autonomous_runs(run_key) on delete cascade,
  event_type text not null,
  stage text,
  message text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create unique index if not exists idx_vos_autonomous_active
  on public.ventureos_autonomous_runs(founder_key)
  where status in ('queued','running','awaiting_approval');
create index if not exists idx_vos_autonomous_runs_created on public.ventureos_autonomous_runs(founder_key,created_at desc);
create index if not exists idx_vos_autonomous_steps_run on public.ventureos_autonomous_steps(run_key,order_index);
create index if not exists idx_vos_autonomous_events_run on public.ventureos_autonomous_events(run_key,created_at desc);
create index if not exists idx_vos_autonomous_events_date on public.ventureos_autonomous_events(created_at desc);
alter table public.ventureos_autonomous_runs enable row level security;
alter table public.ventureos_autonomous_steps enable row level security;
alter table public.ventureos_autonomous_policies enable row level security;
alter table public.ventureos_autonomous_events enable row level security;
insert into public.ventureos_autonomous_policies(founder_key) values('primary') on conflict(founder_key) do nothing;