-- City XIV: reconcile the three-action phase during heartbeats.
-- This closes the stale-member stall: when a member falls outside the 90s
-- freshness window, the remaining active roster can complete the phase even
-- if nobody can submit another action to trigger the action RPC's phase check.

create or replace function public.cityxiv_ping(p_room_id uuid)
returns boolean
language plpgsql
security definer
set search_path=public,pg_temp
as $cityxiv_ping$
declare
  v_user uuid:=auth.uid();
  v_room public.cityxiv_rooms;
  v_host_seen timestamptz;
  v_next uuid;
  v_state jsonb;
  v_member jsonb;
  v_key text;
  v_active_count integer;
  v_all_done boolean;
begin
  if v_user is null then raise exception 'Authentication required'; end if;

  -- Room-first lock order, shared with action/phase/leave RPCs.
  select * into v_room from public.cityxiv_rooms where id=p_room_id for update;
  if not found then raise exception 'Room not found'; end if;

  update public.cityxiv_room_players
    set last_seen=now()
    where room_id=p_room_id and user_id=v_user;
  if not found then raise exception 'Not a room member'; end if;

  select last_seen into v_host_seen
    from public.cityxiv_room_players
    where room_id=p_room_id and user_id=v_room.host_id;

  if v_room.host_id<>v_user and (v_host_seen is null or v_host_seen<now()-interval '90 seconds') then
    select user_id into v_next
      from public.cityxiv_room_players
      where room_id=p_room_id and user_id<>v_room.host_id
        and last_seen>now()-interval '90 seconds'
      order by last_seen desc,joined_at
      limit 1;
    if v_next is not null then
      update public.cityxiv_rooms set host_id=v_next,updated_at=now()
        where id=p_room_id;
    end if;
  end if;

  -- Heartbeat is also the phase-reconciliation trigger. When all fresh members
  -- have locked exactly three actions, move to the enemy phase atomically.
  if v_room.status='playing'
     and coalesce(v_room.game_state->>'phase','players')='players'
     and not coalesce((v_room.game_state->>'lost')::boolean,false)
     and not coalesce((v_room.game_state->>'won')::boolean,false) then
    v_state:=v_room.game_state;
    select count(*) into v_active_count
      from public.cityxiv_room_players
      where room_id=p_room_id and last_seen>now()-interval '90 seconds';
    v_all_done:=v_active_count>0;
    for v_key in
      select user_id::text
      from public.cityxiv_room_players
      where room_id=p_room_id and last_seen>now()-interval '90 seconds'
    loop
      v_member:=coalesce(v_state->'players','{}'::jsonb)->v_key;
      if v_member is null or coalesce((v_member->>'actions_used')::integer,0)<3 then
        v_all_done:=false;
        exit;
      end if;
    end loop;
    if v_all_done then
      v_state:=jsonb_set(v_state,'{phase}',to_jsonb('enemy'),true);
      update public.cityxiv_rooms set game_state=v_state,updated_at=now()
        where id=p_room_id;
    end if;
  end if;

  return true;
end
$cityxiv_ping$;

revoke all on function public.cityxiv_ping(uuid) from public;
grant execute on function public.cityxiv_ping(uuid) to authenticated;
