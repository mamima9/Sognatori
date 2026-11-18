import React, { useEffect, useMemo, useState } from "react";
import { ROSTER, ROSTER_AVVENTURA } from "@/lib/sognatoriData";
import AdventureBattleArena from "@/components/game/AdventureBattleArena";
import AdventureSognatoreSprite from "@/components/game/AdventureSognatoreSprite";
import AdventureTravelerSprite from "@/components/game/AdventureTravelerSprite";
import { getCityRewards, buildCityTeam, ADVENTURE_CITIES } from "@/lib/adventureCampaignData";

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
const WILD_RECRUIT_QUESTS = {
  "adlimago": { clue: "Adli vuole risolvere un enigma insieme.", task: "Come reagisci?", choices: ["Ammetti ciò che non sai e ragiona","Inventi una risposta","Distruggi le rune"], correct: 0, bond: "La curiosità sincera apre ogni formula." },
  "cancucc": { clue: "Cancucc sta preparando qualcosa da condividere.", task: "Come reagisci?", choices: ["Prepara una porzione anche per chi è rimasto fuori","Chiedi tutto per te","Te ne vai"], correct: 0, bond: "La generosità spontanea lo ha convinto." },
  "eroe": { clue: "Eroe ti osserva da una rupe battuta dal vento.", task: "Come reagisci?", choices: ["Studia le correnti e sali con prudenza","Salta senza guardare","Aspetta che faccia tutto lui"], correct: 0, bond: "Coraggio e lucidità: una bella squadra." },
  "nuvobetta": { clue: "Nuvobetta prova una nuova coreografia.", task: "Come reagisci?", choices: ["Ascolta il ritmo e danza insieme a lei","Cambi musica","La imiti prendendola in giro"], correct: 0, bond: "Avete trovato lo stesso ritmo." },
  "scroccospell": { clue: "Scroccospell custodisce un libro raro.", task: "Come reagisci?", choices: ["Proponi uno scambio equo di conoscenze","Prendi il libro di nascosto","Pretendi che te lo dia"], correct: 0, bond: "La fiducia nasce da uno scambio leale." },
  "deb": { clue: "Deb deve consegnare un pacco fragile.", task: "Come reagisci?", choices: ["Controlla indirizzo, percorso e pacco","Corri senza verificare","Lo affidi a uno sconosciuto"], correct: 0, bond: "Deb apprezza la tua affidabilità." },
  "aragostino": { clue: "Aragostino protegge una pozza di marea.", task: "Come reagisci?", choices: ["Aspetta la marea giusta e rispetta il fondale","Svuota la pozza","Rompi la roccia"], correct: 0, bond: "Hai rispettato il suo piccolo mondo." },
  "sparkly": { clue: "Sparkly teme i complimenti falsi.", task: "Come reagisci?", choices: ["Digli con sincerità cosa apprezzi","Lo lusinghi esagerando","Lo giudichi subito"], correct: 0, bond: "La sincerità gentile ha fatto breccia." },
  "nina": { clue: "Nina custodisce una lanterna per i viandanti.", task: "Come reagisci?", choices: ["Usa la luce per guidare chi si è perso","Tienila solo per te","La spegni"], correct: 0, bond: "Hai scelto di illuminare anche il cammino altrui." },
  "taomarco": { clue: "Tao Marco ti propone uno scambio rischioso.", task: "Come reagisci?", choices: ["Accetta condizioni chiare e mantieni la parola","Cambi le regole a metà","Vuoi vincere tutto"], correct: 0, bond: "La tua correttezza gli è piaciuta." },
  "riwupido": { clue: "Riwupido ti chiede conto di un errore.", task: "Come reagisci?", choices: ["Ammettilo e ripara il danno","Accusa un compagno","Nascondilo"], correct: 0, bond: "Hai dimostrato responsabilità." },
  "fourmori": { clue: "Fourmori coordina un gruppo al lavoro.", task: "Come reagisci?", choices: ["Scegli un compito e collabora","Imponi ordini","Lavori da solo"], correct: 0, bond: "Insieme avete fatto più strada." },
  "ginza": { clue: "Ginza protegge un passaggio pericoloso.", task: "Come reagisci?", choices: ["Accompagna al sicuro il viandante ferito","Lo superi","Lo lasci lì"], correct: 0, bond: "La protezione è la tua vera forza." },
  "dragociocco": { clue: "Dragociocco cerca uova di cacao delicate.", task: "Come reagisci?", choices: ["Raccoglile con cura senza romperle","Scuoti i rami","Calpestale"], correct: 0, bond: "La tua delicatezza lo ha conquistato." },
  "tinia": { clue: "Tinia ti mostra un dipinto di nuvole rosa.", task: "Come reagisci?", choices: ["Chiedile cosa significa per lei e ascolta","Imponi la tua interpretazione","Lo deridi"], correct: 0, bond: "Hai accolto un punto di vista diverso." },
  "uesditti": { clue: "Uesditti ti sfida a verificare una formula.", task: "Come reagisci?", choices: ["Controlla i passaggi e porta prove","Copi la prima risposta","Segui la maggioranza"], correct: 0, bond: "Metodo e verifica: esattamente ciò che cercava." },
  "fierononno": { clue: "Fiero Nonno vuole raccontarti una storia.", task: "Come reagisci?", choices: ["Ascolta con pazienza e chiedi cosa ha imparato","Lo interrompi","Fingi di ascoltare"], correct: 0, bond: "Gli hai dato il tempo che meritava." },
  "long": { clue: "Long aspetta un treno in ritardo.", task: "Come reagisci?", choices: ["Resta e trova un modo utile di aspettare","Te ne vai subito","Prometti risultati impossibili"], correct: 0, bond: "La costanza conta più della fretta." },
  "pepe": { clue: "Pepe ti mostra una moneta misteriosa.", task: "Come reagisci?", choices: ["Studiane valore e rischi prima di decidere","Comprala per moda","Rifiutala senza guardare"], correct: 0, bond: "Hai scelto con la tua testa." },
  "cillymbu": { clue: "Cillymbu si nasconde nel bambù.", task: "Come reagisci?", choices: ["Avanza piano ascoltando il vento","Taglia le canne","Fai più rumore possibile"], correct: 0, bond: "Hai saputo muoverti senza disturbare." },
  "pequeno": { clue: "Pequeno protegge una piantina appena nata.", task: "Come reagisci?", choices: ["Prepara acqua e spazio e lasciala crescere","Strappa le radici","La inondi"], correct: 0, bond: "La pazienza è il suo linguaggio." },
  "cenere": { clue: "Cenere custodisce un cratere caldo.", task: "Come reagisci?", choices: ["Regola la brace e crea un perimetro sicuro","Alimenta il fuoco senza misura","Spegni tutto"], correct: 0, bond: "Hai rispettato la sua natura senza temerla." },
  "icepadel": { clue: "Icepadel ti invita su una pista ghiacciata.", task: "Come reagisci?", choices: ["Rialzati, osserva e riprova correggendoti","Accusi il ghiaccio","Abbandoni la pista"], correct: 0, bond: "Hai trasformato una caduta in esperienza." },
  "pirimar": { clue: "Pirimar segue una corrente che cambia.", task: "Come reagisci?", choices: ["Adattati e ricalcola la rotta","Insisti controcorrente","Lasciati trascinare"], correct: 0, bond: "Sai cambiare strada senza perdere la meta." },
  "spinoff": { clue: "Spinoff inventa una storia a più mani.", task: "Come reagisci?", choices: ["Aggiungi un'idea e lascia spazio alle sue","Riscrivi tutto","Bocci ogni proposta"], correct: 0, bond: "La creatività condivisa vi ha uniti." },
  "toasty": { clue: "Toasty controlla un forno salino.", task: "Come reagisci?", choices: ["Regola il calore e dosa il sale","Porta subito al massimo","Lascia il forno incustodito"], correct: 0, bond: "Hai trovato la misura giusta." },
  "shoboshi": { clue: "Shoboshi appare solo nel silenzio.", task: "Come reagisci?", choices: ["Aspetta senza forzare e lascia scegliere a lui","Lo insegui urlando","Accendi tutte le luci"], correct: 0, bond: "Hai rispettato i suoi tempi." },
  "eriiro": { clue: "Eriiro cambia bersaglio all'ultimo istante.", task: "Come reagisci?", choices: ["Respira e correggi la mira","Tiri a caso","Ti arrabbi"], correct: 0, bond: "La calma ti ha fatto centrare il bersaglio." },
  "elmas": { clue: "Elmas custodisce un cristallo che riflette emozioni.", task: "Come reagisci?", choices: ["Mostra anche le tue fragilità","Fingi di essere perfetto","Copri il cristallo"], correct: 0, bond: "L'autenticità ha creato fiducia." },
  "ring-ape": { clue: "Ring-Ape ti invita a un antico rito.", task: "Come reagisci?", choices: ["Accetta le regole e gioca lealmente","Le cambi se perdi","Rifiuti ogni regola"], correct: 0, bond: "Il rispetto della sfida vi ha legati." },
  "chino": { clue: "Chino ha perso un oggetto nel mercato.", task: "Come reagisci?", choices: ["Cerca insieme e chiedi aiuto con gentilezza","Accusi un passante","Te ne disinteressi"], correct: 0, bond: "L'aiuto concreto non passa inosservato." },
  "ponte": { clue: "Ponte deve unire due rive lontane.", task: "Come reagisci?", choices: ["Studia il terreno e costruisci un passaggio stabile","Abbatti gli alberi","Lo lasci solo"], correct: 0, bond: "Hai costruito un legame, proprio come un ponte." },
  "roccota": { clue: "Roccota custodisce una parete di fossili.", task: "Come reagisci?", choices: ["Osserva e proteggi i reperti","Li stacchi per portarli via","Incidi il tuo nome"], correct: 0, bond: "Hai rispettato la memoria della pietra." },
  "slurpo": { clue: "Slurpo sperimenta una ricetta improbabile.", task: "Come reagisci?", choices: ["Assaggia e proponi una nuova combinazione","Lo giudichi senza provare","Butti via tutto"], correct: 0, bond: "La tua voglia di sperimentare lo diverte." },
  "riwi": { clue: "Riwi sistema un giardino dopo la tempesta.", task: "Come reagisci?", choices: ["Osserva i danni e ripara prima ciò che serve","Sistemi tutto senza guardare","Aspetti che lo faccia qualcun altro"], correct: 0, bond: "Hai dimostrato cura e buon senso." },
  "torosucco": { clue: "Torosucco sta preparando una bevanda frizzante e teme che le bolle scappino.", task: "Qual è il modo migliore per aiutarlo?", choices: ["Versa lentamente e lascia spazio alle bolle","Agita il contenitore prima di aprirlo","Riempi il bicchiere fino all’orlo"], correct: 0, bond: "Hai capito che anche l’entusiasmo ha bisogno della giusta misura." },
  "crunchypat": { clue: "Crunchypat è davanti a una parete di sale che sta per cedere.", task: "Come proteggi chi si trova dietro di te?", choices: ["Ti metti al riparo giusto e fai da scudo agli altri","Corri via lasciando il gruppo","Colpisci la parete per vedere cosa succede"], correct: 0, bond: "Hai dimostrato che proteggere significa restare saldo quando serve." },
  "talamos": { clue: "Talamos ha trovato una pozza salata in cui l’acqua sta evaporando.", task: "Come la aiuti a conservarsi?", choices: ["Ombreggi la pozza e controlli il livello dell’acqua","Aggiungi altro sale senza misurare","Lasci evaporare tutto"], correct: 0, bond: "Hai rispettato l’equilibrio delicato della palude salata." },
  "pingcake": { clue: "Pingcake si è appisolato mentre preparava una torta e rischia di bruciarla.", task: "Come lo aiuti a finire senza stressarlo?", choices: ["Abbassi il forno, sistemi il timer e lo svegli con calma","Alzi la temperatura per fare prima","Gli urli di svegliarsi"], correct: 0, bond: "Hai trovato il ritmo giusto tra dolcezza e attenzione." },
};
function getWildRecruitQuest(sognatore) {
  return WILD_RECRUIT_QUESTS[sognatore?.id] || WILD_RECRUIT_QUESTS.adlimago;
}
const TRIAL_RUNES = ["◆", "✦", "●", "▲", "☾", "✚"];
function buildResonanceTrial(seedValue) {
  const raw = String(seedValue || "sognatore");
  let seed = Array.from(raw).reduce((sum, char) => (sum * 33 + char.charCodeAt(0)) >>> 0, 17);
  return [4, 6, 8].map((length) => {
    const sequence = [];
    for (let i = 0; i < length; i++) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      let next = (seed >>> 16) % TRIAL_RUNES.length;
      if (sequence.length && sequence[sequence.length - 1] === next) next = (next + 1 + (seed % 3)) % TRIAL_RUNES.length;
      sequence.push(next);
    }
    return sequence;
  });
}
function loadSave(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { ownedIds: [], partyIds: [], starterIds: [], completedCities: [], conqueredLeaders: [], factionGems: [], failedWildIds: [], introDone: false };
    const parsed = JSON.parse(raw);
    return {
      ownedIds: Array.isArray(parsed.ownedIds) ? parsed.ownedIds : [],
      partyIds: Array.isArray(parsed.partyIds) ? parsed.partyIds.slice(0, 4) : [],
      starterIds: Array.isArray(parsed.starterIds)
        ? parsed.starterIds.filter((id) => (parsed.partyIds || []).includes(id)).slice(0, 2)
        : (Array.isArray(parsed.partyIds) ? parsed.partyIds.slice(0, 2) : []),
      completedCities: Array.isArray(parsed.completedCities) ? parsed.completedCities : [],
      conqueredLeaders: Array.isArray(parsed.conqueredLeaders) ? parsed.conqueredLeaders : [],
      factionGems: Array.isArray(parsed.factionGems) ? parsed.factionGems : [],
      failedWildIds: Array.isArray(parsed.failedWildIds) ? parsed.failedWildIds : [],
      introDone: !!parsed.introDone,
    };
  } catch {
    return { ownedIds: [], partyIds: [], starterIds: [], completedCities: [], conqueredLeaders: [], factionGems: [], failedWildIds: [], introDone: false };
  }
}

function FactionMedal({ faction }) {
  const outline = "#25212a";
  const medal = (fill, extra = {}) => ({ fill, stroke: outline, strokeWidth: 2.6, strokeLinejoin: "round", ...extra });
  let shape = null;
  switch (faction) {
    case "Demone":
      // Due corna gemelle rosso fuoco.
      shape = <><path d="M8 43C2 30 3 13 8 5C18 10 22 20 24 33C26 20 32 9 43 5C48 17 48 31 40 43L32 35L24 45L16 35Z" {...medal("#e34232")}/><path d="M8 7C13 17 15 25 16 34M43 7C37 17 34 25 32 34" fill="none" stroke="#ffb04b" strokeWidth="4" strokeLinecap="round"/></>;
      break;
    case "Marino":
      // Onda blu oceano, non una goccia.
      shape = <><path d="M4 34C12 34 13 23 21 23C29 23 29 34 37 34C42 34 45 30 47 26V39C42 45 35 47 28 42C21 37 18 37 12 43L4 39Z" {...medal("#087da9")}/><path d="M5 24C13 24 14 13 23 13C31 13 32 24 41 24C44 24 46 22 48 19" fill="none" stroke="#65d9f2" strokeWidth="5" strokeLinecap="round"/><path d="M10 31C16 31 17 23 23 23" fill="none" stroke="#b5f2ff" strokeWidth="2.5" strokeLinecap="round"/></>;
      break;
    case "Dolce":
      // Due cookies dorati con gocce di cioccolato.
      shape = <><circle cx="19" cy="28" r="15" {...medal("#dca653")}/><circle cx="34" cy="22" r="13" {...medal("#f0c879")}/><g fill="#75432e" stroke="#75432e"><circle cx="13" cy="21" r="2"/><circle cx="22" cy="31" r="2.2"/><circle cx="13" cy="34" r="1.8"/><circle cx="34" cy="15" r="2"/><circle cx="40" cy="25" r="2"/><circle cx="30" cy="27" r="1.8"/></g></>;
      break;
    case "Natura":
      // Piantina verde foresta con due foglie e germoglio.
      shape = <><path d="M25 45V25" stroke="#5b3d27" strokeWidth="4" strokeLinecap="round"/><path d="M24 31C8 31 5 20 8 9C21 8 29 16 27 28Z" {...medal("#367b3d")}/><path d="M26 27C25 12 35 5 47 7C49 20 41 30 27 32Z" {...medal("#559b48")}/><path d="M11 13L24 27M43 11L27 28" stroke="#a6d66a" strokeWidth="2.4" fill="none"/></>;
      break;
    case "Robot":
      // Testa robot argento.
      shape = <><path d="M25 5V11M21 5H29" stroke="#dce3e8" strokeWidth="3" strokeLinecap="round"/><rect x="7" y="12" width="36" height="33" rx="8" {...medal("#aeb8c2")}/><path d="M7 22H3M43 22H47" stroke="#dce3e8" strokeWidth="4" strokeLinecap="round"/><rect x="13" y="21" width="9" height="8" rx="2" fill="#536b79"/><rect x="28" y="21" width="9" height="8" rx="2" fill="#536b79"/><path d="M16 36H34" stroke="#596773" strokeWidth="3.5" strokeLinecap="round"/><path d="M12 15H38" stroke="#f4f7f9" strokeWidth="2" opacity=".9"/></>;
      break;
    case "Nuvola":
      shape = <path d="M13 40a11 11 0 0 1-1-22a14 14 0 0 1 27-2a12 12 0 0 1 3 24Z" {...medal("#e9f4fb")}/>;
      break;
    case "Umano":
      // Corona nera.
      shape = <><path d="M5 40L8 16L19 26L25 7L32 26L44 15L46 40Z" {...medal("#171719")}/><path d="M8 44H44" stroke="#050506" strokeWidth="5" strokeLinecap="round"/><circle cx="8" cy="14" r="3" fill="#080809"/><circle cx="25" cy="5" r="3" fill="#080809"/><circle cx="45" cy="13" r="3" fill="#080809"/></>;
      break;
    case "Luce":
      // Due mani unite in preghiera, dita rivolte verso l'alto e polsi dorati.
      shape = <>
        <path d="M15 46L10 39L17 32L22 37L25 34L28 37L33 32L40 39L35 46Z" {...medal("#b98722")}/>
        <path d="M25 39L11 25C8 22 8 18 11 15C14 12 18 14 21 17L25 21L29 17C32 14 36 12 39 15C42 18 42 22 39 25L25 39Z" {...medal("#e4bd45")}/>
        <path d="M19 18L22 8C23 5 26 5 27 8L29 18M25 21L25 37" fill="none" stroke="#fff0a3" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M12 25L25 38L38 25" fill="none" stroke="#f7d979" strokeWidth="2" strokeLinecap="round"/>
      </>;
      break;
    case "Mago":
      // Cappello da mago viola con fascia gialla e stella.
      shape = <><path d="M7 40L19 9L27 25L36 5L45 40Z" {...medal("#7044a5")}/><path d="M11 34H43L46 42H6Z" {...medal("#f1cf45")}/><path d="M25 14L27 19L32 20L28 23L29 28L25 25L21 28L22 23L18 20L23 19Z" fill="#ffeb78" stroke="#f7dc63" strokeWidth="1"/></>;
      break;
    case "Orso":
      // Impronta marrone con quattro dita e cuscinetto.
      shape = <><ellipse cx="25" cy="34" rx="15" ry="12" {...medal("#80532f")}/><ellipse cx="10" cy="17" rx="6" ry="8" transform="rotate(-24 10 17)" {...medal("#80532f")}/><ellipse cx="22" cy="11" rx="6" ry="8" {...medal("#98663b")}/><ellipse cx="35" cy="13" rx="6" ry="8" transform="rotate(18 35 13)" {...medal("#80532f")}/><ellipse cx="45" cy="21" rx="5" ry="7" transform="rotate(28 45 21)" {...medal("#80532f")}/><path d="M25 28C18 28 14 34 17 39C20 44 30 44 34 39C38 34 32 28 25 28Z" fill="#c28b54"/></>;
      break;
    case "Amaro":
      // Chicco di caffè bruno con solco centrale.
      shape = <><path d="M25 5C37 5 46 16 45 28C44 40 34 48 23 47C12 46 5 36 6 24C7 13 15 5 25 5Z" transform="rotate(28 25 26)" {...medal("#68402b")}/><path d="M13 39C20 31 22 24 22 15C22 11 25 8 28 8C32 8 34 12 32 17C29 25 25 34 17 42" fill="none" stroke="#d7a16a" strokeWidth="3.2" strokeLinecap="round"/><path d="M13 20C17 12 23 9 29 10" fill="none" stroke="#a8754b" strokeWidth="2" strokeLinecap="round"/></>;
      break;
    case "Salato":
      // Cubetto di sale rosa dell'Himalaya.
      shape = <><path d="M8 17L25 7L43 17L42 39L25 48L8 39Z" {...medal("#d99a9c")}/><path d="M8 17L25 27L43 17M25 27V48" fill="none" stroke="#f7d8d4" strokeWidth="2.5"/><path d="M25 7L25 27L43 17" fill="#f0c2bd" stroke="#a96f77" strokeWidth="1.5"/><path d="M14 20L20 23M30 32L36 29" stroke="#fff0e9" strokeWidth="2" strokeLinecap="round"/></>;
      break;
    default:
      shape = <path d="M13 40a11 11 0 0 1-1-22a14 14 0 0 1 27-2a12 12 0 0 1 3 24Z" {...medal("#e9f4fb")}/>;
  }
  return <svg viewBox="0 0 50 52" role="img" aria-label={"Medaglia " + faction} className="h-10 w-10 drop-shadow-[0_2px_5px_rgba(0,0,0,.55)]">{shape}</svg>;
}

export default function AdventureCampaign({ userKey, player, facing = { x: 0, y: -1 }, walking = false, encounter, wildEncounter, onClose, onWildClose, onPauseChange, onRestart, onLeaderDefeated, menuContent, grantAllFactionGems = false }) {
  const storageKey = "sognatori-adventure-v1-" + (userKey || "guest");
  const [save, setSave] = useState(() => loadSave(storageKey));

  // Account personale Bibito: sincronizza sia i capi sconfitti sia le gemme
  // nel salvataggio effettivamente letto dal menu della campagna.
  useEffect(() => {
    if (!grantAllFactionGems) return;
    setSave((old) => {
      const conqueredLeaders = Array.from(new Set([
        ...(old.conqueredLeaders || []),
        ...ADVENTURE_CITIES.map((city) => city.id),
      ]));
      const factionGems = ADVENTURE_CITIES.map((city) => ({
        leaderId: city.id,
        faction: city.faction,
        color: city.color,
      }));
      if (conqueredLeaders.length === (old.conqueredLeaders || []).length &&
          factionGems.length === (old.factionGems || []).length &&
          factionGems.every((gem) => (old.factionGems || []).some((owned) => owned.leaderId === gem.leaderId))) return old;
      return { ...old, conqueredLeaders, factionGems };
    });
  }, [grantAllFactionGems]);
  const [panel, setPanel] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [phase, setPhase] = useState("idle");
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState([]);
  const [starterSognatore, setStarterSognatore] = useState(null);
  const [rewardIndex, setRewardIndex] = useState(0);
  const [rewardQueue, setRewardQueue] = useState([]);
  const [battleKey, setBattleKey] = useState(0);
  const [trialRound, setTrialRound] = useState(0);
  const [trialStep, setTrialStep] = useState(0);
  const [trialLives, setTrialLives] = useState(3);
  const [trialMode, setTrialMode] = useState("preview");
  const [trialError, setTrialError] = useState("");
  const [wildQuestStep, setWildQuestStep] = useState(0);
  const [wildQuestFeedback, setWildQuestFeedback] = useState("");
  const [confirmRestart, setConfirmRestart] = useState(false);
  const currentReward = rewardQueue[rewardIndex];
  const wildSognatore = wildEncounter ? ROSTER.find((s) => s.id === wildEncounter.rosterId) || ROSTER.find((s) => s.nome?.toLowerCase() === wildEncounter.name?.toLowerCase()) : null;
  const wildAlreadyOwned = !!wildSognatore && save.ownedIds.some((id) => ROSTER.find((ownedSognatore) => ownedSognatore.id === id)?.nome === wildSognatore.nome);
  const wildFailedThisRun = !!wildSognatore && (save.failedWildIds || []).includes(wildSognatore.id);
  const wildCanRecruit = wildEncounter?.recruitable !== false && !wildAlreadyOwned && !wildFailedThisRun;
  const activeTrialKey = phase === "wildTalk" ? (wildEncounter?.rosterId || wildEncounter?.id) : phase === "reward" ? currentReward?.id : "idle";
  const trialSequences = useMemo(() => buildResonanceTrial(activeTrialKey), [activeTrialKey]);
  const baseTrialSequence = trialSequences[trialRound] || [];
  const activeTrialSequence = trialRound === 1
    ? [...baseTrialSequence].reverse()
    : trialRound === 2
      ? baseTrialSequence.flatMap((_, index) => index < Math.ceil(baseTrialSequence.length / 2) ? [baseTrialSequence[index], baseTrialSequence[baseTrialSequence.length - 1 - index]] : [])
      : baseTrialSequence;

  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(save)); } catch {}
  }, [save, storageKey]);

  useEffect(() => {
    if (phase === "battle" || encounter) {
      setMenuOpen(false);
      setPanel("");
      setConfirmRestart(false);
    }
    onPauseChange?.(phase !== "idle" || !!panel);
    return () => onPauseChange?.(false);
  }, [phase, panel, encounter?.id, onPauseChange]);

  useEffect(() => {
    if (!save.introDone) setPhase("intro");
  }, [save.introDone]);

  useEffect(() => {
    if (wildEncounter) {
      setWildQuestStep(0);
      setWildQuestFeedback("");
      setPhase("wildTalk");
    } else if (encounter) {
        setPhase(save.conqueredLeaders.includes(encounter.id) ? "completed" : "traveler");
    } else if (!save.introDone) {
      setPhase("intro");
    } else if (phase !== "intro") {
      setPhase("idle");
    }
  }, [encounter?.id, wildEncounter?.id]);

  useEffect(() => {
    if (phase === "reward" && currentReward) {
      setTrialRound(0); setTrialStep(0); setTrialLives(3); setTrialMode("preview"); setTrialError("");
    }
  }, [phase, currentReward?.id]);

  const owned = useMemo(
    () => save.ownedIds.map((id) => ROSTER.find((s) => s.id === id)).filter(Boolean),
    [save.ownedIds]
  );
  // Il contatore del legame riguarda esclusivamente il Pokédex delle 11 città (carte 1–39).
  const ownedAdventureCount = save.ownedIds.filter((id) => ROSTER_AVVENTURA.some((s) => s.id === id)).length;
  const party = useMemo(() => {
    const starters = (save.starterIds || []).filter((id) => save.partyIds.includes(id));
    const orderedIds = [...starters, ...save.partyIds.filter((id) => !starters.includes(id))];
    return orderedIds.map((id) => ROSTER.find((s) => s.id === id)).filter(Boolean);
  }, [save.partyIds, save.starterIds]);

  const deposit = owned.filter((s) => !save.partyIds.includes(s.id));
  const expectedCityTeamSize = encounter?.faction === "Nuvola" ? 5 : 4;
  const cityTeam = useMemo(
    () => encounter
      ? (encounter.team?.length === expectedCityTeamSize
        ? encounter.team
        : buildCityTeam(encounter.faction, encounter.id))
      : [],
    [encounter?.id, expectedCityTeamSize]
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
      starterIds: old.starterIds?.length >= 2 || old.partyIds.includes(starterSognatore.id)
        ? (old.starterIds || old.partyIds.slice(0, 2))
        : [...(old.starterIds || old.partyIds.slice(0, 2)), starterSognatore.id].slice(0, 2),
    }));
    setPhase("idle");
  };

  const toggleParty = (id) => {
    setSave((old) => {
      const inParty = old.partyIds.includes(id);
      if (inParty) {
        const partyIds = old.partyIds.filter((x) => x !== id);
        const starters = (old.starterIds || old.partyIds.slice(0, 2)).filter((x) => x !== id);
        const nextStarters = [...starters, ...partyIds.filter((x) => !starters.includes(x))].slice(0, 2);
        return { ...old, partyIds, starterIds: nextStarters };
      }
      if (old.partyIds.length >= 4) return old;
      const partyIds = [...old.partyIds, id];
      const starters = old.starterIds || old.partyIds.slice(0, 2);
      return { ...old, partyIds, starterIds: starters.length < 2 ? [...starters, id] : starters };
    });
  };

  const toggleStarter = (id) => {
    setSave((old) => {
      if (!old.partyIds.includes(id)) return old;
      const starters = (old.starterIds || old.partyIds.slice(0, 2)).filter((x) => old.partyIds.includes(x));
      if (starters.includes(id)) {
        const replacement = old.partyIds.find((x) => x !== id && !starters.includes(x));
        if (!replacement) return old;
        return { ...old, starterIds: [...starters.filter((x) => x !== id), replacement].slice(0, 2) };
      }
      return { ...old, starterIds: [...starters.slice(0, 1), id] };
    });
  };

  const startCityBattle = () => {
    if (party.length < 2 || cityTeam.length !== expectedCityTeamSize) return;
    setBattleKey((n) => n + 1);
    setPhase("battle");
  };

  const handleBattleFinish = (outcome) => {
    if (outcome === "win") {
      // Ogni Capo fazione sconfitto consegna una sola gemma del colore
      // della propria fazione: nessun Sognatore viene assegnato come premio.
      const alreadyDefeated = (save.conqueredLeaders || []).includes(encounter.id);
      const completedCount = new Set([...(save.conqueredLeaders || []).filter((id) => id !== "amaro"), encounter.id]).size;
      setSave((old) => {
        const conqueredLeaders = Array.from(new Set([...(old.conqueredLeaders || []), encounter.id]));
        const factionGems = (old.factionGems || []).some((gem) => gem.leaderId === encounter.id)
          ? (old.factionGems || [])
          : [...(old.factionGems || []), {
              leaderId: encounter.id,
              faction: encounter.faction,
              color: encounter.color || "#d8c7ff",
            }];
        return {
          ...old,
          completedCities: Array.from(new Set([...(old.completedCities || []), encounter.id])),
          conqueredLeaders,
          factionGems,
        };
      });
      if (!alreadyDefeated) onLeaderDefeated?.(encounter.id);
      setPhase(completedCount >= 11 ? "campaignWon" : "rewardDone");
    } else if (outcome === "escape") {
      setPhase("idle");
      onClose?.();
    } else {
      setPhase("lost");
    }
  };

  const convince = (candidate) => {
    setSave((old) => {
      const ownedIds = old.ownedIds.includes(candidate.id) ? old.ownedIds : [...old.ownedIds, candidate.id];
      const partyIds = old.partyIds.length < 4 && !old.partyIds.includes(candidate.id)
        ? [...old.partyIds, candidate.id]
        : old.partyIds;
      return { ...old, ownedIds, partyIds };
    });
    if (rewardIndex + 1 < rewardQueue.length) setRewardIndex((n) => n + 1);
    else {
      setPhase("rewardDone");
    }
  };

  const chooseTrialRune = (runeIndex) => {
    if (trialMode !== "active") return;
    if (runeIndex !== activeTrialSequence[trialStep]) {
      const remaining = trialLives - 1;
      setTrialLives(remaining);
      setTrialStep(0);
      setTrialError("Sequenza interrotta. Memorizza di nuovo il tracciato.");
      setTrialMode(remaining > 0 ? "preview" : "failed");
      return;
    }
    setTrialError("");
    if (trialStep + 1 < activeTrialSequence.length) {
      setTrialStep((step) => step + 1);
      return;
    }
    if (trialRound < 2) {
      setTrialRound((round) => round + 1);
      setTrialStep(0);
      setTrialMode("preview");
      return;
    }
    if (phase === "reward" && currentReward) {
      convince(currentReward);
    }
  };

  const renderResonanceTrial = (accent = "cyan") => (
    <div className={"mt-4 rounded-2xl border p-4 text-left " + (accent === "emerald" ? "border-emerald-200/20 bg-emerald-950/30" : "border-cyan-200/20 bg-cyan-950/30")}>
      <div className="flex items-center justify-between gap-2 text-[10px] font-black uppercase tracking-[.18em] text-white/60">
        <span>Prova di sintonia · Fase {trialRound + 1}/3</span>
        <span className="text-amber-200">Errori rimasti: {trialLives}</span>
      </div>
      <div className="mt-3 flex gap-1.5">{[0,1,2].map((n) => <div key={n} className={"h-1.5 flex-1 rounded-full " + (n <= trialRound ? "bg-emerald-300" : "bg-white/10")}/>)}</div>
      <p className="mt-3 text-xs leading-5 text-white/70">{trialMode === "preview" ? (trialRound === 0 ? "Fase 1: memorizza e ripeti la sequenza nello stesso ordine." : trialRound === 1 ? "Fase 2: memorizza il segnale, ma ripetilo al contrario." : "Fase 3: ripeti alternando prima e ultima runa, poi seconda e penultima.") : trialMode === "active" ? "Riproduci la sequenza applicando la regola di questa fase." : "La risonanza si è spezzata. Puoi riprovare la prova dall'inizio."}</p>
      {trialMode === "preview" && <>
        <div className="mt-3 flex flex-wrap justify-center gap-2 rounded-xl bg-black/25 p-3">{baseTrialSequence.map((rune, i) => <span key={i} className="grid h-10 w-10 place-items-center rounded-lg border border-white/15 bg-white/10 text-xl">{TRIAL_RUNES[rune]}</span>)}</div>
        <button onClick={() => { setTrialMode("active"); setTrialStep(0); setTrialError(""); }} className="mt-3 w-full rounded-xl bg-cyan-200 py-3 text-xs font-black text-slate-950">NASCONDI E INIZIA</button>
      </>}
      {trialMode === "active" && <>
        <div className="mt-3 flex items-center justify-between text-[10px] font-bold text-white/60"><span>Sequenza: {trialStep}/{activeTrialSequence.length}</span><span>{activeTrialSequence.length - trialStep} rune da ricordare</span></div>
        <div className="mt-3 grid grid-cols-3 gap-2">{TRIAL_RUNES.map((rune, i) => <button key={rune} onClick={() => chooseTrialRune(i)} className="rounded-xl border border-white/15 bg-white/5 py-4 text-2xl transition active:scale-95 hover:bg-white/15">{rune}</button>)}</div>
      </>}
      {trialMode === "failed" && <button onClick={() => { setTrialRound(0); setTrialStep(0); setTrialLives(3); setTrialMode("preview"); setTrialError(""); }} className="mt-3 w-full rounded-xl bg-amber-200 py-3 text-xs font-black text-slate-950">RIPROVA LA PROVA</button>}
      {trialError && <p className="mt-3 text-xs font-bold text-amber-300">{trialError}</p>}
    </div>
  );

  return (
    <>
      {!encounter && phase !== "battle" && <div className="pointer-events-none fixed inset-0 z-[210]">
        <div className={`pointer-events-auto fixed right-4 top-16 bottom-4 z-[200] flex w-[min(24rem,calc(100vw-2rem))] flex-col overflow-y-auto overscroll-contain touch-pan-y rounded-2xl border border-white/15 bg-slate-950/95 p-3 text-white shadow-2xl backdrop-blur-md ${menuOpen ? "" : "hidden"}`}>
            <button onClick={() => { setMenuOpen(false); setConfirmRestart(true); }} className="mb-3 w-full rounded-xl border border-red-300/25 bg-red-950/40 px-3 py-3 text-left text-sm font-black text-red-200 hover:bg-red-900/40">
              ↻ RICOMINCIA DA ZERO
            </button>
            {menuContent}
            <div className="px-3 py-2 text-[10px] font-black uppercase tracking-[.2em] text-amber-200/70">
              CAPI FAZIONE SCONFITTI · {new Set((save.conqueredLeaders || []).filter((id) => id !== "amaro")).size}/11
            </div>
            <div className="mx-3 mb-2 rounded-xl border border-white/10 bg-white/[0.04] p-3">
              <div className="mb-3 text-[10px] font-black uppercase tracking-[.18em] text-white/55">
                GEMME INTRISE DI POTERE
              </div>
              {(save.factionGems || []).length ? (
                <div className="flex flex-wrap gap-3">
                  {(save.factionGems || []).map((gem) => (
                    <div key={gem.leaderId} className="flex min-w-[3.5rem] flex-col items-center gap-1" title={gem.faction + " · Gemma di potere"}>
                      <FactionMedal faction={gem.faction} color={gem.color} />
                      <span className="text-[8px] font-black uppercase text-white/70">{gem.faction}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-white/35">Sconfiggi un Capo fazione per ottenere la sua gemma.</p>
              )}
            </div>
            <button onClick={() => { setPanel("party"); setMenuOpen(false); }} className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm font-black text-emerald-100 hover:bg-white/10">
              <span>SQUADRA</span><span className="text-emerald-200">{party.length}/4</span>
            </button>
            <button onClick={() => { setPanel("box"); setMenuOpen(false); }} className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm font-black text-violet-100 hover:bg-white/10">
              <span>DEPOSITO</span><span className="text-violet-200">{deposit.length}</span>
            </button>
            <div className="mt-2 border-t border-white/10 px-3 pt-3">
              <div className="flex items-center justify-between gap-3 text-[10px] font-black uppercase tracking-[.12em] text-white/55">
                <span>Sognatori con cui hai stretto legame</span>
                <span className="shrink-0 text-emerald-200">{ownedAdventureCount}/{ROSTER_AVVENTURA.length}</span>
              </div>
            </div>
            <button
              onClick={() => { setMenuOpen(false); window.location.assign("/"); }}
              className="mt-3 w-full rounded-xl border border-red-300/25 bg-red-950/45 px-3 py-3 text-left text-sm font-black text-red-200 transition hover:bg-red-900/50"
            >
              ← ESCI DALL'AVVENTURA
            </button>

          </div>
        <button onClick={() => { if (menuOpen) { setMenuOpen(false); setPanel(""); } else { setPanel(""); setMenuOpen(true); } }} className="pointer-events-auto fixed right-3 top-12 z-[210] rounded-2xl border border-amber-200/30 bg-slate-950/95 px-5 py-3 text-sm font-black tracking-wider text-amber-100 shadow-xl backdrop-blur-md active:scale-95">
          {menuOpen ? "CHIUDI MENU" : "☰ MENU"}
        </button>
      </div>}

      {confirmRestart && !encounter && phase !== "battle" && (
        <div className="absolute inset-0 z-[120] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-red-300/25 bg-slate-950 p-6 text-center text-white shadow-2xl">
            <div className="text-3xl">↻</div>
            <h2 className="mt-2 text-2xl font-black">Ricominciare da zero?</h2>
            <p className="mt-3 text-sm leading-6 text-white/65">Perderai squadra, Sognatori ottenuti e città completate. Il viaggio ripartirà dall'inizio e potrai scegliere di nuovo i tuoi primi compagni.</p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button onClick={() => setConfirmRestart(false)} className="rounded-xl bg-white/10 py-3 text-sm font-bold">ANNULLA</button>
              <button onClick={() => {
                const freshSave = { ownedIds: [], partyIds: [], starterIds: [], completedCities: [], conqueredLeaders: [], factionGems: [], introDone: false };
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
          <div className="max-h-[94vh] w-full max-w-4xl overflow-hidden rounded-3xl border border-white/15 bg-slate-950 p-4 text-white shadow-2xl sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[.25em] text-emerald-200/60">Il tuo viaggio</div>
                <h2 className="text-2xl font-black">{panel === "party" ? "La tua squadra" : "Box deposito"}</h2>
                <p className="mt-1 text-xs text-white/50">{panel === "party" ? "Scegli 2 titolari: gli altri 2 saranno in panchina. Puoi cambiare scelta quando vuoi." : "I Sognatori che non porti con te restano al sicuro qui."}</p>
              </div>
              <button onClick={() => setPanel("")} className="rounded-lg bg-white/10 px-3 py-2 text-sm font-bold">Chiudi</button>
            </div>
            <div className="mb-3 flex gap-2 text-[10px] font-black uppercase">
              <button onClick={() => setPanel("party")} className={"rounded-lg px-3 py-2 " + (panel === "party" ? "bg-emerald-300 text-black" : "bg-white/10")}>Squadra ({party.length}/4)</button>
              <button onClick={() => setPanel("box")} className={"rounded-lg px-3 py-2 " + (panel === "box" ? "bg-violet-300 text-black" : "bg-white/10")}>Deposito ({deposit.length})</button>
            </div>
            {(
              <div className="flex max-h-[68vh] flex-col gap-3 overflow-y-auto pr-1">
                {(panel === "party" ? party : deposit).map((s) => {
                  const isStarter = (save.starterIds || save.partyIds.slice(0, 2)).includes(s.id);
                  return (
                    <div key={s.id} className={"flex w-full flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center " + (panel === "party" && isStarter ? "border-amber-200/40 bg-amber-300/10" : "border-white/10 bg-white/5")}>
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <AdventureSognatoreSprite s={s} size={58} overworld />
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="break-words text-base font-black leading-tight">{s.nome}</div>
                          <div className="text-sm text-white/65"><span className="font-bold text-white/45">FAZIONE:</span> {s.tipo}</div>
                          {panel === "party" && <div className={"text-sm font-black uppercase tracking-wider " + (isStarter ? "text-amber-200" : "text-sky-200")}>{isStarter ? "TITOLARE" : "PANCHINA"}</div>}
                        </div>
                      </div>
                      {panel === "party" ? (
                        <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col">
                          <button onClick={() => toggleStarter(s.id)} className="rounded-lg border border-amber-200/20 bg-amber-200/10 px-4 py-2 text-xs font-black text-amber-100">{isStarter ? "METTI IN PANCHINA" : "RENDI TITOLARE"}</button>
                          <button onClick={() => toggleParty(s.id)} className="rounded-lg border border-white/10 bg-white/10 px-4 py-2 text-xs font-black">SPOSTA NEL BOX</button>
                        </div>
                      ) : <button onClick={() => toggleParty(s.id)} className="shrink-0 rounded-lg bg-white/10 px-4 py-3 text-xs font-black">AGGIUNGI ALLA SQUADRA</button>}
                    </div>
                  );
                })}
                {(panel === "party" ? party : deposit).length === 0 && <div className="rounded-xl bg-white/5 p-6 text-center text-sm text-white/50">{panel === "party" ? "La squadra è vuota." : "Il deposito è vuoto."}</div>}
              </div>
            )}
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
            <div className="my-5 flex justify-center"><AdventureSognatoreSprite s={starterSognatore} size={220} walking={false} crisp /></div>
            <div className="text-sm font-bold text-emerald-200">{starterSognatore.tipo || starterSognatore.fazione}</div>
            <p className="mt-3 text-sm leading-6 text-white/65">Le tue risposte hanno rivelato un'affinità speciale. Non è una cattura: da oggi questo Sognatore sceglie di iniziare il viaggio insieme a te.</p>
            <button onClick={recruitStarter} className="mt-5 w-full rounded-xl bg-emerald-300 py-3 font-black text-black">ACCETTA IL PRIMO LEGAME</button>
          </div>
        </div>
      )}

      {wildEncounter && phase === "wildTalk" && (
        <div className="absolute inset-0 z-[90] flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-md">
          <div className="my-auto w-full max-w-lg rounded-3xl border border-cyan-200/20 bg-slate-950 p-5 text-center text-white shadow-2xl">
            <div className="text-[10px] font-black uppercase tracking-[.3em] text-cyan-200">Incontro selvatico · Legame unico</div>
            {wildSognatore ? <>
              <div className="my-3 flex justify-center"><AdventureSognatoreSprite s={wildSognatore} size={220} walking={false} crisp /></div>
              <h2 className="text-3xl font-black">{wildSognatore.nome}</h2>
              <div className="mt-1 text-[10px] font-black uppercase tracking-widest text-cyan-100/60">{wildSognatore.tipo || wildSognatore.fazione}</div>
              {wildAlreadyOwned ? (
                <div className="mt-4 rounded-xl border border-emerald-200/20 bg-emerald-950/30 p-4 text-sm leading-6 text-emerald-100">Hai già stretto un legame con {wildSognatore.nome}. Gli altri esemplari della stessa specie restano liberi nel loro habitat, ma non possono essere arruolati una seconda volta.</div>
              ) : wildFailedThisRun ? (
                <div className="mt-4 rounded-xl border border-rose-300/25 bg-rose-950/35 p-4 text-sm leading-6 text-rose-100">Questa occasione è ormai perduta. Non hai compreso {wildSognatore.nome} e non potrai convincerlo a unirsi a te in questa partita. Potrai incontrare gli altri Sognatori, ma lui non ti darà una seconda possibilità.</div>
              ) : !wildCanRecruit ? (
                <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-white/70">Questo esemplare vive in branco e non è arruolabile. Cerca il suo simile contrassegnato dalla stella dorata ✦: uno solo per specie può stringere il legame con te.</div>
              ) : (() => {
                const quest = getWildRecruitQuest(wildSognatore);
                return (
                  <div className="mt-4 rounded-2xl border border-cyan-200/15 bg-cyan-950/25 p-4 text-left">
                    <div className="text-[10px] font-black uppercase tracking-[.2em] text-cyan-200">Conosciamoci · {wildQuestStep + 1}/3</div>
                    {wildQuestStep === 0 ? <>
                      <p className="mt-3 text-sm leading-6 text-white/80">{quest.clue}</p>
                      <p className="mt-2 text-xs text-cyan-100/55">Sei nel suo habitat. Parlagli direttamente e scopri cosa lo rende unico.</p>
                      <button onClick={() => setWildQuestStep(1)} className="mt-4 w-full rounded-xl bg-cyan-300 py-3 text-sm font-black text-slate-950">PARLA CON {wildSognatore.nome.toUpperCase()}</button>
                    </> : wildQuestStep === 1 ? <>
                      <p className="mt-3 text-sm leading-6 text-white/80">{quest.task}</p>
                      <p className="mt-2 text-xs text-cyan-100/55">Ogni Sognatore ha un modo tutto suo per fidarsi. Ascolta e scegli come rispondergli.</p>
                      <div className="mt-4 grid gap-2">
                        {quest.choices.map((choice, index) => (
                          <button key={choice} onClick={() => {
                            if (index === quest.correct) {
                              setWildQuestFeedback("Hai trovato la soluzione giusta. Il Sognatore si fida un po' di più di te.");
                              setWildQuestStep(2);
                            } else {
                              setSave((old) => ({ ...old, failedWildIds: Array.from(new Set([...(old.failedWildIds || []), wildSognatore.id])) }));
                              setWildQuestFeedback("Hai risposto nel modo sbagliato. " + wildSognatore.nome + " perde fiducia e decide di allontanarsi. Non potrai più convincerlo in questa partita.");
                            }
                          }} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm font-bold text-white transition hover:border-cyan-200/40 hover:bg-cyan-300/10">
                            {choice}
                          </button>
                        ))}
                      </div>
                      {wildQuestFeedback && <p className="mt-3 rounded-xl bg-black/30 p-3 text-xs leading-5 text-cyan-100">{wildQuestFeedback}</p>}
                    </> : <>
                      <p className="mt-3 text-sm leading-6 text-white/80">{quest.bond}</p>
                      <p className="mt-2 text-xs text-emerald-200/70">{wildQuestFeedback}</p>
                      <p className="mt-2 text-xs text-emerald-200/70">Il legame è pronto. {save.partyIds.length < 4 ? "Potrà unirsi alla tua squadra." : "La squadra è piena: entrerà nella tua collezione."}</p>
                      <button onClick={() => {
                        setSave((old) => {
                          if (old.ownedIds.some((id) => ROSTER.find((ownedSognatore) => ownedSognatore.id === id)?.nome === wildSognatore.nome)) return old;
                          const ownedIds = [...old.ownedIds, wildSognatore.id];
                          const partyIds = old.partyIds.length < 4 ? [...old.partyIds, wildSognatore.id] : old.partyIds;
                          const starters = old.starterIds || old.partyIds.slice(0, 2);
                          const starterIds = partyIds.includes(wildSognatore.id) && starters.length < 2
                            ? [...starters, wildSognatore.id]
                            : starters;
                          return { ...old, ownedIds, partyIds, starterIds };
                        });
                        setPhase("idle");
                        onWildClose?.(true);
                      }} className="mt-4 w-full rounded-xl bg-emerald-300 py-3 text-sm font-black text-slate-950">STRINGI IL LEGAME</button>
                    </>}
                  </div>
                );
              })()}
            </> : <p className="mt-4">Questo Sognatore non è presente nel roster attuale.</p>}
            <button onClick={() => { setPhase("idle"); onWildClose?.(false); }} className="mt-4 w-full rounded-xl bg-white/10 py-3 text-sm font-bold">LASCIALO LIBERO</button>
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
                  <AdventureTravelerSprite traveler={encounter.traveler || encounter.name} faction={encounter.faction} size={150} walking={false} />
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
                <span className="text-[9px] font-bold text-white/35">{cityTeam.length} SOGNATORI</span>
              </div>
              <div className="flex justify-around gap-1">
                {cityTeam.map((s) => <div key={s.id} className="flex min-w-0 flex-1 flex-col items-center"><AdventureSognatoreSprite s={s} size={52} walking={false} crisp={true}/><span className="mt-1 max-w-full truncate text-[8px] font-bold text-white/75">{s.nome}</span></div>)}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 p-4 sm:px-7 sm:pb-7">
              <button onClick={() => { onClose?.(); setPhase("idle"); }} className="rounded-xl border border-white/10 bg-white/5 py-3 text-xs font-bold text-white/70 transition hover:bg-white/10">TORNA A ESPLORARE</button>
              <button disabled={party.length < 2 || cityTeam.length !== expectedCityTeamSize} onClick={startCityBattle} className="rounded-xl bg-gradient-to-r from-amber-200 to-amber-400 py-3 text-xs font-black tracking-wide text-[#241b16] shadow-lg shadow-amber-950/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-35">{party.length < 2 ? "SERVONO 2 COMPAGNI" : "SFIDA IL CAPO FAZIONE"}</button>
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
            <div className="my-4 flex justify-center"><AdventureSognatoreSprite s={currentReward} size={180} walking={false} crisp /></div>
            <div className="text-xl font-black">{currentReward.nome}</div>
            <p className="mt-2 text-sm text-white/65">Per unirsi a te deve superare una prova di risonanza in tre fasi: 4, 6 e 8 rune, con tre errori disponibili.</p>
            {renderResonanceTrial("emerald")}
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
            <p className="mt-2 text-sm text-white/65">Hai sconfitto il Capo fazione di {encounter.city}. La città riconosce il tuo valore e la tua vittoria.</p>
            <button onClick={() => { setPhase("idle"); onClose?.(); }} className="mt-5 w-full rounded-xl bg-emerald-300 py-3 font-black text-black">TORNA ALL'AVVENTURA</button>
          </div>
        </div>
      )}
    </>
  );
}