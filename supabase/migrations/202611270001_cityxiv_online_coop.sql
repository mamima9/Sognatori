-- City XIV online cooperative rooms (2–5 players).
-- Apply this migration in the Supabase SQL editor before enabling online mode.

create table if not exists public.cityxiv_rooms (
  id uuid primary key default gen_random_uuid(),
  room_code text not null unique,
  host_id uuid not null references auth.users(id) on delete cascade,
  max_players int not null check (max_players between 2 and 5),
  status text not null default 'waiting' check (status in ('waiting','playing','finished')),
  game_state jsonb not null default '{"stage":0,"round":1,"clues":0,"explores":0,"coins":0,"enemy":null,"flags":{},"log":[],"won":false,"lost":false,"players":{}}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '24 hours'
);
create table if not exists public.cityxiv_room_players (
  room_id uuid not null references public.cityxiv_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  player_name text not null,
  character_id text not null,
  ready boolean not null default false,
  position jsonb not null default '{"x":0,"z":3}'::jsonb,
  joined_at timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  primary key (room_id,user_id)
);
create index if not exists cityxiv_room_players_user_idx on public.cityxiv_room_players(user_id,last_seen desc);
create index if not exists cityxiv_rooms_expiry_idx on public.cityxiv_rooms(expires_at);

create or replace function public.cityxiv_character_stats(p_character_id text)
returns jsonb language sql immutable set search_path=public,pg_temp as $$
  select jsonb_build_object('att',v.att,'dif',v.dif,'vel',v.vel)
  from (values ('adlimago',10,15,8),('cancucc',15,9,16),('eroe',17,9,15),('nuvobetta',14,12,11),('scroccospell',12,8,17),('deb',14,11,14),('aragostino',15,12,9),('sparkly',12,9,6),('nina',15,12,9.1),('taomarco',17,13,5.5),('riwupido',11,12,11.2),('fourmori',9,11,11.7),('ginza',12,15,7),('dragociocco',14,10,14.1),('tinia',9,9,8.5),('uesditti',7,7,18),('fierononno',10,10,10),('long',14,12,5.3),('pepe',13,7,9.2),('cillymbu',10,10,3),('pequeno',11,9,7.1),('cenere',13,12,9.3),('icepadel',13,9,9.4),('pirimar',12,8,7.2),('spinoff',13,8,17.5),('toasty',11,11,11),('shoboshi',12,9,11.3),('eriiro',13,8,17.5),('elmas',12,10,9)) as v(id,att,dif,vel)
  where v.id=p_character_id
$$;
revoke all on function public.cityxiv_character_stats(text) from public;
grant execute on function public.cityxiv_character_stats(text) to authenticated;

create or replace function public.cityxiv_is_member(p_room_id uuid)
returns boolean language sql security definer set search_path=public,pg_temp as $$
  select exists(select 1 from public.cityxiv_room_players p where p.room_id=p_room_id and p.user_id=auth.uid())
$$;
revoke all on function public.cityxiv_is_member(uuid) from public;
grant execute on function public.cityxiv_is_member(uuid) to authenticated;

alter table public.cityxiv_rooms enable row level security;
alter table public.cityxiv_room_players enable row level security;
drop policy if exists cityxiv_rooms_member_read on public.cityxiv_rooms;
create policy cityxiv_rooms_member_read on public.cityxiv_rooms for select to authenticated using (public.cityxiv_is_member(id));
drop policy if exists cityxiv_players_member_read on public.cityxiv_room_players;
create policy cityxiv_players_member_read on public.cityxiv_room_players for select to authenticated using (public.cityxiv_is_member(room_id));
revoke insert,update,delete on public.cityxiv_rooms from anon,authenticated;
revoke insert,update,delete on public.cityxiv_room_players from anon,authenticated;
grant select on public.cityxiv_rooms,public.cityxiv_room_players to authenticated;

create or replace function public.cityxiv_create_room(p_player_name text,p_character_id text,p_max_players integer default 5)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare v_user uuid:=auth.uid(); v_id uuid; v_code text; v_name text; v_state jsonb;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if public.cityxiv_character_stats(p_character_id) is null then raise exception 'Invalid Sognatore'; end if;
  if p_max_players not between 2 and 5 then raise exception 'Room size must be 2–5'; end if;
  v_name:=left(coalesce(nullif(trim(p_player_name),''),'Player'),32);
  v_state:='{"stage":0,"round":1,"clues":0,"explores":0,"coins":0,"enemy":null,"flags":{},"log":[],"won":false,"lost":false,"players":{}}'::jsonb;
  for i in 1..10 loop
    v_code:=upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));
    begin
      insert into public.cityxiv_rooms(room_code,host_id,max_players,game_state)
      values(v_code,v_user,p_max_players,v_state) returning id into v_id;
      exit;
    exception when unique_violation then v_id:=null;
    end;
  end loop;
  if v_id is null then raise exception 'Could not generate a room code'; end if;
  insert into public.cityxiv_room_players(room_id,user_id,player_name,character_id,ready)
  values(v_id,v_user,v_name,p_character_id,true);
  v_state:=jsonb_set(v_state,'{players}',jsonb_build_object(v_user::text,jsonb_build_object('active',p_character_id,'bench',null,'hp',20,'bench_hp',20,'actions_used',0,'guard',false,'xp',0,'level',1)),true);
  update public.cityxiv_rooms set game_state=v_state where id=v_id;
  return v_id;
end $$;

create or replace function public.cityxiv_join_room(p_room_code text,p_player_name text,p_character_id text)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare v_user uuid:=auth.uid(); v_room public.cityxiv_rooms; v_count integer; v_state jsonb; v_name text;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if public.cityxiv_character_stats(p_character_id) is null then raise exception 'Invalid Sognatore'; end if;
  v_name:=left(coalesce(nullif(trim(p_player_name),''),'Player'),32);
  select * into v_room from public.cityxiv_rooms where room_code=upper(trim(p_room_code)) and status='waiting' and expires_at>now() for update;
  if not found then raise exception 'Room not found or already started'; end if;
  if exists(select 1 from public.cityxiv_room_players where room_id=v_room.id and user_id=v_user) then return v_room.id; end if;
  select count(*) into v_count from public.cityxiv_room_players where room_id=v_room.id;
  if v_count>=v_room.max_players then raise exception 'Room is full'; end if;
  insert into public.cityxiv_room_players(room_id,user_id,player_name,character_id,ready)
  values(v_room.id,v_user,v_name,p_character_id,false);
  v_state:=v_room.game_state;
  v_state:=jsonb_set(v_state,'{players}',coalesce(v_state->'players','{}'::jsonb)||jsonb_build_object(v_user::text,jsonb_build_object('active',p_character_id,'bench',null,'hp',20,'bench_hp',20,'actions_used',0,'guard',false,'xp',0,'level',1)),true);
  update public.cityxiv_rooms set game_state=v_state,updated_at=now() where id=v_room.id;
  return v_room.id;
end $$;

create or replace function public.cityxiv_set_ready(p_room_id uuid,p_ready boolean)
returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
declare v_status text;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select status into v_status from public.cityxiv_rooms where id=p_room_id for update;
  if v_status is distinct from 'waiting' then raise exception 'Lobby is no longer open'; end if;
  update public.cityxiv_room_players set ready=p_ready,last_seen=now() where room_id=p_room_id and user_id=auth.uid();
  if not found then raise exception 'Not a room member'; end if;
  return true;
end $$;

create or replace function public.cityxiv_start_room(p_room_id uuid)
returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
declare v_room public.cityxiv_rooms; v_count integer; v_ready integer;
begin
  select * into v_room from public.cityxiv_rooms where id=p_room_id for update;
  if not found or v_room.host_id<>auth.uid() then raise exception 'Host only'; end if;
  if v_room.status<>'waiting' then raise exception 'Room already started'; end if;
  select count(*),count(*) filter(where ready) into v_count,v_ready from public.cityxiv_room_players where room_id=p_room_id;
  if v_count<2 or v_count>v_room.max_players or v_ready<>v_count then raise exception '2–5 players must all be ready'; end if;
  update public.cityxiv_rooms set status='playing',updated_at=now(),expires_at=now()+interval '24 hours' where id=p_room_id;
  return true;
end $$;

create or replace function public.cityxiv_update_position(p_room_id uuid,p_x double precision,p_z double precision)
returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
declare v_user uuid:=auth.uid(); v_room public.cityxiv_rooms;
begin
  select * into v_room from public.cityxiv_rooms where id=p_room_id and status='playing';
  if not found then raise exception 'Room is not active'; end if;
  if not exists(select 1 from public.cityxiv_room_players where room_id=p_room_id and user_id=v_user) then raise exception 'Not a room member'; end if;
  update public.cityxiv_room_players set position=jsonb_build_object('x',greatest(-18,least(18,coalesce(p_x,0))),'z',greatest(-39,least(2,coalesce(p_z,3)))),last_seen=now() where room_id=p_room_id and user_id=v_user;
  return true;
end $$;

create or replace function public.cityxiv_ping(p_room_id uuid)
returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
declare v_user uuid:=auth.uid(); v_room public.cityxiv_rooms; v_host_seen timestamptz; v_next uuid;
begin
  -- Lock the room before the member row so heartbeat, leave and action RPCs
  -- follow the same lock order and avoid a room/player deadlock.
  select * into v_room from public.cityxiv_rooms where id=p_room_id for update;
  if not found then raise exception 'Room not found'; end if;
  update public.cityxiv_room_players set last_seen=now() where room_id=p_room_id and user_id=v_user;
  if not found then raise exception 'Not a room member'; end if;
  select last_seen into v_host_seen from public.cityxiv_room_players where room_id=p_room_id and user_id=v_room.host_id;
  if v_room.host_id<>v_user and (v_host_seen is null or v_host_seen<now()-interval '2 minutes') then
    select user_id into v_next from public.cityxiv_room_players where room_id=p_room_id and user_id<>v_room.host_id and last_seen>now()-interval '2 minutes' order by joined_at limit 1;
    if v_next is not null then update public.cityxiv_rooms set host_id=v_next,updated_at=now() where id=p_room_id; end if;
  end if;
  return true;
end $;\n\ncreate or replace function public.cityxiv_resume_room()
returns uuid language sql security definer set search_path=public,pg_temp as $$
  select p.room_id from public.cityxiv_room_players p join public.cityxiv_rooms r on r.id=p.room_id
  where p.user_id=auth.uid() and r.status in ('waiting','playing') and r.expires_at>now()
  order by p.last_seen desc limit 1
$$;

create or replace function public.cityxiv_action(p_room_id uuid,p_action text,p_character_id text default null)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare
  v_user uuid:=auth.uid(); v_room public.cityxiv_rooms; v_state jsonb; v_players jsonb; v_player jsonb;
  v_active text; v_bench text; v_stats jsonb; v_enemy jsonb; v_damage integer; v_hp integer;
  v_stage integer; v_used integer; v_count integer; v_all_done boolean; v_key text; v_member jsonb;
  v_raw integer; v_def integer; v_guard boolean; v_newhp integer; v_log jsonb; v_flag text;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if p_action not in ('explore','talk','attack','attack_area','protect','recover','recruit','switch') then raise exception 'Invalid action'; end if;
  if p_action='recruit' and public.cityxiv_character_stats(p_character_id) is null then raise exception 'Invalid Sognatore'; end if;
  select * into v_room from public.cityxiv_rooms where id=p_room_id and status='playing' for update;
  if not found or not exists(select 1 from public.cityxiv_room_players where room_id=p_room_id and user_id=v_user) then raise exception 'Not a playing member'; end if;
  v_state:=v_room.game_state;
  if coalesce((v_state->>'lost')::boolean,false) or coalesce((v_state->>'won')::boolean,false) then raise exception 'Expedition is over'; end if;
  v_players:=v_state->'players'; v_player:=v_players->v_user::text;
  if v_player is null then raise exception 'Player state missing'; end if;
  v_used:=coalesce((v_player->>'actions_used')::integer,0); if v_used>=3 then raise exception 'No actions left this round'; end if;
  v_stage:=coalesce((v_state->>'stage')::integer,0); v_active:=v_player->>'active'; v_bench:=v_player->>'bench'; v_enemy:=v_state->'enemy';
  if p_action='explore' then
    v_state:=jsonb_set(v_state,'{explores}',to_jsonb(coalesce((v_state->>'explores')::integer,0)+1),true);
    v_flag:='explored_stage_'||v_stage;
    v_state:=jsonb_set(v_state,array['flags',v_flag],to_jsonb(true),true);
    if v_stage=0 then
      v_state:=jsonb_set(v_state,'{clues}',to_jsonb(coalesce((v_state->>'clues')::integer,0)+1),true);
    elsif v_stage in (1,2) and (v_enemy is null or coalesce((v_enemy->>'hp')::integer,0)<=0) and not coalesce((v_state->'flags'->>('enemy_spawned_stage_'||v_stage))::boolean,false) then
      select count(*) into v_count from public.cityxiv_room_players where room_id=p_room_id;
      v_hp:=case v_stage when 1 then 20+v_count*5 else 30+v_count*6 end;
      v_enemy:=jsonb_build_object('name',case v_stage when 1 then 'Custode delle Radici' else 'Sentinella dell’Archivio' end,'hp',v_hp,'max',v_hp,'phase',1,'rewarded',false);
      v_state:=jsonb_set(v_state,'{enemy}',v_enemy,true);
      v_state:=jsonb_set(v_state,array['flags','enemy_spawned_stage_'||v_stage],to_jsonb(true),true);
    end if;
  elsif p_action='talk' then
    v_state:=jsonb_set(v_state,'{clues}',to_jsonb(coalesce((v_state->>'clues')::integer,0)+1),true);
  elsif p_action='attack' or p_action='attack_area' then
    if v_enemy is null or coalesce((v_enemy->>'hp')::integer,0)<=0 then raise exception 'No active enemy'; end if;
    v_stats:=public.cityxiv_character_stats(v_active); if v_stats is null then raise exception 'Invalid active character'; end if;
    v_damage:=greatest(2,round((coalesce((v_stats->>'att')::numeric,1)*.65+coalesce((v_stats->>'vel')::numeric,1)*.15-coalesce((v_stats->>'dif')::numeric,1)*.08)::numeric)::integer);
    if p_action='attack_area' then v_damage:=greatest(2,floor(v_damage*.65)::integer); end if;
    v_hp:=greatest(0,coalesce((v_enemy->>'hp')::integer,0)-v_damage);
    v_enemy:=jsonb_set(v_enemy,'{hp}',to_jsonb(v_hp),true);
    if v_hp=0 and not coalesce((v_enemy->>'rewarded')::boolean,false) then
      v_enemy:=jsonb_set(v_enemy,'{rewarded}',to_jsonb(true),true);
      v_state:=jsonb_set(v_state,'{coins}',to_jsonb(coalesce((v_state->>'coins')::integer,0)+25),true);
      for v_key,v_member in select key,value from jsonb_each(v_players) loop
        v_member:=jsonb_set(v_member,'{xp}',to_jsonb(coalesce((v_member->>'xp')::integer,0)+30),true);
        v_players:=jsonb_set(v_players,array[v_key],v_member,true);
      end loop;
      v_player:=v_players->v_user::text;
    end if;
    v_state:=jsonb_set(v_state,'{enemy}',v_enemy,true);
  elsif p_action='protect' then
    v_player:=jsonb_set(v_player,'{guard}',to_jsonb(true),true);
  elsif p_action='recover' then
    v_player:=jsonb_set(v_player,'{hp}',to_jsonb(least(20,coalesce((v_player->>'hp')::integer,20)+5)),true);
    v_player:=jsonb_set(v_player,'{guard}',to_jsonb(false),true);
  elsif p_action='recruit' then
    if v_bench is not null then raise exception 'Bench already occupied'; end if;
    for v_key,v_member in select key,value from jsonb_each(v_players) loop
      if (v_member->>'active')=p_character_id or (v_member->>'bench')=p_character_id then raise exception 'Character already in party'; end if;
    end loop;
    v_player:=jsonb_set(v_player,'{bench}',to_jsonb(p_character_id),true);
    v_player:=jsonb_set(v_player,'{bench_hp}',to_jsonb(20),true);
  elsif p_action='switch' then
    if v_bench is null then raise exception 'No bench Sognatore'; end if;
    v_newhp:=coalesce((v_player->>'hp')::integer,20);
    v_player:=jsonb_set(v_player,'{active}',to_jsonb(v_bench),true);
    v_player:=jsonb_set(v_player,'{bench}',to_jsonb(v_active),true);
    v_player:=jsonb_set(v_player,'{hp}',to_jsonb(coalesce((v_player->>'bench_hp')::integer,20)),true);
    v_player:=jsonb_set(v_player,'{bench_hp}',to_jsonb(v_newhp),true);
    v_player:=jsonb_set(v_player,'{guard}',to_jsonb(false),true);
  end if;
  v_player:=jsonb_set(v_player,'{actions_used}',to_jsonb(v_used+1),true);
  v_players:=jsonb_set(v_players,array[v_user::text],v_player,true);
  v_state:=jsonb_set(v_state,'{players}',v_players,true);
  v_log:=coalesce(v_state->'log','[]'::jsonb)||jsonb_build_array(jsonb_build_object('action',p_action,'user_id',v_user,'at',now()));
  v_state:=jsonb_set(v_state,'{log}',v_log,true);
  select count(*) into v_count from public.cityxiv_room_players where room_id=p_room_id;
  v_all_done:=true;
  for v_key,v_member in select key,value from jsonb_each(v_players) loop
    if coalesce((v_member->>'actions_used')::integer,0)<3 then v_all_done:=false; exit; end if;
  end loop;
  if v_all_done and v_count>0 then
    v_enemy:=v_state->'enemy';
    if v_enemy is not null and coalesce((v_enemy->>'hp')::integer,0)>0 then
      v_raw:=case when v_stage=3 and coalesce((v_enemy->>'phase')::integer,1)=2 then 8+floor(v_count*2)::integer else 5+floor(v_count*1.5)::integer end;
      for v_key,v_member in select key,value from jsonb_each(v_players) loop
        v_stats:=public.cityxiv_character_stats(v_member->>'active');
        v_def:=coalesce((v_stats->>'dif')::integer,1);
        v_damage:=greatest(1,v_raw-floor(v_def/5)::integer);
        if coalesce((v_member->>'guard')::boolean,false) then v_damage:=ceil(v_damage/2.0)::integer; end if;
        v_newhp:=greatest(0,coalesce((v_member->>'hp')::integer,20)-v_damage);
        v_member:=jsonb_set(v_member,'{hp}',to_jsonb(v_newhp),true);
        v_member:=jsonb_set(v_member,'{guard}',to_jsonb(false),true);
        v_member:=jsonb_set(v_member,'{actions_used}',to_jsonb(0),true);
        v_players:=jsonb_set(v_players,array[v_key],v_member,true);
      end loop;
      v_state:=jsonb_set(v_state,'{players}',v_players,true);
      if v_stage=3 and coalesce((v_enemy->>'hp')::integer,0)<=coalesce((v_enemy->>'max')::integer,1)/2 and coalesce((v_enemy->>'phase')::integer,1)=1 then
        v_enemy:=jsonb_set(v_enemy,'{phase}',to_jsonb(2),true); v_state:=jsonb_set(v_state,'{enemy}',v_enemy,true);
      end if;
      v_all_done:=true;
      for v_key,v_member in select key,value from jsonb_each(v_players) loop
        if coalesce((v_member->>'hp')::integer,0)>0 or (v_member->>'bench') is not null and coalesce((v_member->>'bench_hp')::integer,0)>0 then v_all_done:=false; exit; end if;
      end loop;
      if v_all_done then v_state:=jsonb_set(v_state,'{lost}',to_jsonb(true),true); end if;
    else
      for v_key,v_member in select key,value from jsonb_each(v_players) loop
        v_member:=jsonb_set(v_member,'{actions_used}',to_jsonb(0),true); v_member:=jsonb_set(v_member,'{guard}',to_jsonb(false),true);
        v_players:=jsonb_set(v_players,array[v_key],v_member,true);
      end loop;
      v_state:=jsonb_set(v_state,'{players}',v_players,true);
    end if;
    v_state:=jsonb_set(v_state,'{round}',to_jsonb(coalesce((v_state->>'round')::integer,1)+1),true);
  end if;
  update public.cityxiv_rooms set game_state=v_state,updated_at=now() where id=p_room_id;
  return v_state;
end $$;

create or replace function public.cityxiv_advance(p_room_id uuid)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_room public.cityxiv_rooms; v_state jsonb; v_stage integer; v_enemy jsonb; v_next integer; v_players jsonb; v_key text; v_member jsonb; v_count integer;
begin
  select * into v_room from public.cityxiv_rooms where id=p_room_id for update;
  if not found or v_room.host_id<>auth.uid() or v_room.status<>'playing' then raise exception 'Host only'; end if;
  v_state:=v_room.game_state; v_stage:=coalesce((v_state->>'stage')::integer,0); v_enemy:=v_state->'enemy';
  if coalesce((v_state->>'lost')::boolean,false) then raise exception 'Party defeated'; end if;
  if coalesce((v_state->>'won')::boolean,false) then raise exception 'Expedition already completed'; end if;
  if v_stage=0 then
    if coalesce((v_state->>'clues')::integer,0)<2 or not coalesce((v_state->'flags'->>'explored_stage_0')::boolean,false) then raise exception 'Piazza: explore and gather two clues'; end if;
  elsif v_stage in (1,2) then
    if not coalesce((v_state->'flags'->>('explored_stage_'||v_stage))::boolean,false) or v_enemy is null or coalesce((v_enemy->>'hp')::integer,0)>0 then raise exception 'Explore and clear the stage encounter'; end if;
  elsif v_stage=3 then
    if v_enemy is null or coalesce((v_enemy->>'hp')::integer,0)>0 then raise exception 'Defeat the Seal'; end if;
    v_state:=jsonb_set(v_state,'{won}',to_jsonb(true),true);
    v_state:=jsonb_set(v_state,'{coins}',to_jsonb(coalesce((v_state->>'coins')::integer,0)+100),true);
    v_players:=v_state->'players';
    for v_key,v_member in select key,value from jsonb_each(v_players) loop
      v_member:=jsonb_set(v_member,'{xp}',to_jsonb(coalesce((v_member->>'xp')::integer,0)+100),true);
      v_players:=jsonb_set(v_players,array[v_key],v_member,true);
    end loop;
    v_state:=jsonb_set(v_state,'{players}',v_players,true);
    update public.cityxiv_rooms set status='finished',game_state=v_state,updated_at=now() where id=v_room.id;
    return v_state;
  end if;
  v_next:=v_stage+1;
  v_state:=jsonb_set(v_state,'{stage}',to_jsonb(v_next),true);
  v_state:=jsonb_set(v_state,'{enemy}','null'::jsonb,true);
  if v_next=3 then
    select count(*) into v_count from public.cityxiv_room_players where room_id=v_room.id;
    v_enemy:=jsonb_build_object('name','Sigillo Vivente','hp',70+v_count*15,'max',70+v_count*15,'phase',1,'rewarded',false);
    v_state:=jsonb_set(v_state,'{enemy}',v_enemy,true);
  end if;
  update public.cityxiv_rooms set game_state=v_state,updated_at=now() where id=v_room.id;
  return v_state;
end $$;

create or replace function public.cityxiv_leave_room(p_room_id uuid)
returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
declare v_user uuid:=auth.uid(); v_room public.cityxiv_rooms; v_next uuid; v_state jsonb; v_count integer;
begin
  select * into v_room from public.cityxiv_rooms where id=p_room_id for update;
  if not found or not exists(select 1 from public.cityxiv_room_players where room_id=p_room_id and user_id=v_user) then return true; end if;
  delete from public.cityxiv_room_players where room_id=p_room_id and user_id=v_user;
  select count(*) into v_count from public.cityxiv_room_players where room_id=p_room_id;
  if v_count=0 then delete from public.cityxiv_rooms where id=p_room_id; return true; end if;
  if v_room.host_id=v_user then
    select user_id into v_next from public.cityxiv_room_players where room_id=p_room_id order by joined_at limit 1;
    update public.cityxiv_rooms set host_id=v_next,updated_at=now() where id=p_room_id;
  end if;
  v_state:=v_room.game_state; v_state:=jsonb_set(v_state,'{players}',coalesce(v_state->'players','{}'::jsonb)-v_user::text,true);
  update public.cityxiv_rooms set game_state=v_state,updated_at=now() where id=p_room_id;
  return true;
end $$;

-- RPC-only writes; never expose the service role or direct client writes.
revoke all on function public.cityxiv_create_room(text,text,integer) from public;
revoke all on function public.cityxiv_join_room(text,text,text) from public;
revoke all on function public.cityxiv_set_ready(uuid,boolean) from public;
revoke all on function public.cityxiv_start_room(uuid) from public;
revoke all on function public.cityxiv_update_position(uuid,double precision,double precision) from public;
revoke all on function public.cityxiv_ping(uuid) from public;
revoke all on function public.cityxiv_resume_room() from public;
revoke all on function public.cityxiv_leave_room(uuid) from public;
revoke all on function public.cityxiv_action(uuid,text,text) from public;
revoke all on function public.cityxiv_advance(uuid) from public;
grant execute on function public.cityxiv_create_room(text,text,integer),public.cityxiv_join_room(text,text,text),public.cityxiv_set_ready(uuid,boolean),public.cityxiv_start_room(uuid),public.cityxiv_update_position(uuid,double precision,double precision),public.cityxiv_ping(uuid),public.cityxiv_resume_room(),public.cityxiv_leave_room(uuid),public.cityxiv_action(uuid,text,text),public.cityxiv_advance(uuid) to authenticated;

do $$ begin
  if exists(select 1 from pg_publication where pubname='supabase_realtime') then
    begin alter publication supabase_realtime add table public.cityxiv_rooms; exception when duplicate_object then null; end;
    begin alter publication supabase_realtime add table public.cityxiv_room_players; exception when duplicate_object then null; end;
  end if;
end $$;
