import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  applyEndOfTurn,
  aiChooseActions,
  onEntry,
  initBattleSognatore,
  calcDamage,
  orderActions,
  processAction
} from "@/lib/battleEngine";
import BattlePokemon from "./BattlePokemon";
import BenchCard from "./BenchCard";
import { SognatoreImage } from "./HealthBar";
import TypeChartTable from "./TypeChartTable";
import { useCountdown, TimerBar } from "./Timer";
import AbandonButton from "./AbandonButton";
import { useLanguage } from "@/lib/i18n";
import { bm } from "@/lib/battleMessages";
import { getAbilityName, getAbilityDesc } from "@/lib/abilityI18n";

const TURN_SECONDS = 60;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function actionLabel(act, enemyActive, playerBench, m) {
  if (!act) return "";

  if (act.type === "attack") {
    const t = enemyActive.find((e) => e && e.id === act.targetId);
    return `⚔️ ${m.attacksLabel} ${t ? t.nome : "?"}`;
  }

  if (act.type === "protect") {
    return `🛡️ ${m.protectLabel}`;
  }

  if (act.type === "switch") {
    const b = playerBench[act.benchIdx];
    return `🔄 → ${b ? b.nome : "?"}`;
  }

  return "";
}

export default function BattleArena({ playerTeam, enemyTeam, onEnd }) {
  const { t, lang, setLang } = useLanguage();
  const m = bm(lang);

  const [playerActive, setPlayerActive] = useState(
    () => playerTeam.slice(0, 2).map(initBattleSognatore)
  );

  const [enemyActive, setEnemyActive] = useState(
    () => enemyTeam.slice(0, 2).map(initBattleSognatore)
  );

  const [playerBench, setPlayerBench] = useState(
    () => playerTeam.slice(2).map(initBattleSognatore)
  );

  const [enemyBench, setEnemyBench] = useState(
    () => enemyTeam.slice(2).map(initBattleSognatore)
  );

  const [actions, setActions] = useState({});
  const [log, setLog] = useState([m.battleStart]);
  const [phase, setPhase] = useState("select");
  const [busy, setBusy] = useState(false);
  const [popups, setPopups] = useState([]);
  const [showTypeChart, setShowTypeChart] = useState(false);
  const [showBench, setShowBench] = useState(false);
  const [animLogStart, setAnimLogStart] = useState(0);
  const [turnKey, setTurnKey] = useState(0);
  const [currentTurn, setCurrentTurn] = useState(0);

  const logEnd = useRef(null);

  useEffect(() => {
    const logs = [];

    playerActive.forEach(s => {
      if (s) logs.push(...onEntry(s, playerActive, enemyActive, lang));
    });

    enemyActive.forEach(s => {
      if (s) logs.push(...onEntry(s, enemyActive, playerActive, lang));
    });

    if (logs.length) {
      setLog(prev => [...prev, ...logs]);
      setPlayerActive(prev => [...prev]);
      setEnemyActive(prev => [...prev]);
    }

    // eslint-disable-next-line
  }, []);

  const setAction = (slot, action) =>
    setActions((a) => ({ ...a, [slot]: action }));

  const aliveSlots = playerActive
    .map((s, i) => (s && !s.fainted ? i : null))
    .filter((i) => i !== null);

  const allSet = aliveSlots.every(
    (i) => actions[i] && !actions[i]._picking
  );

  const confirmTurn = async (overrideActions) => {
    const usedActions = overrideActions || actions;

    setBusy(true);
    setPhase("animating");
    setAnimLogStart(log.length);

    const aiActions = aiChooseActions(
      enemyActive,
      playerActive,
      enemyBench
    );

    let pActive = [...playerActive];
    let pBench = [...playerBench];
    let eActive = [...enemyActive];
    let eBench = [...enemyBench];

    const slots = pActive
      .map((s, i) => (s && !s.fainted ? i : null))
      .filter((i) => i !== null);

    // Process switches
    const switchLogs = [];
    const entered = [];

    slots.forEach((i) => {
      const act = usedActions[i];

      if (act && act.type === "switch" && pActive[i]) {
        const inc = pBench[act.benchIdx];
        const out = pActive[i];

        pActive[i] = inc;
        pBench[act.benchIdx] = out;

        switchLogs.push(m.switchLog(out.nome, inc.nome));

        entered.push({
          s: inc,
          allies: pActive,
          enemies: eActive
        });
      }
    });

    aiActions.forEach((a, i) => {
      if (a && a.type === "switch" && eActive[i]) {
        const inc = eBench[a.benchIdx];
        const out = eActive[i];

        eActive[i] = inc;
        eBench[a.benchIdx] = out;

        switchLogs.push(
          m.enemySwitchLog(out.nome, inc.nome)
        );

        entered.push({
          s: inc,
          allies: eActive,
          enemies: pActive
        });
      }
    });

    entered.forEach(({ s, allies, enemies }) => {
      switchLogs.push(
        ...onEntry(s, allies, enemies, lang)
      );
    });

    // Process protections
    const protectLogs = [];

    slots.forEach((i) => {
      const act = usedActions[i];

      if (
        act &&
        act.type === "protect" &&
        pActive[i] &&
        !pActive[i].protectedLastTurn
      ) {
        pActive[i].protectedThisTurn = true;
        protectLogs.push(
          m.protects(pActive[i].nome)
        );
      }
    });

    aiActions.forEach((a, i) => {
      if (
        a &&
        a.type === "protect" &&
        eActive[i] &&
        !eActive[i].protectedLastTurn
      ) {
        eActive[i].protectedThisTurn = true;
        protectLogs.push(
          m.enemyProtects(eActive[i].nome)
        );
      }
    });

    setPlayerActive([...pActive]);
    setPlayerBench([...pBench]);
    setEnemyActive([...eActive]);
    setEnemyBench([...eBench]);

    setActions({});
    setCurrentTurn(ct => ct + 1);

    setLog(prev => [
      ...prev,
      `__TURN_${currentTurn + 1}__`
    ]);

    for (const l of switchLogs) {
      setLog(prev => [...prev, l]);
      await sleep(4000);
    }

    for (const l of protectLogs) {
      setLog(prev => [...prev, l]);
      await sleep(4000);
    }

    // Build and order attacks
    const playerAttacks = [];

    slots.forEach((i) => {
      const act = usedActions[i];

      if (
        act &&
        act.type === "attack" &&
        pActive[i]
      ) {
        const target =
          eActive.find(
            s =>
              s &&
              s.id === act.targetId &&
              !s.fainted
          ) ||
          eActive.find(
            s => s && !s.fainted
          );

        if (target) {
          playerAttacks.push({
            attacker: pActive[i],
            target
          });
        }
      }
    });

    const enemyAttacks = [];

    aiActions.forEach((a, i) => {
      if (
        a &&
        a.type === "attack" &&
        eActive[i]
      ) {
        const target =
          pActive.find(
            s =>
              s &&
              s.id === a.targetId &&
              !s.fainted
          ) ||
          pActive.find(
            s => s && !s.fainted
          );

        if (target) {
          enemyAttacks.push({
            attacker: eActive[i],
            target
          });
        }
      }
    });

    const ordered = orderActions(
      pActive,
      eActive,
      playerAttacks,
      enemyAttacks
    );

    // Execute each attack one at a time — 4 seconds per move
    for (const act of ordered) {
      const {
        log: actionLog,
        events
      } = processAction(act, lang);

      setLog(prev => [
        ...prev,
        ...actionLog
      ]);

      if (events.length) {
        setPopups(events);
      }

      setPlayerActive([...pActive]);
      setEnemyActive([...eActive]);

      await sleep(4000);

      setPopups([]);

      await sleep(200);
    }

    // End of turn
    const endLog = applyEndOfTurn(
      [...pActive, ...eActive],
      lang
    );

    for (const l of endLog) {
      setLog(prev => [...prev, l]);
      await sleep(4000);
    }

    // Handle enemy faints/replacements
    const finalEActive = [];
    const finalEBench = [...eBench];
    const enteredEnemies = [];

    for (const s of eActive) {
      if (s && s.fainted) {
        const bi = finalEBench.findIndex(
          b => b && !b.fainted
        );

        if (bi !== -1) {
          const inc = finalEBench[bi];

          finalEBench[bi] = s;
          finalEActive.push(inc);
          enteredEnemies.push(inc);

          setLog(prev => [
            ...prev,
            m.enemyEnter(inc.nome)
          ]);

          await sleep(4000);
        }
      } else if (s) {
        finalEActive.push(s);
      }
    }

    enteredEnemies.forEach(inc => {
      onEntry(
        inc,
        finalEActive,
        pActive,
        lang
      ).forEach(l =>
        setLog(prev => [...prev, l])
      );
    });

    setPlayerActive([...pActive]);
    setPlayerBench([...pBench]);
    setEnemyActive([...finalEActive]);
    setEnemyBench([...finalEBench]);

    const pAlive = [
      ...pActive,
      ...pBench
    ].filter(
      s => s && !s.fainted
    ).length;

    const eAlive = [
      ...finalEActive,
      ...finalEBench
    ].filter(
      s => s && !s.fainted
    ).length;

    if (pAlive === 0) {
      setPhase("done");
      onEnd("lose");
      return;
    }

    if (eAlive === 0) {
      setPhase("done");
      onEnd("win");
      return;
    }

    if (
      pActive.some(
        s => s && s.fainted
      )
    ) {
      setPhase("switch");
    } else {
      setPhase("select");
      setTurnKey(k => k + 1);
    }

    setBusy(false);
  };

  const handleTimerExpire = () => {
    if (
      phase !== "select" ||
      busy
    ) {
      return;
    }

    const slots = playerActive
      .map(
        (s, i) =>
          s && !s.fainted ? i : null
      )
      .filter(
        i => i !== null
      );

    const newActions = {};

    slots.forEach(i => {
      if (
        actions[i] &&
        !actions[i]._picking
      ) {
        newActions[i] =
          actions[i];
      } else {
        const targets =
          enemyActive.filter(
            e =>
              e &&
              !e.fainted
          );

        if (targets.length > 0) {
          newActions[i] = {
            type: "attack",
            targetId:
              targets[
                Math.floor(
                  Math.random() *
                    targets.length
                )
              ].id
          };
        } else {
          newActions[i] = {
            type: "protect"
          };
        }
      }
    });

    setActions(newActions);
    confirmTurn(newActions);
  };

  const timeLeft = useCountdown(
    phase === "select" && !busy
      ? TURN_SECONDS
      : 0,
    handleTimerExpire,
    `${phase}-${turnKey}`
  );

  const handleSwitchExpire = () => {
    if (
      phase !== "switch" ||
      busy
    ) {
      return;
    }

    if (benchAlive.length > 0) {
      handleSwitchIn(
        playerBench.indexOf(
          benchAlive[0]
        )
      );
    } else {
      handlePlayDown();
    }
  };

  const switchTimeLeft = useCountdown(
    phase === "switch" && !busy
      ? TURN_SECONDS
      : 0,
    handleSwitchExpire,
    `switch-${turnKey}`
  );

  const handleSwitchIn = (benchIdx) => {
    const slot =
      playerActive.findIndex(
        s => s && s.fainted
      );

    if (slot === -1) return;

    const inc =
      playerBench[benchIdx];

    const out =
      playerActive[slot];

    const newActive = [
      ...playerActive
    ];

    newActive[slot] = inc;

    const newBench = [
      ...playerBench
    ];

    newBench[benchIdx] = out;

    const entryLogs = onEntry(
      inc,
      newActive,
      enemyActive,
      lang
    );

    setPlayerActive(
      newActive
    );

    setPlayerBench(
      newBench
    );

    setLog(prev => [
      ...prev,
      m.koEnter(
        out.nome,
        inc.nome
      ),
      ...entryLogs
    ]);

    setTimeout(() => {
      if (
        !newActive.some(
          s => s && s.fainted
        )
      ) {
        setPhase("select");
        setTurnKey(
          k => k + 1
        );
      }
    }, 200);
  };

  const handlePlayDown = () => {
    const slot =
      playerActive.findIndex(
        s => s && s.fainted
      );

    if (slot === -1) return;

    const ko =
      playerActive[slot];

    const newActive =
      playerActive.filter(
        (_, i) => i !== slot
      );

    setPlayerActive(
      newActive
    );

    setLog(prev => [
      ...prev,
      m.playDown(
        ko.nome
      )
    ]);

    setTimeout(() => {
      if (
        newActive.filter(
          s =>
            s &&
            !s.fainted
        ).length === 0
      ) {
        setPhase("done");
        onEnd("lose");
        return;
      }

      if (
        !newActive.some(
          s => s && s.fainted
        )
      ) {
        setPhase("select");
        setTurnKey(
          k => k + 1
        );
      }
    }, 200);
  };

  const switchSlot =
    playerActive.findIndex(
      s => s && s.fainted
    );

  const benchAlive =
    playerBench.filter(
      s =>
        s &&
        !s.fainted
    );

  const animLogs =
    log.slice(animLogStart);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col">

      <div className="relative flex-1 px-4 pt-5 pb-3 max-w-4xl mx-auto w-full">

     <div className="flex items-center gap-3 mb-2">
  <span className="text-xs uppercase tracking-widest text-amber-400 font-bold">
    {t("battle.vgc")}
  </span>

  <button
    onClick={() => setShowTypeChart(true)}
    className="text-[10px] px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition"
  >
    📊 {t("battle.types")}
  </button>

  <button
    onClick={() => setShowBench(true)}
    className="text-[10px] px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition"
  >
    🪑 {t("battle.bench")}
  </button>

  <AbandonButton
    onAbandon={() => onEnd("abandon")}
  />
</div>

        {phase === "animating" &&
          animLogs.length > 0 && (
            <div className="flex justify-center mb-2">
              <motion.div
                key={animLogs.length}
                initial={{
                  opacity: 0,
                  scale: 0.85
                }}
                animate={{
                  opacity: 1,
                  scale: 1
                }}
                transition={{
                  duration: 0.3
                }}
                className="bg-slate-900/95 backdrop-blur border border-amber-500/40 rounded-2xl px-5 py-3 w-full max-w-4xl text-center shadow-2xl"
              >
                <div className="text-[9px] uppercase tracking-widest text-amber-400 font-bold mb-1">
                  {t("battle.turn")}{" "}
                  {currentTurn}
                </div>

             <div className="space-y-1">
  {animLogs
    .filter(l => !l.startsWith("__TURN_"))
    .slice(-8)
.map((l, i, arr) => (
      <div
        key={i}
        className={`rounded-xl px-3 py-1.5 text-[11px] font-semibold leading-snug ${
          i === arr.length - 1
            ? "bg-white/10 text-white"
            : "bg-black/20 text-slate-400"
        }`}
      >
        {l}
      </div>
    ))}
</div>
              </motion.div>
            </div>
          )}

        <div className="relative rounded-3xl bg-gradient-to-b from-rose-950/30 via-slate-900/40 to-emerald-950/30 border border-white/10 p-4 sm:p-6">

          <div className="text-center text-[10px] uppercase tracking-widest text-rose-400 font-bold mb-1">
            {t("battle.opponent")}
          </div>

          <div className="flex justify-around items-end min-h-[120px]">
            {enemyActive.map(
              (s, i) => (
                <BattlePokemon
                  key={s.id + i}
                  s={s}
                  side="enemy"
                  popup={popups.find(
                    p =>
                      p.targetId ===
                      s.id
                  )}
                />
              )
            )}
          </div>

          <div className="my-3 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          <div className="flex justify-around items-start min-h-[120px]">
            {playerActive.map(
              (s, i) => (
                <BattlePokemon
                  key={s.id + i}
                  s={s}
                  side="player"
                  popup={popups.find(
                    p =>
                      p.targetId ===
                      s.id
                  )}
                />
              )
            )}
          </div>

          <div className="text-center text-[10px] uppercase tracking-widest text-emerald-400 font-bold mt-1">
            {t("battle.you")}
          </div>

        </div>
      </div>

      <div className="bg-slate-950/90 backdrop-blur border-t border-white/10 px-4 py-3 max-w-4xl mx-auto w-full">

        {phase === "select" && (
          <div className="mb-2">

            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] text-slate-400">
                {t("battle.timeMoves")}
              </span>

              <span
                className={`text-xs font-bold ${
                  timeLeft <= 10
                    ? "text-red-400"
                    : "text-amber-400"
                }`}
              >
                ⏱ {timeLeft}s
              </span>
            </div>

            <TimerBar
              seconds={timeLeft}
              total={TURN_SECONDS}
            />

          </div>
        )}

        {phase === "select" && (
          <div className="grid grid-cols-2 gap-3">

            {playerActive.map(
              (s, i) => {
                if (!s || s.fainted)
                  return (
                    <div
                      key={i}
                    />
                  );

                const act =
                  actions[i];

                return (
                  <div
  key={i}
  className="rounded-xl bg-white/5 p-2 min-h-[190px] flex flex-col"
>

                    <div className="text-xs font-semibold flex items-center gap-1">

                      <div className="w-5 h-5 rounded overflow-hidden">
                        <SognatoreImage
                          s={s}
                          className="w-full h-full"
                        />
                      </div>

                      {s.nome}

                      {s.protectedLastTurn && (
                        <span className="text-[9px] text-blue-400">
                          🛡️ {t("battle.used")}
                        </span>
                      )}

                      {s.cannotSwitch && (
                        <span className="text-[9px] text-red-400">
                          🔒 {t("battle.locked")}
                        </span>
                      )}

                    </div>

                    <div className="text-[9px] text-amber-400/80 leading-tight mt-0.5">
                      {getAbilityName(
                        s,
                        lang
                      )}{" "}
                      ·{" "}
                      {getAbilityDesc(
                        s,
                        lang
                      )}
                    </div>

                    {!act ? (
                      <div className="space-y-1 mt-1">

                        <div className="grid grid-cols-3 gap-1">

                          <button
                            onClick={() =>
                              setAction(
                                i,
                                {
                                  type: "attack",
                                  _picking: true
                                }
                              )
                            }
                            className="text-[10px] py-1 rounded bg-red-500/20 hover:bg-red-500/30"
                          >
                            ⚔️{" "}
                            {t("battle.attack")}
                          </button>

                          <button
                            onClick={() =>
                              setAction(
                                i,
                                {
                                  type: "protect"
                                }
                              )
                            }
                            disabled={
                              s.protectedLastTurn
                            }
                            className="text-[10px] py-1 rounded bg-blue-500/20 hover:bg-blue-500/30 disabled:opacity-30"
                          >
                            🛡️{" "}
                            {t("battle.protect")}
                          </button>

                          <button
                            onClick={() =>
                              setAction(
                                i,
                                {
                                  type: "switch",
                                  _picking: true
                                }
                              )
                            }
                            disabled={
                              benchAlive.length === 0 ||
                              s.cannotSwitch
                            }
                            className="text-[10px] py-1 rounded bg-purple-500/20 hover:bg-purple-500/30 disabled:opacity-30"
                          >
                            🔄{" "}
                            {t("battle.switch")}
                          </button>

                        </div>

                      </div>

                    ) : act._picking &&
                      act.type === "attack" ? (

                      <div className="mt-1 flex flex-wrap gap-1">

                        {enemyActive
                          .filter(
                            e =>
                              e &&
                              !e.fainted
                          )
                          .map(e => {

                            const {
                              dmg,
                              efficacy
                            } = calcDamage(
                              s,
                              e
                            );

                            const effColor =
                              efficacy === "se"
                                ? "text-green-400"
                                : efficacy === "res"
                                ? "text-orange-400"
                                : efficacy === "immune"
                                ? "text-slate-500"
                                : "text-slate-300";

                            const effIcon =
                              efficacy === "se"
                                ? "🔥"
                                : efficacy === "res"
                                ? "🛡️"
                                : efficacy === "immune"
                                ? "✕"
                                : "";

                            return (
                              <button
                                key={e.id}
                                onClick={() =>
                                  setAction(
                                    i,
                                    {
                                      type: "attack",
                                      targetId: e.id
                                    }
                                  )
                                }
                                className="text-[10px] px-2 py-1 rounded bg-white/10 hover:bg-white/20 flex items-center gap-1"
                              >

                                <div className="w-5 h-5 rounded overflow-hidden">
                                  <SognatoreImage
                                    s={e}
                                    className="w-full h-full"
                                  />
                                </div>

                                {e.nome}

                                <span
                                  className={`font-bold ${effColor}`}
                                >
                                  ~{dmg}
                                  {effIcon &&
                                    ` ${effIcon}`}
                                </span>

                              </button>
                            );
                          })}

                      </div>

                    ) : act._picking &&
                      act.type === "switch" ? (

                      <div className="mt-1 flex flex-wrap gap-1">

                        {playerBench.map(
                          (b, bi) =>
                            b &&
                            !b.fainted ? (
                              <button
                                key={b.id}
                                onClick={() =>
                                  setAction(
                                    i,
                                    {
                                      type: "switch",
                                      benchIdx: bi
                                    }
                                  )
                                }
                                className="text-[10px] px-2 py-1 rounded bg-white/10 hover:bg-white/20 flex items-center gap-1"
                              >

                                <div className="w-5 h-5 rounded overflow-hidden">
                                  <SognatoreImage
                                    s={b}
                                    className="w-full h-full"
                                  />
                                </div>

                                {b.nome}

                              </button>
                            ) : null
                        )}

                      </div>

                    ) : (

                      <div className="mt-1 text-[11px] flex justify-between items-center">

                        <span>
                          {actionLabel(
                            act,
                            enemyActive,
                            playerBench,
                            m
                          )}
                        </span>

                        <button
                          onClick={() =>
                            setAction(
                              i,
                              null
                            )
                          }
                          className="text-[10px] text-amber-400"
                        >
                          {t("battle.change")}
                        </button>

                      </div>

                    )}

                  </div>
                );
              }
            )}

            <div className="col-span-2">

              <button
                onClick={() =>
                  confirmTurn()
                }
                disabled={
                  busy ||
                  !allSet
                }
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold disabled:opacity-40 hover:brightness-110 transition"
              >
                {t("battle.confirm")}
              </button>
</div>
            </div>
        )}

        {phase === "animating" && (
          <div className="text-center text-sm text-amber-400 py-4 animate-pulse">
            {t("battle.executing")}
          </div>
        )}

        {phase === "switch" &&
          switchSlot !== -1 && (

            <div className="text-center py-2">

              <div className="flex justify-between items-center mb-2">

                <span className="text-[10px] text-slate-400">
                  {t("battle.timeSub")}
                </span>

                <span
                  className={`text-xs font-bold ${
                    switchTimeLeft <= 10
                      ? "text-red-400"
                      : "text-amber-400"
                  }`}
                >
                  ⏱ {switchTimeLeft}s
                </span>

              </div>

              <TimerBar
                seconds={switchTimeLeft}
                total={TURN_SECONDS}
                className="mb-3"
              />

              <div className="text-sm text-amber-400 mb-2">
                {t("battle.koMsg")}
              </div>

              <div className="flex flex-wrap gap-2 justify-center">

                {benchAlive.map(
                  b => (
                    <button
                      key={b.id}
                      onClick={() =>
                        handleSwitchIn(
                          playerBench.indexOf(
                            b
                          )
                        )
                      }
                      className="text-sm px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 flex items-center gap-2"
                    >

                      <div className="w-7 h-7 rounded-lg overflow-hidden">
                        <SognatoreImage
                          s={b}
                          className="w-full h-full"
                        />
                      </div>

                      {b.nome} ({b.hp}/20)

                    </button>
                  )
                )}

                {benchAlive.length === 0 && (
                  <button
                    onClick={
                      handlePlayDown
                    }
                    className="text-sm px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20"
                  >
                    {t("battle.playDown")}
                  </button>
                )}

              </div>

            </div>
          )}

      </div>

      {showBench && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() =>
            setShowBench(false)
          }
        >

         <div
  className="bg-gradient-to-b from-amber-950/90 via-slate-900 to-amber-950/90 rounded-3xl border border-amber-500/30 p-5 max-w-4xl w-full min-h-[360px] max-h-[85vh] overflow-y-auto shadow-2xl"
  onClick={e =>
    e.stopPropagation()
  }
>

            <div className="flex justify-between items-center mb-3">

              <h3 className="font-bold text-amber-400">
                {t("battle.bench")}
              </h3>

              <button
                onClick={() =>
                  setShowBench(false)
                }
                className="text-slate-400 hover:text-white text-lg"
              >
                ✕
              </button>

            </div>

            <div className="space-y-4">

              <div>

                <div className="text-[10px] text-rose-400 font-bold mb-2">
                  {t("battle.enemyBench")}
                </div>

                <div className="flex flex-wrap gap-2">
                  {enemyBench.map(
                    (s, i) => (
                      <BenchCard
                        key={s.id + i}
                        s={s}
                        side="enemy"
                      />
                    )
                  )}
                </div>

              </div>

              <div>

                <div className="text-[10px] text-emerald-400 font-bold mb-2">
                  {t("battle.yourBench")}
                </div>

                <div className="flex flex-wrap gap-2">
                  {playerBench.map(
                    (s, i) => (
                      <BenchCard
                        key={s.id + i}
                        s={s}
                        side="player"
                      />
                    )
                  )}
                </div>

              </div>

            </div>

          </div>

        </div>
      )}

      {showTypeChart && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() =>
            setShowTypeChart(false)
          }
        >

          <div
            className="bg-slate-900 rounded-2xl border border-white/10 p-4 max-w-2xl w-full max-h-[85vh] overflow-y-auto"
            onClick={e =>
              e.stopPropagation()
            }
          >

            <div className="flex justify-between items-center mb-3">

              <h3 className="font-bold text-amber-400">
                {t("battle.typeChart")}
              </h3>

              <button
                onClick={() =>
                  setShowTypeChart(false)
                }
                className="text-slate-400 hover:text-white text-lg"
              >
                ✕
              </button>

            </div>

            <div className="text-[10px] text-slate-400 mb-2 text-center">
              {t("battle.typeChartDesc")}
            </div>

            <TypeChartTable />

          </div>

        </div>
      )}

    </div>
  );
}