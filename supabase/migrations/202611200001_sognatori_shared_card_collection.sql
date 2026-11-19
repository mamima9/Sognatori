-- Sognatori: collezione digitale condivisa per Arabnite
-- 64 Sognatori x 100 copie numerate = 6.400 carte uniche.
-- Eseguire nel SQL Editor del progetto Supabase dopo aver verificato il backup.

create extension if not exists pgcrypto;

create table if not exists public.sognatore_card_definitions (
  card_id text primary key,
  display_order integer not null unique check (display_order between 1 and 64),
  created_at timestamptz not null default now()
);

insert into public.sognatore_card_definitions(card_id, display_order) values
('adlimago',1),('cancucc',2),('eroe',3),('nuvobetta',4),
('scroccospell',5),('deb',6),('aragostino',7),('sparkly',8),
('nina',9),('taomarco',10),('riwupido',11),('fourmori',12),
('ginza',13),('dragociocco',14),('tinia',15),('uesditti',16),
('fierononno',17),('long',18),('pepe',19),('cillymbu',20),
('pequeno',21),('cenere',22),('icepadel',23),('pirimar',24),
('spinoff',25),('toasty',26),('shoboshi',27),('eriiro',28),
('elmas',29),('ring-ape',30),('chino',31),('ponte',32),
('roccota',33),('slurpo',34),('riwi',35),('torosucco',36),
('crunchypat',37),('talamos',38),('zibelle',39),('pingcake',40),
('lattelo',41),('muccanza',42),('cardinero',43),('belligonghi-umami',44),
('flame',45),('cocconn',46),('dodo',47),('flypork',48),
('patatos',49),('tartadino',50),('moci-moci',51),('piocino',52),
('talpitrippa',53),('ripple',54),('cervio',55),('gunvallo',56),
('rullino',57),('biglia',58),('brama',59),('lumen',60),
('ponce',61),('sanlegno',62),('trix',63),('vudele',64)
on conflict (card_id) do update set display_order = excluded.display_order;

create table if not exists public.sognatore_card_instances (
  id uuid primary key default gen_random_uuid(),
  card_id text not null references public.sognatore_card_definitions(card_id),
  serial_number smallint not null check (serial_number between 1 and 100),
  rarity text generated always as (
    case when serial_number >= 99 then 'LEGGENDA'
         when serial_number >= 91 then 'EPICA'
         when serial_number >= 71 then 'RARA'
         else 'COMUNE' end
  ) stored,
  owner_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(card_id, serial_number)
);

insert into public.sognatore_card_instances(card_id, serial_number)
select d.card_id, n.serial_number
from public.sognatore_card_definitions d
cross join generate_series(1,100) as n(serial_number)
on conflict (card_id, serial_number) do nothing;

create index if not exists sognatore_instances_owner_idx
  on public.sognatore_card_instances(owner_id, card_id);
create index if not exists sognatore_instances_rarity_idx
  on public.sognatore_card_instances(rarity);

create table if not exists public.sognatore_wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  coins bigint not null default 120 check (coins >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.sognatore_market_listings (
  id uuid primary key default gen_random_uuid(),
  card_instance_id uuid not null references public.sognatore_card_instances(id),
  seller_id uuid not null references auth.users(id) on delete cascade,
  price bigint not null check (price > 0),
  status text not null default 'ACTIVE' check (status in ('ACTIVE','SOLD','CANCELLED')),
  buyer_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create unique index if not exists sognatore_one_active_listing_per_card
  on public.sognatore_market_listings(card_instance_id) where status = 'ACTIVE';
create index if not exists sognatore_market_active_idx
  on public.sognatore_market_listings(status, created_at desc);

create table if not exists public.sognatore_trade_offers (
  id uuid primary key default gen_random_uuid(),
  proposer_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  offered_card_id uuid not null references public.sognatore_card_instances(id),
  requested_card_id uuid not null references public.sognatore_card_instances(id),
  status text not null default 'PENDING' check (status in ('PENDING','ACCEPTED','REJECTED','CANCELLED')),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  check (proposer_id <> recipient_id),
  check (offered_card_id <> requested_card_id)
);
create index if not exists sognatore_trade_recipient_idx
  on public.sognatore_trade_offers(recipient_id, status, created_at desc);

create table if not exists public.sognatore_card_transactions (
  id uuid primary key default gen_random_uuid(),
  card_instance_id uuid not null references public.sognatore_card_instances(id),
  from_user_id uuid references auth.users(id),
  to_user_id uuid references auth.users(id),
  transaction_type text not null check (transaction_type in ('PACK','MARKET','TRADE')),
  reference_id uuid,
  created_at timestamptz not null default now()
);
create index if not exists sognatore_transactions_user_idx
  on public.sognatore_card_transactions(to_user_id, created_at desc);

alter table public.sognatore_card_definitions enable row level security;
alter table public.sognatore_card_instances enable row level security;
alter table public.sognatore_wallets enable row level security;
alter table public.sognatore_market_listings enable row level security;
alter table public.sognatore_trade_offers enable row level security;
alter table public.sognatore_card_transactions enable row level security;

drop policy if exists "card definitions readable" on public.sognatore_card_definitions;
create policy "card definitions readable" on public.sognatore_card_definitions for select to authenticated using (true);
drop policy if exists "owned cards readable" on public.sognatore_card_instances;
create policy "owned cards readable" on public.sognatore_card_instances for select to authenticated using (owner_id = auth.uid());
drop policy if exists "listed cards readable" on public.sognatore_card_instances;
create policy "listed cards readable" on public.sognatore_card_instances for select to authenticated using (exists (select 1 from public.sognatore_market_listings l where l.card_instance_id = id and l.status = 'ACTIVE'));
drop policy if exists "wallet owner readable" on public.sognatore_wallets;
create policy "wallet owner readable" on public.sognatore_wallets for select to authenticated using (user_id = auth.uid());
drop policy if exists "active listings readable" on public.sognatore_market_listings;
create policy "active listings readable" on public.sognatore_market_listings for select to authenticated using (status = 'ACTIVE' or seller_id = auth.uid() or buyer_id = auth.uid());
drop policy if exists "trade participants readable" on public.sognatore_trade_offers;
create policy "trade participants readable" on public.sognatore_trade_offers for select to authenticated using (proposer_id = auth.uid() or recipient_id = auth.uid());
drop policy if exists "transactions participants readable" on public.sognatore_card_transactions;
create policy "transactions participants readable" on public.sognatore_card_transactions for select to authenticated using (from_user_id = auth.uid() or to_user_id = auth.uid());

-- Nessuna scrittura diretta dalle policy: le mutazioni avvengono solo tramite RPC controllate.
revoke insert, update, delete on public.sognatore_card_instances from anon, authenticated;
revoke insert, update, delete on public.sognatore_wallets from anon, authenticated;
revoke insert, update, delete on public.sognatore_market_listings from anon, authenticated;
revoke insert, update, delete on public.sognatore_trade_offers from anon, authenticated;
revoke insert, update, delete on public.sognatore_card_transactions from anon, authenticated;

create or replace function public.sognatore_get_wallet()
returns bigint language plpgsql security definer set search_path = public, pg_temp
as $
declare v_user uuid := auth.uid(); v_coins bigint;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  insert into public.sognatore_wallets(user_id) values(v_user) on conflict do nothing;
  select coins into v_coins from public.sognatore_wallets where user_id=v_user;
  return v_coins;
end $;

create or replace function public.sognatore_open_pack(p_kind text default 'standard')
returns table(card_instance_id uuid, card_id text, serial_number smallint, rarity text)
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_user uuid := auth.uid(); v_price integer; v_wallet bigint; v_card record;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_kind not in ('standard','premium','rare') then raise exception 'INVALID_PACK'; end if;
  v_price := case p_kind when 'standard' then 30 when 'premium' then 65 else 110 end;
  insert into public.sognatore_wallets(user_id) values(v_user) on conflict do nothing;
  select coins into v_wallet from public.sognatore_wallets where user_id=v_user for update;
  if v_wallet < v_price then raise exception 'INSUFFICIENT_COINS'; end if;
  -- Verifica la disponibilità prima di addebitare: una bustina deve contenere sempre 3 carte.
  if (select count(*) from public.sognatore_card_instances i where i.owner_id is null and case p_kind
        when 'standard' then i.rarity in ('COMUNE','RARA')
        when 'premium' then i.rarity in ('RARA','EPICA','LEGGENDA')
        else i.rarity in ('EPICA','LEGGENDA') end) < 3 then
    raise exception 'PACK_POOL_EXHAUSTED';
  end if;
  update public.sognatore_wallets set coins=coins-v_price, updated_at=now() where user_id=v_user;
  for v_card in
    select i.id, i.card_id, i.serial_number, i.rarity
    from public.sognatore_card_instances i
    where i.owner_id is null
      and case p_kind
        when 'standard' then i.rarity in ('COMUNE','RARA')
        when 'premium' then i.rarity in ('RARA','EPICA','LEGGENDA')
        else i.rarity in ('EPICA','LEGGENDA') end
    order by random() limit 3 for update skip locked
  loop
    update public.sognatore_card_instances set owner_id=v_user where id=v_card.id;
    insert into public.sognatore_card_transactions(card_instance_id,to_user_id,transaction_type)
      values(v_card.id,v_user,'PACK');
    card_instance_id:=v_card.id; card_id:=v_card.card_id;
    serial_number:=v_card.serial_number; rarity:=v_card.rarity; return next;
  end loop;
end $$;

create or replace function public.sognatore_list_card(p_card_instance_id uuid, p_price bigint)
returns uuid language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_user uuid := auth.uid(); v_listing uuid;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_price <= 0 then raise exception 'INVALID_PRICE'; end if;
  perform 1 from public.sognatore_card_instances where id=p_card_instance_id and owner_id=v_user for update;
  if not found then raise exception 'CARD_NOT_OWNED'; end if;
  insert into public.sognatore_market_listings(card_instance_id,seller_id,price)
    values(p_card_instance_id,v_user,p_price) returning id into v_listing;
  return v_listing;
end $$;

create or replace function public.sognatore_cancel_listing(p_listing_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  update public.sognatore_market_listings set status='CANCELLED'
  where id=p_listing_id and seller_id=auth.uid() and status='ACTIVE';
  if not found then raise exception 'LISTING_NOT_AVAILABLE'; end if;
end $$;

create or replace function public.sognatore_buy_listing(p_listing_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_user uuid := auth.uid(); v_listing public.sognatore_market_listings%rowtype; v_coins bigint;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into v_listing from public.sognatore_market_listings where id=p_listing_id and status='ACTIVE' for update;
  if not found or v_listing.seller_id=v_user then raise exception 'LISTING_NOT_AVAILABLE'; end if;
  insert into public.sognatore_wallets(user_id) values(v_user) on conflict do nothing;
  select coins into v_coins from public.sognatore_wallets where user_id=v_user for update;
  if v_coins < v_listing.price then raise exception 'INSUFFICIENT_COINS'; end if;
  perform 1 from public.sognatore_card_instances where id=v_listing.card_instance_id and owner_id=v_listing.seller_id for update;
  if not found then raise exception 'CARD_OWNERSHIP_CHANGED'; end if;
  update public.sognatore_wallets set coins=coins-v_listing.price,updated_at=now() where user_id=v_user;
  insert into public.sognatore_wallets(user_id,coins) values(v_listing.seller_id,v_listing.price)
    on conflict(user_id) do update set coins=public.sognatore_wallets.coins+excluded.coins,updated_at=now();
  update public.sognatore_card_instances set owner_id=v_user where id=v_listing.card_instance_id;
  update public.sognatore_market_listings set status='SOLD',buyer_id=v_user,completed_at=now() where id=v_listing.id;
  insert into public.sognatore_card_transactions(card_instance_id,from_user_id,to_user_id,transaction_type,reference_id)
    values(v_listing.card_instance_id,v_listing.seller_id,v_user,'MARKET',v_listing.id);
end $$;

create or replace function public.sognatore_propose_trade(p_recipient_id uuid,p_offered_card_id uuid,p_requested_card_id uuid)
returns uuid language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_user uuid := auth.uid(); v_trade uuid;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_recipient_id=v_user then raise exception 'INVALID_RECIPIENT'; end if;
  perform 1 from public.sognatore_card_instances where id=p_offered_card_id and owner_id=v_user for update;
  if not found then raise exception 'OFFERED_CARD_NOT_OWNED'; end if;
  perform 1 from public.sognatore_card_instances where id=p_requested_card_id and owner_id=p_recipient_id for update;
  if not found then raise exception 'REQUESTED_CARD_NOT_OWNED'; end if;
  if exists(select 1 from public.sognatore_market_listings where card_instance_id in (p_offered_card_id,p_requested_card_id) and status='ACTIVE') then
    raise exception 'CARD_LISTED_ON_MARKET';
  end if;
  insert into public.sognatore_trade_offers(proposer_id,recipient_id,offered_card_id,requested_card_id)
    values(v_user,p_recipient_id,p_offered_card_id,p_requested_card_id) returning id into v_trade;
  return v_trade;
end $$;

create or replace function public.sognatore_respond_trade(p_trade_id uuid,p_accept boolean)
returns void language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_user uuid := auth.uid(); v_trade public.sognatore_trade_offers%rowtype;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into v_trade from public.sognatore_trade_offers where id=p_trade_id and status='PENDING' for update;
  if not found or v_trade.recipient_id<>v_user then raise exception 'TRADE_NOT_AVAILABLE'; end if;
  if not p_accept then
    update public.sognatore_trade_offers set status='REJECTED',completed_at=now() where id=p_trade_id; return;
  end if;
  perform 1 from public.sognatore_card_instances where id=v_trade.offered_card_id and owner_id=v_trade.proposer_id for update;
  if not found then raise exception 'OFFERED_CARD_OWNERSHIP_CHANGED'; end if;
  perform 1 from public.sognatore_card_instances where id=v_trade.requested_card_id and owner_id=v_user for update;
  if not found then raise exception 'REQUESTED_CARD_OWNERSHIP_CHANGED'; end if;
  if exists(select 1 from public.sognatore_market_listings where card_instance_id in (v_trade.offered_card_id,v_trade.requested_card_id) and status='ACTIVE') then
    raise exception 'CARD_LISTED_ON_MARKET';
  end if;
  update public.sognatore_card_instances set owner_id=v_user where id=v_trade.offered_card_id;
  update public.sognatore_card_instances set owner_id=v_trade.proposer_id where id=v_trade.requested_card_id;
  update public.sognatore_trade_offers set status='ACCEPTED',completed_at=now() where id=p_trade_id;
  insert into public.sognatore_card_transactions(card_instance_id,from_user_id,to_user_id,transaction_type,reference_id) values
    (v_trade.offered_card_id,v_trade.proposer_id,v_user,'TRADE',p_trade_id),
    (v_trade.requested_card_id,v_user,v_trade.proposer_id,'TRADE',p_trade_id);
end $$;

revoke all on function public.sognatore_get_wallet() from public;
revoke all on function public.sognatore_open_pack(text) from public;
revoke all on function public.sognatore_list_card(uuid,bigint) from public;
revoke all on function public.sognatore_cancel_listing(uuid) from public;
revoke all on function public.sognatore_buy_listing(uuid) from public;
revoke all on function public.sognatore_propose_trade(uuid,uuid,uuid) from public;
revoke all on function public.sognatore_respond_trade(uuid,boolean) from public;
grant execute on function public.sognatore_get_wallet() to authenticated;
grant execute on function public.sognatore_open_pack(text) to authenticated;
grant execute on function public.sognatore_list_card(uuid,bigint) to authenticated;
grant execute on function public.sognatore_cancel_listing(uuid) to authenticated;
grant execute on function public.sognatore_buy_listing(uuid) to authenticated;
grant execute on function public.sognatore_propose_trade(uuid,uuid,uuid) to authenticated;
grant execute on function public.sognatore_respond_trade(uuid,boolean) to authenticated;
