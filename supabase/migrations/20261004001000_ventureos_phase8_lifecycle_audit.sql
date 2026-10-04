-- Phase 8 product lifecycle creation audit
create or replace function public.ventureos_product_lifecycle_insert_audit()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.ventureos_product_lifecycle_history(
    product_id,from_status,to_status,reason,changed_by,metadata
  ) values (
    new.id,null,coalesce(new.status,'ideas'),'Product created in Product Factory','product_factory',
    jsonb_build_object('source','product_factory','product_key',new.product_key)
  );
  return new;
end;
$$;

drop trigger if exists trg_ventureos_product_lifecycle_insert_audit on public.ventureos_products;
create trigger trg_ventureos_product_lifecycle_insert_audit
after insert on public.ventureos_products
for each row
execute function public.ventureos_product_lifecycle_insert_audit();
