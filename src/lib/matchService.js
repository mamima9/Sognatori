import { supabase } from "./supabase";

export async function getMatch(matchId) {
  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .single();

  if (error) throw error;

  return data;
}

export async function updateMatch(matchId, updates) {
  const { data, error } = await supabase
    .from("matches")
    .update(updates)
    .eq("id", matchId)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export function subscribeToMatch(matchId, callback) {
  if (!matchId || typeof callback !== "function") {
    return () => {};
  }

  // Ogni subscription riceve un topic UNICO.
  // Evita conflitti quando Lobby/Auction vengono montati
  // durante lo stesso cambio di schermata.
  const uniqueId =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const channelName = `match-${matchId}-${uniqueId}`;

  let active = true;

  const channel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "matches",
        filter: `id=eq.${matchId}`,
      },
      (payload) => {
        if (!active) return;

        if (payload?.new) {
          callback(payload.new);
        }
      }
    )
    .subscribe((status) => {
      if (status === "CHANNEL_ERROR") {
        console.error(
          "Realtime match subscription error:",
          matchId
        );
      }
    });

  // Cleanup idempotente: può essere chiamato più volte
  // senza tentare di riutilizzare una subscription già chiusa.
  return () => {
    if (!active) return;

    active = false;

    try {
      supabase.removeChannel(channel);
    } catch (error) {
      console.warn(
        "Realtime channel cleanup warning:",
        error
      );
    }
  };
}

export async function createMatchHistory(history) {
  const { data, error } = await supabase
    .from("match_history")
    .insert(history)
    .select()
    .single();

  if (error) throw error;

  return data;
}
