-- VentureOS Phase 10 hardening: execution concurrency and artifact idempotency
create unique index if not exists idx_vos_execution_active_product
  on public.ventureos_execution_runs(product_id)
  where status in ('queued','running');

create unique index if not exists idx_vos_execution_artifact_dedupe
  on public.ventureos_execution_artifacts(run_key,artifact_type,path,content_hash)
  where path is not null and content_hash is not null;