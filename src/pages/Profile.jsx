
// @ts-nocheck

import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/AuthContext";
import { ROSTER } from "@/lib/sognatoriData";

const LOGO = "/images/bannerLOGOSOGNATORI.png";

export default function Profile() {
  const { user } = useAuth();

  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const [username, setUsername] = useState("");
  const [newUsername, setNewUsername] = useState("");

  const [newEmail, setNewEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // ============================================================
  // DATI UTENTE
  // ============================================================

  useEffect(() => {
    if (!user) return;

    const currentUsername =
      user.user_metadata?.username ||
      user.user_metadata?.full_name ||
      user.email?.split("@")[0] ||
      "";

    setUsername(currentUsername);
    setNewUsername(currentUsername);
  }, [user]);

  // ============================================================
  // CARICA STORICO PARTITE REALE
  // ============================================================

  useEffect(() => {
    if (!user) return;

    const loadMatches = async () => {
      setLoading(true);
      setError("");

      try {
        const { data, error } = await supabase
          .from("match_history")
          .select("*")
          .or(
            `player1_id.eq.${user.id},player2_id.eq.${user.id}`
          );

        if (error) {
          throw error;
        }

        setMatches(data || []);
      } catch (err) {
        console.error("Errore caricamento statistiche:", err);
        setError(
          "Impossibile caricare le statistiche delle partite."
        );
      } finally {
        setLoading(false);
      }
    };

    loadMatches();
  }, [user]);

  // ============================================================
  // STATISTICHE REALI
  // ============================================================

  const stats = useMemo(() => {
    if (!user) {
      return {
        total: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        usageTotal: 0,
        usage: [],
      };
    }

    let wins = 0;

    matches.forEach((match) => {
      if (match.winner_id === user.id) {
        wins++;
      }
    });

    const total = matches.length;
    const losses = Math.max(0, total - wins);

    const winRate =
      total > 0
        ? Math.round((wins / total) * 100)
        : 0;

    // ==========================================================
    // UTILIZZO SOGNATORI
    // ==========================================================

    const usageMap = {};

    ROSTER.forEach((sognatore) => {
      usageMap[String(sognatore.id)] = 0;
    });

    let usageTotal = 0;

    matches.forEach((match) => {
      let team = [];

      if (match.player1_id === user.id) {
        team = Array.isArray(match.player1_team_ids)
          ? match.player1_team_ids
          : [];
      }

      if (match.player2_id === user.id) {
        team = Array.isArray(match.player2_team_ids)
          ? match.player2_team_ids
          : [];
      }

      team.forEach((id) => {
        const key = String(id);

        if (usageMap[key] !== undefined) {
          usageMap[key]++;
          usageTotal++;
        }
      });
    });

    const usage = ROSTER
      .map((sognatore) => {
        const count =
          usageMap[String(sognatore.id)] || 0;

        const percentage =
          usageTotal > 0
            ? Math.round(
                (count / usageTotal) * 100
              )
            : 0;

        return {
          ...sognatore,
          count,
          percentage,
        };
      })
      .sort((a, b) => b.count - a.count);

    return {
      total,
      wins,
      losses,
      winRate,
      usageTotal,
      usage,
    };
  }, [matches, user]);

  // ============================================================
  // CAMBIO USERNAME
  // ============================================================

  const changeUsername = async () => {
    setMessage("");
    setError("");

    const value = newUsername.trim();

    if (!value) {
      setError("Inserisci un username.");
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          ...user.user_metadata,
          username: value,
        },
      });

      if (error) throw error;

      setUsername(value);
      setMessage("Username aggiornato.");
    } catch (err) {
      console.error(err);
      setError(
        err?.message ||
          "Errore durante il cambio username."
      );
    }
  };

  // ============================================================
  // CAMBIO EMAIL
  // ============================================================

  const changeEmail = async () => {
    setMessage("");
    setError("");

    const value = newEmail.trim();

    if (!value) {
      setError("Inserisci una nuova email.");
      return;
    }

    if (value === user.email) {
      setError(
        "La nuova email è uguale a quella attuale."
      );
      return;
    }

    setEmailLoading(true);

    try {
      const { error } =
        await supabase.auth.updateUser({
          email: value,
        });

      if (error) throw error;

      setNewEmail("");

      setMessage(
        "Richiesta inviata. Controlla la nuova email per confermare il cambio."
      );
    } catch (err) {
      console.error(err);
      setError(
        err?.message ||
          "Errore durante il cambio email."
      );
    } finally {
      setEmailLoading(false);
    }
  };

  // ============================================================
  // CAMBIO PASSWORD
  // ============================================================

  const changePassword = async () => {
    setMessage("");
    setError("");

    if (newPassword.length < 6) {
      setError(
        "La password deve contenere almeno 6 caratteri."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(
        "Le password non coincidono."
      );
      return;
    }

    setPasswordLoading(true);

    try {
      const { error } =
        await supabase.auth.updateUser({
          password: newPassword,
        });

      if (error) throw error;

      setNewPassword("");
      setConfirmPassword("");

      setMessage("Password aggiornata.");
    } catch (err) {
      console.error(err);
      setError(
        err?.message ||
          "Errore durante il cambio password."
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  // ============================================================
  // SOGNATORE PIÙ UTILIZZATO
  // ============================================================

  const favoriteSognatore =
    stats.usage.find(
      (sognatore) => sognatore.count > 0
    ) || null;

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950 text-white flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-slate-400 mb-5">
            Devi effettuare il login.
          </p>

          <Link
            to="/login"
            className="px-6 py-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 font-bold"
          >
            Vai al login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950 text-white px-5 py-8">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="max-w-5xl mx-auto">

        <Link
          to="/"
          className="text-sm text-slate-400 hover:text-white transition"
        >
          ← Home
        </Link>

        <div className="text-center mt-5 mb-8">

          <img
            src={LOGO}
            alt="Sognatori"
            className="h-16 mx-auto object-contain mb-4"
          />

          <h1 className="text-3xl sm:text-4xl font-black">
            Profilo
          </h1>

          <p className="text-slate-400 text-sm mt-2">
            Le tue statistiche e le tue impostazioni
          </p>

        </div>

        {/* ====================================================
            MESSAGGI
        ==================================================== */}

        {message && (
          <div className="max-w-2xl mx-auto mb-5 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm">
            ✓ {message}
          </div>
        )}

        {error && (
          <div className="max-w-2xl mx-auto mb-5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* ====================================================
            PROFILO
        ==================================================== */}

        <section className="rounded-3xl bg-white/5 border border-white/10 p-6 mb-6">

          <h2 className="text-xl font-black mb-5">
            👤 Account
          </h2>

          <div className="space-y-5">

            {/* USERNAME */}

            <div>
              <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2">
                Username
              </label>

              <div className="flex flex-col sm:flex-row gap-2">

                <input
                  value={newUsername}
                  onChange={(e) =>
                    setNewUsername(e.target.value)
                  }
                  className="flex-1 px-4 py-3 rounded-xl bg-black/30 border border-white/10 outline-none focus:border-amber-400"
                />

                <button
                  onClick={changeUsername}
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold"
                >
                  Salva
                </button>

              </div>
            </div>

            {/* EMAIL */}

            <div>
              <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2">
                Email attuale
              </label>

              <div className="text-sm text-slate-300 mb-3">
                {user.email}
              </div>

              <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2">
                Nuova email
              </label>

              <div className="flex flex-col sm:flex-row gap-2">

                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) =>
                    setNewEmail(e.target.value)
                  }
                  placeholder="nuova@email.com"
                  className="flex-1 px-4 py-3 rounded-xl bg-black/30 border border-white/10 outline-none focus:border-amber-400"
                />

                <button
                  onClick={changeEmail}
                  disabled={emailLoading}
                  className="px-5 py-3 rounded-xl bg-white/10 border border-white/10 font-bold hover:bg-white/20 disabled:opacity-50"
                >
                  {emailLoading
                    ? "Invio..."
                    : "Cambia email"}
                </button>

              </div>
            </div>

            {/* PASSWORD */}

            <div>

              <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2">
                Nuova password
              </label>

              <input
                type="password"
                value={newPassword}
                onChange={(e) =>
                  setNewPassword(e.target.value)
                }
                placeholder="Nuova password"
                className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/10 outline-none focus:border-amber-400 mb-2"
              />

              <input
                type="password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
                placeholder="Conferma nuova password"
                className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/10 outline-none focus:border-amber-400 mb-3"
              />

              <button
                onClick={changePassword}
                disabled={passwordLoading}
                className="px-5 py-3 rounded-xl bg-white/10 border border-white/10 font-bold hover:bg-white/20 disabled:opacity-50"
              >
                {passwordLoading
                  ? "Aggiornamento..."
                  : "Cambia password"}
              </button>

            </div>

          </div>

        </section>

        {/* ====================================================
            STATISTICHE TEKKEN
        ==================================================== */}

        <section className="rounded-3xl bg-white/5 border border-white/10 p-6 mb-6">

          <h2 className="text-xl font-black mb-6">
            🏆 Le tue statistiche
          </h2>

          {loading ? (
            <div className="text-center text-slate-400 py-10">
              Caricamento statistiche...
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">

                <StatCard
                  label="Partite"
                  value={stats.total}
                />

                <StatCard
                  label="Vittorie"
                  value={stats.wins}
                />

                <StatCard
                  label="Sconfitte"
                  value={stats.losses}
                />

                <StatCard
                  label="Win Rate"
                  value={`${stats.winRate}%`}
                />

              </div>

              {/* WIN RATE */}

              <div className="mb-8">

                <div className="flex justify-between text-xs mb-2">
                  <span className="font-bold">
                    WIN RATE
                  </span>

                  <span className="text-amber-400 font-black">
                    {stats.winRate}%
                  </span>
                </div>

                <div className="h-5 rounded-full bg-black/40 border border-white/10 overflow-hidden">

                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${stats.winRate}%`,
                    }}
                    transition={{
                      duration: 1,
                    }}
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
                  />

                </div>

              </div>

              {/* VITTORIE */}

              <div>

                <div className="flex justify-between text-xs mb-2">
                  <span className="font-bold">
                    VITTORIE
                  </span>

                  <span className="text-emerald-400 font-black">
                    {stats.wins}
                  </span>
                </div>

                <div className="h-5 rounded-full bg-black/40 border border-white/10 overflow-hidden">

                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width:
                        stats.total > 0
                          ? `${(stats.wins / stats.total) * 100}%`
                          : "0%",
                    }}
                    transition={{
                      duration: 1,
                    }}
                    className="h-full bg-gradient-to-r from-emerald-500 to-green-400"
                  />

                </div>

              </div>

            </>
          )}

        </section>

        {/* ====================================================
            SOGNATORE PIÙ USATO
        ==================================================== */}

        {favoriteSognatore && (
          <section className="rounded-3xl bg-white/5 border border-white/10 p-6 mb-6">

            <h2 className="text-xl font-black mb-5">
              🧬 Il tuo Sognatore
            </h2>

            <div className="flex items-center gap-5">

              {favoriteSognatore.img && (
                <img
                  src={favoriteSognatore.img}
                  alt={favoriteSognatore.nome}
                  className="w-24 h-24 object-contain"
                />
              )}

              <div className="flex-1">

                <div className="text-2xl font-black">
                  {favoriteSognatore.nome}
                </div>

                <div className="text-sm text-slate-400 mt-1">
                  Il Sognatore che hai utilizzato di più
                </div>

                <div className="text-amber-400 font-black mt-2">
                  {favoriteSognatore.count} utilizzi
                  {" · "}
                  {favoriteSognatore.percentage}%
                </div>

              </div>

            </div>

          </section>
        )}

        {/* ====================================================
            UTILIZZO SOGNATORI
        ==================================================== */}

        <section className="rounded-3xl bg-white/5 border border-white/10 p-6 mb-8">

          <h2 className="text-xl font-black mb-2">
            📊 Utilizzo Sognatori
          </h2>

          <p className="text-xs text-slate-400 mb-6">
            Percentuale calcolata sulle tue squadre utilizzate
            nelle partite realmente registrate.
          </p>

          {loading ? (
            <div className="text-slate-400 text-sm">
              Caricamento...
            </div>
          ) : stats.usageTotal === 0 ? (
            <div className="text-center py-8 text-slate-500">
              Non hai ancora disputato partite registrate.
            </div>
          ) : (
            <div className="space-y-4">

              {stats.usage.map((sognatore) => {

                if (sognatore.count === 0) {
                  return null;
                }

                return (
                  <div
                    key={sognatore.id}
                  >

                    <div className="flex justify-between items-center mb-1">

                      <span className="text-sm font-bold">
                        {sognatore.nome}
                      </span>

                      <span className="text-xs text-slate-400">
                        {sognatore.count} utilizzi ·{" "}
                        {sognatore.percentage}%
                      </span>

                    </div>

                    <div className="h-3 rounded-full bg-black/40 overflow-hidden border border-white/5">

                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${sognatore.percentage}%`,
                        }}
                        transition={{
                          duration: 0.8,
                        }}
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-400"
                      />

                    </div>

                  </div>
                );
              })}

            </div>
          )}

        </section>

        {/* ====================================================
            BACK
        ==================================================== */}

        <div className="text-center pb-8">

          <Link
            to="/"
            className="inline-block px-6 py-3 rounded-full bg-white/10 border border-white/10 hover:bg-white/20 transition font-bold"
          >
            ← Torna alla Home
          </Link>

        </div>

      </div>

    </div>
  );
}

// ============================================================
// STAT CARD
// ============================================================

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl bg-black/20 border border-white/10 p-4 text-center">

      <div className="text-2xl sm:text-3xl font-black text-amber-400">
        {value}
      </div>

      <div className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">
        {label}
      </div>

    </div>
  );
}
