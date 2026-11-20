import { supabase } from "@/lib/supabase";

export async function getArabniteProgress() {
  const { data, error } = await supabase.rpc("sognatore_arabnite_get_progress");
  if (error) throw error;
  return data || { coins: 0, default_packs: 0, discovered_artwork_ids: [], duplicate_artwork_count: 0, adli_reward_claimed: false };
}
async function runProgressRpc(name, args = {}) {
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw error;
  return data;
}
export const collectDefaultPack = (pickupId) => runProgressRpc("sognatore_arabnite_collect_pack", { p_pickup_id: pickupId });
export const openDefaultPack = () => runProgressRpc("sognatore_arabnite_open_default_pack");
export const buyDefaultPack = () => runProgressRpc("sognatore_arabnite_buy_default_pack");
export const sellDuplicateArtwork = () => runProgressRpc("sognatore_arabnite_sell_duplicate");
export const claimArabniteJar = (cycleIndex, jarSlot) => runProgressRpc("sognatore_arabnite_claim_jar", { p_cycle_index: cycleIndex, p_jar_slot: jarSlot });
export async function claimAdliReward() {
  const { data, error } = await supabase.rpc("sognatore_adli_claim_reward");
  if (error) throw error;
  return data || [];
}
