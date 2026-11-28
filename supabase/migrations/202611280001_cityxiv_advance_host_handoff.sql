-- City XIV: stale-host takeover and stale-member-safe zone advancement.
-- This migration is incremental and can be applied after 202611270001_cityxiv_online_coop.sql.

create or replace function public.cityxiv_advance(p_room_id uuid)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $cityxiv_advance$
declare
  v_user uuid:=auth.uid();
  v_room public.cityxiv_rooms;
  v_state jsonb;
  v_stage integer;
  v_enemy jsonb;
  v_next integer;
  v_players jsonb;
  v_key text;
  v_member jsonb;
  v_host_seen timestamptz;
  v_active_count integer;
begin
  if v_user is null then raise exception 'Authentication required'; end if;

  -- Room-first lock order, consistent with heartbeat/action/phase RPCs.
  select * into v_room from public.cityxiv_rooms where id=p_room_id for update;
  if not found or v_room.status<>'playing' then raise exception 'Room not active'; end if;

  update public.cityxiv_room_players
    set last_seen=now()
    where room_id=p_room_id and user_id=v_user;
  if not found then raise exception 'Not a room member'; end if;

  -- Permit a fresh member to take over zone advancement only after the
  -- existing host's heartbeat has gone stale (or the host row is absent).
  if v_room.host_id<>v_user then
    select last_seen into v_host_seen
      from public.cityxiv_room_players
      where room_id=p_room_id and user_id=v_room.host_id;
    if v_host_seen is not null and v_host_seen>now()-interval '90 seconds' then
      raise exception 'Host only';
    end if;
    update public.cityxiv_rooms
      set host_id=v_user,updated_at=now()
      where id=p_room_id and host_id=v_room.host_id;
  end if;

  select count(*) into v_active_count
    from public.cityxiv_room_players
    where room_id=p_room_id and last_seen>now()-interval '90 seconds';
  if v_active_count<1 or v_active_count>5 then raise exception 'No active party'; end if;

  v_state:=v_room.game_state;
  v_stage:=coalesce((v_state->>'stage')::integer,0);
  v_enemy:=v_state->'enemy';

  if coalesce(v_state->>'phase','players')<>'players' then
    raise exception 'Wait for the enemy phase to resolve';
  end if;
  if coalesce((v_state->>'lost')::boolean,false) then raise exception 'Party defeated'; end if;
  if coalesce((v_state->>'won')::boolean,false) then raise exception 'Expedition already completed'; end if;

  -- Only fresh active members must have completed/reset the previous round.
  for v_key in
    select user_id::text from public.cityxiv_room_players
    where room_id=p_room_id and last_seen>now()-interval '90 seconds'
  loop
    v_member:=coalesce(v_state->'players','{}'::jsonb)->v_key;
    if v_member is null or coalesce((v_member->>'actions_used')::integer,0)<>0 then
      raise exception 'Finish the round before advancing zones';
    end if;
  end loop;

  if v_stage=0 then
    -- The Piazza cannot be skipped after the objectives are met early:
    -- require the first full 3-action round and its automatic enemy phase.
    if coalesce((v_state->>'round')::integer,1)<2 then
      raise exception 'Complete the first three-action round before advancing';
    end if;
    if coalesce((v_state->>'clues')::integer,0)<2
       or not coalesce((v_state->'flags'->>'explored_stage_0')::boolean,false) then
      raise exception 'Piazza: explore and gather two clues';
    end if;
  elsif v_stage in (1,2) then
    if not coalesce((v_state->'flags'->>('explored_stage_'||v_stage))::boolean,false)
       or v_enemy is null or coalesce((v_enemy->>'hp')::integer,0)>0 then
      raise exception 'Explore and clear the stage encounter';
    end if;
  elsif v_stage=3 then
    if v_enemy is null or coalesce((v_enemy->>'hp')::integer,0)>0 then
      raise exception 'Defeat the Seal';
    end if;
    v_state:=jsonb_set(v_state,'{won}',to_jsonb(true),true);
    v_state:=jsonb_set(v_state,'{coins}',to_jsonb(coalesce((v_state->>'coins')::integer,0)+100),true);
    v_players:=coalesce(v_state->'players','{}'::jsonb);
    for v_key,v_member in select key,value from jsonb_each(v_players) loop
      v_member:=jsonb_set(v_member,'{xp}',to_jsonb(coalesce((v_member->>'xp')::integer,0)+100),true);
      v_players:=jsonb_set(v_players,array[v_key],v_member,true);
    end loop;
    v_state:=jsonb_set(v_state,'{players}',v_players,true);
    update public.cityxiv_rooms set status='finished',game_state=v_state,updated_at=now() where id=v_room.id;
    return v_state;
  else
    raise exception 'Invalid zone stage';
  end if;

  v_next:=v_stage+1;
  v_state:=jsonb_set(v_state,'{stage}',to_jsonb(v_next),true);
  v_state:=jsonb_set(v_state,'{phase}',to_jsonb('players'),true);
  v_state:=jsonb_set(v_state,'{zone_progress}',to_jsonb(0),true);
  v_state:=jsonb_set(v_state,'{enemy}','null'::jsonb,true);

  -- A stage boundary resets stale and active round counters alike so a
  -- reconnecting player cannot carry old actions into the newly unlocked zone.
  v_players:=coalesce(v_state->'players','{}'::jsonb);
  for v_key,v_member in select key,value from jsonb_each(v_players) loop
    v_member:=jsonb_set(v_member,'{actions_used}',to_jsonb(0),true);
    v_member:=jsonb_set(v_member,'{guard}',to_jsonb(false),true);
    v_players:=jsonb_set(v_players,array[v_key],v_member,true);
  end loop;
  v_state:=jsonb_set(v_state,'{players}',v_players,true);

  if v_next=3 then
    v_state:=jsonb_set(v_state,'{phase}',to_jsonb('prep'),true);
    v_state:=jsonb_set(v_state,'{prep_ready}','{}'::jsonb,true);
  end if;
  update public.cityxiv_rooms set game_state=v_state,updated_at=now() where id=v_room.id;
  return v_state;
end $cityxiv_advance$;

revoke all on function public.cityxiv_advance(uuid) from public;
grant execute on function public.cityxiv_advance(uuid) to authenticated;
