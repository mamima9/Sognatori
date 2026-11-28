-- City XIV: prune stale reservations only while a room is waiting.
-- Live expeditions retain disconnected member rows/state for reconnect.

create or replace function public.cityxiv_join_room(p_room_code text,p_player_name text,p_character_id text)
returns uuid
language plpgsql
security definer
set search_path=public,pg_temp
as $cityxiv_join_room$
declare
  v_user uuid:=auth.uid();
  v_room public.cityxiv_rooms;
  v_existing boolean:=false;
  v_count integer;
  v_state jsonb;
  v_name text;
  v_stale_ids uuid[];
  v_stale uuid;
  v_host_seen timestamptz;
  v_next uuid;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if public.cityxiv_character_stats(p_character_id) is null then raise exception 'Invalid Sognatore'; end if;
  v_name:=left(coalesce(nullif(trim(p_player_name),''),'Player'),32);

  -- Serialize joins and stale cleanup with the room lock.
  select * into v_room
  from public.cityxiv_rooms
  where room_code=upper(trim(p_room_code))
    and status='waiting'
    and expires_at>now()
  for update;
  if not found then raise exception 'Room not found or already started'; end if;

  -- Refresh a returning member first so their own reservation is never pruned.
  update public.cityxiv_room_players
    set last_seen=now()
    where room_id=v_room.id and user_id=v_user;
  v_existing:=found;

  -- Only waiting rooms are cleaned. Disconnected expedition members are kept
  -- in playing rooms so resume/heartbeat can restore their saved state.
  select array_agg(user_id) into v_stale_ids
  from public.cityxiv_room_players
  where room_id=v_room.id
    and user_id<>v_user
    and last_seen<=now()-interval '90 seconds';

  v_state:=coalesce(v_room.game_state,'{}'::jsonb);
  if v_stale_ids is not null then
    foreach v_stale in array v_stale_ids loop
      v_state:=jsonb_set(
        v_state,
        '{players}',
        coalesce(v_state->'players','{}'::jsonb)-v_stale::text,
        true
      );
    end loop;

    delete from public.cityxiv_room_players
    where room_id=v_room.id and user_id=any(v_stale_ids);
  end if;

  -- If the host reservation was stale/absent, elect the freshest remaining
  -- member; if nobody remains, the incoming member becomes host.
  select last_seen into v_host_seen
  from public.cityxiv_room_players
  where room_id=v_room.id and user_id=v_room.host_id;

  if v_room.host_id<>v_user
     and (v_host_seen is null or v_host_seen<=now()-interval '90 seconds') then
    select user_id into v_next
    from public.cityxiv_room_players
    where room_id=v_room.id
      and user_id<>v_room.host_id
      and last_seen>now()-interval '90 seconds'
    order by last_seen desc,joined_at asc
    limit 1;
    if v_next is null then v_next:=v_user; end if;
  else
    v_next:=v_room.host_id;
  end if;

  if not v_existing then
    select count(*) into v_count
    from public.cityxiv_room_players
    where room_id=v_room.id and last_seen>now()-interval '90 seconds';
    if v_count>=v_room.max_players then raise exception 'Room is full'; end if;

    insert into public.cityxiv_room_players(room_id,user_id,player_name,character_id,ready)
    values(v_room.id,v_user,v_name,p_character_id,false);

    v_state:=jsonb_set(
      v_state,
      '{players}',
      coalesce(v_state->'players','{}'::jsonb)||jsonb_build_object(
        v_user::text,
        jsonb_build_object(
          'active',p_character_id,'bench',null,'hp',20,'bench_hp',20,
          'actions_used',0,'guard',false,'xp',0,'level',1,
          'equipment',jsonb_build_object('weapon',false,'armor',false,'amulet',false)
        )
      ),
      true
    );
  end if;

  update public.cityxiv_rooms
    set host_id=v_next,game_state=v_state,updated_at=now()
    where id=v_room.id;

  return v_room.id;
end
$cityxiv_join_room$;

revoke all on function public.cityxiv_join_room(text,text,text) from public,anon;
grant execute on function public.cityxiv_join_room(text,text,text) to authenticated;
