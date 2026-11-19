import { supabase } from "@/lib/supabase";

// API unica per la collezione condivisa di Arabnite. Le modifiche passano da RPC SQL.
export async function loadArabniteCollection() {
  const [{ data: coins, error: walletError }, { data: cards, error: cardsError }] = await Promise.all([
    supabase.rpc("sognatore_get_wallet"),
    supabase.from("sognatore_card_instances").select("id,card_id,serial_number,rarity").not("owner_id", "is", null).order("card_id").order("serial_number"),
  ]);
  if (walletError) throw walletError;
  if (cardsError) throw cardsError;
  return { coins: Number(coins ?? 0), cards: cards || [] };
}

export async function openSharedArabnitePack(kind = "standard") {
  const { data, error } = await supabase.rpc("sognatore_open_pack", { p_kind: kind });
  if (error) throw error;
  return data || [];
}

export async function getArabniteMarket() {
  const { data, error } = await supabase.from("sognatore_market_listings")
    .select("id,card_instance_id,seller_id,price,created_at,sognatore_card_instances(id,card_id,serial_number,rarity)")
    .eq("status", "ACTIVE").order("created_at", { ascending: false }).limit(60);
  if (error) throw error;
  return data || [];
}

export async function listArabniteCard(cardInstanceId, price) {
  const { data, error } = await supabase.rpc("sognatore_list_card", { p_card_instance_id: cardInstanceId, p_price: Number(price) });
  if (error) throw error;
  return data;
}
export async function buyArabniteListing(listingId) {
  const { error } = await supabase.rpc("sognatore_buy_listing", { p_listing_id: listingId });
  if (error) throw error;
}
export async function cancelArabniteListing(listingId) {
  const { error } = await supabase.rpc("sognatore_cancel_listing", { p_listing_id: listingId });
  if (error) throw error;
}
export async function proposeArabniteTrade(recipientId, offeredCardId, requestedCardId) {
  const { data, error } = await supabase.rpc("sognatore_propose_trade", { p_recipient_id: recipientId, p_offered_card_id: offeredCardId, p_requested_card_id: requestedCardId });
  if (error) throw error;
  return data;
}
export async function respondArabniteTrade(tradeId, accept) {
  const { error } = await supabase.rpc("sognatore_respond_trade", { p_trade_id: tradeId, p_accept: Boolean(accept) });
  if (error) throw error;
}
