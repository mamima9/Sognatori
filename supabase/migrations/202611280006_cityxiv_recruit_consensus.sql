-- City XIV: contextual recruitment with unanimous active-party consensus.
-- Offers are side decisions in the zone action phase and do not consume a combat action.
-- Each member may initiate at most one offer per stage; a veto closes the offer.

create or replace function public.cityxiv_recruit_offer(p_room_id uuid,p_character_id text)
returns jsonb
language plpgsql
security definer
set search_path=public,pg_temp
as $cityxiv_recruit_offer$
declare
  v_user uuid:=auth.uid();
  v_room public.cityxiv_rooms;
  v_state jsonb;
  v_players jsonb;
  v_player jsonb;
  v_offer jsonb;
  v_key text;
  v_member jsonb;
  v_stage integer;
  v_flag text;
  v_active_count integer;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if public.cityxiv_character_stats(p_character_id) is null then raise exception 'Invalid Sognatore'; end if;

  select * into v_room from public.cityxiv_rooms where id=p_room_id and status='playing' for update;
  if not found or not exists(select 1 from public.cityxiv_room_players where room_id=p_room_id and user_id=v_user) then
    raise exception 'Not a playing member';
  end if;
  update public.cityxiv_room_players set last_seen=now() where room_id=p_room_id and user_id=v_user;

  v_state:=v_room.game_state;
  v_stage:=coalesce((v_state->>'stage')::integer,0);
  if v_stage>2 or coalesce(v_state->>'phase','players')<>'players' then raise exception 'Recruitment is available only during zone preparation'; end if;
  if coalesce((v_state->>'won')::boolean,false) or coalesce((v_state->>'lost')::boolean,false) then raise exception 'Expedition is over'; end if;
  if v_state->'enemy' is not null and v_state->'enemy'<>'null'::jsonb and coalesce((v_state->'enemy'->>'hp')::integer,0)>0 then
    raise exception 'Finish the encounter before proposing recruitment';
  end if;

  v_players:=coalesce(v_state->'players','{}'::jsonb);
  v_player:=v_players->v_user::text;
  if v_player is null or v_player->>'bench' is not null then raise exception 'Your bench is already occupied'; end if;
  if coalesce((v_player->>'actions_used')::integer,0)>=3 then raise exception 'No actions left this round'; end if;

  v_flag:='recruit_offer_attempt_'||v_user::text||'_stage_'||v_stage;
  if coalesce((v_state->'flags'->>v_flag)::boolean,false) then raise exception 'You already proposed recruitment this zone'; end if;

  v_offer:=v_state->'recruit_offer';
  if v_offer is not null and v_offer<>'null'::jsonb then
    if coalesce((v_offer->>'stage')::integer,-1)=v_stage then raise exception 'A recruitment offer is already pending'; end if;
    v_state:=jsonb_set(v_state,'{recruit_offer}','null'::jsonb,true);
  end if;

  for v_key,v_member in select key,value from jsonb_each(v_players) loop
    if v_member->>'active'=p_character_id or v_member->>'bench'=p_character_id then
      raise exception 'That Sognatore is already in the party';
    end if;
  end loop;

  select count(*) into v_active_count from public.cityxiv_room_players
    where room_id=p_room_id and last_seen>now()-interval '90 seconds';
  if v_active_count<1 then raise exception 'No active party members'; end if;

  v_state:=jsonb_set(v_state,'{flags}',coalesce(v_state->'flags','{}'::jsonb)||jsonb_build_object(v_flag,true),true);
  v_offer:=jsonb_build_object(
    'candidate',p_character_id,
    'proposer',v_user,
    'stage',v_stage,
    'votes',jsonb_build_object(v_user::text,true),
    'created_at',clock_timestamp()
  );
  v_state:=jsonb_set(v_state,'{recruit_offer}',v_offer,true);
  v_state:=jsonb_set(v_state,'{log}',coalesce(v_state->'log','[]'::jsonb)||jsonb_build_array(jsonb_build_object('action','recruit_offer','user_id',v_user,'candidate',p_character_id,'at',clock_timestamp())),true);
  update public.cityxiv_rooms set game_state=v_state,updated_at=now() where id=p_room_id;
  return v_state;
end
$cityxiv_recruit_offer$;

create or replace function public.cityxiv_recruit_vote(p_room_id uuid,p_accept boolean)
returns jsonb
language plpgsql
security definer
set search_path=public,pg_temp
as $cityxiv_recruit_vote$
declare
  v_user uuid:=auth.uid();
  v_room public.cityxiv_rooms;
  v_state jsonb;
  v_offer jsonb;
  v_votes jsonb;
  v_players jsonb;
  v_member jsonb;
  v_key text;
  v_stage integer;
  v_candidate text;
  v_proposer uuid;
  v_flag text;
  v_active_count integer;
  v_yes_count integer;
  v_all_yes boolean;
  v_proposer_active boolean;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  select * into v_room from public.cityxiv_rooms where id=p_room_id and status='playing' for update;
  if not found then raise exception 'Room not active'; end if;
  update public.cityxiv_room_players set last_seen=now() where room_id=p_room_id and user_id=v_user;
  if not found then raise exception 'Not a room member'; end if;

  v_state:=v_room.game_state;
  v_stage:=coalesce((v_state->>'stage')::integer,0);
  if v_stage>2 or coalesce(v_state->>'phase','players')<>'players' then raise exception 'Voting is closed for this phase'; end if;
  if v_state->'enemy' is not null and v_state->'enemy'<>'null'::jsonb and coalesce((v_state->'enemy'->>'hp')::integer,0)>0 then
    raise exception 'Finish the encounter before voting';
  end if;

  v_offer:=v_state->'recruit_offer';
  if v_offer is null or v_offer='null'::jsonb or coalesce((v_offer->>'stage')::integer,-1)<>v_stage then
    raise exception 'No current recruitment offer';
  end if;
  v_candidate:=v_offer->>'candidate';
  v_proposer:=(v_offer->>'proposer')::uuid;
  if public.cityxiv_character_stats(v_candidate) is null then raise exception 'Invalid Sognatore in offer'; end if;

  if not p_accept then
    v_flag:='recruit_offer_attempt_'||v_proposer::text||'_stage_'||v_stage;
    v_state:=jsonb_set(v_state,'{recruit_offer}','null'::jsonb,true);
    v_state:=jsonb_set(v_state,'{log}',coalesce(v_state->'log','[]'::jsonb)||jsonb_build_array(jsonb_build_object('action','recruit_veto','user_id',v_user,'candidate',v_candidate,'at',clock_timestamp())),true);
    update public.cityxiv_rooms set game_state=v_state,updated_at=now() where id=p_room_id;
    return v_state;
  end if;

  v_votes:=coalesce(v_offer->'votes','{}'::jsonb);
  v_votes:=jsonb_set(v_votes,array[v_user::text],to_jsonb(true),true);
  v_offer:=jsonb_set(v_offer,'{votes}',v_votes,true);
  v_state:=jsonb_set(v_state,'{recruit_offer}',v_offer,true);

  select count(*) into v_active_count from public.cityxiv_room_players
    where room_id=p_room_id and last_seen>now()-interval '90 seconds';
  v_all_yes:=v_active_count>0;
  v_yes_count:=0;
  v_proposer_active:=false;
  for v_key in select user_id::text from public.cityxiv_room_players
    where room_id=p_room_id and last_seen>now()-interval '90 seconds'
  loop
    if v_key=v_proposer::text then v_proposer_active:=true; end if;
    if coalesce((v_votes->>v_key)::boolean,false) then v_yes_count:=v_yes_count+1; else v_all_yes:=false; end if;
  end loop;

  if v_all_yes then
    v_players:=coalesce(v_state->'players','{}'::jsonb);
    v_member:=v_players->v_proposer::text;
    v_flag:='recruit_offer_attempt_'||v_proposer::text||'_stage_'||v_stage;
    if not v_proposer_active or v_member is null or v_member->>'bench' is not null then
      v_state:=jsonb_set(v_state,'{recruit_offer}','null'::jsonb,true);
      v_state:=jsonb_set(v_state,'{log}',coalesce(v_state->'log','[]'::jsonb)||jsonb_build_array(jsonb_build_object('action','recruit_cancelled','candidate',v_candidate,'at',clock_timestamp())),true);
    else
      for v_key,v_member in select key,value from jsonb_each(v_players) loop
        if v_member->>'active'=v_candidate or v_member->>'bench'=v_candidate then
          v_state:=jsonb_set(v_state,'{recruit_offer}','null'::jsonb,true);
          v_state:=jsonb_set(v_state,'{log}',coalesce(v_state->'log','[]'::jsonb)||jsonb_build_array(jsonb_build_object('action','recruit_cancelled_duplicate','candidate',v_candidate,'at',clock_timestamp())),true);
          update public.cityxiv_rooms set game_state=v_state,updated_at=now() where id=p_room_id;
          return v_state;
        end if;
      end loop;
      v_member:=v_players->v_proposer::text;
      v_member:=jsonb_set(v_member,'{bench}',to_jsonb(v_candidate),true);
      v_member:=jsonb_set(v_member,'{bench_hp}',to_jsonb(20),true);
      v_players:=jsonb_set(v_players,array[v_proposer::text],v_member,true);
      v_state:=jsonb_set(v_state,'{players}',v_players,true);
      v_state:=jsonb_set(v_state,'{recruit_offer}','null'::jsonb,true);
      v_state:=jsonb_set(v_state,'{log}',coalesce(v_state->'log','[]'::jsonb)||jsonb_build_array(jsonb_build_object('action','recruit_accepted','user_id',v_proposer,'candidate',v_candidate,'at',clock_timestamp())),true);
    end if;
  end if;

  update public.cityxiv_rooms set game_state=v_state,updated_at=now() where id=p_room_id;
  return v_state;
end
$cityxiv_recruit_vote$;

revoke all on function public.cityxiv_recruit_offer(uuid,text) from public,anon;
revoke all on function public.cityxiv_recruit_vote(uuid,boolean) from public,anon;
grant execute on function public.cityxiv_recruit_offer(uuid,text) to authenticated;
grant execute on function public.cityxiv_recruit_vote(uuid,boolean) to authenticated;
