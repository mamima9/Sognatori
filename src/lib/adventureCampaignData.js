import { ROSTER } from "@/lib/sognatoriData";

export const ADVENTURE_CITIES = [
  { id:"demone", city:"Braciombra", faction:"Demone", traveler:"Vark", x:520, y:400, color:"#bd5360", line:"Qui nessuno sogna senza pagare un prezzo. Dimostra di sapere cosa desideri." },
  { id:"robot", city:"Ferrovia", faction:"Robot", traveler:"Unit-07", x:2920, y:360, color:"#55a8b8", line:"Ogni scelta ha una logica. Il tuo viaggio supera il mio modello predittivo." },
  { id:"natura", city:"Verdelume", faction:"Natura", traveler:"Silva", x:850, y:1320, color:"#70b96b", line:"Non si conquista la natura. Si impara ad ascoltarla." },
  { id:"nuvola", city:"Altacielo", faction:"Nuvola", traveler:"Cirrus", x:2440, y:260, color:"#9aade8", line:"Da quassù ogni ambizione sembra piccola. Cosa ti spinge a salire?" },
  { id:"umano", city:"Crocevia", faction:"Umano", traveler:"Mira", x:1660, y:1740, color:"#d9a06b", line:"I sogni nascono dalle persone. Raccontami il tuo." },
  { id:"luce", city:"Auroria", faction:"Luce", traveler:"Aurelia", x:3220, y:1080, color:"#f0d36d", line:"La luce non si impone: si riconosce. Sei pronto a guardarti dentro?" },
  { id:"dolce", city:"Zuccherìa", faction:"Dolce", traveler:"Miel", x:1180, y:850, color:"#e58fc4", line:"Un cuore gentile può essere più forte di mille colpi." },
  { id:"marino", city:"Marequieto", faction:"Marino", traveler:"Nerio", x:3000, y:1900, color:"#53c2d2", line:"Tutto scorre e cambia. Anche tu saprai adattarti?" },
  { id:"orso", city:"Zannaforte", faction:"Orso", traveler:"Bruma", x:430, y:2050, color:"#b88b55", line:"La forza viene dall'istinto. Non confondere la calma con la debolezza." },
  { id:"mago", city:"Arcania", faction:"Mago", traveler:"Merl", x:2020, y:560, color:"#a58be1", line:"Le parole aprono porte che la forza non può nemmeno vedere." },
  { id:"salato", city:"Salmastra", faction:"Salato", traveler:"Saleh", x:2110, y:2130, color:"#c7c0a9", line:"L'equilibrio nasce dagli opposti. Sai convivere con ciò che non ti somiglia?" },
];

export function buildCityTeam(faction, cityId) {
  const pool = ROSTER.filter((s) => (s.tipo || s.fazione) === faction);
  if (!pool.length) return [];
  return Array.from({ length: 4 }, (_, index) => {
    const base = pool[index % pool.length];
    return {
      ...base,
      // Mantieni sempre il nome ufficiale del Sognatore: nessun ruolo aggiunto.
      nome: base.nome,
      id: base.id + "-traveler-" + cityId + "-" + index,
      originalId: base.id,
    };
  });
}

export function getCityRewards(city) {
  const pool = ROSTER.filter((s) => (s.tipo || s.fazione) === city.faction);
  return pool.slice(-Math.min(2, pool.length));
}

export function getStarterPair(choice) {
  const pairs = {
    Natura: ["cillymbu", "cancucc"],
    Dolce: ["cancucc", "adlimago"],
    Mago: ["adlimago", "pepe"],
  };
  const ids = pairs[choice] || pairs.Natura;
  return ids.map((id) => ROSTER.find((s) => s.id === id)).filter(Boolean);
}


/**
 * Undici territori selvatici, uno per ogni fazione.
 * Le coordinate sono nel sistema del mondo Avventura (3600 x 2400).
 * Ogni territorio ospita un incontro selvatico coerente con il proprio bioma.
 */
export const ADVENTURE_WILD_AREAS = [
  { id:"wild-demone", name:"Caldera delle Braci", faction:"Demone", biome:"lava", x:900, y:350, radius:190, color:"#c65b4b", sognatore:"Pepe", detail:"Campi vulcanici, fumarole e rocce incandescenti." },
  { id:"wild-robot", name:"Selva dei Circuiti", faction:"Robot", biome:"circuit", x:3370, y:690, radius:185, color:"#55b8bd", sognatore:"Deb", detail:"Alberi metallici, relitti e sentieri luminosi." },
  { id:"wild-natura", name:"Giungla delle Radici", faction:"Natura", biome:"forest", x:420, y:1250, radius:190, color:"#79ad58", sognatore:"Cillymbu", detail:"Radici giganti, felci e sorgenti nascoste." },
  { id:"wild-nuvola", name:"Arcipelago delle Nuvole", faction:"Nuvola", biome:"cloud", x:1780, y:300, radius:185, color:"#a9c9ec", sognatore:"Eroe", detail:"Isole sospese, correnti d'aria e fiori celesti." },
  { id:"wild-umano", name:"Praterie del Viandante", faction:"Umano", biome:"prairie", x:1260, y:2020, radius:185, color:"#d6a16e", sognatore:"Sparkly", detail:"Prati aperti, vecchi accampamenti e sentieri di mercanti." },
  { id:"wild-luce", name:"Deserto dell'Alba", faction:"Luce", biome:"sun", x:3380, y:1510, radius:190, color:"#f0d36d", sognatore:"Nina", detail:"Dune dorate, obelischi e specchi di luce." },
  { id:"wild-dolce", name:"Giardini di Zucchero", faction:"Dolce", biome:"candy", x:760, y:700, radius:180, color:"#e58fc4", sognatore:"Dragociocco", detail:"Fiori canditi, colline soffici e ruscelli colorati." },
  { id:"wild-marino", name:"Abisso delle Maree", faction:"Marino", biome:"ocean", x:2740, y:2180, radius:185, color:"#53c2d2", sognatore:"Aragostino", detail:"Scogliere marine, pozze profonde e coralli luminosi." },
  { id:"wild-orso", name:"Altopiano degli Artigli", faction:"Orso", biome:"mountain", x:250, y:1740, radius:185, color:"#b88b55", sognatore:"Ring-Ape", detail:"Pini antichi, massi e tane tra le montagne." },
  { id:"wild-mago", name:"Rovine dell'Etere", faction:"Mago", biome:"arcane", x:2300, y:900, radius:185, color:"#a58be1", sognatore:"Uesditti", detail:"Pietre runiche, archi spezzati e anomalie magiche." },
  { id:"wild-salato", name:"Distese di Sale", faction:"Salato", biome:"crystal", x:2180, y:1730, radius:185, color:"#c7c0a9", sognatore:"Toasty", detail:"Cristalli salini, canyon chiari e geyser minerali." },
];
