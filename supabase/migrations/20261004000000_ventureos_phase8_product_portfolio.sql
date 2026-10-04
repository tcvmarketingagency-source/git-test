-- VentureOS Phase 8: Product Portfolio
alter table public.ventureos_products
  add column if not exists current_phase text not null default 'Research',
  add column if not exists progress integer not null default 0,
  add column if not exists customer_count integer not null default 0,
  add column if not exists mrr numeric(14,2) not null default 0,
  add column if not exists api_cost numeric(14,2) not null default 0,
  add column if not exists gross_margin numeric(14,2) not null default 0,
  add column if not exists repository_url text,
  add column if not exists deployment_url text,
  add column if not exists launch_url text,
  add column if not exists next_milestone text,
  add column if not exists last_transition_at timestamptz;
update public.ventureos_products set status='ideas',current_phase='Research',progress=0 where status='draft';
create table if not exists public.ventureos_product_lifecycle_history(
 id bigserial primary key,product_id bigint not null references public.ventureos_products(id) on delete cascade,
 from_status text,to_status text not null,reason text,changed_by text not null default 'founder',
 metadata jsonb not null default '{}'::jsonb,created_at timestamptz not null default now()
);
create table if not exists public.ventureos_product_metrics(
 id bigserial primary key,product_id bigint not null references public.ventureos_products(id) on delete cascade,
 metric_date date not null,customer_count integer not null default 0,mrr numeric(14,2) not null default 0,
 api_cost numeric(14,2) not null default 0,gross_margin numeric(14,2) not null default 0,
 activation_rate numeric(7,2) not null default 0,retention_rate numeric(7,2) not null default 0,
 metadata jsonb not null default '{}'::jsonb,created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),unique(product_id,metric_date)
);
create index if not exists idx_vos_product_lifecycle_product on public.ventureos_product_lifecycle_history(product_id,created_at desc);
create index if not exists idx_vos_product_metrics_product_date on public.ventureos_product_metrics(product_id,metric_date desc);
create index if not exists idx_vos_products_lifecycle on public.ventureos_products(status,progress);
alter table public.ventureos_product_lifecycle_history enable row level security;
alter table public.ventureos_product_metrics enable row level security;
