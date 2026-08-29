// @ts-nocheck

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase/client";
import MultiplayerBattleArena from "@/components/game/MultiplayerBattleArena";
import MultiplayerAuction from "@/components/game/MultiplayerAuction";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/i18n";

const LOGO = "/images/bannerLOGOSOGNATORI.png";

const ROOM_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const generateRoomCode = () =>
  Array.from(
    { length: 6 },
    () => ROOM_CHARS[Math.floor(Math.random() * ROOM_CHARS.length)]
  ).join("");

export default function Multiplayer() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [screen, setScreen] = useState("menu");
  const [matchId, setMatchId] = useState(null);
  const [mode, setMode] = useState(null);
  const [roomCode, setRoomCode] = useState("");
  const [match, setMatch] = useState(null);
  const [error, setError] = useState("");

  // --------------------------------------------------
  // CLEANUP MATCHES STALE
  // --------------------------------------------------

  useEffect(() => {
    if (!user) return;

    const cleanup = async () => {
      try {
        const fiveMinAgo = new Date(
          Date.now() - 5 * 60 * 1000
        ).toISOString();

        const { data: waiting, error: fetchError } = await supabase
          .from("matches")
          .select("id, player1_id, created_at")
          .eq("status", "waiting")
          .eq("player1_id", user.id)
          .lt("created_at", fiveMinAgo);

        if (fetchError) {
          console.error("Cleanup error:", fetchError);
          return;
        }

        if (!waiting || waiting.length === 0) return;

        for (const m of waiting) {
          await supabase
            .from("matches")
            .delete()
            .eq("id", m.id)
            .eq("player1_id", user.id)
            .eq("status", "waiting");
        }
      } catch (e) {
        console.error("Match cleanup failed:", e);
      }
    };

    cleanup();
  }, [user]);

  // --------------------------------------------------
  // FIND / CREATE MATCH
  // --------------------------------------------------

  const findMatch = async (selectedMode, code = "") => {
    setError("");

    if (!user) {
      setError(t("multiplayer.mustLogin"));
      return;
    }

    try {
      let query = supabase
        .from("matches")
        .select("*")
        .eq("status", "waiting")
        .eq("mode", selectedMode)
        .is("player2_id", null);

      if (selectedMode === "private" && code) {
        query = query.eq("room_code", code);
      }

      const { data: waiting, error: searchError } = await query;

      if (searchError) {
        console.error("Find match error:", searchError);
        throw searchError;
      }

      const joinable = (waiting || []).filter(
        (m) => m.player1_id !== user.id && !m.player2_id
      );

      // ------------------------------------------------
      // JOIN EXISTING MATCH
      // ------------------------------------------------

      if (joinable.length > 0) {
        const m =
          joinable[Math.floor(Math.random() * joinable.length)];

        const { data: updatedMatch, error: updateError } =
          await supabase
            .from("matches")
            .update({
              player2_id: user.id,
              player2_name:
                user.user_metadata?.full_name || user.email,
            })
            .eq("id", m.id)
            .eq("status", "waiting")
            .is("player2_id", null)
            .select()
            .single();

        if (updateError) {
          console.error("Join match error:", updateError);
          throw updateError;
        }

        setMatch(updatedMatch);
        setMatchId(updatedMatch.id);
        setMode(selectedMode);

        // Il giocatore 2 entra direttamente nell'asta.
        setScreen("auction");
      }

      // ------------------------------------------------
      // CREATE NEW MATCH
      // ------------------------------------------------

      else {
        const rc =
          selectedMode === "private"
            ? code || generateRoomCode()
            : null;

        const { data: newMatch, error: createError } =
          await supabase
            .from("matches")
            .insert({
              player1_id: user.id,
              player1_name:
                user.user_metadata?.full_name || user.email,
              status: "waiting",
              mode: selectedMode,
              room_code: rc,
            })
            .select()
            .single();

        if (createError) {
          console.error("Create match error:", createError);
          throw createError;
        }

        setMatch(newMatch);
        setMatchId(newMatch.id);
        setMode(selectedMode);
        setScreen("lobby");
      }
    } catch (e) {
      console.error("Match error:", e);
      setError(t("multiplayer.error"));
    }
  };

  // --------------------------------------------------
  // LOAD MATCH + LOBBY POLLING
  // --------------------------------------------------
  //
  // IMPORTANTE:
  // Qui NON usiamo Supabase Realtime.
  //
  // MultiplayerAuction gestisce il proprio canale Realtime.
  // Evitiamo così il conflitto di subscription che causava:
  //
  // "cannot add 'postgres_changes' callbacks ... after subscribe()"
  //
  // --------------------------------------------------

  useEffect(() => {
    if (!matchId) return;

    // Realtime viene gestito dall'Auction/Battle.
    // Il polling resta attivo anche durante l'asta per rilevare
    // immediatamente il passaggio finale a prematch/battle.
    if (screen !== "lobby" && screen !== "auction") return;

    let mounted = true;

    const fetchMatch = async () => {
      try {
        const { data: m, error: fetchError } = await supabase
          .from("matches")
          .select("*")
          .eq("id", matchId)
          .single();

        if (fetchError) {
          console.error("Fetch match error:", fetchError);
          return;
        }

        if (!mounted || !m) return;

        setMatch(m);

        // ------------------------------------------------
        // SECOND PLAYER JOINED
        // ------------------------------------------------

        if (m.player1_id && m.player2_id) {
          setScreen("auction");
          return;
        }

        // ------------------------------------------------
        // MATCH ALREADY HAS GAME STATE
        // ------------------------------------------------

        if (m.game_state) {
          const phase = m.game_state.phase;

          if (
            phase === "auction_bidding" ||
            phase === "auction_setup" ||
            phase === "auction_select"
          ) {
            setScreen("auction");
            return;
          }

          if (
            phase === "prematch" ||
            phase === "select" ||
            phase === "animating" ||
            phase === "switch"
          ) {
            setScreen("battle");
            return;
          }
        }

        if (m.status === "done") {
          setScreen("battle");
        }
      } catch (e) {
        console.error("Fetch match failed:", e);
      }
    };

    // Prima verifica immediatamente.
    fetchMatch();

    // Poi controlla la lobby ogni 1.5 secondi.
    const pollInterval = setInterval(fetchMatch, 1500);

    return () => {
      mounted = false;
      clearInterval(pollInterval);
    };
  }, [matchId, screen]);

  // --------------------------------------------------
  // CANCEL MATCH
  // --------------------------------------------------

  const cancelMatch = async () => {
    if (!matchId || !match) return;

    if (match.status === "waiting") {
      try {
        // Player 1 created the room -> delete it
        if (
          match.player1_id === user?.id &&
          !match.player2_id
        ) {
          await supabase
            .from("matches")
            .delete()
            .eq("id", matchId)
            .eq("player1_id", user.id)
            .eq("status", "waiting");
        }

        // Player 2 leaves -> remove player 2
        else if (match.player2_id === user?.id) {
          await supabase
            .from("matches")
            .update({
              player2_id: null,
              player2_name: null,
              player2_team: null,
            })
            .eq("id", matchId)
            .eq("status", "waiting")
            .eq("player2_id", user.id);
        }
      } catch (e) {
        console.error("Cancel match error:", e);
      }
    }

    setMatchId(null);
    setMatch(null);
    setScreen("menu");
  };

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950 text-white">
      <AnimatePresence mode="wait">

        {/* ==================================================
            MENU
        ================================================== */}

        {screen === "menu" && (
          <motion.div
            key="menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col items-center justify-center px-6 py-10"
          >
            <Link
              to="/"
              className="absolute top-4 left-4 text-sm text-slate-400 hover:text-white"
            >
              ← {t("common.home")}
            </Link>

            <img
              src={LOGO}
              alt="Sognatori"
              className="h-16 object-contain mb-6"
            />

            <h2 className="text-2xl font-bold mb-2">
              {t("multiplayer.title")}
            </h2>

            <p className="text-sm text-slate-400 mb-8 text-center max-w-sm">
              {t("multiplayer.subtitle")}
            </p>

            {error && (
              <div className="text-red-400 text-sm mb-4">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-3 w-full max-w-xs">

              {/* COMPETITIVE */}

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => findMatch("competitive")}
                className="px-6 py-4 rounded-2xl bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 hover:border-red-500/50 transition text-left"
              >
                <div className="font-bold">
                  ⚔️ {t("mode.competitive")}
                </div>

                <div className="text-xs text-slate-400 mt-1">
                  {t("mode.competitiveDesc")}
                </div>
              </motion.button>

              {/* FRIENDLY */}

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => findMatch("friendly")}
                className="px-6 py-4 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-500/30 hover:border-emerald-500/50 transition text-left"
              >
                <div className="font-bold">
                  🤝 {t("mode.friendly")}
                </div>

                <div className="text-xs text-slate-400 mt-1">
                  {t("mode.friendlyDesc")}
                </div>
              </motion.button>

              {/* PRIVATE */}

              <div className="px-6 py-4 rounded-2xl bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-500/30">
                <div className="font-bold mb-2">
                  🔒 {t("mode.private")}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={t("multiplayer.roomCode")}
                    value={roomCode}
                    onChange={(e) =>
                      setRoomCode(e.target.value.toUpperCase())
                    }
                    maxLength={6}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-black/30 border border-white/20 text-sm focus:border-purple-400 focus:outline-none"
                  />

                  <button
                    onClick={() =>
                      findMatch("private", roomCode)
                    }
                    disabled={roomCode.length < 4}
                    className="px-4 py-1.5 rounded-lg bg-purple-500/40 hover:bg-purple-500/60 text-sm font-bold disabled:opacity-30 transition"
                  >
                    {t("multiplayer.enter")}
                  </button>
                </div>

                <button
                  onClick={() => {
                    const newCode = generateRoomCode();
                    setRoomCode(newCode);
                    findMatch("private", newCode);
                  }}
                  className="text-xs text-purple-400 hover:text-purple-300 mt-2"
                >
                  {t("multiplayer.createRoom")}
                </button>
              </div>
            </div>

            <Link
              to="/rankings"
              className="mt-6 text-sm text-amber-400 hover:text-amber-300"
            >
              📊 {t("multiplayer.rankingsLink")} →
            </Link>
          </motion.div>
        )}

        {/* ==================================================
            AUCTION
        ================================================== */}

        {screen === "auction" && matchId && (
          <motion.div
            key="auction"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <MultiplayerAuction
              matchId={matchId}
              onAbandon={() => {
                setScreen("menu");
                setMatchId(null);
                setMatch(null);
              }}
            />
          </motion.div>
        )}

        {/* ==================================================
            LOBBY
        ================================================== */}

        {screen === "lobby" && (
          <motion.div
            key="lobby"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col items-center justify-center px-6 py-10"
          >
            <Link
              to="/"
              className="absolute top-4 left-4 text-sm text-slate-400 hover:text-white"
            >
              ← {t("common.home")}
            </Link>

            <img
              src={LOGO}
              alt="Sognatori"
              className="h-16 object-contain mb-6"
            />

            <div className="text-2xl font-bold text-amber-400 mb-2">
              {t("multiplayer.waiting")}
            </div>

            {mode === "private" && match?.room_code && (
              <div className="text-sm text-slate-400 mb-2">
                {t("multiplayer.roomCode")}:{" "}
                <span className="font-mono font-bold text-purple-400 text-lg">
                  {match.room_code}
                </span>
              </div>
            )}

            <div className="text-xs text-slate-500 mb-6">
              {t("multiplayer.shareCode")}
            </div>

            <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin mb-6" />

            <button
              onClick={cancelMatch}
              className="px-6 py-2 rounded-full bg-white/10 font-bold text-sm hover:bg-white/20 transition"
            >
              {t("multiplayer.cancel")}
            </button>
          </motion.div>
        )}

        {/* ==================================================
            BATTLE
        ================================================== */}

        {screen === "battle" && matchId && (
          <motion.div
            key="battle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <MultiplayerBattleArena
              matchId={matchId}
              onEnd={() => {
                setScreen("menu");
                setMatchId(null);
                setMatch(null);
              }}
            />
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}