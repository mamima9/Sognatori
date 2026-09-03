// @ts-nocheck

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase/client";
import MultiplayerBattleArena from "@/components/game/MultiplayerBattleArena";
import { useAuth } from "@/lib/AuthContext";
import { ROSTER } from "@/lib/sognatoriData";

const STORAGE_KEY = "sognatori_test_random_match";

const shuffle = (items) => {
  return [...items].sort(() => Math.random() - 0.5);
};

export default function TestRandom() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [matchId, setMatchId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    const createOrJoinMatch = async () => {
      try {
        /*
         * ==========================================================
         * 1. SE QUESTO DISPOSITIVO AVEVA GIÀ CREATO UN TEST
         *    lo recuperiamo.
         * ==========================================================
         */

        const savedMatchId = localStorage.getItem(STORAGE_KEY);

        if (savedMatchId) {
          const { data: savedMatch, error: savedError } =
            await supabase
              .from("matches")
              .select("*")
              .eq("id", savedMatchId)
              .maybeSingle();

          if (savedError) throw savedError;

          if (
            savedMatch &&
            savedMatch.player1_id === user.id &&
            savedMatch.mode === "test_random" &&
            savedMatch.status !== "done"
          ) {
            if (!cancelled) {
              setMatchId(savedMatch.id);
            }

            return;
          }

          localStorage.removeItem(STORAGE_KEY);
        }

        /*
         * ==========================================================
         * 2. CERCA UNA PARTITA TEST RANDOM IN ATTESA
         *
         * IMPORTANTE:
         * non filtriamo player1_id perché i due dispositivi
         * possono usare lo STESSO account.
         * ==========================================================
         */

        const { data: waitingMatch, error: searchError } =
          await supabase
            .from("matches")
            .select("*")
            .eq("mode", "test_random")
            .eq("status", "waiting")
            .is("player2_id", null)
            .order("created_at", { ascending: true })
            .limit(1)
            .maybeSingle();

        if (searchError) throw searchError;

        /*
         * ==========================================================
         * 3. SE TROVIAMO UNA PARTITA:
         *    questo dispositivo diventa PLAYER 2
         * ==========================================================
         */

        if (waitingMatch) {
          const { data: joinedMatch, error: joinError } =
            await supabase
              .from("matches")
              .update({
                player2_id: user.id,
                player2_name:
                  user.user_metadata?.full_name ||
                  user.email ||
                  "TEST PLAYER 2",
              })
              .eq("id", waitingMatch.id)
              .is("player2_id", null)
              .select()
              .single();

          if (joinError) throw joinError;

          if (!cancelled) {
            setMatchId(joinedMatch.id);
          }

          return;
        }

        /*
         * ==========================================================
         * 4. NON ESISTE NESSUNA PARTITA:
         *    questo dispositivo diventa PLAYER 1
         * ==========================================================
         */

        const shuffledRoster = shuffle(ROSTER);

        const player1Team = shuffledRoster
          .slice(0, 4)
          .map((s) => s.id);

        const player2Team = shuffledRoster
          .slice(4, 8)
          .map((s) => s.id);

        const { data: newMatch, error: createError } =
          await supabase
            .from("matches")
            .insert({
              player1_id: user.id,
              player1_name:
                user.user_metadata?.full_name ||
                user.email ||
                "TEST PLAYER 1",

              player1_team_ids: player1Team,
              player2_team_ids: player2Team,

              status: "waiting",
              mode: "test_random",
              room_code: null,
            })
            .select()
            .single();

        if (createError) throw createError;

        /*
         * Salviamo l'ID SOLO su questo dispositivo.
         * Così se il Player 1 ricarica la pagina non rischia
         * di creare/entrare in un altro test.
         */
        localStorage.setItem(STORAGE_KEY, newMatch.id);

        if (!cancelled) {
          setMatchId(newMatch.id);
        }
      } catch (err) {
        console.error("Test Random error:", err);

        if (!cancelled) {
          setError(
            err?.message ||
              "Errore durante la creazione della partita Test Random."
          );
        }
      }
    };

    createOrJoinMatch();

    return () => {
      cancelled = true;
    };
  }, [user]);

  /*
   * ==========================================================
   * ERRORE
   * ==========================================================
   */

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-4 px-6">
        <div className="text-red-400 text-center">
          {error}
        </div>

        <button
          onClick={() => navigate("/multiplayer")}
          className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20"
        >
          ← Torna al multiplayer
        </button>
      </div>
    );
  }

  /*
   * ==========================================================
   * CARICAMENTO
   * ==========================================================
   */

  if (!matchId) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-white/20 border-t-amber-400 rounded-full animate-spin mx-auto mb-5" />

          <div className="text-lg font-bold mb-2">
            🧪 Test Random
          </div>

          <div className="text-sm text-slate-400">
            Cerco un avversario…
          </div>
        </div>
      </div>
    );
  }

  /*
   * ==========================================================
   * BATTLE ARENA
   *
   * L'Arena gestisce già:
   *
   * PLAYER 1 → player1
   * PLAYER 2 → player2
   *
   * e aspetta che entrambi siano presenti prima
   * di inizializzare la battaglia.
   * ==========================================================
   */

  return (
    <MultiplayerBattleArena
      matchId={matchId}
      onEnd={() => {
        localStorage.removeItem(STORAGE_KEY);
        navigate("/multiplayer");
      }}
    />
  );
}
