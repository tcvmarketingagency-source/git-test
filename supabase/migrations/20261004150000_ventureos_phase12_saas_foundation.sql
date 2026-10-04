-- VentureOS Phase 12: SaaS Foundation + Tenant Security
-- Establishes workspace tenancy across VentureOS data while preserving the existing
-- founder/workspace model used elsewhere in the database.

create or replace function public.ventureos_has_workspace_access(p_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (
      select 1
      from public.workspace_members wm
      where wm.workspace_id = p_workspace_id
        and wm.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.workspaces w
      where w.id = p_workspace_id
        and w.owner_id = auth.uid()
    );
$$;

create or replace function public.ventureos_has_workspace_write_access(p_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = p_workspace_id
      and wm.user_id = auth.uid()
      and wm.role in ('owner','admin','member')
  ) or exists (
    select 1
    from public.workspaces w
    where w.id = p_workspace_id
      and w.owner_id = auth.uid()
  );
$$;

grant execute on function public.ventureos_has_workspace_access(uuid) to authenticated, anon;
grant execute on function public.ventureos_has_workspace_write_access(uuid) to authenticated, anon;

do $$
declare
  t record;
  default_workspace uuid := (
    select id from public.workspaces order by created_at asc limit 1
  );
begin
  if default_workspace is null then
    raise exception 'No workspace exists; Phase 12 cannot backfill VentureOS tenancy';
  end if;

  for t in
    select table_name
    from information_schema.tables
    where table_schema = 'public'
      and table_type = 'BASE TABLE'
      and table_name like 'ventureos_%'
      and table_name <> 'ventureos_providers'
  loop
    execute format(
      'alter table public.%I add column if not exists workspace_id uuid',
      t.table_name
    );

    execute format(
      'update public.%I set workspace_id = $1 where workspace_id is null',
      t.table_name
    ) using default_workspace;

    execute format(
      'alter table public.%I alter column workspace_id set not null',
      t.table_name
    );

    execute format(
      'create index if not exists %I on public.%I(workspace_id)',
      'idx_' || t.table_name || '_workspace',
      t.table_name
    );

    execute format(
      'alter table public.%I enable row level security',
      t.table_name
    );

    execute format(
      'drop policy if exists ventureos_workspace_select on public.%I',
      t.table_name
    );
    execute format(
      'create policy ventureos_workspace_select on public.%I
       for select
       to authenticated
       using (public.ventureos_has_workspace_access(workspace_id))',
      t.table_name
    );

    execute format(
      'drop policy if exists ventureos_workspace_insert on public.%I',
      t.table_name
    );
    execute format(
      'create policy ventureos_workspace_insert on public.%I
       for insert
       to authenticated
       with check (public.ventureos_has_workspace_write_access(workspace_id))',
      t.table_name
    );

    execute format(
      'drop policy if exists ventureos_workspace_update on public.%I',
      t.table_name
    );
    execute format(
      'create policy ventureos_workspace_update on public.%I
       for update
       to authenticated
       using (public.ventureos_has_workspace_write_access(workspace_id))
       with check (public.ventureos_has_workspace_write_access(workspace_id))',
      t.table_name
    );

    execute format(
      'drop policy if exists ventureos_workspace_delete on public.%I',
      t.table_name
    );
    execute format(
      'create policy ventureos_workspace_delete on public.%I
       for delete
       to authenticated
       using (public.ventureos_has_workspace_write_access(workspace_id))',
      t.table_name
    );
  end loop;

  -- Providers are global catalog records; users can read, but only the
  -- server-side service role should mutate provider configuration.
  alter table public.ventureos_providers enable row level security;
  drop policy if exists ventureos_providers_read on public.ventureos_providers;
  create policy ventureos_providers_read
    on public.ventureos_providers
    for select
    to authenticated
    using (auth.uid() is not null);

  -- Namespace legacy founder/account keys by workspace so existing unique
  -- constraints remain safe in a multi-tenant database.
  update public.ventureos_credit_accounts set account_key = default_workspace::text where account_key = 'primary';
  update public.ventureos_subscriptions set account_key = default_workspace::text where account_key = 'primary';
  update public.ventureos_provider_accounts set account_key = default_workspace::text where account_key = 'primary';
  update public.ventureos_cost_alerts set account_key = default_workspace::text where account_key = 'primary';
  update public.ventureos_cost_budgets set account_key = default_workspace::text where account_key = 'primary';

  update public.ventureos_autonomous_policies set founder_key = default_workspace::text where founder_key = 'primary';
  update public.ventureos_autonomous_runs set founder_key = default_workspace::text where founder_key = 'primary';

  update public.ventureos_daily_processing_runs set founder_key = default_workspace::text where founder_key = 'primary';
  update public.ventureos_daily_snapshots set founder_key = default_workspace::text where founder_key = 'primary';
  update public.ventureos_founder_decisions set founder_key = default_workspace::text where founder_key = 'primary';
  update public.ventureos_founder_lessons set founder_key = default_workspace::text where founder_key = 'primary';
  update public.ventureos_founder_memory set founder_key = default_workspace::text where founder_key = 'primary';
  update public.ventureos_founder_preferences set founder_key = default_workspace::text where founder_key = 'primary';
  update public.ventureos_founder_profiles set founder_key = default_workspace::text where founder_key = 'primary';
  update public.ventureos_products set founder_key = default_workspace::text where founder_key = 'primary';
end $$;

comment on column public.ventureos_products.workspace_id is 'Owning SaaS workspace for VentureOS tenancy.';
comment on column public.ventureos_credit_accounts.workspace_id is 'Owning SaaS workspace for billing and intelligence credits.';
comment on column public.ventureos_subscriptions.workspace_id is 'Owning SaaS workspace for subscription state.';
