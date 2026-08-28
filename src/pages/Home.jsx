import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import Auction from "@/components/game/Auction";
import BattleArena from "@/components/game/BattleArena";
import PreMatchSelect from "@/components/game/PreMatchSelect";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/i18n";

export default function Home() {
  const { isAuthenticated, user, logout } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const [screen, setScreen] = useState("menu");
  const [teams, setTeams] = useState(null);
  const [result, setResult] = useState(null);

  const RULES = [
    t('rule.1'), t('rule.2'), t('rule.3'), t('rule.4'),
    t('rule.5'), t('rule.6'), t('rule.7'), t('rule.8')
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950 text-white">
      {/* Language selector */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        <span className="text-[10px] text-slate-400 uppercase tracking-widest">{t('home.language')}</span>
        <button onClick={() => setLang('it')} className={`px-3 py-1 rounded-full text-xs font-bold transition ${lang === 'it' ? 'bg-amber-500 text-slate-950' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}>IT</button>
        <button onClick={() => setLang('en')} className={`px-3 py-1 rounded-full text-xs font-bold transition ${lang === 'en' ? 'bg-amber-500 text-slate-950' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}>EN</button>
      </div>

      <AnimatePresence mode="wait">
        {screen === "menu" && (
          <motion.div key="menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen flex flex-col items-center justify-center px-6 py-10">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 100 }} className="mb-4">
              <img
                src="https://media.base44.com/images/public/6a88c0790ad6d8971067dd2b/970a32337_bannerLOGOSOGNATORI.png"
                alt="Sognatori"
                className="h-24 sm:h-32 object-contain drop-shadow-2xl"
              />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="w-full max-w-sm rounded-2xl overflow-hidden border border-white/10 shadow-xl mb-5">
              <video
                src="https://media.base44.com/videos/public/6a88c0790ad6d8971067dd2b/806277199_videointroduttivo5.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="w-full"
              />
            </motion.div>

            <div className="max-w-sm w-full rounded-2xl bg-white/5 border border-white/10 p-4 mb-5">
              <div className="text-xs uppercase tracking-widest text-amber-400 font-bold mb-2">{t('home.rules')}</div>
              <ul className="space-y-1 text-[11px] text-slate-300">
                {RULES.map((r) => <li key={r} className="flex gap-2"><span className="text-amber-400">•</span>{r}</li>)}
              </ul>
            </div>

            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/multiplayer">
                <motion.button
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}
                  className="px-10 py-3.5 rounded-full bg-gradient-to-r from-red-500 to-orange-500 font-bold text-lg shadow-lg shadow-orange-500/30 hover:brightness-110 transition"
                >
                  ⚔️ {t('home.multiplayer')}
                </motion.button>
              </Link>
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}
                onClick={() => setScreen("auction")}
                className="px-8 py-3.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 font-bold text-base shadow-lg shadow-orange-500/30 hover:brightness-110 transition"
              >
                🤖 {t('home.vsAI')}
              </motion.button>
              <Link to="/lore">
                <motion.button
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}
                  className="px-6 py-3.5 rounded-full bg-white/10 font-bold text-sm hover:bg-white/20 transition border border-white/20"
                >
                  📖 {t('home.lore')}
                </motion.button>
              </Link>
              <Link to="/typechart">
                <motion.button
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}
                  className="px-6 py-3.5 rounded-full bg-white/10 font-bold text-sm hover:bg-white/20 transition border border-white/20"
                >
                  📊 {t('home.types')}
                </motion.button>
              </Link>
              <Link to="/rankings">
                <motion.button
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}
                  className="px-6 py-3.5 rounded-full bg-white/10 font-bold text-sm hover:bg-white/20 transition border border-white/20"
                >
                  🏆 {t('home.rankings')}
                </motion.button>
              </Link>
            </div>
            <div className="mt-6 flex gap-3 items-center">
              {isAuthenticated ? (
                <>
                  <span className="text-xs text-slate-400">{t('home.welcome')}, {user?.full_name || user?.email}</span>
                  <button onClick={() => logout()} className="text-xs px-4 py-2 rounded-full bg-white/10 font-bold hover:bg-white/20 transition">{t('home.logout')}</button>
                </>
              ) : (
                <>
                  <Link to="/login"><motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }} className="px-4 py-2 rounded-full bg-white/10 font-bold text-xs hover:bg-white/20 transition">{t('home.login')}</motion.button></Link>
                  <Link to="/register"><motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }} className="px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 font-bold text-xs hover:brightness-110 transition">{t('home.register')}</motion.button></Link>
                </>
              )}
            </div>
          </motion.div>
        )}

        {screen === "auction" && (
          <motion.div key="auction" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Auction
              onComplete={(pt, et) => { setTeams({ playerTeam: pt, enemyTeam: et }); setScreen("prematch"); }}
              onBack={() => setScreen("menu")}
            />
          </motion.div>
        )}

        {screen === "prematch" && teams && (
          <motion.div key="prematch" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <PreMatchSelect
              playerTeam={teams.playerTeam}
              enemyTeam={teams.enemyTeam}
              onComplete={(pt, et) => { setTeams({ playerTeam: pt, enemyTeam: et }); setScreen("battle"); }}
              onBack={() => setScreen("auction")}
              onAbandon={() => { setTeams(null); setScreen("menu"); }}
            />
          </motion.div>
        )}

        {screen === "battle" && teams && (
          <motion.div key="battle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <BattleArena
              playerTeam={teams.playerTeam}
              enemyTeam={teams.enemyTeam}
              onEnd={(r) => { setResult(r); setTimeout(() => setScreen("result"), 1000); }}
            />
          </motion.div>
        )}

        {screen === "result" && (
          <motion.div key="result" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="min-h-screen flex flex-col items-center justify-center text-center px-6">
            <div className="text-7xl mb-4">{result === "win" ? "🏆" : "💀"}</div>
            <img src="https://media.base44.com/images/public/6a88c0790ad6d8971067dd2b/970a32337_bannerLOGOSOGNATORI.png" alt="Sognatori" className="h-16 object-contain mb-3" />
            <h2 className="text-4xl font-black mb-2">{result === "win" ? t('home.victory') : t('home.defeat')}</h2>
            <p className="text-slate-400 mb-8 text-sm">{result === "win" ? t('home.victoryMsg') : t('home.defeatMsg')}</p>
            <div className="flex gap-3">
              <button onClick={() => setScreen("auction")} className="px-8 py-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 font-bold hover:brightness-110 transition">{t('home.playAgain')}</button>
              <button onClick={() => setScreen("menu")} className="px-8 py-3 rounded-full bg-white/10 font-bold hover:bg-white/20 transition">{t('home.menu')}</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}