-- Progressive NFT minting on Base. Existing gameplay inventory remains available without a wallet.
create extension if not exists pgcrypto;

create table if not exists public.player_wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  address text not null unique,
  chain_id integer not null check (chain_id in (8453, 84532)),
  provider text not null default 'injected',
  status text not null default 'VERIFIED' check (status in ('PENDING','VERIFIED','DISCONNECTED')),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint player_wallets_address_lowercase check (address = lower(address))
);

create table if not exists public.nft_wallet_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  address text not null,
  chain_id integer not null check (chain_id in (8453, 84532)),
  message text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists nft_wallet_challenges_user_idx
  on public.nft_wallet_challenges(user_id, created_at desc);

create table if not exists public.nft_mint_jobs (
  id uuid primary key default gen_random_uuid(),
  card_instance_id uuid not null unique references public.sognatore_card_instances(id),
  user_id uuid not null references auth.users(id) on delete cascade,
  definition_index smallint not null check (definition_index between 1 and 64),
  serial_number smallint not null check (serial_number between 1 and 100),
  token_id integer not null unique check (token_id between 1 and 6400),
  recipient_address text,
  chain_id integer not null default 84532 check (chain_id in (8453,84532)),
  status text not null default 'PENDING_WALLET'
    check (status in ('PENDING_WALLET','QUEUED','PROCESSING','SUBMITTED','MINTED','FAILED','NEEDS_REVIEW')),
  tx_hash text unique,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  next_attempt_at timestamptz not null default now(),
  last_error text,
  idempotency_key text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  minted_at timestamptz,
  constraint nft_token_id_formula check (token_id = (definition_index - 1) * 100 + serial_number)
);
create index if not exists nft_mint_jobs_queue_idx
  on public.nft_mint_jobs(status, next_attempt_at, created_at);

alter table public.player_wallets enable row level security;
alter table public.nft_wallet_challenges enable row level security;
alter table public.nft_mint_jobs enable row level security;

drop policy if exists "wallet owner can read" on public.player_wallets;
create policy "wallet owner can read" on public.player_wallets
  for select to authenticated using (user_id = auth.uid());
drop policy if exists "mint jobs owner can read" on public.nft_mint_jobs;
create policy "mint jobs owner can read" on public.nft_mint_jobs
  for select to authenticated using (user_id = auth.uid());

revoke all on public.nft_wallet_challenges from anon, authenticated;
revoke insert, update, delete on public.player_wallets from anon, authenticated;
revoke insert, update, delete on public.nft_mint_jobs from anon, authenticated;

-- First assignment of an off-chain card copy creates exactly one mint job.
-- Later marketplace/trade ownership changes must be handled as NFT transfers, not re-mints.
create or replace function public.sognatore_enqueue_progressive_mint()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_definition_index integer;
  v_wallet public.player_wallets%rowtype;
  v_token_id integer;
begin
  if old.owner_id is not null or new.owner_id is null then
    return new;
  end if;

  select display_order into v_definition_index
  from public.sognatore_card_definitions
  where card_id = new.card_id;

  if v_definition_index is null then
    raise exception 'NFT_DEFINITION_NOT_FOUND';
  end if;

  v_token_id := (v_definition_index - 1) * 100 + new.serial_number;
  select * into v_wallet from public.player_wallets
  where user_id = new.owner_id and status = 'VERIFIED';

  insert into public.nft_mint_jobs(
    card_instance_id,user_id,definition_index,serial_number,token_id,
    recipient_address,chain_id,status,idempotency_key
  ) values (
    new.id,new.owner_id,v_definition_index,new.serial_number,v_token_id,
    case when found then v_wallet.address else null end,
    case when found then v_wallet.chain_id else 84532 end,
    case when found then 'QUEUED' else 'PENDING_WALLET' end,
    'card-instance:' || new.id::text
  )
  on conflict (card_instance_id) do nothing;

  return new;
end;
$$;

drop trigger if exists sognatore_progressive_mint_trigger on public.sognatore_card_instances;
create trigger sognatore_progressive_mint_trigger
after update of owner_id on public.sognatore_card_instances
for each row
when (old.owner_id is null and new.owner_id is not null)
execute function public.sognatore_enqueue_progressive_mint();

-- Atomically reserve jobs for one worker. Only service_role can call this function.
create or replace function public.nft_claim_mint_jobs(p_limit integer default 10)
returns table(
  id uuid,
  token_id integer,
  definition_index smallint,
  serial_number smallint,
  recipient_address text,
  chain_id integer,
  attempt_count integer
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_limit < 1 or p_limit > 50 then raise exception 'INVALID_BATCH_SIZE'; end if;
  return query
  with picked as (
    select j.id
    from public.nft_mint_jobs j
    where j.status in ('QUEUED','FAILED')
      and j.next_attempt_at <= now()
      and j.recipient_address is not null
    order by j.created_at
    limit p_limit
    for update skip locked
  )
  update public.nft_mint_jobs j
  set status = 'PROCESSING',
      attempt_count = j.attempt_count + 1,
      updated_at = now(),
      last_error = null
  from picked
  where j.id = picked.id
  returning j.id,j.token_id,j.definition_index,j.serial_number,
    j.recipient_address,j.chain_id,j.attempt_count;
end;
$$;

revoke all on function public.nft_claim_mint_jobs(integer) from public, anon, authenticated;
grant execute on function public.nft_claim_mint_jobs(integer) to service_role;

-- Wallet linking is performed only by the signed challenge Edge Function.
create or replace function public.nft_attach_wallet_to_pending_jobs()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.status = 'VERIFIED' then
    update public.nft_mint_jobs
    set recipient_address = new.address,
        chain_id = new.chain_id,
        status = case when status in ('PENDING_WALLET','FAILED') then 'QUEUED' else status end,
        next_attempt_at = now(),
        updated_at = now()
    where user_id = new.user_id and status in ('PENDING_WALLET','FAILED');
  end if;
  return new;
end;
$$;

drop trigger if exists nft_wallet_queue_trigger on public.player_wallets;
create trigger nft_wallet_queue_trigger
after insert or update of address,chain_id,status on public.player_wallets
for each row execute function public.nft_attach_wallet_to_pending_jobs();

-- Do not automatically mint legacy inventory. Eligibility must be reviewed and backfilled explicitly.
