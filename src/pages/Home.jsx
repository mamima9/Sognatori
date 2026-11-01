// @ts-nocheck

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import Auction from "@/components/game/Auction";
import BattleArena from "@/components/game/BattleArena";
import PreMatchSelect from "@/components/game/PreMatchSelect";
import ArcadeWorld from "@/components/game/ArcadeWorld";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/i18n";
import { supabase } from "@/lib/supabase/client";

export default function Home() {
  const { isAuthenticated, user, logout } = useAuth();
  const { lang, setLang, t } = useLanguage();

  const isDev = user?.user_metadata?.username === "bibito";

  const [screen, setScreen] = useState("menu");
  const [teams, setTeams] = useState(null);
  const [arcadeStage, setArcadeStage] = useState(1);
  const [result, setResult] = useState(null);
  const [battleLog, setBattleLog] = useState([]);
  const [showResultLog, setShowResultLog] = useState(false);
  const [missionNotification, setMissionNotification] = useState(null);
  const [arcadeHumanOnlyRun, setArcadeHumanOnlyRun] = useState(true);

  const groupedLog = (entries) => {
    const groups = [];
    let current = { turn: 0, entries: [] };
    (entries || []).forEach((entry) => {
      const marker = typeof entry === "string" ? entry.match(/^__TURN_(\d+)__$/) : null;
      if (marker) {
        if (current.entries.length || current.turn > 0) groups.push(current);
        current = { turn: Number(marker[1]), entries: [] };
      } else if (entry) {
        current.entries.push(entry);
      }
    });
    if (current.entries.length || current.turn > 0) groups.push(current);
    return groups;
  };

  const [arcadePortrait, setArcadePortrait] = useState(null);
  const [arcadeIntro, setArcadeIntro] = useState(false);

  const arcadePortraits = [
    "angi.png",
    "moro.png",
    "anna.png",
    "xia.png",
    "vecchiaccio.png",
    "diouf.png",
    "biondo.png",
  ];

  const arcadeNPCNames = {
    1: "Gnopot",
    2: "Ribarbanno",
    3: "Civu",
    4: "Marsmellow",
    5: "Spaxio",
    6: "Gubbo",
    7: "Boccinu-R",
    8: "Viaggiatore101",
    9: "Affrescone",
    10: "Mangu",
  };

  const arcadeNPCImages = {
    1: "gnopot.png",
    2: "ribarbanno.jpg",
    3: "civu.png",
    4: "marsmellow.png",
    5: "spaxio.png",
    6: "gubbo.png",
    7: "boccinu-r.png",
    8: "viaggiatore101.png",
    9: "affrescone.png",
  };

  useEffect(() => {
    if (screen !== "arcadeIntro") return;

    const timer = setTimeout(() => {
      setScreen("auction");
    }, 6000);

    return () => clearTimeout(timer);
  }, [screen]);

  const RULES = [
    t("rule.1"),
    t("rule.2"),
    t("rule.3"),
    t("rule.4"),
    t("rule.5"),
    t("rule.6"),
    t("rule.7"),
    t("rule.8"),
    t("rule.9"),
    t("rule.10"),
    t("rule.11"),
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950 text-white">
      {missionNotification && (
        <motion.div
          initial={{ opacity: 0, y: -30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] max-w-md rounded-2xl border border-emerald-400/50 bg-slate-900/95 shadow-2xl shadow-emerald-900/40 p-4"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start gap-3">
            <div className="text-3xl">🏆</div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-black uppercase tracking-widest text-emerald-300">
                {lang === "en" ? "MISSION COMPLETED!" : "MISSIONE COMPLETATA!"}
              </div>
              <div className="font-bold text-white mt-1">
                {missionNotification}
              </div>
              <div className="text-xs text-slate-300 mt-1">
                {lang === "en" ? "You have completed this challenge and unlocked its reward." : "Hai completato questa sfida e sbloccato la relativa ricompensa."}
              </div>
            </div>
            <button onClick={() => setMissionNotification(null)} className="text-slate-400 hover:text-white" aria-label={lang === "en" ? "Close notification" : "Chiudi notifica"}>✕</button>
          </div>
        </motion.div>
      )}


      <AnimatePresence mode="wait">

        {/* ========================================================= */}
        {/* MENU */}
        {/* ========================================================= */}

        {screen === "menu" && (
          <motion.div
            key="menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col items-center justify-center px-6 py-10"
          >

            {/* LINGUA */}
            <div className="absolute top-4 right-4 z-50 flex items-center gap-1 rounded-full bg-slate-900/90 backdrop-blur border border-white/10 shadow-lg px-2 py-1.5">

              <span className="text-[9px] text-slate-400 uppercase tracking-widest mr-1">
                {t("home.language")}
              </span>

              <button
                onClick={() => setLang("it")}
                className={`px-2.5 py-1 rounded-full text-xs font-bold transition ${
                  lang === "it"
                    ? "bg-amber-500 text-slate-950"
                    : "bg-white/10 text-slate-300 hover:bg-white/20"
                }`}
              >
                IT
              </button>

              <button
                onClick={() => setLang("en")}
                className={`px-2.5 py-1 rounded-full text-xs font-bold transition ${
                  lang === "en"
                    ? "bg-amber-500 text-slate-950"
                    : "bg-white/10 text-slate-300 hover:bg-white/20"
                }`}
              >
                EN
              </button>

            </div>

            {/* LOGO */}
            <motion.div
              initial={{
                scale: 0.8,
                opacity: 0,
              }}
              animate={{
                scale: 1,
                opacity: 1,
              }}
              transition={{
                type: "spring",
                stiffness: 100,
              }}
              className="mb-4"
            >
              <img
                src="/images/bannerLOGOSOGNATORI.png"
                alt="Sognatori"
                className="h-24 sm:h-32 object-contain drop-shadow-2xl"
              />
            </motion.div>

            {/* REGOLE */}
            <div className="max-w-sm w-full rounded-2xl bg-white/5 border border-white/10 p-4 mb-5">

              <div className="text-xs uppercase tracking-widest text-amber-400 font-bold mb-2">
                {t("home.rules")}
              </div>

              <ul className="space-y-1 text-[11px] text-slate-300">

                {RULES.map((r) => (
                  <li
                    key={r}
                    className="flex gap-2"
                  >
                    <span className="text-amber-400">
                      •
                    </span>

                    {r}
                  </li>
                ))}

              </ul>

            </div>

            {/* PULSANTI */}
            <div className="flex flex-wrap gap-3 justify-center">

              {/* ARCADE */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  setArcadePortrait(null);
                  setArcadeHumanOnlyRun(true);
                  setScreen("arcadePortrait");
                }}
                className="px-8 py-3.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 font-bold text-base shadow-lg shadow-orange-500/30 hover:brightness-110 transition"
              >
                🤖 {t("Arcade")}
              </motion.button>

              {/* MULTIPLAYER */}
              <Link to="/multiplayer">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.96 }}
                  className="px-10 py-3.5 rounded-full bg-gradient-to-r from-red-500 to-orange-500 font-bold text-lg shadow-lg shadow-orange-500/30 hover:brightness-110 transition"
                >
                  ⚔️ {t("home.multiplayer")}
                </motion.button>
              </Link>

              {/* LORE */}
              <Link to="/lore">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.96 }}
                  className="px-6 py-3.5 rounded-full bg-white/10 font-bold text-sm hover:bg-white/20 transition border border-white/20"
                >
                  📖 {t("home.lore")}
                </motion.button>
              </Link>

              {/* AFFINITÀ */}
              <Link to="/typechart">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.96 }}
                  className="px-6 py-3.5 rounded-full bg-white/10 font-bold text-sm hover:bg-white/20 transition border border-white/20"
                >
                  📊 {t("home.types")}
                </motion.button>
              </Link>

              {/* SOGNATORI */}
              <Link to="/sognatori">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.96 }}
                  className="px-6 py-3.5 rounded-full bg-white/10 font-bold text-sm hover:bg-white/20 transition border border-white/20"
                >
                  🧬 Sognatori
                </motion.button>
              </Link>

              {/* PROFILO */}
              {isAuthenticated && (
                <Link to="/profilo">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.96 }}
                    className="px-6 py-3.5 rounded-full bg-white/10 font-bold text-sm hover:bg-white/20 transition border border-white/20"
                  >
                    👤 Profilo
                  </motion.button>
                </Link>
              )}

              {/* MISSIONI */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setScreen("missions")}
                className="px-6 py-3.5 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 font-bold text-sm shadow-lg shadow-indigo-500/20 hover:brightness-110 transition border border-violet-300/20"
              >
                🎯 Missioni
              </motion.button>

              {/* CLASSIFICHE */}
              <Link to="/rankings">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.96 }}
                  className="px-6 py-3.5 rounded-full bg-white/10 font-bold text-sm hover:bg-white/20 transition border border-white/20"
                >
                  🏆 {t("home.rankings")}
                </motion.button>
              </Link>

            </div>

            {/* LOGIN / REGISTRAZIONE */}
            <div className="mt-6 flex gap-3 items-center">

              {isAuthenticated ? (
                <>
                  <span className="text-xs text-slate-400">
                    {t("home.welcome")},{" "}
                    {user?.user_metadata?.username || user?.email}
                  </span>

                  <button
                    onClick={() => logout()}
                    className="text-xs px-4 py-2 rounded-full bg-white/10 font-bold hover:bg-white/20 transition"
                  >
                    {t("home.logout")}
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.96 }}
                      className="px-4 py-2 rounded-full bg-white/10 font-bold text-xs hover:bg-white/20 transition"
                    >
                      {t("home.login")}
                    </motion.button>
                  </Link>

                  <Link to="/register">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.96 }}
                      className="px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 font-bold text-xs hover:brightness-110 transition"
                    >
                      {t("home.register")}
                    </motion.button>
                  </Link>
                </>
              )}

            </div>

          </motion.div>
        )}

        {/* ========================================================= */}
        {/* MISSIONI */}
        {/* ========================================================= */}
        {screen === "missions" && (
          <motion.div
            key="missions"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="min-h-screen max-w-3xl mx-auto px-5 py-8"
          >
            <button
              onClick={() => setScreen("menu")}
              className="text-sm text-slate-400 hover:text-white mb-8"
            >
              ← {lang === "en" ? "Back to home" : "Torna alla home"}
            </button>

            <div className="text-center mb-8">
              <div className="text-5xl mb-3">🎯</div>
              <h1 className="text-3xl font-black text-amber-400">
                {lang === "en" ? "MISSIONS" : "MISSIONI"}
              </h1>
              <p className="text-sm text-slate-400 mt-2">
                {lang === "en" ? "Complete challenges to unlock Dreamer lore." : "Completa le sfide per sbloccare le Lore dei Sognatori."}
              </p>
            </div>

            <section className="rounded-2xl border border-violet-400/30 bg-gradient-to-br from-violet-900/30 to-indigo-950/50 p-5 shadow-xl">
              <div className="flex items-center justify-between gap-3 mb-4">
                <span className="text-xs font-black tracking-widest text-violet-300 uppercase">
                  {lang === "en" ? "MISSION 1" : "MISSIONE 1"}
                </span>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${user?.user_metadata?.pepe_lore_unlocked ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}`}>
                  {user?.user_metadata?.pepe_lore_unlocked
                    ? (lang === "en" ? "COMPLETED" : "COMPLETATA")
                    : (lang === "en" ? "IN PROGRESS" : "IN CORSO")}
                </span>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="w-20 h-20 rounded-xl bg-black/30 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                  <img src="/images/19  - PEPE.png" alt="Pepe" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">
                    {lang === "en" ? "Unlock Pepe's Lore" : "Sblocca Lore Pepe"}
                  </h2>
                  <p className="text-sm text-slate-300 mt-1">
                    {lang === "en"
                      ? "Win 3 Arcade matches in a row with Pepe in your team."
                      : "Vinci 3 partite in Arcade di fila con Pepe nella tua squadra."}
                  </p>
                </div>
              </div>

              <div className="mb-2 flex justify-between text-xs font-bold">
                <span className="text-slate-300">{lang === "en" ? "Progress" : "Progressi"}</span>
                <span className="text-amber-300">
                  {user?.user_metadata?.pepe_lore_unlocked ? "3/3" : `${Math.min(3, Number(user?.user_metadata?.pepe_arcade_streak || 0))}/3`}
                </span>
              </div>
              <div className="h-3 rounded-full bg-black/40 overflow-hidden border border-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-amber-400 transition-all duration-500"
                  style={{ width: `${user?.user_metadata?.pepe_lore_unlocked ? 100 : Math.min(100, Number(user?.user_metadata?.pepe_arcade_streak || 0) / 3 * 100)}%` }}
                />
              </div>

              {!isAuthenticated && (
                <p className="mt-4 text-xs text-amber-300">
                  {lang === "en" ? "Log in to save your mission progress." : "Accedi per salvare i progressi della missione."}
                </p>
              )}
              {user?.user_metadata?.pepe_lore_unlocked && (
                <Link to="/lore" className="inline-flex mt-5 px-5 py-2.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold text-sm hover:bg-emerald-500/30">
                  📖 {lang === "en" ? "View Pepe's Lore" : "Leggi la Lore di Pepe"}
                </Link>
              )}
            </section>

            <section className="rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-cyan-900/25 to-indigo-950/50 p-5 shadow-xl mt-5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <span className="text-xs font-black tracking-widest text-cyan-300 uppercase">
                  {lang === "en" ? "MISSION 2" : "MISSIONE 2"}
                </span>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${user?.user_metadata?.riwupido_nina_lore_unlocked ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}`}>
                  {user?.user_metadata?.riwupido_nina_lore_unlocked
                    ? (lang === "en" ? "COMPLETED" : "COMPLETATA")
                    : (lang === "en" ? "IN PROGRESS" : "IN CORSO")}
                </span>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="w-20 h-20 rounded-xl bg-black/30 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                  <img src="/images/11. RIWUPIDO.png" alt="Riwupido" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">
                    {lang === "en" ? "Unlock Riwupido's Lore" : "Sblocca Lore Riwupido"}
                  </h2>
                  <p className="text-sm text-slate-300 mt-1">
                    {lang === "en"
                      ? "Win 3 Competitive Multiplayer matches in a row with both Riwupido and Nina on your team."
                      : "Vinci 3 partite di fila in Multiplayer competitivo con Riwupido e Nina nella tua squadra."}
                  </p>
                </div>
              </div>

              <div className="mb-2 flex justify-between text-xs font-bold">
                <span className="text-slate-300">{lang === "en" ? "Progress" : "Progressi"}</span>
                <span className="text-amber-300">
                  {user?.user_metadata?.riwupido_nina_lore_unlocked ? "3/3" : `${Math.min(3, Number(user?.user_metadata?.riwupido_nina_competitive_streak || 0))}/3`}
                </span>
              </div>
              <div className="h-3 rounded-full bg-black/40 overflow-hidden border border-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-500"
                  style={{ width: `${user?.user_metadata?.riwupido_nina_lore_unlocked ? 100 : Math.min(100, Number(user?.user_metadata?.riwupido_nina_competitive_streak || 0) / 3 * 100)}%` }}
                />
              </div>
              {user?.user_metadata?.riwupido_nina_lore_unlocked && (
                <Link to="/lore" className="inline-flex mt-5 px-5 py-2.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold text-sm hover:bg-emerald-500/30">
                  📖 {lang === "en" ? "View Riwupido's Lore" : "Leggi la Lore di Riwupido"}
                </Link>
              )}
            </section>

            <section className="rounded-2xl border border-sky-400/30 bg-gradient-to-br from-sky-900/25 to-blue-950/50 p-5 shadow-xl mt-5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <span className="text-xs font-black tracking-widest text-sky-300 uppercase">
                  {lang === "en" ? "MISSION 3" : "MISSIONE 3"}
                </span>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${user?.user_metadata?.icepadel_lore_unlocked ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}`}>
                  {user?.user_metadata?.icepadel_lore_unlocked
                    ? (lang === "en" ? "COMPLETED" : "COMPLETATA")
                    : (lang === "en" ? "IN PROGRESS" : "IN CORSO")}
                </span>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="w-20 h-20 rounded-xl bg-black/30 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                  <img src="/images/23- ICEPADEL.png" alt="Icepadel" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">
                    {lang === "en" ? "Unlock Icepadel's Lore" : "Sblocca Lore Icepadel"}
                  </h2>
                  <p className="text-sm text-slate-300 mt-1">
                    {lang === "en"
                      ? "Complete 10 Competitive Multiplayer matches."
                      : "Completa 10 partite in Multiplayer competitivo."}
                  </p>
                </div>
              </div>

              <div className="mb-2 flex justify-between text-xs font-bold">
                <span className="text-slate-300">{lang === "en" ? "Progress" : "Progressi"}</span>
                <span className="text-amber-300">
                  {user?.user_metadata?.icepadel_lore_unlocked ? "10/10" : `${Math.min(10, Number(user?.user_metadata?.icepadel_competitive_matches || 0))}/10`}
                </span>
              </div>
              <div className="h-3 rounded-full bg-black/40 overflow-hidden border border-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-300 transition-all duration-500"
                  style={{ width: `${user?.user_metadata?.icepadel_lore_unlocked ? 100 : Math.min(100, Number(user?.user_metadata?.icepadel_competitive_matches || 0) / 10 * 100)}%` }}
                />
              </div>
              {user?.user_metadata?.icepadel_lore_unlocked && (
                <Link to="/lore" className="inline-flex mt-5 px-5 py-2.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold text-sm hover:bg-emerald-500/30">
                  📖 {lang === "en" ? "View Icepadel's Lore" : "Leggi la Lore di Icepadel"}
                </Link>
              )}
            </section>
            <section className="rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-900/25 to-orange-950/50 p-5 shadow-xl mt-5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <span className="text-xs font-black tracking-widest text-amber-300 uppercase">{lang === "en" ? "MISSION 4" : "MISSIONE 4"}</span>
                <span className={user?.user_metadata?.taomarco_lore_unlocked ? "text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300" : "text-xs font-bold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300"}>{user?.user_metadata?.taomarco_lore_unlocked ? (lang === "en" ? "COMPLETED" : "COMPLETATA") : (lang === "en" ? "IN PROGRESS" : "IN CORSO")}</span>
              </div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-20 h-20 rounded-xl bg-black/30 border border-white/10 flex items-center justify-center overflow-hidden shrink-0"><img src="/images/10 TAOMARCO.png" alt="Tao Marco" className="w-full h-full object-contain" /></div>
                <div>
                  <h2 className="text-xl font-black text-white">{lang === "en" ? "Unlock Tao Marco's Lore" : "Sblocca Lore Taomarco"}</h2>
                  <p className="text-sm text-slate-300 mt-1">{lang === "en" ? "Use Tao Marco more than any other Dreamer in your profile, win 15 Competitive matches, and complete all 10 Arcade stages using only Human-type Dreamers." : "Usa Taomarco più di ogni altro Sognatore nel tuo profilo, vinci 15 partite in competitivo e completa tutti e 10 gli stage Arcade usando solo Sognatori di tipo Umano."}</p>
                </div>
              </div>
              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex justify-between"><span>{lang === "en" ? "Competitive wins" : "Vittorie competitive"}</span><b className="text-amber-300">{Math.min(15, Number(user?.user_metadata?.taomarco_competitive_wins || 0))}/15</b></div>
                <div className="flex justify-between"><span>{lang === "en" ? "Human-only Arcade" : "Arcade solo Umano"}</span><b>{user?.user_metadata?.taomarco_human_arcade_completed ? "10/10 ✓" : "0/10"}</b></div>
                <div className="flex justify-between"><span>{lang === "en" ? "Most used in profile" : "Più utilizzato nel profilo"}</span><b>{user?.user_metadata?.taomarco_is_most_used ? "✓" : "—"}</b></div>
              </div>
              {user?.user_metadata?.taomarco_lore_unlocked && <Link to="/lore" className="inline-flex mt-5 px-5 py-2.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold text-sm">📖 {lang === "en" ? "Read Tao Marco's Lore" : "Leggi la Lore di Taomarco"}</Link>}
            </section>
          </motion.div>
        )}

        {/* ========================================================= */}
        {/* SCELTA VIAGGIATORE */}
        {/* ========================================================= */}

        {screen === "arcadePortrait" && (
          <motion.div
            key="arcadePortrait"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col items-center justify-center p-6"
          >

            <h1 className="text-4xl font-bold text-white mb-8">
              SCEGLI IL TUO VIAGGIATORE
            </h1>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">

              {arcadePortraits.map((portrait) => (
                <button
                  key={portrait}
                  onClick={() => setArcadePortrait(portrait)}
                  className={`w-32 h-40 rounded-xl border-4 transition-all ${
                    arcadePortrait === portrait
                      ? "border-yellow-400 scale-110"
                      : "border-white/20 hover:border-white/60"
                  }`}
                >
                  <img
                    src={`/images/${portrait}`}
                    alt={portrait}
                    className="w-full h-full object-contain"
                  />
                </button>
              ))}

            </div>

            <button
              disabled={!arcadePortrait}
              onClick={() => setScreen("arcadeWorld")}
              className="mt-10 px-8 py-4 rounded-xl bg-yellow-500 text-black font-bold disabled:opacity-40"
            >
              CONFERMA
            </button>

            <button
              onClick={() => setScreen("menu")}
              className="mt-4 text-white/70 hover:text-white"
            >
              ← Indietro
            </button>

            {/* ===================================================== */}
            {/* DEV MODE — SOLO BIBITO */}
            {/* ===================================================== */}

            {isDev && (
              <div className="mt-8 p-4 rounded-2xl bg-red-950/50 border border-red-500/40">

                <div className="text-xs font-black text-red-400 tracking-widest mb-3 text-center">
                  DEV MODE — TEST STAGE
                </div>

                <div className="flex flex-wrap justify-center gap-2">

                  {Array.from(
                    { length: 10 },
                    (_, i) => i + 1
                  ).map((testStage) => (
                    <button
                      key={testStage}
                      onClick={() => {
                        setArcadeStage(testStage);
                        setScreen("arcadeWorld");
                      }}
                      className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-black transition"
                    >
                      STAGE {testStage}
                    </button>
                  ))}

                </div>

              </div>
            )}

          </motion.div>
        )}

        {/* ========================================================= */}
        {/* ARCADE INTRO */}
        {/* ========================================================= */}

        {screen === "arcadeIntro" && (
          <motion.div
            key="arcadeIntro"
            initial={{
              opacity: 0,
              scale: 0.9,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            exit={{
              opacity: 0,
            }}
            className="min-h-screen flex flex-col items-center justify-center px-4 text-center"
          >

            <div className="text-amber-400 text-2xl md:text-3xl font-black tracking-[0.25em] mb-5 uppercase drop-shadow-lg">
              STAGE {arcadeStage}
            </div>

            <div className="w-full flex flex-col items-center justify-center gap-8">

              {/* TUO VIAGGIATORE */}
              <motion.div
                initial={{
                  x: -120,
                  opacity: 0,
                }}
                animate={{
                  x: 0,
                  opacity: 1,
                }}
                transition={{
                  duration: 0.5,
                }}
                className="flex flex-col items-center"
              >

                <div className="w-28 h-28 md:w-32 md:h-32 rounded-2xl border-4 border-amber-400 bg-white/5 p-2">

                  <img
                    src={`/images/${arcadePortrait}`}
                    alt="Il tuo viaggiatore"
                    className="w-full h-full object-contain"
                  />

                </div>

                <div className="mt-2 text-sm md:text-base font-black">
                  {user?.user_metadata?.username || user?.email || "TU"}
                </div>

              </motion.div>

              {/* VS */}
              <motion.div
                initial={{
                  scale: 0,
                  opacity: 0,
                }}
                animate={{
                  scale: 1,
                  opacity: 1,
                }}
                transition={{
                  delay: 0.45,
                  duration: 0.35,
                  type: "spring",
                }}
                className="text-2xl md:text-3xl font-black text-amber-400 drop-shadow-lg"
              >
                VS
              </motion.div>

              {/* NPC */}
              <div className="flex flex-col items-center">

                <div className="w-28 h-28 md:w-32 md:h-32 rounded-2xl border-4 border-red-500 bg-white/5 p-2 flex items-center justify-center">

                  {arcadeNPCImages[arcadeStage] ? (
                    <img
                      src={`/images/${arcadeNPCImages[arcadeStage]}`}
                      alt={arcadeNPCNames[arcadeStage]}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-6xl">🧙</span>
                  )}

                </div>

                <div className="mt-2 text-sm md:text-base font-black">
                  {arcadeNPCNames[arcadeStage]}
                </div>

              </div>

            </div>

            <div className="mt-10 text-slate-400 text-sm">
              PREPARATI ALLA SFIDA...
            </div>

          </motion.div>
        )}

        {/* ========================================================= */}
        {/* ARCADE WORLD */}
        {/* ========================================================= */}

        {screen === "arcadeWorld" && (
          <motion.div
            key="arcadeWorld"
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
          >

            <ArcadeWorld
              stage={arcadeStage}
              portrait={arcadePortrait}
              npcNames={arcadeNPCNames}
              npcImages={arcadeNPCImages}
              onStartAuction={(stage) => {
                setArcadeStage(stage);
                setArcadeIntro(true);
                setScreen("arcadeIntro");
              }}
              onBack={() => setScreen("menu")}
            />

          </motion.div>
        )}

        {/* ========================================================= */}
        {/* AUCTION */}
        {/* ========================================================= */}

        {screen === "auction" && (
          <motion.div
            key="auction"
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
            }}
          >

            <Auction
              stage={arcadeStage}
              onComplete={(pt, et) => {
                setTeams({
                  playerTeam: pt,
                  enemyTeam: et,
                });

                setScreen("prematch");
              }}
              onBack={() => setScreen("menu")}
            />

          </motion.div>
        )}

        {/* ========================================================= */}
        {/* PREMATCH */}
        {/* ========================================================= */}

        {screen === "prematch" && teams && (
          <motion.div
            key="prematch"
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
            }}
          >

            <PreMatchSelect
              playerTeam={teams.playerTeam}
              enemyTeam={teams.enemyTeam}
              onComplete={(pt, et) => {
                setTeams({
                  playerTeam: pt,
                  enemyTeam: et,
                });

                setScreen("battle");
              }}
              onBack={() =>
                setScreen("auction")
              }
              onAbandon={() => {
                setTeams(null);
                setScreen("menu");
              }}
            />

          </motion.div>
        )}

        {/* ========================================================= */}
        {/* BATTLE */}
        {/* ========================================================= */}

        {screen === "battle" && teams && (
          <motion.div
            key="battle"
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
          >

            <BattleArena
  stage={arcadeStage}
  playerTeam={teams.playerTeam}
  enemyTeam={teams.enemyTeam}
              onMissionComplete={() => {
                setMissionNotification(lang === "en" ? "Mission 1: Unlock Pepe's Lore" : "Missione 1: Sblocca Lore Pepe");
                window.setTimeout(() => setMissionNotification(null), 7000);
              }}
              onEnd={(r, fullLog = []) => {
                const currentTeamIsHumanOnly = (teams?.playerTeam || []).length > 0 &&
                  teams.playerTeam.every((s) => String(s?.tipo || s?.type || "").toLowerCase() === "umano");
                const completedHumanStage = arcadeHumanOnlyRun && currentTeamIsHumanOnly && r === "win";
                setArcadeHumanOnlyRun(completedHumanStage);
                setResult(r);
                setBattleLog(fullLog);
                setShowResultLog(false);
                setTeams(null);
                if (r === "win") {
                  if (arcadeStage < 10) {
                    setArcadeStage((prev) => prev + 1);
                    setScreen("arcadeWorld");
                  } else {
                    if (completedHumanStage && user) {
                      supabase.auth.updateUser({ data: { taomarco_human_arcade_completed: true } }).then(({ error }) => {
                        if (error) console.error("Errore salvataggio missione Arcade Taomarco:", error);
                        else {
                          setMissionNotification(lang === "en" ? "Mission 4: Human-only Arcade completed!" : "Missione 4: Arcade completato con soli Umani!");
                          window.setTimeout(() => setMissionNotification(null), 7000);
                        }
                      });
                    }
                    setScreen("result");
                  }
                } else setScreen("result");
              }}
            />

          </motion.div>
        )}

        {/* ========================================================= */}
        {/* RESULT */}
        {/* ========================================================= */}

        {screen === "result" && (
          <motion.div
            key="result"
            initial={{
              opacity: 0,
              scale: 0.9,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            className="min-h-screen flex flex-col items-center justify-center text-center px-6"
          >

            <div className="text-7xl mb-4">
              {result === "win"
                ? "🏆"
                : "💀"}
            </div>

            <img
              src="/images/bannerLOGOSOGNATORI.png"
              alt="Sognatori"
              className="h-16 object-contain mb-3"
            />

            <h2 className="text-4xl font-black mb-2">

              {result === "win" && arcadeStage === 10
                ? "ARCADE COMPLETATO!"
                : result === "win"
                  ? t("home.victory")
                  : t("home.defeat")}

            </h2>

            <p className="text-slate-400 mb-8 text-sm">

              {result === "win" && arcadeStage === 10
                ? "Hai completato tutti e 10 gli Stage dei Sognatori!"
                : result === "win"
                  ? t("home.victoryMsg")
                  : t("home.defeatMsg")}

            </p>

            {result === "win" && arcadeStage === 10 && (
              <div className="text-amber-400 font-bold text-lg mb-8">
                🎁 Otterrai una ricompensa!
              </div>
            )}

            <div className="flex flex-wrap justify-center gap-3 mb-4">
              <button
                onClick={() => setShowResultLog(true)}
                className="px-6 py-3 rounded-full bg-white/10 font-bold hover:bg-white/20 transition"
              >
                📜 {lang === "en" ? "View complete log" : "Visualizza log completo"}
              </button>
            </div>

            {showResultLog && (
              <div className="fixed inset-0 z-[70] bg-black/85 flex items-center justify-center p-4" onClick={() => setShowResultLog(false)}>
                <div className="bg-slate-900 rounded-2xl border border-amber-500/30 p-4 max-w-2xl w-full max-h-[85vh] overflow-y-auto text-left" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-amber-400">📜 {lang === "en" ? "Complete battle log" : "Log completo della battaglia"}</h3>
                    <button onClick={() => setShowResultLog(false)} className="text-slate-400 hover:text-white text-lg">✕</button>
                  </div>
                  <div className="space-y-1">
                    {groupedLog(battleLog).map((group, groupIndex) => (
                      <section key={group.turn || groupIndex} className="mb-4">
                        <h4 className="text-xs font-black uppercase tracking-widest text-amber-300 mb-2 border-b border-amber-500/20 pb-1">
                          {group.turn ? (lang === "en" ? `Turn ${group.turn}` : `Turno ${group.turn}`) : (lang === "en" ? "Match start" : "Inizio partita")}
                        </h4>
                        <div className="space-y-1">
                          {group.entries.map((entry, i) => <div key={i} className="text-xs text-slate-200 bg-white/5 rounded-lg px-3 py-2">{entry}</div>)}
                        </div>
                      </section>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">

              <button
                onClick={() =>
                  setScreen("auction")
                }
                className="px-8 py-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 font-bold hover:brightness-110 transition"
              >
                {t("home.playAgain")}
              </button>

              <button
                onClick={() =>
                  setScreen("menu")
                }
                className="px-8 py-3 rounded-full bg-white/10 font-bold hover:bg-white/20 transition"
              >
                {t("home.menu")}
              </button>

            </div>

          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
}