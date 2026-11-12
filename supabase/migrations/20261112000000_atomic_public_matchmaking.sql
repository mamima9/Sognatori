-- Atomic public matchmaking for Sognatori.
-- Run through Supabase migrations / SQL editor before using the updated frontend.

create or replace function public.find_or_create_public_match(
  p_mode text,
  p_player_name text
)
returns public.matches
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_match public.matches;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  if p_mode not in ('competitive', 'friendly') then
    raise exception 'Invalid matchmaking mode';
  end if;

  -- Serialize matchmaking requests by mode so two simultaneous players
  -- cannot both observe an empty queue and create separate waiting rooms.
  perform pg_advisory_xact_lock(
    hashtext('sognatori-matchmaking:' || p_mode)
  );

  delete from public.matches
  where status = 'waiting'
    and created_at < now() - interval '5 minutes';

  -- Reuse this user's existing open lobby, if any.
  select *
  into v_match
  from public.matches
  where status = 'waiting'
    and mode = p_mode
    and player1_id = v_user
    and player2_id is null
  order by created_at desc
  limit 1
  for update;

  if found then
    return v_match;
  end if;

  -- Join the oldest available opponent.
  select *
  into v_match
  from public.matches
  where status = 'waiting'
    and mode = p_mode
    and player2_id is null
    and player1_id <> v_user
  order by created_at asc
  limit 1
  for update;

  if found then
    update public.matches
    set
      player2_id = v_user,
      player2_name = coalesce(nullif(p_player_name, ''), 'Player')
    where id = v_match.id
    returning * into v_match;

    return v_match;
  end if;

  insert into public.matches (
    player1_id,
    player1_name,
    status,
    mode,
    room_code
  )
  values (
    v_user,
    coalesce(nullif(p_player_name, ''), 'Player'),
    'waiting',
    p_mode,
    null
  )
  returning * into v_match;

  return v_match;
end;
$$;

revoke all on function public.find_or_create_public_match(text, text)
from public;

grant execute on function public.find_or_create_public_match(text, text)
to authenticated;
