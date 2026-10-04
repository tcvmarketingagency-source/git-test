-- VentureOS Phase 9: Cost OS + Unified Billing
-- Source contract: internal credits, provider usage/cost ledger, budgets, guardrails and billing abstraction.
create table if not exists public.ventureos_subscriptions (
 id bigserial primary key,account_key text not null default 'primary',plan_id text not null default 'founder',
 status text not null default 'unconfigured',payment_provider text,external_customer_id text,external_subscription_id text,
 monthly_amount numeric(14,2) not null default 0,currency text not null default 'INR',
 current_period_start timestamptz,current_period_end timestamptz,metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table if not exists public.ventureos_credit_accounts (
 id bigserial primary key,account_key text not null unique default 'primary',status text not null default 'unconfigured',
 monthly_limit numeric(14,2) not null default 0,daily_limit numeric(14,2) not null default 0,balance numeric(14,2) not null default 0,
 reserved_balance numeric(14,2) not null default 0,consumed_balance numeric(14,2) not null default 0,
 alert_percent numeric(5,2) not null default 75,warning_percent numeric(5,2) not null default 85,
 soft_stop_percent numeric(5,2) not null default 90,hard_stop_percent numeric(5,2) not null default 100,
 period_start date not null default current_date,period_end date not null default (current_date+interval '30 days')::date,
 metadata jsonb not null default '{}'::jsonb,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table if not exists public.ventureos_credit_transactions (
 id bigserial primary key,account_id bigint not null references public.ventureos_credit_accounts(id) on delete cascade,
 type text not null,amount numeric(14,2) not null,reason text,source text,reference_id text,request_id text,provider text,
 opportunity_id bigint references public.ventureos_opportunities(id) on delete set null,
 product_id bigint references public.ventureos_products(id) on delete set null,
 metadata jsonb not null default '{}'::jsonb,created_at timestamptz not null default now()
);
create table if not exists public.ventureos_providers (
 id bigserial primary key,provider_key text not null unique,display_name text not null,category text not null,
 status text not null default 'available',unit text not null default 'request',pricing jsonb not null default '{}'::jsonb,
 budget_limit numeric(14,2) not null default 0,metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table if not exists public.ventureos_provider_accounts (
 id bigserial primary key,provider_id bigint not null references public.ventureos_providers(id) on delete cascade,
 account_key text not null default 'primary',status text not null default 'not_configured',secret_configured boolean not null default false,
 auto_recharge_enabled boolean not null default false,monthly_limit numeric(14,2) not null default 0,metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(provider_id,account_key)
);
create table if not exists public.ventureos_provider_usage (
 id bigserial primary key,provider_id bigint references public.ventureos_providers(id) on delete set null,
 provider text not null,operation text not null,request_id text,units numeric(18,4) not null default 0,
 actual_cost numeric(14,4) not null default 0,currency text not null default 'INR',
 opportunity_id bigint references public.ventureos_opportunities(id) on delete set null,
 product_id bigint references public.ventureos_products(id) on delete set null,
 category text not null default 'research',metadata jsonb not null default '{}'::jsonb,recorded_at timestamptz not null default now()
);
create table if not exists public.ventureos_cost_budgets (
 id bigserial primary key,account_key text not null default 'primary',period_start date not null,period_end date not null,
 monthly_budget numeric(14,2) not null default 0,consumed numeric(14,2) not null default 0,reserved numeric(14,2) not null default 0,
 forecast numeric(14,2) not null default 0,status text not null default 'healthy',metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(account_key,period_start)
);
create table if not exists public.ventureos_cost_alerts (
 id bigserial primary key,account_key text not null default 'primary',alert_type text not null,
 threshold_percent numeric(5,2) not null,current_percent numeric(5,2) not null default 0,status text not null default 'open',
 message text,triggered_at timestamptz,resolved_at timestamptz,metadata jsonb not null default '{}'::jsonb,created_at timestamptz not null default now()
);
create index if not exists idx_vos_credit_transactions_account_date on public.ventureos_credit_transactions(account_id,created_at desc);
create index if not exists idx_vos_provider_usage_provider_date on public.ventureos_provider_usage(provider,recorded_at desc);
create index if not exists idx_vos_provider_usage_opportunity on public.ventureos_provider_usage(opportunity_id,recorded_at desc);
create index if not exists idx_vos_provider_usage_product on public.ventureos_provider_usage(product_id,recorded_at desc);
create index if not exists idx_vos_cost_alerts_account_date on public.ventureos_cost_alerts(account_key,created_at desc);
insert into public.ventureos_credit_accounts(account_key,status) values ('primary','unconfigured') on conflict (account_key) do nothing;
insert into public.ventureos_providers(provider_key,display_name,category,unit) values
('openai','OpenAI','ai','token'),('tavily','Tavily','search','credit'),('firecrawl','Firecrawl','scraping','credit'),
('exa','Exa','research','request'),('infra','Infrastructure','infrastructure','unit') on conflict(provider_key) do nothing;
insert into public.ventureos_provider_accounts(provider_id,account_key,status,secret_configured)
select id,'primary','not_configured',false from public.ventureos_providers on conflict(provider_id,account_key) do nothing;
