-- VentureOS identity cleanup: migrate the founder workspace out of the legacy Revenue OS name
update public.workspaces
set name='VentureOS',
    slug=coalesce(nullif(slug,''),'ventureos')
where id='ab769736-0d12-493e-a716-922dc7fd9f0e';

create or replace function public.handle_new_user_workspace()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare wid uuid;
begin
  insert into public.workspaces(owner_id,name,slug)
  values(
    new.id,
    'VentureOS',
    'ventureos-' || substring(replace(new.id::text,'-','') from 1 for 8)
  )
  returning id into wid;

  insert into public.workspace_members(workspace_id,user_id,role)
  values(wid,new.id,'owner');

  insert into public.business_profiles(workspace_id,business_name)
  values(wid,split_part(coalesce(new.email,''),'@',1));

  return new;
end
$function$;
