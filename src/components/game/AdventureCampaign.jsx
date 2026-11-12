import React, { useEffect, useMemo, useState } from "react";
import { ROSTER } from "@/lib/sognatoriData";
import AdventureBattle from "@/components/game/AdventureBattle";
import AdventureSognatoreSprite from "@/components/game/AdventureSognatoreSprite";
import { getStarterPair, getCityRewards, buildCityTeam } from "@/lib/adventureCampaignData";

const ANSWERS = {
  Demone: "Non temo il tuo fuoco: voglio capire cosa protegge.",
  Robot: "La logica è utile, ma non può scegliere al posto mio.",
  Natura: "Voglio proteggere, non dominare.",
  Nuvola: "Non cerco di superarti: voglio conoscere ciò che vedi.",
  Umano: "Il mio sogno è più grande di me: voglio condividerlo.",
  Luce: "Accetto anche le mie ombre. È così che posso brillare.",
  Dolce: "La gentilezza non è debolezza: è una scelta.",
  Marino: "Cambiare non significa perdersi.",
  Orso: "La vera forza serve a proteggere.",
  Mago: "La conoscenza ha valore solo quando viene condivisa.",
  Salato: "Gli opposti possono completarsi senza annullarsi.",
};
const WRONG = [
  "Voglio solo diventare il più forte.",
  "Non mi interessa ascoltare, seguimi e basta.",
];

function persuasionOptionsFor(s) {
  const options = [ANSWERS[s?.tipo] || ANSWERS.Natura, ...WRONG];
  const seed = Array.from(String(s?.id || s?.nome || "")).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const shift = seed % options.length;
  return options.slice(shift).concat(options.slice(0, shift));
}

function loadSave(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { ownedIds: [], partyIds: [], completedCities: [], introDone: false };
    const parsed = JSON.parse(raw);
    return {
      ownedIds: Array.isArray(parsed.ownedIds) ? parsed.ownedIds : [],
      partyIds: Array.isArray(parsed.partyIds) ? parsed.partyIds.slice(0, 4) : [],
      completedCities: Array.isArray(parsed.completedCities) ? parsed.completedCities : [],
      introDone: !!parsed.introDone,
    };
  } catch {
    return { ownedIds: [], partyIds: [], completedCities: [], introDone: false };
  }
}

export default function AdventureCampaign({ userKey, player, walking = false, encounter, wildEncounter, onClose, onWildClose, onPauseChange }) {
  const storageKey = "sognatori-adventure-v1-" + (userKey || "guest");
  const [save, setSave] = useState(() => loadSave(storageKey));
  const [panel, setPanel] = useState("");
  const [phase, setPhase] = useState("idle");
  const [starterChoice, setStarterChoice] = useState("Natura");
  const [rewardIndex, setRewardIndex] = useState(0);
  const [rewardQueue, setRewardQueue] = useState([]);
  const [persuasionError, setPersuasionError] = useState(false);
  const [battleKey, setBattleKey] = useState(0);
  const [wildError, setWildError] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(save)); } catch {}
  }, [save, storageKey]);

  useEffect(() => {
    onPauseChange?.(phase !== "idle" || !!panel);
    return () => onPauseChange?.(false);
  }, [phase, panel, onPauseChange]);

  useEffect(() => {
    if (!save.introDone) setPhase("intro");
  }, [save.introDone]);

  useEffect(() => {
    if (wildEncounter) {
      setWildError(false);
      setPhase("wildTalk");
    } else if (encounter) {
      setPersuasionError(false);
      setPhase(save.completedCities.includes(encounter.id) ? "completed" : "traveler");
    } else if (phase !== "intro") {
      setPhase("idle");
    }
  }, [encounter?.id, wildEncounter?.id]);

  const owned = useMemo(
    () => save.ownedIds.map((id) => ROSTER.find((s) => s.id === id)).filter(Boolean),
    [save.ownedIds]
  );
  const party = useMemo(
    () => save.partyIds.map((id) => ROSTER.find((s) => s.id === id)).filter(Boolean),
    [save.partyIds]
  );
  const deposit = owned.filter((s) => !save.partyIds.includes(s.id));
  const wildSognatore = wildEncounter ? ROSTER.find((s) => s.nome?.toLowerCase() === wildEncounter.name?.toLowerCase()) : null;
  const cityTeam = useMemo(
    () => encounter ? (encounter.team?.length === 4 ? encounter.team : buildCityTeam(encounter.faction, encounter.id)) : [],
    [encounter?.id]
  );
  const rewards = useMemo(
    () => encounter ? getCityRewards(encounter).filter((s) => !save.ownedIds.includes(s.id)) : [],
    [encounter?.id, save.ownedIds]
  );

  const recruitStarter = () => {
    const pair = getStarterPair(starterChoice);
    const ids = pair.map((s) => s.id);
    setSave((old) => ({
      ...old,
      introDone: true,
      ownedIds: Array.from(new Set([...old.ownedIds, ...ids])),
      partyIds: [...old.partyIds, ...ids].slice(0, 4),
    }));
    setPhase("idle");
  };

  const toggleParty = (id) => {
    setSave((old) => {
      const inParty = old.partyIds.includes(id);
      if (inParty) return { ...old, partyIds: old.partyIds.filter((x) => x !== id) };
      if (old.partyIds.length >= 4) return old;
      return { ...old, partyIds: [...old.partyIds, id] };
    });
  };

  const startCityBattle = () => {
    if (party.length < 2 || cityTeam.length !== 4) return;
    setBattleKey((n) => n + 1);
    setPhase("battle");
  };

  const handleBattleFinish = (outcome) => {
    if (outcome === "win") {
      setRewardIndex(0);
      setRewardQueue(rewards);
      setPersuasionError(false);
      if (!rewards.length) {
        setSave((old) => ({ ...old, completedCities: Array.from(new Set([...old.completedCities, encounter.id])) }));
        setPhase("rewardDone");
      } else {
        setPhase("reward");
      }
    } else if (outcome === "escape") {
      setPhase("idle");
      onClose?.();
    } else {
      setPhase("lost");
    }
  };

  const convince = (candidate) => {
    const answer = ANSWERS[candidate.tipo] || ANSWERS.Natura;
    if (candidate._answer !== answer) {
      setPersuasionError(true);
      return;
    }
    setSave((old) => {
      const ownedIds = old.ownedIds.includes(candidate.id) ? old.ownedIds : [...old.ownedIds, candidate.id];
      const partyIds = old.partyIds.length < 4 && !old.partyIds.includes(candidate.id)
        ? [...old.partyIds, candidate.id]
        : old.partyIds;
      return { ...old, ownedIds, partyIds };
    });
    setPersuasionError(false);
    if (rewardIndex + 1 < rewardQueue.length) setRewardIndex((n) => n + 1);
    else {
      setSave((old) => ({ ...old, completedCities: Array.from(new Set([...old.completedCities, encounter.id])) }));
      setPhase("rewardDone");
    }
  };

  const currentReward = rewardQueue[rewardIndex];
  const followers = party.slice(0, 4);

  return (
    <>
      <style>{'@keyframes followerBob {0%,100%{transform:translate(-50%,0)}50%{transform:translate(-50%,-3px)}}'}</style>

      {player && followers.map((s, index) => (
        <div key={s.id} className="pointer-events-none absolute z-30 flex flex-col items-center"
          style={{ left: "50%", top: "calc(50% + " + (42 + index * 34) + "px)", marginLeft: (index % 2 ? 22 : -22) + "px", animation: "followerBob " + (1.05 + index * 0.12) + "s ease-in-out infinite", filter: "drop-shadow(0 3px 3px rgba(0,0,0,.7))" }}>
          <AdventureSognatoreSprite s={s} size={34} walking={walking} />
        </div>
      ))}

      <div className="absolute right-4 top-1/2 z-[55] flex -translate-y-1/2 flex-col gap-2">
        <button onClick={() => setPanel(panel === "party" ? "" : "party")} className="rounded-xl border border-emerald-200/30 bg-slate-950/90 px-3 py-2 text-xs font-black text-emerald-100 shadow-xl">
          SQUADRA {party.length}/4
        </button>
        <button onClick={() => setPanel(panel === "box" ? "" : "box")} className="rounded-xl border border-violet-200/30 bg-slate-950/90 px-3 py-2 text-xs font-black text-violet-100 shadow-xl">
          DEPOSITO {deposit.length}
        </button>
      </div>

      {panel && (
        <div className="absolute inset-0 z-[80] flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm">
          <div className="max-h-[88vh] w-full max-w-3xl overflow-hidden rounded-3xl border border-white/15 bg-slate-950 p-4 text-white shadow-2xl sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[.25em] text-emerald-200/60">Il tuo viaggio</div>
                <h2 className="text-2xl font-black">{panel === "party" ? "La tua squadra" : "Box deposito"}</h2>
                <p className="mt-1 text-xs text-white/50">{panel === "party" ? "Massimo 4 compagni ti seguono nel mondo." : "I Sognatori che non porti con te restano al sicuro qui."}</p>
              </div>
              <button onClick={() => setPanel("")} className="rounded-lg bg-white/10 px-3 py-2 text-sm font-bold">Chiudi</button>
            </div>
            <div className="mb-3 flex gap-2 text-[10px] font-black uppercase">
              <button onClick={() => setPanel("party")} className={"rounded-lg px-3 py-2 " + (panel === "party" ? "bg-emerald-300 text-black" : "bg-white/10")}>Squadra ({party.length}/4)</button>
              <button onClick={() => setPanel("box")} className={"rounded-lg px-3 py-2 " + (panel === "box" ? "bg-violet-300 text-black" : "bg-white/10")}>Deposito ({deposit.length})</button>
            </div>
            <div className="grid max-h-[58vh] grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
              {(panel === "party" ? party : deposit).map((s) => (
                <div key={s.id} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3">
                  <AdventureSognatoreSprite s={s} size={42} />
                  <div className="min-w-0 flex-1"><div className="truncate text-sm font-black">{s.nome}</div><div className="text-[10px] text-white/45">{s.tipo}</div></div>
                  <button onClick={() => toggleParty(s.id)} className="rounded-lg bg-white/10 px-2 py-2 text-[10px] font-black">{panel === "party" ? "BOX" : "AGGIUNGI"}</button>
                </div>
              ))}
              {(panel === "party" ? party : deposit).length === 0 && <div className="col-span-full rounded-xl bg-white/5 p-6 text-center text-sm text-white/50">{panel === "party" ? "La squadra è vuota." : "Il deposito è vuoto."}</div>}
            </div>
            <div className="mt-3 text-[10px] text-white/45">Posseduti: {owned.length} · In squadra: {party.length} · Nel deposito: {deposit.length}</div>
          </div>
        </div>
      )}

      {phase === "intro" && (
        <div className="absolute inset-0 z-[90] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-xl rounded-3xl border border-emerald-200/20 bg-slate-950 p-6 text-white shadow-2xl">
            <div className="text-[10px] font-black uppercase tracking-[.3em] text-emerald-200">Il primo legame</div>
            <h2 className="mt-2 text-3xl font-black">Il Sentiero dei Sognatori</h2>
            <p className="mt-3 leading-7 text-white/70">Non possiedi ancora nessun Sognatore. Nel mondo dei sogni non si cattura nessuno: si costruisce un legame. Una guida ti offre la possibilità di conoscere due compagni disposti a viaggiare con te.</p>
            <p className="mt-4 text-sm font-bold">Quale sentiero vuoi ascoltare?</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {["Natura","Dolce","Mago"].map((f) => <button key={f} onClick={() => setStarterChoice(f)} className={"rounded-xl border p-3 text-xs font-black " + (starterChoice === f ? "border-emerald-300 bg-emerald-300/15 text-emerald-100" : "border-white/10 bg-white/5")}>{f}</button>)}
            </div>
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-white/5 p-3">
              {getStarterPair(starterChoice).map((s) => <div key={s.id} className="flex flex-1 flex-col items-center"><AdventureSognatoreSprite s={s} size={58}/><span className="mt-1 text-xs font-bold">{s.nome}</span></div>)}
            </div>
            <button onClick={recruitStarter} className="mt-5 w-full rounded-xl bg-emerald-300 py-3 font-black text-black">STRINGI IL PRIMO LEGAME</button>
          </div>
        </div>
      )}


      {wildEncounter && phase === "wildTalk" && (
        <div className="absolute inset-0 z-[90] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl border border-cyan-200/20 bg-slate-950 p-6 text-center text-white shadow-2xl">
            <div className="text-[10px] font-black uppercase tracking-[.3em] text-cyan-200">Incontro nel mondo</div>
            {wildSognatore ? <>
              <div className="my-4 flex justify-center"><AdventureSognatoreSprite s={wildSognatore} size={92} walking /></div>
              <h2 className="text-3xl font-black">{wildSognatore.nome}</h2>
              <p className="mt-2 text-sm text-white/60">Non puoi catturarlo. Puoi solo provare a conquistare la sua fiducia con le parole.</p>
              <div className="mt-5 grid gap-2">
                {persuasionOptionsFor(wildSognatore).map((answer) => <button key={answer} onClick={() => {
                  if (answer !== (ANSWERS[wildSognatore.tipo] || ANSWERS.Natura)) { setWildError(true); return; }
                  setSave((old) => {
                    const ownedIds = old.ownedIds.includes(wildSognatore.id) ? old.ownedIds : [...old.ownedIds, wildSognatore.id];
                    const partyIds = old.partyIds.length < 4 && !old.partyIds.includes(wildSognatore.id) ? [...old.partyIds, wildSognatore.id] : old.partyIds;
                    return { ...old, ownedIds, partyIds };
                  });
                  setWildError(false);
                  setPhase("idle");
                  onWildClose?.();
                }} className="rounded-xl border border-white/10 bg-white/5 p-3 text-left text-sm hover:bg-white/10">{answer}</button>)}
              </div>
              {wildError && <p className="mt-3 text-sm font-bold text-amber-300">Non si fida ancora. Prova ad ascoltarlo meglio.</p>}
            </> : <p className="mt-4">Questo Sognatore non è presente nel roster attuale.</p>}
            <button onClick={() => { setPhase("idle"); onWildClose?.(); }} className="mt-4 w-full rounded-xl bg-white/10 py-3 text-sm font-bold">Lascialo andare</button>
          </div>
        </div>
      )}
      {encounter && phase === "traveler" && (
        <div className="absolute inset-0 z-[70] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-3xl border border-amber-200/20 bg-slate-950 p-6 text-center text-white shadow-2xl">
            <div className="text-[10px] font-black uppercase tracking-[.3em] text-amber-200/70">{encounter.city} · Fazione {encounter.faction}</div>
            <h2 className="mt-2 text-3xl font-black">{encounter.traveler || encounter.name}</h2>
            <p className="mt-3 text-sm leading-6 text-white/65">{encounter.line || "Il viaggiatore ti osserva in silenzio."}</p>
            <div className="my-5 flex justify-center gap-3">
              {cityTeam.map((s) => <div key={s.id} className="flex flex-col items-center"><AdventureSognatoreSprite s={s} size={54}/><span className="mt-1 max-w-16 truncate text-[9px] font-bold">{s.nome}</span></div>)}
            </div>
            <p className="text-xs text-white/45">La sua squadra è composta da 4 Sognatori della fazione {encounter.faction}.</p>
            <button disabled={owned.length < 2} onClick={startCityBattle} className="mt-5 w-full rounded-xl bg-amber-300 py-3 font-black text-black disabled:opacity-30">{party.length < 2 ? "CONVINCI ALTRI SOGNATORI PER SFIDARLO" : "ACCETTA LA SFIDA"}</button>
            <button onClick={() => { onClose?.(); setPhase("idle"); }} className="mt-2 w-full rounded-xl bg-white/10 py-3 text-sm font-bold">Torna a esplorare</button>
          </div>
        </div>
      )}

      {encounter && phase === "battle" && (
        <AdventureBattle key={battleKey} opponentName={(encounter.traveler || encounter.name) + " · " + encounter.city} enemyTeam={cityTeam} playerRoster={party} onFinish={handleBattleFinish} />
      )}

      {encounter && phase === "lost" && (
        <div className="absolute inset-0 z-[90] flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md rounded-3xl border border-red-300/20 bg-slate-950 p-6 text-center text-white">
            <div className="text-4xl">✦</div><h2 className="mt-2 text-2xl font-black">Il legame vacilla</h2>
            <p className="mt-2 text-sm text-white/60">Il Viaggiatore ti ha sconfitto. Riposa, prepara la squadra e torna quando sarai pronto.</p>
            <button onClick={() => setPhase("traveler")} className="mt-5 w-full rounded-xl bg-white/10 py-3 font-bold">Torna alla città</button>
          </div>
        </div>
      )}

      {encounter && phase === "completed" && (
        <div className="absolute inset-0 z-[70] flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-md rounded-3xl border border-emerald-300/20 bg-slate-950 p-6 text-center text-white">
            <div className="text-4xl">✦</div><h2 className="mt-2 text-2xl font-black">{encounter.city}</h2>
            <p className="mt-2 text-sm text-white/60">Hai già conquistato la fiducia di questa città. I suoi Sognatori ti riconoscono come amico.</p>
            <button onClick={() => { setPhase("idle"); onClose?.(); }} className="mt-5 w-full rounded-xl bg-emerald-300 py-3 font-black text-black">CONTINUA IL VIAGGIO</button>
          </div>
        </div>
      )}

      {encounter && phase === "reward" && currentReward && (
        <div className="absolute inset-0 z-[90] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
          <div className="w-full max-w-xl rounded-3xl border border-emerald-200/20 bg-slate-950 p-6 text-center text-white shadow-2xl">
            <div className="text-[10px] font-black uppercase tracking-[.3em] text-emerald-200">Dopo la vittoria</div>
            <h2 className="mt-2 text-3xl font-black">Un nuovo legame</h2>
            <div className="my-4 flex justify-center"><AdventureSognatoreSprite s={currentReward} size={90}/></div>
            <div className="text-xl font-black">{currentReward.nome}</div>
            <p className="mt-2 text-sm text-white/65">Il Sognatore ti osserva. Non vuole essere catturato: devi convincerlo che il tuo viaggio merita la sua fiducia.</p>
            <div className="mt-4 grid gap-2">
              {persuasionOptionsFor(currentReward).map((answer) => <button key={answer} onClick={() => convince({ ...currentReward, _answer: answer })} className="rounded-xl border border-white/10 bg-white/5 p-3 text-left text-sm hover:bg-white/10">{answer}</button>)}
            </div>
            {persuasionError && <p className="mt-3 text-sm font-bold text-amber-300">Non è ancora convinto. Ascoltalo meglio e riprova.</p>}
          </div>
        </div>
      )}

      {encounter && phase === "rewardDone" && (
        <div className="absolute inset-0 z-[90] flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md rounded-3xl border border-emerald-200/20 bg-slate-950 p-6 text-center text-white">
            <div className="text-4xl">✧</div><h2 className="mt-2 text-2xl font-black">La città ti accoglie</h2>
            <p className="mt-2 text-sm text-white/65">Hai convinto i Sognatori esclusivi di {encounter.city}. Se la squadra è piena, i nuovi compagni sono stati trasferiti nel deposito.</p>
            <button onClick={() => { setPhase("idle"); onClose?.(); }} className="mt-5 w-full rounded-xl bg-emerald-300 py-3 font-black text-black">TORNA ALL'AVVENTURA</button>
          </div>
        </div>
      )}
    </>
  );
}