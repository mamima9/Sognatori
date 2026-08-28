// @ts-nocheck


import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ROSTER } from "@/lib/sognatoriData";
import { FactionBadge } from "./HealthBar";
import { useCountdown, TimerBar } from "./Timer";
import AbandonButton from "./AbandonButton";
import { useLanguage } from "@/lib/i18n";
import { getAbilityName, getAbilityDesc } from "@/lib/abilityI18n";

const LOGO = "/images/bannerLOGOSOGNATORI.png";
const BID_OPTIONS = [1, 5, 10];

/**
 * @typedef {Object} Sognatore
 * @property {string} id
 * @property {string} nome
 * @property {string} tipo
 * @property {number} att
 * @property {number} dif
 * @property {number} vel
 * @property {string} abilKey
 * @property {string} abil
 * @property {string} abilDesc
 * @property {number} costo
 * @property {string} theme
 * @property {string} img
 */

/**
 * @typedef {"player"|"ai"} Side
 */

/**
 * @typedef {Object} AuctionLog
 * @property {Side|null} winner
 * @property {number} price
 * @property {Sognatore} sog
 */

export default function Auction({ onComplete, onBack }) {
  const { t, lang } = useLanguage();

  /** @type {[Sognatore[], React.Dispatch<React.SetStateAction<Sognatore[]>>]} */
  const [pool, setPool] = useState(() =>
    [...ROSTER].sort(() => Math.random() - 0.5)
  );

  const [playerCredits, setPlayerCredits] = useState(100);
  const [aiCredits, setAiCredits] = useState(100);

  /** @type {[Sognatore[], React.Dispatch<React.SetStateAction<Sognatore[]>>]} */
  const [playerTeam, setPlayerTeam] = useState([]);

  /** @type {[Sognatore[], React.Dispatch<React.SetStateAction<Sognatore[]>>]} */
  const [aiTeam, setAiTeam] = useState([]);

  /** @type {[Sognatore|null, React.Dispatch<React.SetStateAction<Sognatore|null>>]} */
  const [currentSog, setCurrentSog] = useState(null);

  const [currentBid, setCurrentBid] = useState(0);

  /** @type {[Side|null, React.Dispatch<React.SetStateAction<Side|null>>]} */
  const [currentBidder, setCurrentBidder] = useState(null);

  /** @type {[Side, React.Dispatch<React.SetStateAction<Side>>]} */
  const [turn, setTurn] = useState("player");

  /** @type {[Side, React.Dispatch<React.SetStateAction<Side>>]} */
  const [picker, setPicker] = useState("player");

  /** @type {[AuctionLog[], React.Dispatch<React.SetStateAction<AuctionLog[]>>]} */
  const [roundLog, setRoundLog] = useState([]);

  const [finished, setFinished] = useState(false);
  const [pickingSog, setPickingSog] = useState(false);
  const [round, setRound] = useState(0);

  const playerDone = playerTeam.length >= 4;
  const aiDone = aiTeam.length >= 4;

  const handleAuctionExpire = () => {
    if (!finished) {
      onBack?.();
    }
  };

  const auctionTimeLeft = useCountdown(
    currentSog && !finished ? 60 : 0,
    handleAuctionExpire,
    currentSog?.id || "none"
  );

  const handlePickExpire = () => {
    if (pickingSog) {
      onBack?.();
    }
  };

  const pickTimeLeft = useCountdown(
    pickingSog ? 60 : 0,
    handlePickExpire,
    `pick-${round}`
  );

  const aiValuation = (sog) => {
    const sameType = aiTeam.filter((teamSog) => teamSog.tipo === sog.tipo).length;

    let value =
      sog.costo + Math.round((Math.random() - 0.4) * 12);

    if (sameType >= 2) {
      value = 1;
    } else if (sameType >= 1) {
      value = Math.max(1, value - 4);
    }

    return Math.max(1, value);
  };

  const finish = () => {
    if (finished) return;

    let finalPlayerTeam = [...playerTeam];
    let finalAiTeam = [...aiTeam];

    const soldIds = new Set(
      [...finalPlayerTeam, ...finalAiTeam].map((sog) => sog.id)
    );

    const remaining = pool.filter((sog) => !soldIds.has(sog.id));

    while (finalPlayerTeam.length < 4 && remaining.length > 0) {
      const sog = remaining.shift();

      if (
        sog &&
        !finalPlayerTeam.some((teamSog) => teamSog.id === sog.id)
      ) {
        finalPlayerTeam.push(sog);
      }
    }

    while (finalAiTeam.length < 4 && remaining.length > 0) {
      const sog = remaining.shift();

      if (
        sog &&
        !finalAiTeam.some((teamSog) => teamSog.id === sog.id)
      ) {
        finalAiTeam.push(sog);
      }
    }

    setFinished(true);

    setTimeout(() => {
      onComplete?.(finalPlayerTeam, finalAiTeam);
    }, 800);
  };

  const autoWinAt1 = (winner, sog) => {
    if (!sog) return;

    if (winner === "player") {
      setPlayerTeam((team) =>
        team.some((item) => item.id === sog.id)
          ? team
          : [...team, sog]
      );

      setPlayerCredits((credits) => Math.max(0, credits - 1));
    } else {
      setAiTeam((team) =>
        team.some((item) => item.id === sog.id)
          ? team
          : [...team, sog]
      );

      setAiCredits((credits) => Math.max(0, credits - 1));
    }

    setRoundLog((log) =>
      [
        {
          winner,
          price: 1,
          sog,
        },
        ...log,
      ].slice(0, 10)
    );

    setTimeout(() => {
      setRound((value) => value + 1);
    }, 600);
  };

  const startRound = () => {
    if (finished) return;

    if ((playerDone && aiDone) || pool.length === 0) {
      finish();
      return;
    }

    let nextPicker = picker;

    if (nextPicker === "player" && playerDone) {
      nextPicker = "ai";
    }

    if (nextPicker === "ai" && aiDone) {
      nextPicker = "player";
    }

    if (playerDone && !aiDone) {
      const available = pool
        .filter(
          (sog) => !aiTeam.some((teamSog) => teamSog.id === sog.id)
        )
        .sort((a, b) => b.costo - a.costo);

      const pick = available[0];

      if (!pick) {
        finish();
        return;
      }

      setPool((currentPool) =>
        currentPool.filter((sog) => sog.id !== pick.id)
      );

      autoWinAt1("ai", pick);
      return;
    }

    if (aiDone && !playerDone) {
      setPickingSog(true);
      return;
    }

    if (nextPicker === "player" && !playerDone) {
      setPickingSog(true);
      return;
    }

    if (nextPicker === "ai" && !aiDone) {
      const available = pool
        .filter(
          (sog) => !aiTeam.some((teamSog) => teamSog.id === sog.id)
        )
        .sort((a, b) => b.costo - a.costo);

      if (available.length === 0) {
        finish();
        return;
      }

      const limit = Math.min(3, available.length);
      const pick = available[Math.floor(Math.random() * limit)];

      setPool((currentPool) =>
        currentPool.filter((sog) => sog.id !== pick.id)
      );

      setCurrentSog(pick);
      setCurrentBid(1);
      setCurrentBidder("ai");
      setTurn("player");
      return;
    }

    finish();
  };

  const beginBidding = (sog) => {
    setCurrentSog(sog);
    setCurrentBid(0);
    setCurrentBidder(null);
    setTurn("player");
  };

  const playerPickSog = (sog) => {
    if (!sog) return;

    setPool((currentPool) =>
      currentPool.filter((item) => item.id !== sog.id)
    );

    setPickingSog(false);

    if (aiDone) {
      autoWinAt1("player", sog);
      return;
    }

    beginBidding(sog);
  };

  const resolveWin = (winner) => {
    if (!currentSog) return;

    const sog = currentSog;
    const price = currentBid;

    if (winner === "player") {
      setPlayerTeam((team) =>
        team.some((item) => item.id === sog.id)
          ? team
          : [...team, sog]
      );

      setPlayerCredits((credits) =>
        Math.max(0, credits - price)
      );
    } else {
      setAiTeam((team) =>
        team.some((item) => item.id === sog.id)
          ? team
          : [...team, sog]
      );

      setAiCredits((credits) =>
        Math.max(0, credits - price)
      );
    }

    setRoundLog((log) =>
      [
        {
          winner,
          price,
          sog,
        },
        ...log,
      ].slice(0, 10)
    );

    setCurrentSog(null);
    setCurrentBid(0);
    setCurrentBidder(null);

    setPicker((side) =>
      side === "player" ? "ai" : "player"
    );

    setTimeout(() => {
      setRound((value) => value + 1);
    }, 600);
  };

  const resolveUnsold = () => {
    if (!currentSog) return;

    setRoundLog((log) =>
      [
        {
          winner: null,
          price: 0,
          sog: currentSog,
        },
        ...log,
      ].slice(0, 10)
    );

    setCurrentSog(null);
    setCurrentBid(0);
    setCurrentBidder(null);

    setPicker((side) =>
      side === "player" ? "ai" : "player"
    );

    setTimeout(() => {
      setRound((value) => value + 1);
    }, 600);
  };

  const playerBid = (amount) => {
    const newBid = currentBid + amount;

    if (newBid > playerCredits) return;

    setCurrentBid(newBid);
    setCurrentBidder("player");
    setTurn("ai");
  };

  const playerPass = () => {
    if (currentBidder === null) return;

    resolveWin("ai");
  };

  useEffect(() => {
    if (
      turn !== "ai" ||
      !currentSog ||
      finished
    ) {
      return;
    }

    const timer = setTimeout(() => {
      if (aiDone) {
        if (currentBidder === "player") {
          resolveWin("player");
        } else {
          resolveUnsold();
        }

        return;
      }

      const value = aiValuation(currentSog);

      if (currentBidder === "player") {
        if (
          value > currentBid + 1 &&
          aiCredits >= currentBid + 1
        ) {
          setCurrentBid(currentBid + 1);
          setCurrentBidder("ai");
          setTurn("player");
        } else {
          resolveWin("player");
        }
      } else {
        if (aiCredits >= 1) {
          setCurrentBid(1);
          setCurrentBidder("ai");
          setTurn("player");
        } else {
          resolveUnsold();
        }
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [
    turn,
    currentSog,
    currentBid,
    currentBidder,
    aiDone,
    aiCredits,
    finished,
  ]);

  useEffect(() => {
    if (
      !currentSog &&
      !finished &&
      !pickingSog
    ) {
      startRound();
    }
  }, [round]);

  useEffect(() => {
    if (
      playerDone &&
      aiDone &&
      !finished
    ) {
      finish();
    }
  }, [playerDone, aiDone]);

  if (pickingSog) {
    return (
      <div className="min-h-screen px-4 py-6 max-w-5xl mx-auto bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950 text-white">
        <div className="flex justify-between items-center mb-4">
          <AbandonButton onAbandon={onBack} />

          <h2 className="text-lg font-bold text-amber-400">
            {t("auction.pickTitle")}
          </h2>

          <div
            className={`text-xs font-bold ${
              pickTimeLeft <= 10
                ? "text-red-400"
                : "text-amber-400"
            }`}
          >
            ⏱ {pickTimeLeft}s
          </div>
        </div>

        <p className="text-xs text-slate-400 mb-4">
          {t("auction.pickTurn")}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {pool.map((sog) => (
            <button
              key={sog.id}
              onClick={() => playerPickSog(sog)}
              className="rounded-xl bg-white/5 border border-white/10 hover:border-amber-400/50 hover:bg-white/10 transition p-2 text-left"
            >
              <div className="flex gap-2 items-center">
                <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
                  <img
                    src={sog.img}
                    alt={sog.nome}
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold truncate">
                    {sog.nome}
                  </div>

                  <FactionBadge type={sog.tipo} />

                  <div className="text-[9px] text-slate-400">
                    {sog.att}/{sog.dif}/{sog.vel}
                  </div>
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
          <button
            onClick={onBack}
            className="text-sm text-slate-400 hover:text-white"
          >
            ← {t("auction.back")}
          </button>
        </div>

        <img
          src={LOGO}
          alt="Sognatori"
          className="h-10 object-contain"
        />

        <div className="text-[10px] text-slate-400">
          ✋ {t("battle.chosenMode")}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3">
          <div className="text-xs text-emerald-300 font-semibold">
            {t("auction.you")}
          </div>

          <div className="text-lg font-bold">
            🪙 {playerCredits}
          </div>

          <div className="text-[11px] text-slate-400">
            {playerTeam.length}/4
          </div>

          <div className="flex gap-1 mt-1 flex-wrap">
            {playerTeam.map((sog) => (
              <div
                key={sog.id}
                className="w-8 h-8 rounded-lg overflow-hidden border border-emerald-500/40"
              >
                <img
                  src={sog.img}
                  alt={sog.nome}
                  className="w-full h-full object-contain"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-right">
          <div className="text-xs text-rose-300 font-semibold">
            {t("auction.opponent")}
          </div>

          <div className="text-lg font-bold">
            🪙 {aiCredits}
          </div>

          <div className="text-[11px] text-slate-400">
            {aiTeam.length}/4
          </div>

          <div className="flex gap-1 mt-1 justify-end flex-wrap">
            {aiTeam.map((sog) => (
              <div
                key={sog.id}
                className="w-8 h-8 rounded-lg overflow-hidden border border-rose-500/40"
              >
                <img
                  src={sog.img}
                  alt={sog.nome}
                  className="w-full h-full object-contain"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {currentSog && !finished && (
          <motion.div
            key={currentSog.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-sm mx-auto"
          >
            <div className="rounded-2xl overflow-hidden border border-white/10 bg-white/5 p-4 flex gap-4 items-center">
              <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-white/5">
                <img
                  src={currentSog.img}
                  alt={currentSog.nome}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="flex-1">
                <div className="font-bold text-lg">
                  {currentSog.nome}
                </div>

                <FactionBadge type={currentSog.tipo} />

                <div className="grid grid-cols-3 gap-1 mt-2 text-[10px]">
                  {[
                    ["ATT", currentSog.att],
                    ["DIF", currentSog.dif],
                    ["VEL", currentSog.vel],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="bg-white/5 rounded px-1 py-0.5 text-center"
                    >
                      <div className="text-slate-400">
                        {label}
                      </div>

                      <div className="font-bold">
                        {value}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-[10px] text-amber-400 mt-1 font-semibold">
                  {getAbilityName(currentSog, lang)}
                </div>

                <div className="text-[9px] text-slate-300 mt-0.5 leading-tight">
                  {getAbilityDesc(currentSog, lang)}
                </div>
              </div>
            </div>

            <div className="mt-3 text-center">
              <div className="text-xs text-slate-400">
                {t("auction.currentBid")}
              </div>

              <div className="text-3xl font-bold text-amber-400">
                🪙 {currentBid}
              </div>

              <div className="text-xs text-slate-400">
                {currentBidder === "player"
                  ? t("auction.youLead")
                  : currentBidder === "ai"
                    ? t("auction.aiLead")
                    : t("auction.noBid")}
              </div>
            </div>

            <div className="mt-2">
              <div className="flex justify-between items-center mb-0.5">
                <span className="text-[9px] text-slate-400">
                  {t("auction.timeLeft")}
                </span>

                <span
                  className={`text-[10px] font-bold ${
                    auctionTimeLeft <= 10
                      ? "text-red-400"
                      : "text-amber-400"
                  }`}
                >
                  ⏱ {auctionTimeLeft}s
                </span>
              </div>

              <TimerBar
                seconds={auctionTimeLeft}
                total={60}
              />
            </div>

            {turn === "player" && !playerDone ? (
              <div
                className={`mt-3 grid gap-2 ${
                  currentBid > 0
                    ? "grid-cols-4"
                    : "grid-cols-3"
                }`}
              >
                {BID_OPTIONS.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => playerBid(amount)}
                    disabled={
                      currentBid + amount > playerCredits
                    }
                    className="py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 font-bold text-sm disabled:opacity-30"
                  >
                    +{amount}
                  </button>
                ))}

                {currentBid > 0 && (
                  <button
                    onClick={playerPass}
                    className="py-2.5 rounded-lg bg-white/10 font-bold text-sm hover:bg-white/20"
                  >
                    {t("auction.pass")}
                  </button>
                )}
              </div>
            ) : turn === "player" && playerDone ? (
              <div className="mt-3 text-center">
                <button
                  onClick={playerPass}
                  className="px-6 py-2 rounded-lg bg-white/10 font-bold text-sm"
                >
                  {t("auction.teamComplete")}
                </button>
              </div>
            ) : (
              <div className="mt-3 text-center text-sm text-rose-400 animate-pulse">
                {t("auction.aiThinking")}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-4 space-y-1">
        {roundLog.map((log, index) => (
          <div
            key={`${log.sog.id}-${index}`}
            className="text-[11px] flex items-center gap-2 bg-white/5 rounded-md px-2 py-1"
          >
            <div className="w-6 h-6 rounded overflow-hidden flex-shrink-0">
              <img
                src={log.sog.img}
                alt={log.sog.nome}
                className="w-full h-full object-contain"
              />
            </div>

            <span className="flex-1 truncate">
              {log.sog.nome}
            </span>

            <span
              className={
                log.winner === "player"
                  ? "text-emerald-400"
                  : log.winner === "ai"
                    ? "text-rose-400"
                    : "text-slate-500"
              }
            >
              {log.winner === "player"
                ? `${t("battle.youShort")} — ${log.price}🪙`
                : log.winner === "ai"
                  ? `${t("battle.aiShort")} — ${log.price}🪙`
                  : t("battle.skipped")}
            </span>
          </div>
        ))}
      </div>

      {finished && (
        <div className="text-center text-amber-400 mt-4 animate-pulse">
          {t("auction.teamsReady")}
        </div>
      )}
    </div>
  );
}