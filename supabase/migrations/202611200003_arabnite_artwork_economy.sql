-- Arabnite: economia delle bustine artwork e premio unico di Adli.
-- Le carte reali restano separate dagli artwork sbloccati nell'album.

create table if not exists public.sognatore_arabnite_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  coins bigint not null default 0 check (coins >= 0),
  default_packs integer not null default 0 check (default_packs >= 0),
  discovered_artwork_ids text[] not null default '{}',
  duplicate_artwork_count integer not null default 0 check (duplicate_artwork_count >= 0),
  adli_reward_claimed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sognatore_arabnite_pack_pickups (
  user_id uuid not null references auth.users(id) on delete cascade,
  pickup_id text not null,
  claimed_at timestamptz not null default now(),
  primary key(user_id, pickup_id)
);

create table if not exists public.sognatore_arabnite_jar_claims (
  user_id uuid not null references auth.users(id) on delete cascade,
  cycle_index integer not null check (cycle_index >= 0),
  jar_slot integer not null check (jar_slot between 1 and 5),
  claimed_at timestamptz not null default now(),
  primary key(user_id, cycle_index, jar_slot)
);

alter table public.sognatore_arabnite_progress enable row level security;
alter table public.sognatore_arabnite_pack_pickups enable row level security;
alter table public.sognatore_arabnite_jar_claims enable row level security;

drop policy if exists "Arabnite progress owner read" on public.sognatore_arabnite_progress;
create policy "Arabnite progress owner read" on public.sognatore_arabnite_progress for select to authenticated using (user_id = auth.uid());
revoke insert, update, delete on public.sognatore_arabnite_progress from anon, authenticated;
revoke all on public.sognatore_arabnite_pack_pickups from anon, authenticated;
revoke all on public.sognatore_arabnite_jar_claims from anon, authenticated;

alter table public.sognatore_wallets alter column coins set default 0;

create or replace function public.sognatore_arabnite_get_progress()
returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_user uuid := auth.uid(); v_row public.sognatore_arabnite_progress%rowtype;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  insert into public.sognatore_arabnite_progress(user_id) values(v_user) on conflict do nothing;
  select * into v_row from public.sognatore_arabnite_progress where user_id=v_user;
  return jsonb_build_object(
    'coins',v_row.coins,'default_packs',v_row.default_packs,
    'discovered_artwork_ids',v_row.discovered_artwork_ids,
    'duplicate_artwork_count',v_row.duplicate_artwork_count,
    'adli_reward_claimed',v_row.adli_reward_claimed
  );
end $$;

create or replace function public.sognatore_arabnite_collect_pack(p_pickup_id text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_user uuid := auth.uid(); v_added integer;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_pickup_id is null or length(p_pickup_id)>100 then raise exception 'INVALID_PICKUP'; end if;
  insert into public.sognatore_arabnite_progress(user_id) values(v_user) on conflict do nothing;
  insert into public.sognatore_arabnite_pack_pickups(user_id,pickup_id) values(v_user,p_pickup_id) on conflict do nothing;
  get diagnostics v_added = row_count;
  if v_added=1 then
    update public.sognatore_arabnite_progress set default_packs=default_packs+1,updated_at=now() where user_id=v_user;
  end if;
  return public.sognatore_arabnite_get_progress();
end $$;

create or replace function public.sognatore_arabnite_open_default_pack()
returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_user uuid := auth.uid(); v_card_id text; v_new boolean; v_progress public.sognatore_arabnite_progress%rowtype;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  insert into public.sognatore_arabnite_progress(user_id) values(v_user) on conflict do nothing;
  select * into v_progress from public.sognatore_arabnite_progress where user_id=v_user for update;
  if v_progress.default_packs<1 then raise exception 'NO_DEFAULT_PACKS'; end if;
  select d.card_id into v_card_id
  from public.sognatore_card_definitions d
  where not (d.card_id = any(v_progress.discovered_artwork_ids))
  order by random() limit 1;
  v_new := v_card_id is not null;
  update public.sognatore_arabnite_progress
  set default_packs=default_packs-1,
      discovered_artwork_ids=case when v_new then array_append(discovered_artwork_ids,v_card_id) else discovered_artwork_ids end,
      duplicate_artwork_count=duplicate_artwork_count+case when v_new then 0 else 1 end,
      updated_at=now()
  where user_id=v_user;
  if not v_new then
    select d.card_id into v_card_id from public.sognatore_card_definitions d order by random() limit 1;
  end if;
  return jsonb_build_object('card_id',v_card_id,'is_new',v_new,'progress',public.sognatore_arabnite_get_progress());
end $$;

create or replace function public.sognatore_arabnite_buy_default_pack()
returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_user uuid := auth.uid(); v_coins bigint;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  insert into public.sognatore_arabnite_progress(user_id) values(v_user) on conflict do nothing;
  select coins into v_coins from public.sognatore_arabnite_progress where user_id=v_user for update;
  if v_coins<60 then raise exception 'INSUFFICIENT_COINS'; end if;
  update public.sognatore_arabnite_progress set coins=coins-60,default_packs=default_packs+1,updated_at=now() where user_id=v_user;
  return public.sognatore_arabnite_get_progress();
end $$;

create or replace function public.sognatore_arabnite_sell_duplicate()
returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  insert into public.sognatore_arabnite_progress(user_id) values(v_user) on conflict do nothing;
  update public.sognatore_arabnite_progress
  set duplicate_artwork_count=duplicate_artwork_count-1,coins=coins+1,updated_at=now()
  where user_id=v_user and duplicate_artwork_count>0;
  if not found then raise exception 'NO_DUPLICATE_ARTWORK'; end if;
  return public.sognatore_arabnite_get_progress();
end $$;

create or replace function public.sognatore_arabnite_claim_jar(p_cycle_index integer,p_jar_slot integer)
returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_user uuid := auth.uid(); v_added integer;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_cycle_index<0 or (p_cycle_index=0 and p_jar_slot not between 1 and 5) or (p_cycle_index>0 and p_jar_slot<>1) then raise exception 'INVALID_JAR';
  end if;
  insert into public.sognatore_arabnite_progress(user_id) values(v_user) on conflict do nothing;
  insert into public.sognatore_arabnite_jar_claims(user_id,cycle_index,jar_slot)
  values(v_user,p_cycle_index,p_jar_slot) on conflict do nothing;
  get diagnostics v_added = row_count;
  if v_added=1 then
    update public.sognatore_arabnite_progress set coins=coins+1,updated_at=now() where user_id=v_user;
  end if;
  return public.sognatore_arabnite_get_progress();
end $$;

create or replace function public.sognatore_adli_claim_reward()
returns table(card_instance_id uuid,card_id text,serial_number smallint)
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_user uuid := auth.uid(); v_progress public.sognatore_arabnite_progress%rowtype; v_card record; v_count integer:=0;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  insert into public.sognatore_arabnite_progress(user_id) values(v_user) on conflict do nothing;
  select * into v_progress from public.sognatore_arabnite_progress where user_id=v_user for update;
  if v_progress.adli_reward_claimed then raise exception 'ADLI_REWARD_ALREADY_CLAIMED'; end if;
  if cardinality(v_progress.discovered_artwork_ids)<>64 then raise exception 'ALBUM_NOT_COMPLETE'; end if;
  perform pg_advisory_xact_lock(hashtext('sognatore_pack_pool'));
  if (select count(*) from public.sognatore_card_instances where owner_id is null)<3 then raise exception 'PACK_POOL_EXHAUSTED'; end if;
  update public.sognatore_arabnite_progress set adli_reward_claimed=true,updated_at=now() where user_id=v_user;
  for v_card in
    select i.id,i.card_id,i.serial_number from public.sognatore_card_instances i
    where i.owner_id is null order by random() limit 3 for update skip locked
  loop
    update public.sognatore_card_instances set owner_id=v_user where id=v_card.id;
    insert into public.sognatore_card_transactions(card_instance_id,to_user_id,transaction_type)
    values(v_card.id,v_user,'PACK');
    card_instance_id:=v_card.id; card_id:=v_card.card_id; serial_number:=v_card.serial_number;
    v_count:=v_count+1; return next;
  end loop;
  if v_count<>3 then raise exception 'PACK_POOL_EXHAUSTED'; end if;
end $$;

revoke all on function public.sognatore_arabnite_get_progress() from public;
revoke all on function public.sognatore_arabnite_collect_pack(text) from public;
revoke all on function public.sognatore_arabnite_open_default_pack() from public;
revoke all on function public.sognatore_arabnite_buy_default_pack() from public;
revoke all on function public.sognatore_arabnite_sell_duplicate() from public;
revoke all on function public.sognatore_arabnite_claim_jar(integer,integer) from public;
revoke all on function public.sognatore_adli_claim_reward() from public;
grant execute on function public.sognatore_arabnite_get_progress() to authenticated;
grant execute on function public.sognatore_arabnite_collect_pack(text) to authenticated;
grant execute on function public.sognatore_arabnite_open_default_pack() to authenticated;
grant execute on function public.sognatore_arabnite_buy_default_pack() to authenticated;
grant execute on function public.sognatore_arabnite_sell_duplicate() to authenticated;
grant execute on function public.sognatore_arabnite_claim_jar(integer,integer) to authenticated;
grant execute on function public.sognatore_adli_claim_reward() to authenticated;
