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
  const channel = supabase
    .channel(`match-${matchId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "matches",
        filter: `id=eq.${matchId}`,
      },
      (payload) => {
        if (payload.new) {
          callback(payload.new);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
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