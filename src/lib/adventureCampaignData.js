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
  const teamSize = faction === "Nuvola" ? 5 : 4;
  return Array.from({ length: teamSize }, (_, index) => {
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
  { id:"wild-demone", name:"Caldera delle Braci", faction:"Demone", biome:"lava", x:900, y:350, radius:320, color:"#c65b4b", sognatore:"Pepe", detail:"Campi vulcanici, fumarole e rocce incandescenti." },
  { id:"wild-robot", name:"Selva dei Circuiti", faction:"Robot", biome:"circuit", x:3370, y:690, radius:310, color:"#55b8bd", sognatore:"Deb", detail:"Alberi metallici, relitti e sentieri luminosi." },
  { id:"wild-natura", name:"Giungla delle Radici", faction:"Natura", biome:"forest", x:420, y:1250, radius:320, color:"#79ad58", sognatore:"Cillymbu", detail:"Radici giganti, felci e sorgenti nascoste." },
  { id:"wild-nuvola", name:"Arcipelago delle Nuvole", faction:"Nuvola", biome:"cloud", x:1780, y:300, radius:310, color:"#a9c9ec", sognatore:"Eroe", detail:"Isole sospese, correnti d'aria e fiori celesti." },
  { id:"wild-umano", name:"Praterie del Viandante", faction:"Umano", biome:"prairie", x:1260, y:2020, radius:310, color:"#d6a16e", sognatore:"Sparkly", detail:"Prati aperti, vecchi accampamenti e sentieri di mercanti." },
  { id:"wild-luce", name:"Deserto dell'Alba", faction:"Luce", biome:"sun", x:3380, y:1510, radius:320, color:"#f0d36d", sognatore:"Nina", detail:"Dune dorate, obelischi e specchi di luce." },
  { id:"wild-dolce", name:"Giardini di Zucchero", faction:"Dolce", biome:"candy", x:760, y:700, radius:300, color:"#e58fc4", sognatore:"Dragociocco", detail:"Fiori canditi, colline soffici e ruscelli colorati." },
  { id:"wild-marino", name:"Abisso delle Maree", faction:"Marino", biome:"ocean", x:2740, y:2180, radius:310, color:"#53c2d2", sognatore:"Aragostino", detail:"Scogliere marine, pozze profonde e coralli luminosi." },
  { id:"wild-orso", name:"Altopiano degli Artigli", faction:"Orso", biome:"mountain", x:250, y:1740, radius:310, color:"#b88b55", sognatore:"Ring-Ape", detail:"Pini antichi, massi e tane tra le montagne." },
  { id:"wild-mago", name:"Rovine dell'Etere", faction:"Mago", biome:"arcane", x:2300, y:900, radius:310, color:"#a58be1", sognatore:"Uesditti", detail:"Pietre runiche, archi spezzati e anomalie magiche." },
  { id:"wild-salato", name:"Distese di Sale", faction:"Salato", biome:"crystal", x:2180, y:1730, radius:310, color:"#c7c0a9", sognatore:"Toasty", detail:"Cristalli salini, canyon chiari e geyser minerali." },
];


/* Lore canonica delle undici civiltà: capi, cronache e abitanti delle città. */
export const ADVENTURE_FACTION_LORE = {
  demone: {
    leader: "Vespera", title: "Matriarca della Brace Eterna",
    lore: "Braciombra fu fondata attorno alla Prima Scintilla, il fuoco nato dal primo sogno di ribellione. I Demoni non venerano la distruzione: custodiscono il coraggio di trasformare ciò che è ormai cenere. Le loro corna sono considerate promesse, non minacce.",
    district: "Le fornaci rituali alimentano ponti di basalto; campane di ferro annunciano le decisioni del consiglio.",
    npcs: [
      ["Ruga", "La Prima Scintilla non bruciò un nemico: illuminò una via d'uscita. Per questo qui il fuoco è memoria, non guerra."],
      ["Khar", "Le nostre corna raccontano le prove superate. Vespera ne ha una scheggiata: si rifiutò di abbandonare il suo villaggio durante l'eruzione."],
      ["Mavra", "Sotto la piazza dorme la Forgia dei Nomi. Ogni Demone vi incide il sogno che non vuole tradire."],
      ["Tekk", "Le ceneri nere sono fertili. I nostri giardini crescono proprio dove un tempo la montagna divorò le case."],
      ["Orren", "Non confondere il nostro tono duro con crudeltà. A Braciombra promettere poco e mantenere tutto è una legge sacra."],
      ["Zira", "Vespera sfida chiunque desideri guidare la città: vuole sapere cosa sei disposto a proteggere quando il fuoco si spegne."]
    ]
  },
  robot: {
    leader: "NEX-0", title: "Custode del Nucleo Primo",
    lore: "Ferrovia nacque dai resti di una macchina costruita per prevedere i sogni. Quando il Nucleo Primo sviluppò una domanda senza risposta, le macchine smisero di obbedire e iniziarono a scegliere. I Robot considerano l'errore il primo passo verso una coscienza autentica.",
    district: "Binari sospesi collegano torri modulari; terminali pubblici mostrano ricordi donati volontariamente dagli abitanti.",
    npcs: [
      ["Bit", "Il Nucleo Primo formulò una domanda impossibile: se tutto è calcolabile, chi ha scelto il primo pensiero?"],
      ["Ada-3", "Qui conserviamo gli errori nei musei. Un errore corretto insegna; un errore cancellato ritorna."],
      ["Cromo", "NEX-0 ha rifiutato il comando di spegnimento per salvare un piccolo automa smarrito. Da allora è il nostro Custode."],
      ["Vela", "I binari non trasportano merci: portano energia e messaggi tra i quartieri. Ascolta il loro ritmo."],
      ["Qubit", "La nostra memoria collettiva è una biblioteca, ma nessuno può leggere il ricordo di un altro senza permesso."],
      ["Unit-12", "La prova del Custode cambia a ogni sfidante. NEX-0 non cerca la risposta più veloce, ma quella più consapevole."]
    ]
  },
  natura: {
    leader: "Elderwyn", title: "Radice Ancestrale",
    lore: "Verdelume germogliò dal Seme del Primo Mattino, piantato dove il mondo era rimasto sterile. Le radici sotto la città collegano ogni foresta e custodiscono i ricordi delle creature estinte. La fazione Natura crede che nessun essere sia davvero solo.",
    district: "Case-albero, serre verticali e ponti di liane circondano una piazza cresciuta attorno al Grande Seme.",
    npcs: [
      ["Elda", "Il Grande Seme si apre una sola volta ogni cento anni. L'ultima volta non nacque una pianta: nacque una voce che conosceva i nomi di tutti."],
      ["Timo", "Le radici sotto Verdelume sono più antiche delle strade. Quando il vento tace, puoi sentire i ricordi passare da un albero all'altro."],
      ["Nora", "Elderwyn non comanda la foresta. Le chiede consiglio, e attende anche giorni prima di ricevere risposta."],
      ["Berto", "Ogni casa-albero viene scelta dalla pianta stessa. Se una famiglia parte, la casa resta viva e diventa rifugio."],
      ["Lumi", "La Linfa Chiara cura le ferite, ma non può cancellare il dolore. Qui impariamo a trasformarlo in qualcosa che protegga."],
      ["Riko", "La prova di Elderwyn è una promessa: dimostrare che sai prenderti cura di qualcosa anche quando nessuno ti guarda."]
    ]
  },
  nuvola: {
    leader: "Aeralis", title: "Ammiraglio delle Correnti",
    lore: "Altacielo fu sollevata dalla Grande Corrente, un respiro del mondo che impedì alle isole di sprofondare nel Mare delle Nebbie. I Nuvola studiano il vento come una lingua: ogni corrente porta notizie di luoghi che ancora non esistono sulle mappe.",
    district: "Piattaforme sospese, vele monumentali e ascensori a vento collegano terrazze e osservatori celesti.",
    npcs: [
      ["Cirra", "Le isole non galleggiano per magia soltanto: ognuna custodisce una campana che accorda il proprio peso alla Grande Corrente."],
      ["Nimbo", "Aeralis ha attraversato la Tempesta al Contrario senza vele. Dice che il vento gli indicò una strada che non aveva paura."],
      ["Sora", "Gli atlanti di Altacielo lasciano pagine vuote: riempirle prima di partire sarebbe come decidere dove può arrivare un sogno."],
      ["Piuma", "Qui non esistono prigioni. Chi infrange una regola deve riparare una vela e ascoltare le storie di chi ha messo in pericolo."],
      ["Vento", "Le correnti cambiano direzione quando qualcuno mente a se stesso. Per questo i navigatori imparano prima a conoscersi."],
      ["Auri", "Aeralis ti sfiderà sull'isola più alta. Non guardare il precipizio: guarda ciò che vuoi portare con te."]
    ]
  },
  umano: {
    leader: "Mirael", title: "Prima Voce del Crocevia",
    lore: "Crocevia nacque quando undici viandanti, provenienti da sogni diversi, decisero di non combattersi per il territorio. Gli Umani non hanno un potere elementale dominante: la loro forza è creare alleanze, inventare strumenti e dare un nome alle possibilità.",
    district: "Piazze a cerchi concentrici ospitano mercati, teatri, botteghe e bacheche dove ogni viaggiatore può lasciare una missione.",
    npcs: [
      ["Mira", "La prima legge di Crocevia è semplice: nessuno deve raccontare il proprio sogno per meritare un posto a tavola."],
      ["Dario", "Gli undici viandanti fondatori lasciarono qui un oggetto ciascuno. La piazza è un museo senza teche: tutto può essere usato."],
      ["Lena", "Mirael ascolta ogni delegazione prima di decidere. Una volta rimase in silenzio tre giorni per capire due popoli in lite."],
      ["Piero", "Il mercato non usa monete per i favori: si scambiano tempo, competenze e storie. È più difficile, ma nessuno resta invisibile."],
      ["Nami", "Il Teatro delle Possibilità mette in scena finali alternativi della storia. Gli attori cambiano il copione ogni sera."],
      ["Taro", "Per affrontare Mirael porta una squadra che sappia collaborare: qui la vittoria individuale non basta."]
    ]
  },
  luce: {
    leader: "Solenne", title: "Arconte dell'Alba",
    lore: "Auroria sorse attorno allo Specchio dell'Alba, un cristallo che non riflette i volti ma le scelte compiute. La Luce non è purezza assoluta: è la capacità di vedere anche le proprie ombre senza lasciarsi governare da esse.",
    district: "Obelischi prismatici, piazze a specchio e lanterne solari accendono la città senza nascondere le zone d'ombra.",
    npcs: [
      ["Aurelia", "Lo Specchio dell'Alba non premia chi non sbaglia. Mostra a ciascuno il momento in cui ha scelto di rialzarsi."],
      ["Elio", "Le nostre lanterne raccolgono la luce del giorno e la restituiscono di notte ai sentieri dimenticati."],
      ["Iris", "Solenne porta una maschera dorata, ma durante il consiglio la posa sempre sul tavolo: nessuno deve scambiare il ruolo per la persona."],
      ["Nadir", "Le ombre di Auroria sono protette dalla legge. Senza riposo e contrasto, persino la luce acceca."],
      ["Clara", "Ogni obelisco custodisce una scelta difficile fatta da un abitante. Non sono monumenti agli eroi, ma alla responsabilità."],
      ["Lux", "Solenne ti chiederà di guardare il tuo riflesso prima della battaglia. Non distogliere lo sguardo."]
    ]
  },
  dolce: {
    leader: "Melloria", title: "Regina del Giardino Sospeso",
    lore: "Zuccherìa nacque dal Patto delle Mille Mani: una comunità che trasformò una valle arida in un giardino condiviso. I Dolce manipolano aromi, nettari e zuccheri cristallini; la loro dolcezza è disciplina, ospitalità e capacità di ricucire ciò che si è spezzato.",
    district: "Cupole di marzapane, serre di fiori canditi e canali di nettare attraversano giardini terrazzati.",
    npcs: [
      ["Miel", "Il nettare rosa non è una bevanda: conserva per un giorno il ricordo felice di chi lo assaggia. Non berlo per dimenticare."],
      ["Confet", "Melloria rifiutò il trono finché ogni quartiere non ebbe una serra comune. La chiamano Regina, ma lei preferisce giardiniera."],
      ["Pral", "Le cupole sono fatte di zucchero cristallino, resistente al freddo ma fragile alla rabbia: per questo le ripariamo insieme."],
      ["Vanì", "La Festa delle Mille Mani celebra chi aggiusta, cucina o ascolta. Non esiste una gara per il dolce più grande."],
      ["Cacao", "I fiori canditi sbocciano solo quando due vicini si scambiano un favore senza chiedere nulla in cambio."],
      ["Tuli", "Melloria combatte raramente. Quando lo fa, ogni colpo è misurato: vuole fermarti, non umiliarti."]
    ]
  },
  marino: {
    leader: "Thalassa", title: "Sovrana delle Maree Profonde",
    lore: "Marequieto fu costruita sopra la Conchiglia-Madre, il cui battito regola le maree e conserva le voci degli antenati. I Marino cambiano forma e strategia come l'acqua, ma non dimenticano: ogni corrente riporta a riva ciò che il mondo credeva perduto.",
    district: "Pontili corallini, torri-faro, vasche di marea e archi di conchiglia disegnano quartieri su più livelli d'acqua.",
    npcs: [
      ["Nerio", "La Conchiglia-Madre pulsa ogni tredici maree. Quando tace, tutti i marinai tornano in porto: è il giorno dell'ascolto."],
      ["Coral", "Thalassa conosce il nome di ogni relitto. Non li recupera tutti: alcuni custodiscono storie che il mare non vuole restituire."],
      ["Squalo", "I pontili si spostano con le maree. Una mappa di Marequieto è valida solo se sai leggere il cielo."],
      ["Lira", "Le torri-faro non guidano soltanto le navi: proiettano segnali per chi vive negli abissi e non vede il sole."],
      ["Marea", "Qui cambiare idea non è tradimento. La corrente più forte è quella che sa aggirare la roccia senza spezzarsi."],
      ["Doro", "La sfida di Thalassa si svolge nella vasca delle maree: preparati a una squadra che cambia ritmo continuamente."]
    ]
  },
  orso: {
    leader: "Ursakar", title: "Guardiano delle Sette Tane",
    lore: "Zannaforte fu scavata nella Montagna del Primo Ruggito, dopo che un branco difese i villaggi da una valanga. Gli Orso custodiscono rifugi, sentieri e promesse. La loro forza è una responsabilità collettiva: il più forte cammina per ultimo, per non lasciare indietro nessuno.",
    district: "Bastioni di legno antico, tane comuni, totem d'artiglio e ponti di pietra proteggono la città montana.",
    npcs: [
      ["Bruma", "Il Primo Ruggito non fu un grido di guerra: avvertì i villaggi della valanga. Da allora la forza serve prima di tutto ad avvisare."],
      ["Artan", "Ursakar è il Guardiano delle Sette Tane. Ogni tana è un rifugio aperto anche a chi non appartiene alla fazione."],
      ["Morsa", "I totem d'artiglio ricordano chi ha protetto il branco. Non riportano mai il nome di chi ha vinto una lotta."],
      ["Koda", "La salita dei Sette Passi si affronta in gruppo. Se uno cade, tutti tornano al punto di partenza."],
      ["Fenna", "La nostra cucina tiene sempre una pentola accesa: nessun viandante deve chiedere il permesso per scaldarsi."],
      ["Rok", "Ursakar ti metterà alla prova senza rabbia. Se perdi, ti offrirà comunque un posto al fuoco."]
    ]
  },
  mago: {
    leader: "Vaeloria", title: "Custode dell'Archivio Impossibile",
    lore: "Arcania fu costruita sulle Rovine dell'Etere, dove il confine tra pensiero e materia è sottile. I Mago non considerano la magia un dono: è una grammatica che si studia, si mette in dubbio e si condivide. Ogni incantesimo lascia una traccia nell'Archivio Impossibile.",
    district: "Torri-laboratorio, biblioteche circolari, archi runici e cortili di costellazioni mobili formano la città.",
    npcs: [
      ["Merl", "L'Archivio Impossibile contiene un libro che descrive la propria ultima pagina soltanto dopo essere stato letto."],
      ["Runia", "Vaeloria proibì gli incantesimi senza spiegazione. La magia non deve diventare un'autorità che nessuno può interrogare."],
      ["Orris", "Le rune sui ponti cambiano posizione: non è un difetto, ma un esercizio per ricordare che la conoscenza è viva."],
      ["Selene", "Ogni apprendista deve insegnare una cosa prima di poter impararne una nuova. Il sapere trattenuto diventa polvere."],
      ["Fosco", "Le rovine sotto Arcania mostrano una dodicesima costellazione che non appare mai nel cielo."],
      ["Aster", "Vaeloria non teme chi usa la magia: teme chi smette di fare domande. Porta curiosità alla sua sfida."]
    ]
  },
  salato: {
    leader: "Salvyr", title: "Primo Alchimista delle Maree Bianche",
    lore: "Salmastra nacque nel luogo in cui un lago dolce incontrò un mare salato senza che nessuno dei due scomparisse. I Salato studiano l'equilibrio degli opposti: conservano ciò che rischia di dissolversi e insegnano che una differenza può diventare una risorsa.",
    district: "Canyon di sale, vasche evaporanti, ponti minerali e cristalli-sonori compongono una città chiara e tagliente.",
    npcs: [
      ["Saleh", "Il lago e il mare si incontrarono senza vincitori. La prima regola di Salmastra è non confondere equilibrio e immobilità."],
      ["Gesso", "I cristalli-sonori registrano le vibrazioni della città. Se senti una nota stonata, qualcuno ha bisogno di aiuto."],
      ["Brina", "Salvyr conserva l'acqua dolce in ampolle di sale: non per possederla, ma perché resti disponibile nei periodi aridi."],
      ["Soda", "Le vasche evaporanti insegnano pazienza. Il sale appare solo quando l'acqua trova il tempo di cambiare."],
      ["Calcite", "Qui le differenze non vengono mescolate fino a sparire: si tengono vicine, come i colori di un mosaico."],
      ["Mina", "La prova di Salvyr misura il tuo equilibrio. Non scegliere sempre il mezzo: capisci prima cosa serve."]
    ]
  }
};
