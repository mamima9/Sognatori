import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase/client";
import { ROSTER } from "@/lib/sognatoriData";
import { SognatoreImage, FactionBadge } from "@/components/game/HealthBar";
import { useLanguage } from "@/lib/i18n";

const LOGO =
  "https://media.base44.com/images/public/6a88c0790ad6d8971067dd2b/970a32337_bannerLOGOSOGNATORI.png";

export default function Rankings() {
  const { t } = useLanguage();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("players");

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);

      try {
        const { data, error } = await supabase
          .from("match_history")
          .select("*")
          .eq("mode", "competitive")
          .order("created_at", { ascending: false })
          .limit(200);

        if (error) throw error;

        setHistory(data || []);
      } catch (error) {
        console.error("Failed to load match history:", error);
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, []);

  // ============================================
  // PLAYER RANKINGS
  // ============================================

  const playerStats = {};

  history.forEach((h) => {
    if (!h.player1_id) return;
    if (!h.player2_id) return;

    if (!playerStats[h.player1_id]) {
      playerStats[h.player1_id] = {
        name: h.player1_name || "?",
        wins: 0,
        losses: 0,
      };
    }

    if (!playerStats[h.player2_id]) {
      playerStats[h.player2_id] = {
        name: h.player2_name || "?",
        wins: 0,
        losses: 0,
      };
    }

    if (h.winner_id === h.player1_id) {
      playerStats[h.player1_id].wins++;
      playerStats[h.player2_id].losses++;
    } else if (h.winner_id === h.player2_id) {
      playerStats[h.player2_id].wins++;
      playerStats[h.player1_id].losses++;
    }
  });

  const rankings = Object.entries(playerStats)
    .map(([id, s]) => ({
      id,
      ...s,
      total: s.wins + s.losses,
      winrate:
        s.wins + s.losses > 0
          ? Math.round((s.wins / (s.wins + s.losses)) * 100)
          : 0,
    }))
    .sort((a, b) => b.wins - a.wins || b.winrate - a.winrate);

  // ============================================
  // SOGNATORI RANKINGS
  // ============================================

  const sogStats = {};

  history.forEach((h) => {
    const t1 = Array.isArray(h.player1_team_ids)
      ? h.player1_team_ids
      : [];

    const t2 = Array.isArray(h.player2_team_ids)
      ? h.player2_team_ids
      : [];

    const winnerTeam =
      h.winner_id === h.player1_id ? t1 : t2;

    [...t1, ...t2].forEach((id) => {
      if (!id) return;

      if (!sogStats[id]) {
        sogStats[id] = {
          picks: 0,
          wins: 0,
          teammates: {},
        };
      }

      sogStats[id].picks++;
    });

    winnerTeam.forEach((id) => {
      if (sogStats[id]) {
        sogStats[id].wins++;
      }
    });

    [t1, t2].forEach((team) => {
      team.forEach((id) => {
        if (!sogStats[id]) return;

        team.forEach((other) => {
          if (id !== other) {
            sogStats[id].teammates[other] =
              (sogStats[id].teammates[other] || 0) + 1;
          }
        });
      });
    });
  });

  const sogRanking = Object.entries(sogStats)
    .map(([id, s]) => {
      const roster = ROSTER.find((r) => r.id === id);

      const topTeammates = Object.entries(s.teammates)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([tid, count]) => ({
          sog: ROSTER.find((r) => r.id === tid),
          count,
        }));

      return {
        id,
        ...s,
        nome: roster?.nome,
        tipo: roster?.tipo,
        img: roster?.img,
        topTeammates,
      };
    })
    .sort((a, b) => b.picks - a.picks);

  // ============================================
  // UI
  // ============================================

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-8">

        <div className="flex items-center justify-between mb-6">
          <Link
            to="/"
            className="text-sm text-slate-400 hover:text-white"
          >
            {t("rankings.back")}
          </Link>

          <img
            src={LOGO}
            alt="Sognatori"
            className="h-10 object-contain"
          />

          <Link
            to="/multiplayer"
            className="text-sm text-amber-400 hover:text-amber-300"
          >
            {t("rankings.play")}
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-amber-400 mb-6 text-center">
          {t("rankings.title")}
        </h1>

        <div className="flex gap-2 mb-6 justify-center">
          <button
            onClick={() => setTab("players")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
              tab === "players"
                ? "bg-amber-500/30 text-amber-400 border border-amber-500/50"
                : "bg-white/5 text-slate-400 border border-white/10"
            }`}
          >
            🏆 {t("rankings.players")}
          </button>

          <button
            onClick={() => setTab("sognatori")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
              tab === "sognatori"
                ? "bg-amber-500/30 text-amber-400 border border-amber-500/50"
                : "bg-white/5 text-slate-400 border border-white/10"
            }`}
          >
            🎴 {t("rankings.sognatori")}
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center text-slate-400 py-20">
            <div className="text-5xl mb-4">📊</div>

            <p className="text-sm">
              {t("rankings.empty")}
            </p>

            <Link
              to="/multiplayer"
              className="inline-block mt-4 px-6 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 font-bold text-sm hover:brightness-110 transition"
            >
              {t("rankings.firstMatch")}
            </Link>
          </div>
        ) : tab === "players" ? (
          <div className="space-y-2">
            {rankings.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`flex items-center gap-3 rounded-xl p-3 border ${
                  i < 3
                    ? "bg-amber-500/10 border-amber-500/30"
                    : "bg-white/5 border-white/10"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    i === 0
                      ? "bg-yellow-500 text-black"
                      : i === 1
                      ? "bg-gray-400 text-black"
                      : i === 2
                      ? "bg-orange-700 text-white"
                      : "bg-white/10 text-slate-400"
                  }`}
                >
                  {i + 1}
                </div>

                <div className="flex-1">
                  <div className="font-bold text-sm">
                    {p.name}
                  </div>

                  <div className="text-[10px] text-slate-400">
                    {p.total} {t("rankings.matches")} ·{" "}
                    {p.winrate}% {t("rankings.winrate")}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-lg font-bold text-emerald-400">
                    {p.wins}
                    {t("rankings.wins")}
                  </div>

                  <div className="text-[10px] text-rose-400">
                    {p.losses}
                    {t("rankings.losses")}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {sogRanking.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`rounded-xl p-3 border ${
                  i < 3
                    ? "bg-amber-500/10 border-amber-500/30"
                    : "bg-white/5 border-white/10"
                }`}
              >
                <div className="flex items-center gap-3">

                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                      i === 0
                        ? "bg-yellow-500 text-black"
                        : i === 1
                        ? "bg-gray-400 text-black"
                        : i === 2
                        ? "bg-orange-700 text-white"
                        : "bg-white/10 text-slate-400"
                    }`}
                  >
                    {i + 1}
                  </div>

                  <SognatoreImage
                    s={s}
                    className="w-10 h-10"
                  />

                  <div className="flex-1">
                    <div className="font-bold text-sm">
                      {s.nome}
                    </div>

                    {s.tipo && (
                      <FactionBadge type={s.tipo} />
                    )}
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-bold text-amber-400">
                      {s.picks} {t("rankings.picks")}
                    </div>

                    <div className="text-[10px] text-emerald-400">
                      {s.wins}
                      {t("rankings.wins")}
                    </div>
                  </div>
                </div>

                {s.topTeammates.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-white/10">

                    <div className="text-[9px] text-slate-400 mb-1">
                      {t("rankings.topTeammates")}
                    </div>

                    <div className="flex gap-2">
                      {s.topTeammates.map(
                        ({ sog: tm, count }) =>
                          tm ? (
                            <div
                              key={tm.id}
                              className="flex items-center gap-1 bg-white/5 rounded-lg px-2 py-1"
                            >
                              <SognatoreImage
                                s={tm}
                                className="w-6 h-6"
                              />

                              <span className="text-[10px]">
                                {tm.nome}
                              </span>

                              <span className="text-[9px] text-slate-500">
                                ×{count}
                              </span>
                            </div>
                          ) : null
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}