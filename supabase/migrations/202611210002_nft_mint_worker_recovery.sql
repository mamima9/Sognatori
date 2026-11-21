-- Recover jobs left PROCESSING/SUBMITTED after worker crashes or RPC timeouts.
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
    where j.recipient_address is not null
      and j.next_attempt_at <= now()
      and (
        j.status in ('QUEUED','FAILED')
        or (j.status in ('PROCESSING','SUBMITTED') and j.updated_at < now() - interval '10 minutes')
      )
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
