// @ts-nocheck
import React, { useMemo, useState } from "react";
import { ROSTER } from "@/lib/sognatoriData";
import {
  initBattleSognatore,
  onEntryDual,
  aiChooseActions,
  orderActions,
  processActionDual,
  applyEndOfTurnDual,
} from "@/lib/battleEngine";
import { SognatoreImage } from "@/components/game/HealthBar";
import { bm } from "@/lib/battleMessages";
import { useLanguage } from "@/lib/i18n";

const clone = (value) => JSON.parse(JSON.stringify(value));

export default function AdventureBattle({ enemyTeam = [], playerRoster, opponentName = "Sfidante", isWild = false, onFinish }) {
  const { lang } = useLanguage();
  const mIt = useMemo(() => bm("it"), []);
  const mEn = useMemo(() => bm("en"), []);
  const [chosenIds, setChosenIds] = useState([]);
  const [battle, setBattle] = useState(null);
  const [targets, setTargets] = useState([0, 0]);
  const [playerModes, setPlayerModes] = useState(["attack", "attack"]);
  const [logs, setLogs] = useState([]);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  const available = useMemo(() => (Array.isArray(playerRoster) ? playerRoster : ROSTER).filter((s) => s && s.id), [playerRoster]);
  const chosen = chosenIds.map((id) => available.find((s) => String(s.id) === String(id))).filter(Boolean);

  const startBattle = () => {
    if (chosen.length !== 2 || !enemyTeam.length) return;
    const playerTeam = chosen.map((s) => initBattleSognatore({ ...s, hp: 20, hpMax: 20 }));
    const enemyTeamReady = enemyTeam.map((s, index) => initBattleSognatore({ ...s, id: `adventure-enemy-${index}-${s.id}`, hp: 20, hpMax: 20 }));
    const playerActive = playerTeam.slice(0, 2);
    const playerBench = playerTeam.slice(2);
    const enemyActive = enemyTeamReady.slice(0, 2);
    const enemyBench = enemyTeamReady.slice(2);
    const entryLogs = [];
    playerActive.forEach((s) => {
      const entry = onEntryDual(s, playerActive, enemyActive, mIt, mEn);
      entryLogs.push(...(lang === "en" ? entry.log_en : entry.log_it));
    });
    enemyActive.forEach((s) => {
      const entry = onEntryDual(s, enemyActive, playerActive, mIt, mEn);
      entryLogs.push(...(lang === "en" ? entry.log_en : entry.log_it));
    });
    setBattle({ playerActive, enemyActive, playerBench, enemyBench, turn: 1 });
    setLogs(entryLogs.length ? entryLogs : [lang === "en" ? "The battle begins!" : "La battaglia ha inizio!"]);
  };

  const takeTurn = () => {
    if (!battle || busy || result) return;
    setBusy(true);
    const next = clone(battle);
    const turnLogs = [];
    next.playerActive.forEach((attacker, index) => {
      if (attacker && !attacker.fainted && playerModes[index] === "protect") {
        attacker.protectedThisTurn = true;
        turnLogs.push(lang === "en" ? attacker.nome + " takes a defensive stance." : attacker.nome + " si mette in protezione.");
      }
    });
    const aiActions = aiChooseActions(next.enemyActive, next.playerActive, []);
    next.enemyActive.forEach((attacker, index) => {
      if (attacker && !attacker.fainted && aiActions[index]?.type === "protect") {
        attacker.protectedThisTurn = true;
        turnLogs.push(lang === "en" ? attacker.nome + " protects itself." : attacker.nome + " si protegge.");
      }
    });
    const playerAttacks = next.playerActive.map((attacker, index) => {
      if (!attacker || attacker.fainted || playerModes[index] === "protect") return null;
      const aliveTargets = next.enemyActive.filter((s) => s && !s.fainted);
      if (!aliveTargets.length) return null;
      const preferred = next.enemyActive[targets[index]];
      const target = preferred && !preferred.fainted ? preferred : aliveTargets[0];
      return { attacker, target };
    }).filter(Boolean);

    const enemyAttacks = aiActions.map((action, index) => {
      const attacker = next.enemyActive[index];
      if (!attacker || attacker.fainted || !action || action.type !== "attack") return null;
      const target = next.playerActive.find((s) => s && !s.fainted && s.id === action.targetId)
        || next.playerActive.find((s) => s && !s.fainted);
      return target ? { attacker, target } : null;
    }).filter(Boolean);

    const ordered = orderActions(next.playerActive, next.enemyActive, playerAttacks, enemyAttacks);
    ordered.forEach((action) => {
      const outcome = processActionDual(action, mIt, mEn);
      turnLogs.push(...(lang === "en" ? outcome.log_en : outcome.log_it));
    });

    const end = applyEndOfTurnDual([...next.playerActive, ...next.enemyActive], mIt, mEn);
    turnLogs.push(...(lang === "en" ? end.log_en : end.log_it));

    const playerBench = [...(next.playerBench || [])];
    const enemyBench = [...(next.enemyBench || [])];
    next.playerActive = next.playerActive.map((s, index) => {
      if ((!s || s.fainted || s.hp <= 0) && playerBench.length) {
        const incoming = playerBench.shift();
        const fresh = initBattleSognatore({ ...incoming, hp: 20, hpMax: 20 });
        const entry = onEntryDual(fresh, next.playerActive, next.enemyActive, mIt, mEn);
        turnLogs.push(...(lang === "en" ? entry.log_en : entry.log_it));
        return fresh;
      }
      return s;
    });
    next.enemyActive = next.enemyActive.map((s, index) => {
      if ((!s || s.fainted || s.hp <= 0) && enemyBench.length) {
        const incoming = enemyBench.shift();
        const fresh = initBattleSognatore({ ...incoming, hp: 20, hpMax: 20 });
        const entry = onEntryDual(fresh, next.enemyActive, next.playerActive, mIt, mEn);
        turnLogs.push(...(lang === "en" ? entry.log_en : entry.log_it));
        return fresh;
      }
      return s;
    });
    next.playerBench = playerBench;
    next.enemyBench = enemyBench;
    const won = next.enemyActive.every((s) => !s || s.fainted || s.hp <= 0) && enemyBench.length === 0;
    const lost = next.playerActive.every((s) => !s || s.fainted || s.hp <= 0) && playerBench.length === 0;
    next.turn += 1;
    setBattle(next);
    setPlayerModes(["attack", "attack"]);
    setLogs((old) => [...old, `— ${lang === "en" ? "Turn" : "Turno"} ${next.turn - 1} —`, ...turnLogs].slice(-35));
    if (won || lost) setResult(won ? "win" : "loss");
    setBusy(false);
  };

  const toggleChoice = (id) => {
    setChosenIds((old) => old.includes(id)
      ? old.filter((value) => value !== id)
      : old.length < 4 ? [...old, id] : [old[1], old[2], old[3], id]
    );
  };

  const finish = () => onFinish?.(result);

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/90 p-3 backdrop-blur-md">
      <div className="my-auto w-full max-w-5xl rounded-3xl border border-amber-300/20 bg-slate-950 p-4 text-white shadow-2xl sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.28em] text-amber-300/70">{isWild ? (lang === "en" ? "Wild encounter" : "Incontro selvatico") : (lang === "en" ? "Trainer challenge" : "Sfida allenatore")}</div>
            <h2 className="text-2xl font-black sm:text-3xl">{opponentName}</h2>
          </div>
          {!battle && <button onClick={() => onFinish?.("escape")} className="rounded-xl bg-white/10 px-3 py-2 text-sm font-bold">{lang === "en" ? "Back" : "Indietro"}</button>}
        </div>

        {!battle && (
          <>
            <p className="mb-3 text-sm text-white/65">{lang === "en" ? "Choose two Sognatori for your team." : "Scegli da 2 a 4 Sognatori per la tua squadra."} <b className="text-amber-300">{chosen.length}/4</b></p>
            <div className="grid max-h-[48vh] grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-5">
              {available.map((s) => {
                const selected = chosenIds.includes(s.id);
                return <button key={s.id} onClick={() => toggleChoice(s.id)} className={`rounded-xl border p-2 text-center transition ${selected ? "border-amber-300 bg-amber-300/15" : "border-white/10 bg-white/5 hover:bg-white/10"}`}>
                  <SognatoreImage s={s} className="mx-auto h-14 w-14" />
                  <div className="mt-1 truncate text-xs font-bold">{s.nome}</div>
                  <div className="text-[9px] text-white/45">{s.tipo}</div>
                  {selected && <div className="mt-1 text-[9px] font-black text-amber-300">{lang === "en" ? "SELECTED" : "SCELTO"}</div>}
                </button>;
              })}
            </div>
            <div className="mt-4 flex gap-2">
              <button disabled={chosen.length < 2} onClick={startBattle} className="flex-1 rounded-xl bg-amber-300 py-3 font-black text-black disabled:cursor-not-allowed disabled:opacity-30">{lang === "en" ? "START BATTLE" : "INIZIA LA BATTAGLIA"}</button>
            </div>
          </>
        )}

        {battle && (
          <>
            <div className="mb-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-red-300/15 bg-red-950/20 p-3">
                <div className="mb-2 text-[10px] font-black uppercase tracking-widest text-red-200/60">{opponentName}</div>
                <div className="grid grid-cols-2 gap-2">
                  {battle.enemyActive.map((s, i) => s ? <div key={s.id} className="rounded-xl bg-black/20 p-2 text-center">
                    <SognatoreImage s={s} className={`mx-auto h-16 w-16 ${s.fainted ? "opacity-30 grayscale" : ""}`} />
                    <div className="truncate text-xs font-bold">{s.nome}</div>
                    <div className="mt-1 h-2 overflow-hidden rounded bg-white/10"><div className="h-full bg-red-400" style={{ width: `${Math.max(0, s.hp / s.hpMax * 100)}%` }} /></div>
                    <div className="text-[10px] text-white/55">{Math.max(0, s.hp)}/{s.hpMax} PS</div>
                  </div> : <div key={i} />)}
                </div>
              </div>
              <div className="rounded-2xl border border-emerald-300/15 bg-emerald-950/20 p-3">
                <div className="mb-2 text-[10px] font-black uppercase tracking-widest text-emerald-200/60">{lang === "en" ? "Your team" : "La tua squadra"}</div>
                <div className="grid grid-cols-2 gap-2">
                  {battle.playerActive.map((s) => <div key={s.id} className="rounded-xl bg-black/20 p-2 text-center">
                    <SognatoreImage s={s} className={`mx-auto h-16 w-16 ${s.fainted ? "opacity-30 grayscale" : ""}`} />
                    <div className="truncate text-xs font-bold">{s.nome}</div>
                    <div className="mt-1 h-2 overflow-hidden rounded bg-white/10"><div className="h-full bg-emerald-400" style={{ width: `${Math.max(0, s.hp / s.hpMax * 100)}%` }} /></div>
                    <div className="text-[10px] text-white/55">{Math.max(0, s.hp)}/{s.hpMax} PS</div>
                  </div>)}
                </div>
              </div>
            </div>

            {!result && <div className="mb-3 grid gap-2 sm:grid-cols-2">
              {battle.playerActive.map((s, index) => !s.fainted && <div key={s.id} className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs">
                <span className="mb-2 block font-bold">{s.nome}</span>
                <select value={playerModes[index]} onChange={(e) => setPlayerModes((old) => old.map((v, i) => i === index ? e.target.value : v))} className="mb-2 w-full rounded-lg bg-slate-800 p-2 text-white">
                  <option value="attack">{lang === "en" ? "Attack" : "Attacca"}</option>
                  <option value="protect">{lang === "en" ? "Protect" : "Proteggi"}</option>
                </select>
                {playerModes[index] === "attack" && <>
                  <span className="mb-1 block text-white/55">{lang === "en" ? "Target" : "Bersaglio"}</span>
                  <select value={targets[index]} onChange={(e) => setTargets((old) => old.map((v, i) => i === index ? Number(e.target.value) : v))} className="w-full rounded-lg bg-slate-800 p-2 text-white">
                    {battle.enemyActive.map((enemy, enemyIndex) => enemy && !enemy.fainted && <option key={enemy.id} value={enemyIndex}>{enemy.nome}</option>)}
                  </select>
                </>}
              </div>)}
            </div>}

            <div className="mb-3 max-h-32 overflow-y-auto rounded-xl border border-white/10 bg-black/30 p-3 text-xs leading-relaxed text-white/75">
              {logs.map((line, index) => <div key={index}>{line}</div>)}
            </div>

            {result ? <div className="rounded-2xl bg-white/5 p-4 text-center">
              <div className="text-3xl">{result === "win" ? "🏆" : "💫"}</div>
              <div className="mt-2 text-xl font-black">{result === "win" ? (lang === "en" ? "Victory!" : "Vittoria!") : (lang === "en" ? "Defeat" : "Sconfitta")}</div>
              <button onClick={finish} className="mt-4 w-full rounded-xl bg-amber-300 py-3 font-black text-black">{lang === "en" ? "RETURN TO THE WORLD" : "TORNA ALL'AVVENTURA"}</button>
            </div> : <button disabled={busy} onClick={takeTurn} className="w-full rounded-xl bg-amber-300 py-3 font-black text-black disabled:opacity-40">{busy ? (lang === "en" ? "RESOLVING..." : "RISOLUZIONE...") : (lang === "en" ? "FIGHT — END TURN" : "COMBATTI — CONCLUDI TURNO")}</button>}
          </>
        )}
      </div>
    </div>
  );
}
