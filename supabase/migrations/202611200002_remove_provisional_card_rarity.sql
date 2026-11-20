-- Remove provisional rarity tiers: every unowned copy has the same chance to be drawn.
-- Run this migration in Supabase SQL Editor after deploying the matching frontend commit.

drop function if exists public.sognatore_open_pack(text);

alter table public.sognatore_card_instances
  drop column if exists rarity;

create or replace function public.sognatore_open_pack(p_kind text default 'standard')
returns table(card_instance_id uuid, card_id text, serial_number smallint)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_price integer;
  v_wallet bigint;
  v_card record;
  v_drawn integer := 0;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_kind not in ('standard','premium','rare') then raise exception 'INVALID_PACK'; end if;

  -- Keep existing pack prices for now; all packs draw from the same undifferentiated pool.
  v_price := case p_kind when 'standard' then 30 when 'premium' then 65 else 110 end;

  perform pg_advisory_xact_lock(hashtext('sognatore_pack_pool'));

  insert into public.sognatore_wallets(user_id)
    values(v_user) on conflict do nothing;

  select coins into v_wallet
  from public.sognatore_wallets
  where user_id = v_user
  for update;

  if v_wallet < v_price then raise exception 'INSUFFICIENT_COINS'; end if;

  if (select count(*) from public.sognatore_card_instances where owner_id is null) < 3 then
    raise exception 'PACK_POOL_EXHAUSTED';
  end if;

  update public.sognatore_wallets
  set coins = coins - v_price, updated_at = now()
  where user_id = v_user;

  for v_card in
    select i.id, i.card_id, i.serial_number
    from public.sognatore_card_instances i
    where i.owner_id is null
    order by random()
    limit 3
    for update skip locked
  loop
    update public.sognatore_card_instances
    set owner_id = v_user
    where id = v_card.id;

    insert into public.sognatore_card_transactions(card_instance_id,to_user_id,transaction_type)
      values(v_card.id,v_user,'PACK');

    card_instance_id := v_card.id;
    card_id := v_card.card_id;
    serial_number := v_card.serial_number;
    v_drawn := v_drawn + 1;
    return next;
  end loop;

  if v_drawn <> 3 then
    raise exception 'PACK_POOL_EXHAUSTED';
  end if;
end;
$$;

grant execute on function public.sognatore_open_pack(text) to authenticated;
