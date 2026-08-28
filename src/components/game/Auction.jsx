import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ROSTER } from "@/lib/sognatoriData";
import { Image } from "@/components/ui/image";
import { FactionBadge } from "./HealthBar";
import { useCountdown, TimerBar } from "./Timer";
import AbandonButton from "./AbandonButton";
import { useLanguage } from "@/lib/i18n";
import { getAbilityName, getAbilityDesc } from "@/lib/abilityI18n";

const LOGO = "https://media.base44.com/images/public/6a88c0790ad6d8971067dd2b/970a32337_bannerLOGOSOGNATORI.png";
const BID_OPTIONS = [1, 5, 10];

export default function Auction({ onComplete, onBack }) {
  const { t, lang } = useLanguage();
  const [pool, setPool] = useState(() => [...ROSTER].sort(() => Math.random() - 0.5));
  const [playerCredits, setPlayerCredits] = useState(100);
  const [aiCredits, setAiCredits] = useState(100);
  const [playerTeam, setPlayerTeam] = useState([]);
  const [aiTeam, setAiTeam] = useState([]);
  const [currentSog, setCurrentSog] = useState(null);
  const [currentBid, setCurrentBid] = useState(0);
  const [currentBidder, setCurrentBidder] = useState(null);
  const [turn, setTurn] = useState("player");
  const [picker, setPicker] = useState("player");
  const [roundLog, setRoundLog] = useState([]);
  const [finished, setFinished] = useState(false);
  const [pickingSog, setPickingSog] = useState(false);
  const [round, setRound] = useState(0);

  const handleAuctionExpire = () => { if (!finished) onBack(); };
  const auctionTimeLeft = useCountdown(currentSog && !finished ? 60 : 0, handleAuctionExpire, currentSog?.id || "none");

  const handlePickExpire = () => { if (pickingSog) onBack(); };
  const pickTimeLeft = useCountdown(pickingSog ? 60 : 0, handlePickExpire, `pick-${round}`);

  const playerDone = playerTeam.length >= 4;
  const aiDone = aiTeam.length >= 4;

  const aiValuation = (s) => {
    const sameType = aiTeam.filter(t => t.tipo === s.tipo).length;
    let val = s.costo + Math.round((Math.random() - 0.4) * 12);
    if (sameType >= 2) val = 1;
    else if (sameType >= 1) val = Math.max(1, val - 4);
    return Math.max(1, val);
  };

  const finish = () => {
    if (finished) return;
    let pt = [...playerTeam], et = [...aiTeam];
    const sold = new Set([...pt, ...et].map(s => s.id));
    const remaining = pool.filter(s => !sold.has(s.id));
    while (pt.length < 4 && remaining.length > 0) { const n = remaining.shift(); if (!pt.some(s => s.id === n.id)) pt.push(n); }
    while (et.length < 4 && remaining.length > 0) { const n = remaining.shift(); if (!et.some(s => s.id === n.id)) et.push(n); }
    setFinished(true);
    setTimeout(() => onComplete(pt, et), 800);
  };

  const autoWinAt1 = (winner, sog) => {
    if (winner === "player") { setPlayerTeam(t => t.some(s => s.id === sog.id) ? t : [...t, sog]); setPlayerCredits(c => c - 1); }
    else { setAiTeam(t => t.some(s => s.id === sog.id) ? t : [...t, sog]); setAiCredits(c => c - 1); }
    setRoundLog(l => [{ winner, price: 1, sog }, ...l].slice(0, 10));
    setTimeout(() => setRound(r => r + 1), 600);
  };

  const startRound = () => {
    if (finished) return;
    if ((playerDone && aiDone) || pool.length === 0) { finish(); return; }
    if (playerDone && aiDone) { finish(); return; }
    let p = picker;
    if (p === "player" && playerDone) p = "ai";
    if (p === "ai" && aiDone) p = "player";
    if (playerDone && !aiDone) {
      const pick = [...pool].filter(s => !aiTeam.some(t => t.id === s.id)).sort((a, b) => b.costo - a.costo)[0];
      if (!pick) { finish(); return; }
      setPool(prev => prev.filter(s => s.id !== pick.id));
      autoWinAt1("ai", pick);
      return;
    }
    if (aiDone && !playerDone) {
      setPickingSog(true);
      return;
    }
    if (p === "player" && !playerDone) {
      setPickingSog(true);
    } else if (p === "ai" && !aiDone) {
      const available = [...pool].filter(s => !aiTeam.some(t => t.id === s.id)).sort((a, b) => b.costo - a.costo);
      const pick = available[Math.floor(Math.random() * Math.min(3, available.length))];
      setPool(prev => prev.filter(s => s.id !== pick.id));
      setCurrentSog(pick);
      setCurrentBid(1);
      setCurrentBidder("ai");
      setTurn("player");
    } else {
      finish();
    }
  };

  const beginBidding = (sog) => {
    setCurrentSog(sog);
    setCurrentBid(0);
    setCurrentBidder(null);
    setTurn("player");
  };

  const playerPickSog = (sog) => {
    setPool(prev => prev.filter(s => s.id !== sog.id));
    setPickingSog(false);
    if (aiDone) { autoWinAt1("player", sog); return; }
    beginBidding(sog);
  };

  const resolveWin = (winner) => {
    if (!currentSog) return;
    const sog = currentSog, price = currentBid;
    if (winner === "player") { setPlayerTeam(t => t.some(s => s.id === sog.id) ? t : [...t, sog]); setPlayerCredits(c => c - price); }
    else { setAiTeam(t => t.some(s => s.id === sog.id) ? t : [...t, sog]); setAiCredits(c => c - price); }
    setRoundLog(l => [{ winner, price, sog }, ...l].slice(0, 10));
    setCurrentSog(null); setCurrentBid(0); setCurrentBidder(null);
    setPicker(p => p === "player" ? "ai" : "player");
    setTimeout(() => setRound(r => r + 1), 600);
  };

  const resolveUnsold = () => {
    if (!currentSog) return;
    setRoundLog(l => [{ winner: "—", price: 0, sog: currentSog }, ...l].slice(0, 10));
    setCurrentSog(null); setCurrentBid(0); setCurrentBidder(null);
    setPicker(p => p === "player" ? "ai" : "player");
    setTimeout(() => setRound(r => r + 1), 600);
  };

  const playerBid = (amount) => {
    const newBid = currentBid + amount;
    if (newBid > playerCredits) return;
    setCurrentBid(newBid); setCurrentBidder("player"); setTurn("ai");
  };

  const playerPass = () => {
    if (currentBidder === null) return; // non può passare a 0, deve partire da 1
    resolveWin("ai");
  };

  // AI turn
  useEffect(() => {
    if (turn !== "ai" || !currentSog || finished) return;
    const timer = setTimeout(() => {
      if (aiDone) {
        if (currentBidder === "player") resolveWin("player");
        else resolveUnsold();
        return;
      }
      const val = aiValuation(currentSog);
      if (currentBidder === "player") {
        if (val > currentBid + 1 && aiCredits >= currentBid + 1) {
          setCurrentBid(currentBid + 1); setCurrentBidder("ai"); setTurn("player");
        } else { resolveWin("player"); }
      } else {
        if (aiCredits >= 1) {
          setCurrentBid(1); setCurrentBidder("ai"); setTurn("player");
        } else { resolveUnsold(); }
      }
    }, 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line
  }, [turn, currentSog, currentBid, currentBidder, aiDone, aiCredits, finished]);

  useEffect(() => {
    if (!currentSog && !finished && !pickingSog) startRound();
    // eslint-disable-next-line
  }, [round]);

  useEffect(() => {
    if (playerDone && aiDone && !finished) finish();
    // eslint-disable-next-line
  }, [playerDone, aiDone]);

  // Picking (chosen mode)
  if (pickingSog) {
    return (
      <div className="min-h-screen px-4 py-6 max-w-5xl mx-auto bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950 text-white">
        <div className="flex justify-between items-center mb-4">
          <AbandonButton onAbandon={onBack} />
          <h2 className="text-lg font-bold text-amber-400">{t('auction.pickTitle')}</h2>
          <div className={`text-xs font-bold ${pickTimeLeft <= 10 ? "text-red-400" : "text-amber-400"}`}>⏱ {pickTimeLeft}s</div>
        </div>
        <p className="text-xs text-slate-400 mb-4">{t('auction.pickTurn')}</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {pool.map(s => (
            <button key={s.id} onClick={() => playerPickSog(s)}
              className="rounded-xl bg-white/5 border border-white/10 hover:border-amber-400/50 hover:bg-white/10 transition p-2 text-left">
              <div className="flex gap-2 items-center">
                <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0"><Image src={s.img} alt={s.nome} className="w-full h-full" fittingType="fit" /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold truncate">{s.nome}</div>
                  <FactionBadge type={s.tipo} />
                  <div className="text-[9px] text-slate-400">{s.att}/{s.dif}/{s.vel}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 max-w-5xl mx-auto bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950 text-white">
      <div className="flex items-center justify-between mb-4">
        <AbandonButton onAbandon={onBack} />
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-sm text-slate-400 hover:text-white">← {t('auction.back')}</button>
        </div>
        <img src={LOGO} alt="Sognatori" className="h-10 object-contain" />
        <div className="text-[10px] text-slate-400">✋ {t('battle.chosenMode')}</div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3">
          <div className="text-xs text-emerald-300 font-semibold">{t('auction.you')}</div>
          <div className="text-lg font-bold">🪙 {playerCredits}</div>
          <div className="text-[11px] text-slate-400">{playerTeam.length}/4</div>
          <div className="flex gap-1 mt-1 flex-wrap">
            {playerTeam.map(s => <div key={s.id} className="w-8 h-8 rounded-lg overflow-hidden border border-emerald-500/40"><Image src={s.img} alt={s.nome} className="w-full h-full" fittingType="fit" /></div>)}
          </div>
        </div>
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-right">
          <div className="text-xs text-rose-300 font-semibold">{t('auction.opponent')}</div>
          <div className="text-lg font-bold">🪙 {aiCredits}</div>
          <div className="text-[11px] text-slate-400">{aiTeam.length}/4</div>
          <div className="flex gap-1 mt-1 justify-end flex-wrap">
            {aiTeam.map(s => <div key={s.id} className="w-8 h-8 rounded-lg overflow-hidden border border-rose-500/40"><Image src={s.img} alt={s.nome} className="w-full h-full" fittingType="fit" /></div>)}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {currentSog && !finished && (
          <motion.div key={currentSog.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-sm mx-auto">
            <div className="rounded-2xl overflow-hidden border border-white/10 bg-white/5 p-4 flex gap-4 items-center">
              <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-white/5"><Image src={currentSog.img} alt={currentSog.nome} className="w-full h-full" fittingType="fit" /></div>
              <div className="flex-1">
                <div className="font-bold text-lg">{currentSog.nome}</div>
                <FactionBadge type={currentSog.tipo} />
                <div className="grid grid-cols-3 gap-1 mt-2 text-[10px]">
                  {[["ATT", currentSog.att], ["DIF", currentSog.dif], ["VEL", currentSog.vel]].map(([l, v]) => (
                    <div key={l} className="bg-white/5 rounded px-1 py-0.5 text-center"><div className="text-slate-400">{l}</div><div className="font-bold">{v}</div></div>
                  ))}
                </div>
                <div className="text-[10px] text-amber-400 mt-1 font-semibold">{getAbilityName(currentSog, lang)}</div>
                <div className="text-[9px] text-slate-300 mt-0.5 leading-tight">{getAbilityDesc(currentSog, lang)}</div>
              </div>
            </div>

            <div className="mt-3 text-center">
              <div className="text-xs text-slate-400">{t('auction.currentBid')}</div>
              <div className="text-3xl font-bold text-amber-400">🪙 {currentBid}</div>
              <div className="text-xs text-slate-400">{currentBidder === "player" ? t('auction.youLead') : currentBidder === "ai" ? t('auction.aiLead') : t('auction.noBid')}</div>
            </div>

            {currentSog && !finished && (
              <div className="mt-2">
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-[9px] text-slate-400">{t('auction.timeLeft')}</span>
                  <span className={`text-[10px] font-bold ${auctionTimeLeft <= 10 ? "text-red-400" : "text-amber-400"}`}>⏱ {auctionTimeLeft}s</span>
                </div>
                <TimerBar seconds={auctionTimeLeft} total={60} />
              </div>
            )}

            {turn === "player" && !playerDone ? (
              <div className={`mt-3 grid gap-2 ${currentBid > 0 ? "grid-cols-4" : "grid-cols-3"}`}>
                {BID_OPTIONS.map(amt => (
                  <button key={amt} onClick={() => playerBid(amt)} disabled={currentBid + amt > playerCredits}
                    className="py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 font-bold text-sm disabled:opacity-30">+{amt}</button>
                ))}
                {currentBid > 0 && <button onClick={playerPass} className="py-2.5 rounded-lg bg-white/10 font-bold text-sm hover:bg-white/20">{t('auction.pass')}</button>}
                </div>
                ) : turn === "player" && playerDone ? (
                <div className="mt-3 text-center"><button onClick={playerPass} className="px-6 py-2 rounded-lg bg-white/10 font-bold text-sm">{t('auction.teamComplete')}</button></div>
                ) : (
                <div className="mt-3 text-center text-sm text-rose-400 animate-pulse">{t('auction.aiThinking')}</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-4 space-y-1">
        {roundLog.map((r, i) => (
          <div key={i} className="text-[11px] flex items-center gap-2 bg-white/5 rounded-md px-2 py-1">
            <div className="w-6 h-6 rounded overflow-hidden flex-shrink-0"><Image src={r.sog.img} alt={r.sog.nome} className="w-full h-full" fittingType="fit" /></div>
            <span className="flex-1 truncate">{r.sog.nome}</span>
            <span className={r.winner === "player" ? "text-emerald-400" : r.winner === "ai" ? "text-rose-400" : "text-slate-500"}>
              {r.winner === "player" ? `${t('battle.youShort')} — ${r.price}🪙` : r.winner === "ai" ? `${t('battle.aiShort')} — ${r.price}🪙` : t('battle.skipped')}
            </span>
          </div>
        ))}
      </div>

      {finished && <div className="text-center text-amber-400 mt-4 animate-pulse">{t('auction.teamsReady')}</div>}
    </div>
  );
}