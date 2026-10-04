-- VentureOS Phase 12 security hardening
-- RLS helper functions are internal policy helpers, not public application RPC endpoints.

revoke execute on function public.ventureos_has_workspace_access(uuid) from anon;
revoke execute on function public.ventureos_has_workspace_write_access(uuid) from anon;
grant execute on function public.ventureos_has_workspace_access(uuid) to authenticated;
grant execute on function public.ventureos_has_workspace_write_access(uuid) to authenticated;
