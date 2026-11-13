import React, { useEffect, useMemo, useState } from "react";
import { ROSTER } from "@/lib/sognatoriData";
import AdventureBattleArena from "@/components/game/AdventureBattleArena";
import AdventureSognatoreSprite from "@/components/game/AdventureSognatoreSprite";
import AdventureTravelerSprite from "@/components/game/AdventureTravelerSprite";
import { getCityRewards, buildCityTeam } from "@/lib/adventureCampaignData";

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
const FIRST_BOND_QUESTIONS = [
  { q: "Quando incontri una difficoltà, cosa fai per prima cosa?", a: [["Analizzo il problema con calma","Robot"],["Mi butto e affronto la sfida","Demone"],["Cerco una soluzione che non ferisca nessuno","Natura"],["Osservo tutte le possibilità","Mago"]] },
  { q: "Quale luogo ti fa sentire davvero a casa?", a: [["Una foresta tranquilla","Natura"],["Una città piena di tecnologia","Robot"],["Una spiaggia sul mare","Marino"],["Una montagna sopra le nuvole","Nuvola"]] },
  { q: "Quale qualità apprezzi di più?", a: [["Il coraggio","Demone"],["La lealtà","Orso"],["La curiosità","Mago"],["La gentilezza","Dolce"]] },
  { q: "Quale dono sceglieresti?", a: [["Illuminare la strada agli altri","Luce"],["Adattarmi a ogni cambiamento","Marino"],["Costruire qualsiasi cosa","Robot"],["Comprendere la natura","Natura"]] },
  { q: "Davanti a un'ingiustizia, come reagisci?", a: [["Mi oppongo senza tirarmi indietro","Demone"],["Cerco di unire le persone","Umano"],["Proteggo chi è in difficoltà","Orso"],["Cerco di capire ogni dettaglio","Mago"]] },
  { q: "Quale avventura ti attirerebbe di più?", a: [["Esplorare un mondo sconosciuto","Nuvola"],["Scoprire antiche magie","Mago"],["Attraversare oceani misteriosi","Marino"],["Visitare una città futuristica","Robot"]] },
  { q: "Cosa ti dà più energia?", a: [["Creare qualcosa insieme","Umano"],["Seguire il mio istinto","Demone"],["Prendermi cura di ciò che amo","Natura"],["Portare buonumore","Dolce"]] },
  { q: "Quale frase senti più vicina?", a: [["La conoscenza apre ogni porta","Mago"],["La forza serve a difendere","Orso"],["Cambiare è un'occasione","Marino"],["Anche una piccola luce conta","Luce"]] },
  { q: "In un gruppo, quale ruolo assumi?", a: [["Organizzo e pianifico","Robot"],["Incoraggio tutti","Umano"],["Trovo idee insolite","Nuvola"],["Tengo unito il gruppo","Dolce"]] },
  { q: "Quale valore non vorresti mai perdere?", a: [["La libertà","Nuvola"],["La sincerità","Salato"],["La speranza","Luce"],["La determinazione","Demone"]] },
];
const WRONG = [
  "Voglio solo diventare il più forte.",
  "Non mi interessa ascoltare, seguimi e basta.",
];

const PERSUASION_RIDDLES = [
  { q: "Tre interruttori sono fuori da una stanza chiusa. Dentro c'è una sola lampadina a incandescenza. Puoi azionare gli interruttori quanto vuoi, ma entrare nella stanza una sola volta. Come individui quello giusto?", a: ["Accendo il primo, aspetto, lo spengo e accendo il secondo: entrando, luce accesa = secondo; spenta ma calda = primo; spenta e fredda = terzo.", "Accendo tutti e tre e controllo la luminosità.", "Entro al buio e provo gli interruttori uno per volta."], correct: 0 },
  { q: "Hai 9 monete identiche all'aspetto; una è più pesante. Con una bilancia a due piatti, qual è il minimo numero di pesate per trovarla con certezza?", a: ["Due pesate: dividi in tre gruppi da tre, poi confronta due monete del gruppo sospetto.", "Tre pesate, una per ogni moneta.", "Una sola pesata mettendone quattro contro quattro."], correct: 0 },
  { q: "Un orologio impiega 5 secondi per battere 6 rintocchi. Quanto impiega per batterne 12, mantenendo lo stesso intervallo?", a: ["11 secondi.", "10 secondi.", "12 secondi."], correct: 0 },
  { q: "Un uomo guarda un ritratto e dice: «Non ho fratelli né sorelle, ma il padre di quell'uomo è figlio di mio padre». Chi è nel ritratto?", a: ["Suo figlio.", "Suo padre.", "Lui stesso."], correct: 0 },
  { q: "Hai due corde. Ognuna brucia in esattamente 60 minuti, ma in modo irregolare. Come misuri 45 minuti?", a: ["Accendi la prima da entrambe le estremità e la seconda da una; quando la prima finisce (30 min), accendi anche l'altra estremità della seconda.", "Accendi entrambe da un'estremità e aspetti che una metà sia consumata.", "Tagli entrambe a metà e le accendi."], correct: 0 },
  { q: "Completa la sequenza: 1, 11, 21, 1211, 111221, ... Qual è il termine successivo?", a: ["312211.", "211221.", "13112221."], correct: 0 },
  { q: "In una gara superi il concorrente che si trova al secondo posto. In quale posizione ti trovi?", a: ["Secondo.", "Primo.", "Terzo."], correct: 0 },
  { q: "Un contadino deve attraversare un fiume con volpe, oca e sacco di fagioli. La barca porta lui e un solo elemento. Qual è la prima traversata corretta?", a: ["Porta l'oca sull'altra riva.", "Porta prima la volpe.", "Porta prima i fagioli."], correct: 0 },
  { q: "Tre scatole sono etichettate «Mele», «Pere» e «Miste», ma tutte le etichette sono sbagliate. Puoi estrarre un solo frutto da una scatola. Da quale inizi?", a: ["Da quella etichettata «Miste».", "Da quella etichettata «Mele».", "Da quella etichettata «Pere»."], correct: 0 },
  { q: "Un numero di due cifre ha somma delle cifre pari a 9. Scambiando le cifre, il numero aumenta di 27. Qual è il numero originale?", a: ["36.", "45.", "63."], correct: 0 },
  { q: "In una stanza ci sono 100 armadietti chiusi. Al passaggio n apri o chiudi ogni armadietto il cui numero è multiplo di n. Dopo 100 passaggi, quali restano aperti?", a: ["Quelli con numero quadrato perfetto.", "Quelli con numero primo.", "Tutti quelli con numero pari."], correct: 0 },
];

function persuasionChallengeFor(s) {
  const id = String(s?.id || s?.nome || "sognatore");
  const seed = Array.from(id).reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 7);
  const riddle = PERSUASION_RIDDLES[seed % PERSUASION_RIDDLES.length];
  const order = [0, 1, 2];
  const shift = (seed >>> 3) % 3;
  const shuffled = order.slice(shift).concat(order.slice(0, shift));
  return {
    question: riddle.q,
    options: shuffled.map((index) => riddle.a[index]),
    correct: riddle.a[0],
  };
}

function loadSave(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { ownedIds: [], partyIds: [], completedCities: [], conqueredLeaders: [], introDone: false };
    const parsed = JSON.parse(raw);
    return {
      ownedIds: Array.isArray(parsed.ownedIds) ? parsed.ownedIds : [],
      partyIds: Array.isArray(parsed.partyIds) ? parsed.partyIds.slice(0, 4) : [],
      completedCities: Array.isArray(parsed.completedCities) ? parsed.completedCities : [],
      conqueredLeaders: Array.isArray(parsed.conqueredLeaders) ? parsed.conqueredLeaders : [],
      introDone: !!parsed.introDone,
    };
  } catch {
    return { ownedIds: [], partyIds: [], completedCities: [], conqueredLeaders: [], introDone: false };
  }
}

export default function AdventureCampaign({ userKey, player, facing = { x: 0, y: -1 }, walking = false, encounter, wildEncounter, onClose, onWildClose, onPauseChange, onRestart, menuContent }) {
  const storageKey = "sognatori-adventure-v1-" + (userKey || "guest");
  const [save, setSave] = useState(() => loadSave(storageKey));
  const [panel, setPanel] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [phase, setPhase] = useState("idle");
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState([]);
  const [starterSognatore, setStarterSognatore] = useState(null);
  const [rewardIndex, setRewardIndex] = useState(0);
  const [rewardQueue, setRewardQueue] = useState([]);
  const [persuasionError, setPersuasionError] = useState(false);
  const [battleKey, setBattleKey] = useState(0);
  const [wildError, setWildError] = useState(false);
  const [confirmRestart, setConfirmRestart] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(save)); } catch {}
  }, [save, storageKey]);

  useEffect(() => {
    if (phase === "battle") {
      setMenuOpen(false);
      setPanel("");
    }
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
      setPhase(save.conqueredLeaders.includes(encounter.id) ? "completed" : "traveler");
    } else if (!save.introDone) {
      setPhase("intro");
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

  const answerStarterQuestion = (faction) => {
    const nextAnswers = [...quizAnswers, faction];
    setQuizAnswers(nextAnswers);
    if (quizIndex < FIRST_BOND_QUESTIONS.length - 1) {
      setQuizIndex((n) => n + 1);
      return;
    }
    const scores = nextAnswers.reduce((acc, value) => {
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});
    const rankedFactions = Object.entries(scores).sort((a, b) => b[1] - a[1]).map(([name]) => name);
    const candidate = rankedFactions.flatMap((factionName) =>
      ROSTER.filter((s) => (s.tipo || s.fazione) === factionName)
    )[0] || ROSTER[0];
    setStarterSognatore(candidate || null);
    setPhase("starterResult");
  };

  const recruitStarter = () => {
    if (!starterSognatore) return;
    setSave((old) => ({
      ...old,
      introDone: true,
      ownedIds: old.ownedIds.includes(starterSognatore.id) ? old.ownedIds : [...old.ownedIds, starterSognatore.id],
      partyIds: old.partyIds.includes(starterSognatore.id) ? old.partyIds : [...old.partyIds, starterSognatore.id].slice(0, 4),
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
        const completedCount = new Set([...save.conqueredLeaders, encounter.id]).size;
        setSave((old) => ({ ...old, completedCities: Array.from(new Set([...old.completedCities, encounter.id])), conqueredLeaders: Array.from(new Set([...(old.conqueredLeaders || []), encounter.id])) }));
        setPhase(completedCount >= 11 ? "campaignWon" : "rewardDone");
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
    const answer = persuasionChallengeFor(candidate).correct;
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
      const completedCount = new Set([...save.conqueredLeaders, encounter.id]).size;
      setSave((old) => ({ ...old, completedCities: Array.from(new Set([...old.completedCities, encounter.id])), conqueredLeaders: Array.from(new Set([...(old.conqueredLeaders || []), encounter.id])) }));
      setPhase(completedCount >= 11 ? "campaignWon" : "rewardDone");
    }
  };

  const currentReward = rewardQueue[rewardIndex];

  return (
    <>
      {phase !== "battle" && <div className="pointer-events-none fixed inset-0 z-[210]">
        {menuOpen && (
          <div className="pointer-events-auto fixed right-4 top-16 bottom-4 z-[200] flex w-[min(24rem,calc(100vw-2rem))] flex-col overflow-y-auto overscroll-contain touch-pan-y rounded-2xl border border-white/15 bg-slate-950/95 p-3 text-white shadow-2xl backdrop-blur-md">
            <button onClick={() => { setMenuOpen(false); setConfirmRestart(true); }} className="mb-3 w-full rounded-xl border border-red-300/25 bg-red-950/40 px-3 py-3 text-left text-sm font-black text-red-200 hover:bg-red-900/40">
              ↻ RICOMINCIA DA ZERO
            </button>
            {menuContent}
            <div className="px-3 py-2 text-[10px] font-black uppercase tracking-[.2em] text-amber-200/70">
              CAPI FAZIONE CONQUISTATI · {(save.conqueredLeaders || []).length}/11
            </div>
            <button onClick={() => { setPanel("party"); setMenuOpen(false); }} className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm font-black text-emerald-100 hover:bg-white/10">
              <span>SQUADRA</span><span className="text-emerald-200">{party.length}/4</span>
            </button>
            <button onClick={() => { setPanel("box"); setMenuOpen(false); }} className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm font-black text-violet-100 hover:bg-white/10">
              <span>DEPOSITO</span><span className="text-violet-200">{deposit.length}</span>
            </button>

          </div>
        )}
        <button onClick={() => setMenuOpen((open) => !open)} className="pointer-events-auto fixed right-3 top-12 z-[210] rounded-2xl border border-amber-200/30 bg-slate-950/95 px-5 py-3 text-sm font-black tracking-wider text-amber-100 shadow-xl backdrop-blur-md active:scale-95">
          {menuOpen ? "CHIUDI MENU" : "☰ MENU"}
        </button>
      </div>}

      {confirmRestart && phase !== "battle" && (
        <div className="absolute inset-0 z-[120] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-red-300/25 bg-slate-950 p-6 text-center text-white shadow-2xl">
            <div className="text-3xl">↻</div>
            <h2 className="mt-2 text-2xl font-black">Ricominciare da zero?</h2>
            <p className="mt-3 text-sm leading-6 text-white/65">Perderai squadra, Sognatori ottenuti e città completate. Il viaggio ripartirà dall'inizio e potrai scegliere di nuovo i tuoi primi compagni.</p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button onClick={() => setConfirmRestart(false)} className="rounded-xl bg-white/10 py-3 text-sm font-bold">ANNULLA</button>
              <button onClick={() => {
                const freshSave = { ownedIds: [], partyIds: [], completedCities: [], conqueredLeaders: [], introDone: false };
                setSave(freshSave);
                try { localStorage.removeItem(storageKey); } catch {}
                setConfirmRestart(false);
                setMenuOpen(false);
                setPanel("");
                setQuizIndex(0); setQuizAnswers([]); setStarterSognatore(null);
                setPhase("intro");
                onRestart?.();
              }} className="rounded-xl bg-red-400 py-3 text-sm font-black text-black">SÌ, RICOMINCIA</button>
            </div>
          </div>
        </div>
      )}

      {panel && phase !== "battle" && (
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
        <div className="absolute inset-0 z-[90] flex items-center justify-center overflow-y-auto bg-black/85 p-4 backdrop-blur-md">
          <div className="my-auto w-full max-w-xl rounded-3xl border border-emerald-200/20 bg-slate-950 p-5 text-white shadow-2xl sm:p-6">
            <div className="text-[10px] font-black uppercase tracking-[.3em] text-emerald-200">Il primo legame · {quizIndex + 1}/10</div>
            <h2 className="mt-2 text-2xl font-black sm:text-3xl">Conosciamoci</h2>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-emerald-300 transition-all" style={{ width: ((quizIndex + 1) / 10 * 100) + "%" }} /></div>
            <p className="mt-6 text-lg font-bold leading-7">{FIRST_BOND_QUESTIONS[quizIndex].q}</p>
            <div className="mt-4 grid gap-2">
              {FIRST_BOND_QUESTIONS[quizIndex].a.map(([label, faction]) => (
                <button key={faction} onClick={() => answerStarterQuestion(faction)} className="rounded-xl border border-white/10 bg-white/5 p-3 text-left text-sm font-semibold transition hover:border-emerald-200/50 hover:bg-emerald-300/10">{label}</button>
              ))}
            </div>
            <p className="mt-4 text-center text-[11px] text-white/40">Il tuo primo legame darà inizio al viaggio tra le undici civiltà. Dovrai conquistare la fiducia dei Sognatori e affrontare tutti gli undici Capi fazione.</p>
          </div>
        </div>
      )}

      {phase === "starterResult" && starterSognatore && (
        <div className="absolute inset-0 z-[90] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-emerald-200/20 bg-slate-950 p-6 text-center text-white shadow-2xl">
            <div className="text-[10px] font-black uppercase tracking-[.3em] text-emerald-200">Il vostro primo legame</div>
            <h2 className="mt-2 text-3xl font-black">Ti affidiamo {starterSognatore.nome}</h2>
            <div className="my-5 flex justify-center"><AdventureSognatoreSprite s={starterSognatore} size={128}/></div>
            <div className="text-sm font-bold text-emerald-200">{starterSognatore.tipo || starterSognatore.fazione}</div>
            <p className="mt-3 text-sm leading-6 text-white/65">Le tue risposte hanno rivelato un'affinità speciale. Non è una cattura: da oggi questo Sognatore sceglie di iniziare il viaggio insieme a te.</p>
            <button onClick={recruitStarter} className="mt-5 w-full rounded-xl bg-emerald-300 py-3 font-black text-black">ACCETTA IL PRIMO LEGAME</button>
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
              <p className="mt-2 text-sm text-white/60">Per conquistare la sua fiducia devi superare una prova di logica. Ogni Sognatore custodisce un enigma diverso.</p>
              <div className="mt-4 rounded-xl border border-cyan-200/20 bg-cyan-950/30 p-4 text-left text-sm font-semibold leading-6">{persuasionChallengeFor(wildSognatore).question}</div>
              <div className="mt-4 grid gap-2">
                {persuasionChallengeFor(wildSognatore).options.map((answer) => <button key={answer} onClick={() => {
                  if (answer !== persuasionChallengeFor(wildSognatore).correct) { setWildError(true); return; }
                  setSave((old) => {
                    const ownedIds = old.ownedIds.includes(wildSognatore.id) ? old.ownedIds : [...old.ownedIds, wildSognatore.id];
                    const partyIds = old.partyIds.length < 4 && !old.partyIds.includes(wildSognatore.id) ? [...old.partyIds, wildSognatore.id] : old.partyIds;
                    return { ...old, ownedIds, partyIds };
                  });
                  setWildError(false);
                  setPhase("idle");
                  onWildClose?.(true);
                }} className="rounded-xl border border-white/10 bg-white/5 p-3 text-left text-sm hover:bg-white/10">{answer}</button>)}
              </div>
              {wildError && <p className="mt-3 text-sm font-bold text-amber-300">Risposta errata. Ragiona con attenzione: il legame non si conquista a caso.</p>}
            </> : <p className="mt-4">Questo Sognatore non è presente nel roster attuale.</p>}
            <button onClick={() => { setPhase("idle"); onWildClose?.(false); }} className="mt-4 w-full rounded-xl bg-white/10 py-3 text-sm font-bold">Lascialo andare</button>
          </div>
        </div>
      )}
      {encounter && phase === "traveler" && (
        <div className="absolute inset-0 z-[70] flex items-center justify-center bg-black/80 p-3 backdrop-blur-md">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-[28px] border border-amber-100/20 bg-gradient-to-br from-[#20233b] via-[#111a2b] to-[#172d31] text-white shadow-[0_24px_80px_rgba(0,0,0,.65)]">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-amber-200/80 to-transparent" />
            <div className="grid grid-cols-[112px_1fr] gap-3 px-4 pt-5 sm:grid-cols-[180px_1fr] sm:gap-5 sm:px-7 sm:pt-7">
              <div className="relative flex min-h-[190px] items-end justify-center sm:min-h-[230px]">
                <div className="absolute bottom-2 h-7 w-28 rounded-full bg-black/35 blur-md" />
                <div className="relative z-[1]">
                  <AdventureTravelerSprite traveler={encounter.traveler || encounter.name} faction={encounter.faction} size={150} />
                </div>
                <div className="absolute bottom-0 left-1/2 h-px w-24 -translate-x-1/2 bg-gradient-to-r from-transparent via-amber-200/50 to-transparent" />
              </div>
              <div className="min-w-0 self-center py-3">
                <div className="text-[9px] font-black uppercase tracking-[.28em] text-amber-200/65">{encounter.city} · {encounter.faction} · CAPO FAZIONE</div>
                <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-4xl">{encounter.traveler || encounter.name}</h2>
                <div className="text-[10px] font-black uppercase tracking-widest text-amber-100/60">{encounter.title || "Custode della fazione"}</div>
                <p className="mt-3 max-w-md text-xs leading-6 text-white/75 sm:text-sm">{encounter.lore || encounter.line || "Il capo fazione ti osserva in silenzio."}</p>
                <p className="mt-2 max-w-md text-[10px] leading-5 text-white/45">{encounter.district}</p>
                <div className="mt-4 flex items-center gap-2 text-[9px] font-black uppercase tracking-[.2em] text-white/35">
                  <span className="h-px w-7 bg-amber-200/50" /> PROVA DEL CAPO FAZIONE
                </div>
              </div>
            </div>
            <div className="mx-4 mt-3 rounded-2xl border border-white/10 bg-black/20 p-3 sm:mx-7 sm:p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[9px] font-black uppercase tracking-[.22em] text-amber-100/60">SQUADRA DEL RIVALE</span>
                <span className="text-[9px] font-bold text-white/35">4 SOGNATORI</span>
              </div>
              <div className="flex justify-around gap-1">
                {cityTeam.map((s) => <div key={s.id} className="flex min-w-0 flex-1 flex-col items-center"><AdventureSognatoreSprite s={s} size={52}/><span className="mt-1 max-w-full truncate text-[8px] font-bold text-white/75">{s.nome}</span></div>)}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 p-4 sm:px-7 sm:pb-7">
              <button onClick={() => { onClose?.(); setPhase("idle"); }} className="rounded-xl border border-white/10 bg-white/5 py-3 text-xs font-bold text-white/70 transition hover:bg-white/10">TORNA A ESPLORARE</button>
              <button disabled={party.length < 2 || cityTeam.length !== 4} onClick={startCityBattle} className="rounded-xl bg-gradient-to-r from-amber-200 to-amber-400 py-3 text-xs font-black tracking-wide text-[#241b16] shadow-lg shadow-amber-950/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-35">{party.length < 2 ? "SERVONO 2 COMPAGNI" : "SFIDA IL CAPO FAZIONE"}</button>
            </div>
          </div>
        </div>
      )}

      {encounter && phase === "battle" && (
        <AdventureBattleArena
          key={battleKey}
          stage={0}
          opponentName={(encounter.traveler || encounter.name) + " · " + encounter.city}
          opponentTraveler={encounter.traveler || encounter.name}
          opponentFaction={encounter.faction}
          playerTeam={party}
          enemyTeam={cityTeam}
          adventureMode
          onEnd={(outcome) => handleBattleFinish(outcome === "lose" ? "loss" : outcome === "abandon" ? "escape" : outcome)}
        />
      )}

      {encounter && phase === "lost" && (
        <div className="absolute inset-0 z-[90] flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md rounded-3xl border border-red-300/20 bg-slate-950 p-6 text-center text-white">
            <div className="text-4xl">✦</div><h2 className="mt-2 text-2xl font-black">Il legame vacilla</h2>
            <p className="mt-2 text-sm text-white/60">Il Capo fazione ti ha sconfitto. Riposa, prepara la squadra e torna quando sarai pronto.</p>
            <button onClick={() => setPhase("traveler")} className="mt-5 w-full rounded-xl bg-white/10 py-3 font-bold">Riprova la sfida</button>
            <button onClick={() => { setPhase("idle"); onClose?.(); }} className="mt-2 w-full rounded-xl bg-white/5 py-3 text-sm font-bold text-white/70">Torna a esplorare</button>
          </div>
        </div>
      )}

      {encounter && phase === "completed" && (
        <div className="absolute inset-0 z-[70] flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-md rounded-3xl border border-emerald-300/20 bg-slate-950 p-6 text-center text-white">
            <div className="text-4xl">✦</div><h2 className="mt-2 text-2xl font-black">{encounter.city}</h2>
            <p className="mt-2 text-sm text-white/60">Hai già sconfitto il Capo fazione di questa città. I suoi Sognatori ti riconoscono come alleato.</p>
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
            <p className="mt-2 text-sm text-white/65">Non vuole essere catturato: prima devi dimostrare lucidità e ingegno superando il suo enigma.</p>
            <div className="mt-4 rounded-xl border border-emerald-200/20 bg-emerald-950/30 p-4 text-left text-sm font-semibold leading-6">{persuasionChallengeFor(currentReward).question}</div>
            <div className="mt-4 grid gap-2">
              {persuasionChallengeFor(currentReward).options.map((answer) => <button key={answer} onClick={() => convince({ ...currentReward, _answer: answer })} className="rounded-xl border border-white/10 bg-white/5 p-3 text-left text-sm hover:bg-white/10">{answer}</button>)}
            </div>
            {persuasionError && <p className="mt-3 text-sm font-bold text-amber-300">Risposta errata. Il Sognatore aspetta una soluzione ragionata.</p>}
          </div>
        </div>
      )}


      {phase === "campaignWon" && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/90 p-4 backdrop-blur-md">
          <div className="my-auto w-full max-w-xl rounded-[2rem] border border-amber-200/30 bg-gradient-to-b from-[#30294a] to-slate-950 p-7 text-center text-white shadow-2xl">
            <div className="text-5xl">✦</div>
            <div className="mt-3 text-[10px] font-black uppercase tracking-[.35em] text-amber-200">Le undici alleanze sono compiute</div>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">Hai unito le fazioni!</h2>
            <p className="mt-4 text-sm leading-7 text-white/75">Hai sconfitto tutti gli undici Capi fazione e conquistato il rispetto delle civiltà. Le antiche rivalità si placano: per la prima volta nella storia, Demoni, Robot, Natura, Nuvola, Umani, Luce, Dolce, Marino, Orso, Mago e Salato condividono lo stesso sogno.</p>
            <div className="my-5 grid grid-cols-4 gap-2 text-[10px] font-black text-amber-100/75 sm:grid-cols-6">
              {["DEMONE","ROBOT","NATURA","NUVOLA","UMANO","LUCE","DOLCE","MARINO","ORSO","MAGO","SALATO"].map((f) => <div key={f} className="rounded-lg border border-white/10 bg-white/5 px-1 py-3">{f}</div>)}
            </div>
            <button onClick={() => { setPhase("idle"); onClose?.(); }} className="w-full rounded-xl bg-amber-200 py-3 font-black text-[#211b2a]">TORNA NEL MONDO</button>
          </div>
        </div>
      )}

      {encounter && phase === "rewardDone" && (
        <div className="absolute inset-0 z-[90] flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md rounded-3xl border border-emerald-200/20 bg-slate-950 p-6 text-center text-white">
            <div className="text-4xl">✧</div><h2 className="mt-2 text-2xl font-black">La città ti accoglie</h2>
            <p className="mt-2 text-sm text-white/65">Hai conquistato il Capo fazione di {encounter.city}. I Sognatori che hanno scelto di unirsi a te sono stati aggiunti alla squadra o al deposito.</p>
            <button onClick={() => { setPhase("idle"); onClose?.(); }} className="mt-5 w-full rounded-xl bg-emerald-300 py-3 font-black text-black">TORNA ALL'AVVENTURA</button>
          </div>
        </div>
      )}
    </>
  );
}