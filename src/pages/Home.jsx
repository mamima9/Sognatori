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

export default function Home() {
  const { isAuthenticated, user, logout } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const isDev = user?.user_metadata?.username === "bibito";
  const [screen, setScreen] = useState("menu");
  const [teams, setTeams] = useState(null);
  const [arcadeStage, setArcadeStage] = useState(1);
  const [result, setResult] = useState(null);
const [arcadePortrait, setArcadePortrait] = useState(null);
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
};

const arcadeNPCImages = {
  1: "gnopot.png",
  2: "ribarbanno.jpg",
  3: "civu.png",
  4: "cappucc.png",
  5: "spaxio.png",
  6: "gubbo.png",
  7: "boccinu-r.png",
  8: "viaggiatore101.png",
  9: "affrescone.png",
};
const [arcadeIntro, setArcadeIntro] = useState(false);
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

      <AnimatePresence mode="wait">

        {/* MENU */}
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

          
              {/* VS IA */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.96 }}
             onClick={() => {
  setArcadePortrait(null);
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

              {/* AFFINITà */}
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
  </motion.div>
)}

{/* ARCADE INTRO */}
{screen === "arcadeIntro" && (
  <motion.div
    key="arcadeIntro"
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0 }}
    className="min-h-screen flex flex-col items-center justify-center px-4 text-center"
  >
<div className="text-amber-400 text-2xl md:text-3xl font-black tracking-[0.25em] mb-5 uppercase drop-shadow-lg">
  STAGE {arcadeStage}
</div>

 <div className="w-full flex flex-col items-center justify-center gap-8">
    
          {/* TUO VIAGGIATORE */}
        <motion.div
          initial={{ x: -120, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
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

        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.45, duration: 0.35, type: "spring" }}
          className="text-2xl md:text-3xl font-black text-amber-400 drop-shadow-lg"
        >
          VS
        </motion.div>

      {/* NPC */}
      <div className="flex flex-col items-center">
<div className="w-28 h-28 md:w-32 md:h-32 rounded-2xl border-4 border-red-500 bg-white/5 p-2 flex items-center justify-center">
       <img
  src={`/images/${arcadeNPCImages[arcadeStage]}`}
  alt={arcadeNPCNames[arcadeStage]}
  className="w-full h-full object-contain"
/>
        </div>

<div className="mt-2 text-sm md:text-base font-black">  {arcadeNPCNames[arcadeStage]}
</div>
      </div>

    </div>

    <div className="mt-10 text-slate-400 text-sm">
      PREPARATI ALLA SFIDA...
    </div>
  </motion.div>
)}


{/* ARCADE WORLD */}
{screen === "arcadeWorld" && (
    <motion.div
      key="arcadeWorld"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
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
  </>
)}


        {/* AUCTION */}
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

        {/* PREMATCH */}
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

        {/* BATTLE */}
        {screen === "battle" && teams && (
          <motion.div
            key="battle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            
<BattleArena
  playerTeam={teams.playerTeam}
  enemyTeam={teams.enemyTeam}
  onEnd={(r) => {
    setResult(r);
    setTeams(null);

    if (r === "win") {
      if (arcadeStage < 9) {
        setArcadeStage((prev) => prev + 1);
        setScreen("arcadeWorld");
      } else {
        setScreen("result");
      }
    } else {
      setScreen("result");
    }
  }}
/>


          </motion.div>
        )}

        {/* RESULT */}
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
  {result === "win" && arcadeStage === 9
    ? "ARCADE COMPLETATO!"
    : result === "win"
      ? t("home.victory")
      : t("home.defeat")}
</h2>

<p className="text-slate-400 mb-8 text-sm">
  {result === "win" && arcadeStage === 9
    ? "Hai completato tutti e 9 gli Stage dei Sognatori!"
    : result === "win"
      ? t("home.victoryMsg")
      : t("home.defeatMsg")}
</p>

{result === "win" && arcadeStage === 9 && (
  <div className="text-amber-400 font-bold text-lg mb-8">
    🎁 Otterrai una ricompensa!
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