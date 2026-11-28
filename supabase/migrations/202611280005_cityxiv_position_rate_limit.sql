-- City XIV: server-side position update throttling and finite coordinate validation.
-- Client throttling is not authoritative; serialize updates on the member row.

alter table public.cityxiv_room_players
  add column if not exists position_updated_at timestamptz not null default now();

create or replace function public.cityxiv_update_position(p_room_id uuid,p_x double precision,p_z double precision)
returns boolean
language plpgsql
security definer
set search_path=public,pg_temp
as $cityxiv_update_position$
declare
  v_user uuid:=auth.uid();
  v_status text;
  v_last timestamptz;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if p_x is null or p_z is null
     or p_x<='-Infinity'::double precision or p_x>='Infinity'::double precision
     or p_z<='-Infinity'::double precision or p_z>='Infinity'::double precision then
    raise exception 'Invalid position';
  end if;

  -- Room-first lock order: phase/status changes cannot race an accepted move.
  select status into v_status
  from public.cityxiv_rooms
  where id=p_room_id
  for share;
  if v_status is distinct from 'playing' then raise exception 'Room is not active'; end if;

  select position_updated_at into v_last
  from public.cityxiv_room_players
  where room_id=p_room_id and user_id=v_user
  for update;
  if not found then raise exception 'Not a room member'; end if;

  -- 250ms server-side minimum interval (the UI sends at roughly 400ms).
  if v_last>now()-interval '250 milliseconds' then return false; end if;

  update public.cityxiv_room_players
  set position=jsonb_build_object(
        'x',greatest(-18,least(18,p_x)),
        'z',greatest(-39,least(2,p_z))
      ),
      position_updated_at=now(),
      last_seen=now()
  where room_id=p_room_id and user_id=v_user;

  return true;
end
$cityxiv_update_position$;

revoke all on function public.cityxiv_update_position(uuid,double precision,double precision) from public,anon;
grant execute on function public.cityxiv_update_position(uuid,double precision,double precision) to authenticated;
