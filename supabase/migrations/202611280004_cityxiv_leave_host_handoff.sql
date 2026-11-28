-- City XIV: choose a fresh host when a member explicitly leaves.
-- If the current host leaves or is already stale, prefer the freshest active
-- remaining member; only fall back to the oldest persisted member when nobody
-- has a fresh heartbeat. Room-first locking is shared with co-op RPCs.

create or replace function public.cityxiv_leave_room(p_room_id uuid)
returns boolean
language plpgsql
security definer
set search_path=public,pg_temp
as $cityxiv_leave_room$
declare
  v_user uuid:=auth.uid();
  v_room public.cityxiv_rooms;
  v_next uuid;
  v_state jsonb;
  v_players jsonb;
  v_ready jsonb;
  v_host_seen timestamptz;
  v_count integer;
begin
  if v_user is null then raise exception 'Authentication required'; end if;

  select * into v_room
  from public.cityxiv_rooms
  where id=p_room_id
  for update;
  if not found
     or not exists(select 1 from public.cityxiv_room_players where room_id=p_room_id and user_id=v_user) then
    return true;
  end if;

  delete from public.cityxiv_room_players
  where room_id=p_room_id and user_id=v_user;

  select count(*) into v_count
  from public.cityxiv_room_players
  where room_id=p_room_id;
  if v_count=0 then
    delete from public.cityxiv_rooms where id=p_room_id;
    return true;
  end if;

  select last_seen into v_host_seen
  from public.cityxiv_room_players
  where room_id=p_room_id and user_id=v_room.host_id;

  -- A leaving host, or a host whose reservation is already stale/missing,
  -- should not transfer authority to an offline member when a fresh one exists.
  if v_room.host_id=v_user
     or v_host_seen is null
     or v_host_seen<=now()-interval '90 seconds' then
    select user_id into v_next
    from public.cityxiv_room_players
    where room_id=p_room_id
      and last_seen>now()-interval '90 seconds'
    order by last_seen desc,joined_at asc
    limit 1;

    if v_next is null then
      select user_id into v_next
      from public.cityxiv_room_players
      where room_id=p_room_id
      order by joined_at asc
      limit 1;
    end if;

    update public.cityxiv_rooms
      set host_id=v_next,updated_at=now()
      where id=p_room_id;
  end if;

  v_state:=coalesce(v_room.game_state,'{}'::jsonb);
  v_players:=case when jsonb_typeof(v_state->'players')='object'
    then v_state->'players' else '{}'::jsonb end;
  v_state:=jsonb_set(v_state,'{players}',v_players-v_user::text,true);

  v_ready:=case when jsonb_typeof(v_state->'prep_ready')='object'
    then v_state->'prep_ready' else '{}'::jsonb end;
  v_state:=jsonb_set(v_state,'{prep_ready}',v_ready-v_user::text,true);

  update public.cityxiv_rooms
    set game_state=v_state,updated_at=now()
    where id=p_room_id;

  return true;
end
$cityxiv_leave_room$;

revoke all on function public.cityxiv_leave_room(uuid) from public,anon;
grant execute on function public.cityxiv_leave_room(uuid) to authenticated;
