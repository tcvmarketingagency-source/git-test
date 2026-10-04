-- VentureOS Phase 10: Execution Layer
alter table public.ventureos_products
  add column if not exists execution_status text not null default 'not_started',
  add column if not exists repository_name text,
  add column if not exists repository_owner text,
  add column if not exists figma_file_url text,
  add column if not exists execution_supabase_project_ref text,
  add column if not exists vercel_project_id text,
  add column if not exists execution_last_run text;
create table if not exists public.ventureos_execution_runs(
 id bigserial primary key,run_key text not null unique,product_id bigint not null references public.ventureos_products(id) on delete cascade,
 mode text not null default 'dry_run',status text not null default 'queued',repository_url text,figma_url text,
 supabase_project_ref text,vercel_project_id text,deployment_url text,requested_by text not null default 'founder',
 metadata jsonb not null default '{}'::jsonb,error text,started_at timestamptz,completed_at timestamptz,created_at timestamptz not null default now()
);
create table if not exists public.ventureos_execution_steps(
 id bigserial primary key,run_key text not null references public.ventureos_execution_runs(run_key) on delete cascade,
 step_key text not null,provider text not null default 'ventureos',order_index integer not null,
 status text not null default 'pending',idempotency_key text not null unique,input jsonb not null default '{}'::jsonb,
 output jsonb not null default '{}'::jsonb,error text,started_at timestamptz,completed_at timestamptz,created_at timestamptz not null default now(),
 unique(run_key,step_key)
);
create table if not exists public.ventureos_execution_artifacts(
 id bigserial primary key,run_key text not null references public.ventureos_execution_runs(run_key) on delete cascade,
 artifact_type text not null,title text not null,path text,content text,content_hash text,external_url text,
 status text not null default 'generated',metadata jsonb not null default '{}'::jsonb,created_at timestamptz not null default now()
);
create index if not exists idx_vos_execution_runs_product on public.ventureos_execution_runs(product_id,created_at desc);
create index if not exists idx_vos_execution_steps_run on public.ventureos_execution_steps(run_key,order_index);
create index if not exists idx_vos_execution_artifacts_run on public.ventureos_execution_artifacts(run_key,created_at desc);
alter table public.ventureos_execution_runs enable row level security;
alter table public.ventureos_execution_steps enable row level security;
alter table public.ventureos_execution_artifacts enable row level security;