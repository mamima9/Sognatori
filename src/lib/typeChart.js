// Tabella tipi ufficiale Sognatori
// Debole A = attaccante è superefficace contro questi tipi (+5)
// Resiste A = attaccante è resistito da questi tipi (-3)
// Immune A = attaccante è immune a questi tipi (-15, danno 0)

export const FACTIONS = [
  "Demone", "Marino", "Natura", "Luce", "Umano", "Dolce", "Mago", "Robot", "Orso", "Nuvola", "Salato"
];

// [attaccante] → { debole: [tipi che subiscono +5], resiste: [tipi che fanno -3], immune: [tipi immune -15] }
const TYPE_DATA = {
  Demone:  { se: ["Luce","Orso","Marino"],      res: ["Natura","Umano","Demone","Nuvola"], imm: [] },
  Marino:  { se: ["Natura","Robot"],             res: ["Umano","Demone","Marino"],         imm: [] },
  Natura:  { se: ["Salato","Mago","Demone","Umano"], res: ["Natura","Marino","Robot","Luce"], imm: [] },
  Luce:    { se: ["Marino","Natura","Umano"],    res: ["Salato","Orso"],                   imm: ["Robot"] },
  Umano:   { se: ["Demone","Dolce","Luce"],      res: ["Mago","Natura","Umano","Nuvola"],  imm: ["Salato"] },
  Dolce:   { se: ["Mago"],                       res: ["Orso"],                            imm: [] },
  Mago:    { se: ["Robot","Orso","Umano"],        res: ["Natura","Dolce"],                 imm: ["Luce"] },
  Robot:   { se: ["Luce"],                        res: ["Mago","Umano","Robot"],            imm: [] },
  Orso:    { se: ["Luce","Dolce","Natura","Marino","Umano"], res: ["Mago","Salato","Demone"], imm: [] },
  Nuvola:  { se: ["Umano"],                      res: ["Demone","Marino","Robot"],          imm: ["Dolce"] },
  Salato:  { se: ["Luce"],                       res: ["Natura","Salato","Dolce"],          imm: [] },
};

export const chart = {};

FACTIONS.forEach((attacker) => {
  chart[attacker] = {};

  FACTIONS.forEach((defender) => {
    const defenderData = TYPE_DATA[defender];

    if (defenderData.imm.includes(attacker)) {
      chart[attacker][defender] = -15;
    } else if (defenderData.se.includes(attacker)) {
      chart[attacker][defender] = 5;
    } else if (defenderData.res.includes(attacker)) {
      chart[attacker][defender] = -3;
    } else {
      chart[attacker][defender] = 0;
    }
  });
});

export function typeBonus(attacker, defender) {
  return chart[attacker]?.[defender] ?? 0;
}

export const FACTION_COLORS = {
  Demone:  "#E83232",
  Marino:  "#1E90FF",
  Natura:  "#2D8B2D",
  Luce:    "#FFD700",
  Umano:   "#3A3A3A",
  Dolce:   "#C8A165",
  Mago:    "#7B3CA8",
  Robot:   "#B8B8B8",
  Orso:    "#8B5A2B",
  Nuvola:  "#D5D5D0",
  Salato:  "#FFA630",
};