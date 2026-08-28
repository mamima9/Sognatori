import React, { useState } from "react";
import { motion } from "framer-motion";
import { SognatoreImage, FactionBadge } from "./HealthBar";
import { useCountdown, TimerBar } from "./Timer";
import AbandonButton from "./AbandonButton";
import { useLanguage } from "@/lib/i18n";
import { getAbilityName, getAbilityDesc } from "@/lib/abilityI18n";

const LOGO = "/images/bannerLOGOSOGNATORI.png";
const TIMER_SECONDS = 60;

export default function PreMatchSelect({ playerTeam, enemyTeam, onComplete, onBack, onAbandon }) {
  const { t, lang } = useLanguage();
  const [starters, setStarters] = useState([]);

  const toggleStarter = (idx) => {
    setStarters(prev => {
      if (prev.includes(idx)) return prev.filter(i => i !== idx);
      if (prev.length >= 2) return prev;
      return [...prev, idx];
    });
  };

  const buildTeams = (chosen) => {
    const auto = chosen.length === 2 ? chosen : [0, 1];
    const benchIdx = [0, 1, 2, 3].filter(i => !auto.includes(i));
    const reorderedPlayer = [...auto.map(i => playerTeam[i]), ...benchIdx.map(i => playerTeam[i])];
    // AI picks the 2 starters with highest total stats (att + dif + vel)
    const enemySorted = [0, 1, 2, 3].sort((a, b) => {
      const sa = enemyTeam[a].att + enemyTeam[a].dif + enemyTeam[a].vel;
      const sb = enemyTeam[b].att + enemyTeam[b].dif + enemyTeam[b].vel;
      return sb - sa;
    });
    const reorderedEnemy = [...enemySorted.slice(0, 2).map(i => enemyTeam[i]), ...enemySorted.slice(2).map(i => enemyTeam[i])];
    onComplete(reorderedPlayer, reorderedEnemy);
  };

  const handleConfirm = () => { if (starters.length === 2) buildTeams(starters); };
  const handleExpire = () => { buildTeams(starters); };

  const timeLeft = useCountdown(TIMER_SECONDS, handleExpire, "prematch");

  const renderCard = (s, i, isPlayer) => (
    <div key={s.id} className={`rounded-xl p-2 border transition text-left ${isPlayer && starters.includes(i) ? "border-amber-400 bg-amber-400/10" : isPlayer ? "border-white/10 bg-white/5 hover:border-white/30 cursor-pointer" : "border-rose-500/20 bg-white/5"}`}
      onClick={isPlayer ? () => toggleStarter(i) : undefined}>
      <div className="flex gap-2 items-center">
        <SognatoreImage s={s} className="w-12 h-12" />
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold truncate">{s.nome}</div>
          <FactionBadge type={s.tipo} />
          <div className="flex gap-1 mt-0.5 text-[8px]">
            <span className="bg-red-500/20 rounded px-1">ATT {s.att}</span>
            <span className="bg-blue-500/20 rounded px-1">DIF {s.dif}</span>
            <span className="bg-green-500/20 rounded px-1">VEL {s.vel}</span>
          </div>
        </div>
      </div>
      <div className="text-[8px] text-amber-400/80 font-semibold mt-1">{getAbilityName(s, lang)}</div>
      <div className="text-[7px] text-slate-400 leading-tight mt-0.5">{getAbilityDesc(s, lang)}</div>
      {isPlayer && starters.includes(i) && <div className="text-[9px] text-amber-400 font-bold mt-1 text-center">✓ {t('prematch.starter')}</div>}
    </div>
  );

  return (
    <div className="min-h-screen px-4 py-6 max-w-5xl mx-auto bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950 text-white">
      <AbandonButton onAbandon={onAbandon} />
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-sm text-slate-400 hover:text-white">← {t('auction.back')}</button>
        </div>
        <img src={LOGO} alt="Sognatori" className="h-10 object-contain" />
        <div className={`text-xs font-bold ${timeLeft <= 10 ? "text-red-400" : "text-amber-400"}`}>⏱ {timeLeft}s</div>
      </div>
      <TimerBar seconds={timeLeft} total={TIMER_SECONDS} className="mb-4" />

      <div className="text-center mb-4">
        <h2 className="text-lg font-bold text-amber-400">{t('prematch.title')}</h2>
        <p className="text-xs text-slate-400">{t('prematch.subtitle')} ({starters.length}/2)</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
        {playerTeam.map((s, i) => renderCard(s, i, true))}
      </div>

      <div className="text-center mb-3">
        <h3 className="text-sm font-bold text-rose-400">{t('prematch.enemyTeam')}</h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
        {enemyTeam.map((s, i) => renderCard(s, i, false))}
      </div>

      <motion.button whileTap={{ scale: 0.97 }} onClick={handleConfirm} disabled={starters.length !== 2}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 font-bold disabled:opacity-40 hover:brightness-110 transition">
        {t('prematch.confirm')} ({starters.length}/2)
      </motion.button>
    </div>
  );
}