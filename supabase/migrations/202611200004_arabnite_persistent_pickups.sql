-- Include collected pickup IDs and claimed jar cycles in the progress payload,
-- so Arabnite pickups remain hidden after reconnecting or changing device.
create or replace function public.sognatore_arabnite_get_progress()
returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_row public.sognatore_arabnite_progress%rowtype;
  v_pack_ids text[];
  v_jar_keys text[];
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  insert into public.sognatore_arabnite_progress(user_id) values(v_user) on conflict do nothing;
  select * into v_row from public.sognatore_arabnite_progress where user_id=v_user;
  select coalesce(array_agg(pickup_id), '{}') into v_pack_ids
    from public.sognatore_arabnite_pack_pickups where user_id=v_user;
  select coalesce(array_agg(cycle_index::text || ':' || jar_slot::text), '{}') into v_jar_keys
    from public.sognatore_arabnite_jar_claims where user_id=v_user;
  return jsonb_build_object(
    'coins',v_row.coins,
    'default_packs',v_row.default_packs,
    'discovered_artwork_ids',v_row.discovered_artwork_ids,
    'duplicate_artwork_count',v_row.duplicate_artwork_count,
    'adli_reward_claimed',v_row.adli_reward_claimed,
    'collected_pack_ids',v_pack_ids,
    'claimed_jar_keys',v_jar_keys
  );
end $$;
