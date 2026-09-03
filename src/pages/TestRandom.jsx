// @ts-nocheck

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase/client";
import { ROSTER } from "@/lib/sognatoriData";
import MultiplayerBattleArena from "@/components/game/MultiplayerBattleArena";
import { useAuth } from "@/lib/AuthContext";

const shuffle = (items) => [...items].sort(() => Math.random() - 0.5);

export default function TestRandom() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [matchId, setMatchId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const createRandomMatch = async () => {
      if (!user) return;

      const shuffled = shuffle(ROSTER);
      const player1Team = shuffled.slice(0, 4).map((s) => s.id);
      const player2Team = shuffled.slice(4, 8).map((s) => s.id);

      const { data, error: insertError } = await supabase
        .from("matches")
        .insert({
          player1_id: user.id,
          player1_name: user.user_metadata?.full_name || user.email || "TEST",
          player2_id: user.id,
          player2_name: "TEST RANDOM",
          player1_team_ids: player1Team,
          player2_team_ids: player2Team,
          status: "waiting",
          mode: "test_random",
          room_code: null,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Random test match error:", insertError);
        setError(insertError.message || "Impossibile creare il test.");
        return;
      }

      if (!cancelled) setMatchId(data.id);
    };

    createRandomMatch();

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-4 px-6">
        <div className="text-red-400 text-center">{error}</div>
        <button
          onClick={() => navigate("/multiplayer")}
          className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20"
        >
          ← Torna al multiplayer
        </button>
      </div>
    );
  }

  if (!matchId) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-white/20 border-t-amber-400 rounded-full animate-spin mx-auto mb-4" />
          <div className="text-sm text-slate-400">Genero due squadre casuali…</div>
        </div>
      </div>
    );
  }

  return <MultiplayerBattleArena matchId={matchId} onEnd={() => navigate("/multiplayer")} />;
}
