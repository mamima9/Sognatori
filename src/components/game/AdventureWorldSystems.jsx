import React, { useEffect, useMemo, useRef, useState } from "react";
import { ROSTER } from "@/lib/sognatoriData";

const QUESTS = [
  ["demone","La brace smarrita","Trova la scintilla spenta vicino alle rovine e scegli se custodirla o restituirla alla forgia.","Custodisci la scintilla","Restituisci la scintilla"],
  ["robot","Memoria corrotta","Un terminale ha perso un ricordo. Decidi se ripararlo o lasciarlo riposare.","Ripara il terminale","Rispetta il silenzio"],
  ["natura","La radice ferita","Una radice antica sta soffocando il sentiero. Puoi curarla o liberare spazio per i viandanti.","Cura la radice","Apri il sentiero"],
  ["nuvola","La vela spezzata","Una vela è bloccata su una terrazza. Scegli se ripararla o usarla per segnalare una rotta nuova.","Ripara la vela","Traccia una nuova rotta"],
  ["umano","Una promessa al mercato","Due abitanti litigano per uno scambio. Puoi mediare o sostenere chi ha meno risorse.","Media tra i due","Aiuta chi è in difficoltà"],
  ["luce","Lo specchio opaco","Lo Specchio dell'Alba non riflette più le scelte. Decidi se pulirlo o coprirlo per proteggerlo.","Pulisci lo specchio","Proteggi lo specchio"],
  ["dolce","Il giardino senza profumo","Un'aiuola ha perso il suo aroma. Puoi condividere i semi o conservare l'ultimo fiore.","Condividi i semi","Conserva il fiore"],
  ["marino","Il relitto sommerso","Un relitto custodisce una storia. Scegli se recuperare il diario o lasciarlo al mare.","Recupera il diario","Lascia il diario al mare"],
  ["orso","Il rifugio aperto","Un viandante cerca riparo. Puoi accompagnarlo o rinforzare prima il rifugio.","Accompagna il viandante","Rinforza il rifugio"],
  ["mago","La pagina impossibile","Una pagina cambia testo a ogni lettura. Decidi se copiarla o aggiungere una domanda.","Copia la pagina","Aggiungi una domanda"],
  ["salato","Due acque","Una sorgente dolce e una salata si stanno mescolando. Scegli come preservare entrambe.","Separa le correnti","Crea un canale comune"],
];

const EVENTS = [
  {id:"meteor",title:"Pioggia di stelle",text:"Frammenti luminosi attraversano il cielo. Un bagliore resta visibile per poco: esplora la zona prima che svanisca.",night:true},
  {id:"merchant",title:"Mercante itinerante",text:"Un mercante ha allestito un piccolo banco in città. Le sue storie rivelano un passaggio dimenticato.",night:false},
  {id:"wind",title:"Vento anomalo",text:"Una corrente insolita attraversa la città e porta con sé una voce proveniente da un luogo lontano.",night:false},
  {id:"echo",title:"Eco notturna",text:"Dopo il tramonto una voce ripete il nome di un Sognatore. Le tracce conducono a un segreto.",night:true},
  {id:"festival",title:"Festa di fazione",text:"Gli abitanti si ritrovano nella piazza. Ascoltare le loro storie svela un frammento di lore.",night:false},
];

const SECRET_HINTS = [
  "Quando la città tace, cerca il simbolo che non proietta ombra.",
  "Una parete con tre segni diversi nasconde una stanza dimenticata.",
  "Segui il sentiero che termina dove la mappa sembra vuota.",
  "Il passaggio appare soltanto dopo aver aiutato gli abitanti.",
  "La luce della notte rivela incisioni invisibili al mattino.",
  "Una sorgente nascosta custodisce un ricordo antico.",
  "Il vecchio ponte conduce a qualcosa che non compare sulle mappe.",
  "Le conchiglie disposte in cerchio indicano un ingresso sommerso.",
  "Sotto il rifugio più antico si sente un battito.",
  "Una runa incompleta indica la strada per una camera segreta.",
  "Due minerali opposti, posati insieme, aprono un varco.",
];

const readSave = (key) => {
  try { return JSON.parse(localStorage.getItem(key) || "{}"); } catch { return {}; }
};

export default function AdventureWorldSystems({ saveKey, activeCity, time, defeatedLeaders = [], discoveredWildClues = {}, completedWildTasks = {}, recruitedIds = [] }) {
  const storageKey = saveKey + "-world-systems";
  const [saved, setSaved] = useState(() => readSave(storageKey));
  const [panel, setPanel] = useState("");
  const [eventNotice, setEventNotice] = useState(null);
  const [lastEventHour, setLastEventHour] = useState(-1);
  const previousHour = useRef(Math.floor(Number(time) || 0));
  const [dayIndex, setDayIndex] = useState(() => Number(readSave(storageKey).dayIndex) || 0);
  const [secretNotice, setSecretNotice] = useState("");
  const [selectedQuest, setSelectedQuest] = useState(null);

  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(saved)); } catch (error) { console.warn("Salvataggio Avventura non disponibile", error); }
  }, [storageKey, saved]);

  const hour = Math.floor(Number(time) || 0);
  const isNight = hour >= 20 || hour < 6;
  const quest = QUESTS.find((item) => item[0] === activeCity?.id);
  const questDone = !!saved.quests?.[activeCity?.id];
  const eventDay = dayIndex;

  useEffect(() => {
    if (!activeCity?.id || lastEventHour === hour) return;
    setLastEventHour(hour);
    if (hour % 6 !== 0) return;
    const available = EVENTS.filter((item) => item.night === isNight);
    if (!available.length) return;
    const seed = (eventDay * 17 + hour * 7 + activeCity.id.length * 13) % available.length;
    const next = { ...available[seed], cityId: activeCity.id, hour, day: eventDay };
    if (saved.lastEvent?.cityId === next.cityId && saved.lastEvent?.day === next.day && saved.lastEvent?.hour === next.hour) return;
    setEventNotice(next);
    setSaved((old) => ({ ...old, lastEvent: next }));
  }, [activeCity?.id, hour, isNight, eventDay, lastEventHour, saved.lastEvent]);

  const completeQuest = (choice) => {
    if (!quest || questDone) return;
    setSaved((old) => ({
      ...old,
      quests: { ...(old.quests || {}), [activeCity.id]: { choice, at: Date.now() } },
      bonds: { ...(old.bonds || {}), [activeCity.id]: choice === 0 ? 1 : -1 },
      loreFragments: [...new Set([...(old.loreFragments || []), activeCity.id])],
    }));
    setSelectedQuest({ title: quest[1], choice: quest[choice + 2], consequence: choice === 0 ? "La città ricorderà la tua scelta come un gesto di cura." : "La città ricorderà la tua scelta come un gesto di pragmatismo." });
  };

  const discoverSecret = (cityId) => {
    if (saved.secrets?.[cityId]) return;
    setSaved((old) => ({ ...old, secrets: { ...(old.secrets || {}), [cityId]: true }, loreFragments: [...new Set([...(old.loreFragments || []), cityId + "-secret"])] }));
    setSecretNotice("Hai scoperto un passaggio segreto e un frammento di lore di " + activeCity.city + "!");
  };

  const species = useMemo(() => ROSTER.map((item) => ({
    ...item,
    seen: Object.keys(discoveredWildClues || {}).some((key) => key.endsWith(":" + item.id)),
    recruited: (saved.recruitedIds || []).includes(item.id),
  })), [discoveredWildClues, saved.recruitedIds]);

  const completedQuestCount = Object.keys(saved.quests || {}).length;
  const unlockedCities = Math.min(11, Math.max(1, new Set(defeatedLeaders).size + 1));

  return <div className="w-full flex flex-col gap-3 border-t border-white/10 pt-3">
    {eventNotice && <div className="w-full rounded-2xl border border-amber-200/30 bg-[#17140f]/95 p-3 text-white">
      <div className="flex items-center justify-between gap-2"><b className="text-xs uppercase tracking-wider text-amber-200">✦ Evento · {eventNotice.title}</b><button onClick={() => setEventNotice(null)} className="text-white/60">✕</button></div>
      <p className="mt-1 text-xs leading-5 text-white/80">{eventNotice.text}</p>
      <button onClick={() => { setSaved((old) => ({ ...old, eventDiscoveries: [...new Set([...(old.eventDiscoveries || []), eventNotice.id + ":" + eventNotice.cityId])] })); setEventNotice(null); }} className="mt-2 rounded-lg bg-amber-200 px-3 py-1.5 text-[10px] font-black text-black">ESPLORA L'EVENTO</button>
    </div>}
    {secretNotice && <div className="rounded-xl border border-violet-300/30 bg-violet-950/95 px-3 py-2 text-xs text-violet-100">{secretNotice}<button onClick={() => setSecretNotice("")} className="ml-3 font-black">✕</button></div>}

  </div>;
}
