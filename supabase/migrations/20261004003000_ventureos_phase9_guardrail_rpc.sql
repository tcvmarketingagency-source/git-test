-- VentureOS Phase 9 guardrail RPC hardening
create or replace function public.ventureos_reserve_credits(
  p_account_key text,p_amount numeric,p_reason text default null,p_source text default 'system',
  p_reference_id text default null,p_request_id text default null
) returns jsonb language plpgsql security definer as $$
declare a public.ventureos_credit_accounts;tx bigint;ratio numeric:=0;today_consumed numeric:=0;
begin
 if p_amount<=0 then raise exception 'Reservation amount must be positive'; end if;
 select * into a from public.ventureos_credit_accounts where account_key=p_account_key for update;
 if not found then raise exception 'Credit account not found'; end if;
 select coalesce(sum(amount),0) into today_consumed from public.ventureos_credit_transactions
 where account_id=a.id and type='CONSUME' and created_at>=date_trunc('day',now());
 if a.daily_limit>0 and today_consumed+p_amount>a.daily_limit then raise exception 'Daily hard stop reached'; end if;
 if a.monthly_limit>0 then ratio=((a.consumed_balance+a.reserved_balance+p_amount)/a.monthly_limit)*100;if ratio>=a.hard_stop_percent then raise exception 'Monthly hard stop reached';end if;end if;
 if a.balance<p_amount then raise exception 'Insufficient available credits'; end if;
 update public.ventureos_credit_accounts set balance=balance-p_amount,reserved_balance=reserved_balance+p_amount,updated_at=now() where id=a.id;
 insert into public.ventureos_credit_transactions(account_id,type,amount,reason,source,reference_id,request_id)
 values(a.id,'RESERVE',p_amount,p_reason,p_source,p_reference_id,p_request_id) returning id into tx;
 return jsonb_build_object('ok',true,'transaction_id',tx,'reserved',p_amount,'balance',a.balance-p_amount,'reserved_balance',a.reserved_balance+p_amount,'daily_consumed',today_consumed);
end;$$;

create or replace function public.ventureos_consume_credits(
  p_account_key text,p_amount numeric,p_reservation_id text default null,p_reason text default null,
  p_source text default 'system',p_reference_id text default null,p_request_id text default null
) returns jsonb language plpgsql security definer as $$
declare a public.ventureos_credit_accounts;tx bigint;using_reserved boolean:=false;next_balance numeric;next_reserved numeric;next_consumed numeric;
begin
 if p_amount<=0 then raise exception 'Consume amount must be positive'; end if;
 select * into a from public.ventureos_credit_accounts where account_key=p_account_key for update;
 if not found then raise exception 'Credit account not found'; end if;
 if a.reserved_balance>=p_amount then using_reserved=true;
 elsif p_reservation_id is not null then raise exception 'Reserved balance is lower than consume amount';
 elsif a.balance>=p_amount then using_reserved=false;
 else raise exception 'Insufficient available credits'; end if;
 if using_reserved then next_balance:=a.balance;next_reserved:=a.reserved_balance-p_amount;
 else next_balance:=a.balance-p_amount;next_reserved:=a.reserved_balance;end if;
 next_consumed:=a.consumed_balance+p_amount;
 update public.ventureos_credit_accounts set balance=next_balance,reserved_balance=next_reserved,consumed_balance=next_consumed,updated_at=now() where id=a.id;
 insert into public.ventureos_credit_transactions(account_id,type,amount,reason,source,reference_id,request_id)
 values(a.id,'CONSUME',p_amount,p_reason,p_source,coalesce(p_reference_id,p_reservation_id),p_request_id) returning id into tx;
 return jsonb_build_object('ok',true,'transaction_id',tx,'consumed',p_amount,'balance',next_balance,'reserved_balance',next_reserved,'consumed_balance',next_consumed);
end;$$;
